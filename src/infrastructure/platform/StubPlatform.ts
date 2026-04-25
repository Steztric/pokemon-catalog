import type { IPlatform, IStorageAdapter, IImageCacheAdapter, ICameraAdapter } from "../../domain/interfaces";
import {
  StubCardRepository,
  StubCardSetRepository,
  StubCatalogRepository,
  StubScanEventRepository,
  StubScanSessionRepository,
} from "../db/StubRepositories";
import { StubPokemonCardDataProvider } from "../api/StubPokemonCardDataProvider";

class StubImageCacheAdapter implements IImageCacheAdapter {
  async get(_cardId: string): Promise<string | null> {
    return null;
  }
  async set(_cardId: string, _imageData: ArrayBuffer): Promise<void> {}
  async has(_cardId: string): Promise<boolean> {
    return false;
  }
}

class StubCameraAdapter implements ICameraAdapter {
  async getStream(): Promise<MediaStream> {
    throw new Error("Camera not available in stub platform");
  }
  async listDevices(): Promise<MediaDeviceInfo[]> {
    return [];
  }
  async selectDevice(_deviceId: string): Promise<void> {}
  captureFrame(_video: HTMLVideoElement): ImageData {
    return new ImageData(1, 1);
  }
  stop(): void {}
}

function buildStubStorage(): IStorageAdapter {
  return {
    cardRepository: new StubCardRepository(),
    cardSetRepository: new StubCardSetRepository(),
    catalogRepository: new StubCatalogRepository(),
    scanEventRepository: new StubScanEventRepository(),
    scanSessionRepository: new StubScanSessionRepository(),
  };
}

export const stubPlatform: IPlatform = {
  storage: buildStubStorage(),
  imageCache: new StubImageCacheAdapter(),
  camera: new StubCameraAdapter(),
  cardDataProvider: new StubPokemonCardDataProvider(),
};
