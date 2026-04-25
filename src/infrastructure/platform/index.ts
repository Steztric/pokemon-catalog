import type { IPlatform } from "../../domain/interfaces";
import { stubPlatform } from "./StubPlatform";

function resolvePlatform(): IPlatform {
  // Phase 4 will replace StubPlatform with SQLite (Tauri) or IndexedDB (browser)
  // based on whether window.__TAURI__ is defined.
  return stubPlatform;
}

export const platform: IPlatform = resolvePlatform();
