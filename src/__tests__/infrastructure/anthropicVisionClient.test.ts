import { describe, it, expect, vi, afterEach } from "vitest";
import { AnthropicVisionClient } from "../../infrastructure/vision/anthropicVisionClient";
import type { ImageFrame } from "../../domain/entities";

const frame: ImageFrame = {
  data: new Uint8ClampedArray(4),
  width: 1,
  height: 1,
  capturedAt: new Date(),
};

// Bypass canvas — not available in jsdom with full rendering
const mockEncoder = (_f: ImageFrame) => "base64imagedata";

function successResponse(cardName: string | null, setName: string | null, cardNumber: string | null) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        content: [{ type: "text", text: JSON.stringify({ cardName, setName, cardNumber }) }],
      }),
  };
}

describe("AnthropicVisionClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses a valid response into LLMCardIdentification", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successResponse("Charizard", "Base Set", "4")));
    const client = new AnthropicVisionClient("test-key", mockEncoder);
    const result = await client.identifyCard(frame);
    expect(result).toEqual({ cardName: "Charizard", setName: "Base Set", cardNumber: "4" });
  });

  it("sends the correct headers and model in the request body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse("Pikachu", "Base Set", "58"));
    vi.stubGlobal("fetch", fetchMock);
    const client = new AnthropicVisionClient("my-key", mockEncoder);
    await client.identifyCard(frame);

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect((options.headers as Record<string, string>)["x-api-key"]).toBe("my-key");
    const body = JSON.parse(options.body as string) as { model: string };
    expect(body.model).toBe("claude-sonnet-4-6");
  });

  it("returns null when the API returns a non-200 status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const client = new AnthropicVisionClient("test-key", mockEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });

  it("returns null on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));
    const client = new AnthropicVisionClient("test-key", mockEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });

  it("returns null when the model cannot identify the card (null fields)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successResponse(null, null, null)));
    const client = new AnthropicVisionClient("test-key", mockEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });

  it("returns null when the response content is malformed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ type: "text", text: "not json at all" }] }),
    }));
    const client = new AnthropicVisionClient("test-key", mockEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });

  it("returns null when the encoder throws", async () => {
    const throwingEncoder = () => { throw new Error("canvas unavailable"); };
    const client = new AnthropicVisionClient("test-key", throwingEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });
});
