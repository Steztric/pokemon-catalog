import type { ImageFrame } from "../../domain/entities";

export interface LLMCardIdentification {
  cardName: string;
  setName: string;
  cardNumber: string;
}

type FrameEncoder = (frame: ImageFrame) => string;

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";
const SYSTEM = "You are a Pokemon trading card expert. Identify cards precisely from images.";
const USER_TEXT =
  'Identify this Pokemon trading card. Respond ONLY with a JSON object in this exact format:\n{"cardName":"<name>","setName":"<set name>","cardNumber":"<number>"}\nIf you cannot identify it, respond with {"cardName":null,"setName":null,"cardNumber":null}';

function defaultEncoder(frame: ImageFrame): string {
  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(new ImageData(frame.data, frame.width, frame.height), 0, 0);
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}

export class AnthropicVisionClient {
  constructor(
    private readonly apiKey: string,
    private readonly encoder: FrameEncoder = defaultEncoder,
  ) {}

  async identifyCard(frame: ImageFrame): Promise<LLMCardIdentification | null> {
    let base64: string;
    try {
      base64 = this.encoder(frame);
      console.log(`[llm] frame encoded to base64 (${base64.length} chars)`);
    } catch (err) {
      console.log("[llm] encoder threw:", err);
      return null;
    }

    console.log(`[llm] POST ${API_URL} model=${MODEL}…`);
    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 256,
          system: SYSTEM,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: "image/jpeg", data: base64 },
                },
                { type: "text", text: USER_TEXT },
              ],
            },
          ],
        }),
      });
    } catch (err) {
      console.log("[llm] network error:", err);
      return null;
    }

    if (!response.ok) {
      console.log(`[llm] HTTP ${response.status} — request failed`);
      return null;
    }

    console.log(`[llm] HTTP ${response.status} OK — parsing response…`);
    let body: unknown;
    try {
      body = await response.json();
    } catch (err) {
      console.log("[llm] response.json() threw:", err);
      return null;
    }

    const text = (body as { content?: Array<{ type: string; text?: string }> })
      ?.content?.[0]?.text;
    if (typeof text !== "string") {
      console.log("[llm] unexpected response shape — no text content");
      return null;
    }

    console.log("[llm] raw text:", text);
    try {
      const parsed = JSON.parse(text.trim()) as {
        cardName: unknown;
        setName: unknown;
        cardNumber: unknown;
      };
      if (!parsed.cardName || !parsed.setName) {
        console.log("[llm] null fields — card not identifiable");
        return null;
      }
      const result = {
        cardName: String(parsed.cardName),
        setName: String(parsed.setName),
        cardNumber: String(parsed.cardNumber ?? ""),
      };
      console.log("[llm] parsed:", result);
      return result;
    } catch (err) {
      console.log("[llm] JSON.parse failed:", err, "raw:", text);
      return null;
    }
  }
}
