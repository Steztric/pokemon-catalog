import type { ICameraAdapter } from "../../domain/interfaces";

export class WebRTCCameraAdapter implements ICameraAdapter {
  private stream: MediaStream | null = null;
  private deviceId: string | null = null;

  async getStream(): Promise<MediaStream> {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
    }
    const constraints: MediaStreamConstraints = {
      video: this.deviceId ? { deviceId: { exact: this.deviceId } } : true,
      audio: false,
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.stream;
  }

  async listDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput");
  }

  async selectDevice(deviceId: string): Promise<void> {
    this.deviceId = deviceId;
  }

  captureFrame(video: HTMLVideoElement): ImageData {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}
