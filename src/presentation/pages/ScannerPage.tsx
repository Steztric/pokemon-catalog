import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { platform } from "../../infrastructure/platform";
import { CardPresenceDetector, guideRect } from "../../infrastructure/vision/cardPresenceDetector";
import { preprocessFrame } from "../../infrastructure/vision/framePreprocessor";
import type { IdentificationResult } from "../../domain/entities";
import { useScanSession } from "../hooks/useScanSession";

const CAPTURE_INTERVAL_MS = 250; // ~4 fps
const CORNER_LEN = 20;

// Single discriminated union — one setState call per tick, no intermediate renders.
type Phase =
  | "idle"         // nothing in guide
  | "detecting"    // card present, building stability
  | "identifying"  // stable, identification in progress
  | { result: IdentificationResult }; // done

function drawGuide(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  phase: Phase,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = video.videoWidth || canvas.offsetWidth;
  canvas.height = video.videoHeight || canvas.offsetHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const guide = guideRect(canvas.width, canvas.height);
  const { x, y, width: w, height: h } = guide;

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, 0, canvas.width, y);
  ctx.fillRect(0, y + h, canvas.width, canvas.height - y - h);
  ctx.fillRect(0, y, x, h);
  ctx.fillRect(x + w, y, canvas.width - x - w, h);

  const color =
    phase === "identifying" || typeof phase === "object"
      ? "#22c55e"
      : phase === "detecting"
      ? "#facc15"
      : "rgba(255,255,255,0.6)";

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const corners: [number, number, number, number][] = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * CORNER_LEN, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * CORNER_LEN);
    ctx.stroke();
  }
}

function statusLabel(phase: Phase): string {
  if (phase === "identifying") return "Identifying…";
  if (typeof phase === "object") {
    const r = phase.result;
    if (r.status === "identified") return `Match: ${r.cardId ?? "unknown"}`;
    return "Low confidence — remove and retry";
  }
  if (phase === "detecting") return "Detecting…";
  return "Align card within guide";
}

function statusColor(phase: Phase): string {
  if (typeof phase === "object") {
    return phase.result.status === "identified"
      ? "bg-green-600 text-white"
      : "bg-orange-400 text-white";
  }
  if (phase === "identifying" || phase === "detecting") return "bg-green-600 text-white";
  return "bg-black/50 text-white/70";
}

export function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef(new CardPresenceDetector());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capturedFrameRef = useRef<ImageData | null>(null);

  // Refs that the interval closure reads — avoids stale captures.
  const phaseRef = useRef<Phase>("idle");
  const identifyingRef = useRef(false); // true while async identification is running
  const hasResultRef = useRef(false);   // true while a result is displayed

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  const { cardsScanned } = useScanSession();

  // Keep phaseRef in sync whenever React state updates.
  function setPhaseSync(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    try {
      if (deviceId) await platform.camera.selectDevice(deviceId);
      const stream = await platform.camera.getStream();
      if (videoRef.current) videoRef.current.srcObject = stream;
      const devList = await platform.camera.listDevices();
      setDevices(devList);
      if (!selectedDeviceId && devList.length > 0) setSelectedDeviceId(devList[0].deviceId);
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "Could not access camera");
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    startCamera();
    return () => {
      platform.camera.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startDetectionLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    detectorRef.current.reset();
    capturedFrameRef.current = null;
    identifyingRef.current = false;
    hasResultRef.current = false;
    setPhaseSync("idle");

    intervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const frame = platform.camera.captureFrame(video);
      const result = detectorRef.current.detect(frame);

      if (!result.detected) {
        // Card left the frame — reset so the next placement starts fresh.
        if (phaseRef.current !== "idle") {
          detectorRef.current.reset();
          capturedFrameRef.current = null;
          identifyingRef.current = false;
          hasResultRef.current = false;
          setPhaseSync("idle");
          drawGuide(canvas, video, "idle");
        }
        return;
      }

      // Card is present. If a result is already showing or identification is
      // in flight, leave the display alone — don't cycle back to "detecting".
      if (identifyingRef.current || hasResultRef.current) {
        return;
      }

      if (!result.stable) {
        if (phaseRef.current !== "detecting") {
          setPhaseSync("detecting");
          drawGuide(canvas, video, "detecting");
        }
        return;
      }

      // Stable new detection — kick off identification exactly once.
      identifyingRef.current = true;
      capturedFrameRef.current = frame;
      setPhaseSync("identifying");
      drawGuide(canvas, video, "identifying");

      const preprocessed = preprocessFrame(frame, result.bounds!);
      console.log(`[scanner] stable detection — frame captured (${preprocessed.width}×${preprocessed.height}), starting identification…`);
      platform.cardIdentificationService.identify(preprocessed)
        .then((r) => {
          console.log(`[scanner] identification complete: status=${r.status} cardId=${r.cardId ?? "—"} strategy=${r.strategy} conf=${r.confidence.toFixed(3)}`);
          identifyingRef.current = false;
          hasResultRef.current = true;
          setPhaseSync({ result: r });
          if (canvas && video) drawGuide(canvas, video, { result: r });
        })
        .catch((err) => {
          console.log("[scanner] identification threw:", err);
          identifyingRef.current = false;
          hasResultRef.current = false;
          detectorRef.current.reset();
          setPhaseSync("idle");
          if (canvas && video) drawGuide(canvas, video, "idle");
        });
    }, CAPTURE_INTERVAL_MS);
  }, []);

  function handleDeviceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedDeviceId(id);
    startCamera(id);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Scanner</h1>
        <Link
          to="/dashboard"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>

      {devices.length > 1 && (
        <div className="mb-4">
          <label className="text-sm text-gray-600 mr-2" htmlFor="camera-select">
            Camera:
          </label>
          <select
            id="camera-select"
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {cameraError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Camera unavailable</p>
          <p className="mt-1">{cameraError}</p>
          <button
            onClick={() => startCamera(selectedDeviceId || undefined)}
            className="mt-2 text-blue-600 underline text-xs"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-2xl rounded-lg overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlay={startDetectionLoop}
            className="w-full h-full object-cover"
            aria-label="Camera feed"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
            <span className={`rounded px-3 py-1 text-xs font-medium ${statusColor(phase)}`}>
              {statusLabel(phase)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
        <span className="text-2xl font-bold text-gray-900">{cardsScanned}</span>
        <span>{cardsScanned === 1 ? "card scanned" : "cards scanned"} this session</span>
      </div>
    </div>
  );
}
