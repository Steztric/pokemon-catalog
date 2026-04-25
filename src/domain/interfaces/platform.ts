import type {
  ICardRepository,
  ICardSetRepository,
  ICatalogRepository,
  IScanEventRepository,
  IScanSessionRepository,
} from "./repositories";
import type { IPokemonCardDataProvider } from "./services";

export interface IStorageAdapter {
  cardRepository: ICardRepository;
  cardSetRepository: ICardSetRepository;
  catalogRepository: ICatalogRepository;
  scanEventRepository: IScanEventRepository;
  scanSessionRepository: IScanSessionRepository;
}

export interface IImageCacheAdapter {
  get(cardId: string): Promise<string | null>;
  set(cardId: string, imageData: ArrayBuffer): Promise<void>;
  has(cardId: string): Promise<boolean>;
}

export interface ICameraAdapter {
  getStream(): Promise<MediaStream>;
  listDevices(): Promise<MediaDeviceInfo[]>;
  selectDevice(deviceId: string): Promise<void>;
  captureFrame(video: HTMLVideoElement): ImageData;
  stop(): void;
}

export interface IPlatform {
  storage: IStorageAdapter;
  imageCache: IImageCacheAdapter;
  camera: ICameraAdapter;
  cardDataProvider: IPokemonCardDataProvider;
}
