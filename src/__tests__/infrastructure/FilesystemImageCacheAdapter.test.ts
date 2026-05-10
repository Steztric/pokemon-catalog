import { describe, it, expect, beforeEach } from "vitest";
import { FilesystemImageCacheAdapter } from "../../infrastructure/cache/FilesystemImageCacheAdapter";
import type { IFileSystem } from "../../infrastructure/cache/IFileSystem";

class MemoryFileSystem implements IFileSystem {
  private files = new Map<string, Uint8Array>();

  async readFile(path: string): Promise<Uint8Array> {
    const data = this.files.get(path);
    if (!data) throw new Error(`ENOENT: ${path}`);
    return data;
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    this.files.set(path, data);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async mkdir(_path: string): Promise<void> {}

  async joinPath(...parts: string[]): Promise<string> {
    return parts.join("/");
  }

  async getAppDataDir(): Promise<string> {
    return "/test-data";
  }

  toDisplayUrl(localPath: string): string {
    return `asset://${localPath}`;
  }
}

describe("FilesystemImageCacheAdapter", () => {
  let adapter: FilesystemImageCacheAdapter;
  const cardId = "base1-4";
  const imageData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer; // mock JPEG header

  beforeEach(() => {
    adapter = new FilesystemImageCacheAdapter(new MemoryFileSystem());
  });

  it("returns false for has() when image is not cached", async () => {
    expect(await adapter.has(cardId)).toBe(false);
  });

  it("returns null for get() when image is not cached", async () => {
    expect(await adapter.get(cardId)).toBeNull();
  });

  it("stores an image and has() returns true", async () => {
    await adapter.set(cardId, imageData);
    expect(await adapter.has(cardId)).toBe(true);
  });

  it("get() returns a display URL after set()", async () => {
    await adapter.set(cardId, imageData);
    const url = await adapter.get(cardId);
    expect(url).toBeTruthy();
    expect(url).toContain(cardId);
  });

  it("get() returns a URL prefixed by toDisplayUrl output", async () => {
    await adapter.set(cardId, imageData);
    const url = await adapter.get(cardId);
    expect(url).toMatch(/^asset:\/\//);
  });

  it("stores multiple cards independently", async () => {
    const otherId = "base1-25";
    await adapter.set(cardId, imageData);
    expect(await adapter.has(otherId)).toBe(false);
    await adapter.set(otherId, imageData);
    expect(await adapter.has(cardId)).toBe(true);
    expect(await adapter.has(otherId)).toBe(true);
  });

  it("overwrites an existing cached image on set()", async () => {
    await adapter.set(cardId, imageData);
    const newData = new Uint8Array([0x00, 0x01]).buffer;
    await expect(adapter.set(cardId, newData)).resolves.toBeUndefined();
    expect(await adapter.has(cardId)).toBe(true);
  });

  it("has() returns false on filesystem error", async () => {
    const badFs: IFileSystem = {
      readFile: async () => { throw new Error("disk error"); },
      writeFile: async () => { throw new Error("disk error"); },
      exists: async () => { throw new Error("disk error"); },
      mkdir: async () => { throw new Error("disk error"); },
      joinPath: async (...p) => p.join("/"),
      getAppDataDir: async () => { throw new Error("disk error"); },
      toDisplayUrl: (p) => p,
    };
    const faultyAdapter = new FilesystemImageCacheAdapter(badFs);
    expect(await faultyAdapter.has(cardId)).toBe(false);
  });

  it("get() returns null when image is missing (fallback)", async () => {
    expect(await adapter.get("nonexistent-card")).toBeNull();
  });
});
