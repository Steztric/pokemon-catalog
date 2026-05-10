import { readFile, writeFile, exists, mkdir } from "@tauri-apps/plugin-fs";
import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { IFileSystem } from "./IFileSystem";

export const tauriFileSystem: IFileSystem = {
  readFile: (path) => readFile(path),
  writeFile: (path, data) => writeFile(path, data),
  exists: (path) => exists(path),
  mkdir: (path, options) => mkdir(path, options),
  joinPath: (...parts) => join(...parts),
  getAppDataDir: () => appLocalDataDir(),
  toDisplayUrl: (path) => convertFileSrc(path),
};
