import { describe, it, expect, vi, afterEach } from "vitest";
import { OpenAIVisionClient } from "../../infrastructure/vision/openaiVisionClient";
import type { ImageFrame } from "../../domain/entities";

const frame: ImageFrame = {
  data: new Uint8ClampedArray(4),
  width: 1,
  height: 1,
  capturedAt: new Date(),
};

const mockEncoder = (_f: ImageFrame) => "base64imagedata";

function successResponse(cardName: string | null, setName: string | null, cardNumber: string | null) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ cardName, setName, cardNumber }) } }],
      }),
  };
}

describe("OpenAIVisionClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses a valid response into LLMCardIdentification", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successResponse("Charizard", "Base Set", "4")));
    const client = new OpenAIVisionClient("test-key", mockEncoder);
    const result = await client.identifyCard(frame);
    expect(result).toEqual({ cardName: "Charizard", setName: "Base Set", cardNumber: "4" });
  });

  it("sends the correct Authorization header and model in the request body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse("Pikachu", "Base Set", "58"));
    vi.stubGlobal("fetch", fetchMock);
    const client = new OpenAIVisionClient("my-openai-key", mockEncoder);
    await client.identifyCard(frame);

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect((options.headers as Record<string, string>)["Authorization"]).toBe("Bearer my-openai-key");
    const body = JSON.parse(options.body as string) as { model: string };
    expect(body.model).toBe("gpt-4o");
  });

  it("sends the image as a base64 data URL in the image_url content block", async () => {
    const fetchMock = vi.fn().mockResolvedValue(successResponse("Mewtwo", "Base Set", "10"));
    vi.stubGlobal("fetch", fetchMock);
    const client = new OpenAIVisionClient("test-key", mockEncoder);
    await client.identifyCard(frame);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as {
      messages: Array<{ role: string; content: unknown }>;
    };
    const userMsg = body.messages.find((m) => m.role === "user");
    const imageBlock = (userMsg?.content as Array<{ type: string; image_url?: { url: string } }>).find(
      (b) => b.type === "image_url",
    );
    expect(imageBlock?.image_url?.url).toBe("data:image/jpeg;base64,base64imagedata");
  });

  it("returns null when the API returns a non-200 status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    const client = new OpenAIVisionClient("test-key", mockEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });

  it("returns null on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));
    const client = new OpenAIVisionClient("test-key", mockEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });

  it("returns null when the model cannot identify the card (null fields)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successResponse(null, null, null)));
    const client = new OpenAIVisionClient("test-key", mockEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });

  it("returns null when the response content is malformed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "not json at all" } }] }),
    }));
    const client = new OpenAIVisionClient("test-key", mockEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });

  it("returns null when the encoder throws", async () => {
    const throwingEncoder = () => { throw new Error("canvas unavailable"); };
    const client = new OpenAIVisionClient("test-key", throwingEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });

  it("returns null when the response has no choices", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [] }),
    }));
    const client = new OpenAIVisionClient("test-key", mockEncoder);
    expect(await client.identifyCard(frame)).toBeNull();
  });
});
