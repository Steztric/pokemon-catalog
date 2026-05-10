import type { IImageCacheAdapter } from "../../domain/interfaces";
import type { IFileSystem } from "./IFileSystem";

export class FilesystemImageCacheAdapter implements IImageCacheAdapter {
  private cacheDirPromise: Promise<string> | null = null;

  constructor(private readonly fs: IFileSystem) {}

  private getCacheDir(): Promise<string> {
    if (!this.cacheDirPromise) {
      this.cacheDirPromise = (async () => {
        const dataDir = await this.fs.getAppDataDir();
        const dir = await this.fs.joinPath(dataDir, "card-images");
        await this.fs.mkdir(dir, { recursive: true });
        return dir;
      })();
    }
    return this.cacheDirPromise;
  }

  async set(cardId: string, imageData: ArrayBuffer): Promise<void> {
    const dir = await this.getCacheDir();
    const path = await this.fs.joinPath(dir, `${cardId}.jpg`);
    await this.fs.writeFile(path, new Uint8Array(imageData));
  }

  async get(cardId: string): Promise<string | null> {
    if (!(await this.has(cardId))) return null;
    const dir = await this.getCacheDir();
    const path = await this.fs.joinPath(dir, `${cardId}.jpg`);
    return this.fs.toDisplayUrl(path);
  }

  async has(cardId: string): Promise<boolean> {
    try {
      const dir = await this.getCacheDir();
      const path = await this.fs.joinPath(dir, `${cardId}.jpg`);
      return await this.fs.exists(path);
    } catch {
      return false;
    }
  }
}
