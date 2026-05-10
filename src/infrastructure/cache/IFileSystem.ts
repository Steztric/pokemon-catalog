export interface IFileSystem {
  readFile(path: string): Promise<Uint8Array>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  joinPath(...parts: string[]): Promise<string>;
  getAppDataDir(): Promise<string>;
  toDisplayUrl(localPath: string): string;
}
