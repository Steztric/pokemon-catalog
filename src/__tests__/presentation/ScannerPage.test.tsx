import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ScannerPage } from "../../presentation/pages/ScannerPage";

// Hoist mock functions so they can be referenced in both vi.mock factories and test bodies.
const { mockDetect, mockIdentify } = vi.hoisted(() => ({
  mockDetect: vi.fn(),
  mockIdentify: vi.fn(),
}));

vi.mock("../../infrastructure/vision/cardPresenceDetector", () => ({
  CardPresenceDetector: vi.fn().mockImplementation(() => ({ detect: mockDetect, reset: vi.fn() })),
  guideRect: vi.fn().mockReturnValue({ x: 0, y: 0, width: 100, height: 140 }),
}));

vi.mock("../../infrastructure/vision/framePreprocessor", () => ({
  preprocessFrame: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
    capturedAt: new Date(),
  }),
}));

vi.mock("../../infrastructure/platform", () => ({
  platform: {
    storage: {
      scanSessionRepository: {
        save: vi.fn().mockResolvedValue(undefined),
        findById: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue(undefined),
      },
      scanEventRepository: {
        findBySession: vi.fn().mockResolvedValue([]),
        save: vi.fn().mockResolvedValue(undefined),
      },
      cardRepository: {
        findById: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue(undefined),
      },
      catalogRepository: {
        findByCardId: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockResolvedValue(undefined),
        incrementQuantity: vi.fn().mockResolvedValue(undefined),
      },
    },
    camera: {
      getStream: vi.fn().mockResolvedValue({ getTracks: () => [] }),
      listDevices: vi.fn().mockResolvedValue([]),
      selectDevice: vi.fn().mockResolvedValue(undefined),
      captureFrame: vi.fn().mockReturnValue(new ImageData(1, 1)),
      stop: vi.fn(),
    },
    cardDataProvider: {
      searchCards: vi.fn().mockResolvedValue([]),
    },
    cardIdentificationService: { identify: mockIdentify },
    imageCache: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      has: vi.fn().mockResolvedValue(false),
    },
  },
}));

vi.mock("../../presentation/hooks/useScanSession", () => ({
  useScanSession: () => ({ sessionId: "test-session", cardsScanned: 0, setCardsScanned: vi.fn() }),
}));

function renderScanner() {
  return render(
    <MemoryRouter>
      <ScannerPage />
    </MemoryRouter>
  );
}

describe("ScannerPage — confirmation panel persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockDetect.mockReset();
    mockIdentify.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the confirmation panel visible when the card leaves the frame while awaiting user action", async () => {
    // First tick: stable card detected → triggers identification.
    // All subsequent ticks: no card detected.
    mockDetect
      .mockReturnValueOnce({ detected: true, stable: true, bounds: { x: 0, y: 0, width: 100, height: 140 } })
      .mockReturnValue({ detected: false, stable: false });

    mockIdentify.mockResolvedValue({
      status: "low_confidence",
      cardId: null,
      confidence: 0.2,
      strategy: "local_hash",
    });

    renderScanner();

    const video = document.querySelector("video")!;
    Object.defineProperty(video, "readyState", { value: 4, configurable: true });
    Object.defineProperty(video, "videoWidth", { value: 640, configurable: true });
    Object.defineProperty(video, "videoHeight", { value: 480, configurable: true });

    // Trigger onPlay → startDetectionLoop.
    await act(async () => {
      fireEvent(video, new Event("play", { bubbles: false }));
    });

    // First 250 ms tick: stable detection fires identify(); promise resolves; panel appears.
    await act(async () => {
      vi.advanceTimersByTime(250);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(/low confidence/i)).toBeInTheDocument();

    // Three more ticks: card is gone from frame — panel must remain visible.
    await act(async () => {
      vi.advanceTimersByTime(750);
    });

    expect(screen.getByText(/low confidence/i)).toBeInTheDocument();
  });

  it("resets to idle when card leaves frame before identification completes", async () => {
    // First tick: card detected but not stable.
    // Second tick: card gone.
    mockDetect
      .mockReturnValueOnce({ detected: true, stable: false, bounds: undefined })
      .mockReturnValue({ detected: false, stable: false });

    renderScanner();

    const video = document.querySelector("video")!;
    Object.defineProperty(video, "readyState", { value: 4, configurable: true });

    await act(async () => {
      fireEvent(video, new Event("play", { bubbles: false }));
    });

    // Two ticks: detecting → then card gone → resets to idle.
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // No confirmation panel.
    expect(screen.queryByText(/low confidence/i)).toBeNull();
    expect(screen.queryByText(/confirm.*add to collection/i)).toBeNull();
  });
});
