import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Provider, TestCase } from "./types.js";

const SYSTEM_PROMPT =
  "You are a QA test case generator. Respond only with valid JSON — a JSON array of test case objects. No markdown, no explanation, just the JSON array.";

export async function generateTestCases(
  prompt: string,
  provider: Provider,
  model: string
): Promise<TestCase[]> {
  let rawText: string;

  if (provider === "gemini") {
    rawText = await callGemini(prompt, model);
  } else {
    rawText = await callClaude(prompt, model);
  }

  return parseTestCases(rawText);
}

async function callClaude(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required.");
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  let response;
  try {
    response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (error: unknown) {
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        console.error(
          "Error: Claude API authentication failed. Check your ANTHROPIC_API_KEY."
        );
        process.exit(1);
      }
      if (error.status === 429) {
        console.error(
          "Error: Rate limited by Claude API. Wait a moment and try again."
        );
        process.exit(1);
      }
      console.error(
        `Error: Claude API returned status ${error.status}: ${error.message}`
      );
      process.exit(1);
    }
    throw error;
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("Error: No text response from Claude API.");
    process.exit(1);
  }

  return textBlock.text.trim();
}

async function callGemini(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY environment variable is required.");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
  });

  let result;
  try {
    result = await genModel.generateContent(prompt);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    if (err.status === 401 || err.status === 403) {
      console.error(
        "Error: Gemini API authentication failed. Check your GEMINI_API_KEY."
      );
      process.exit(1);
    }
    if (err.status === 429) {
      console.error(
        "Error: Rate limited by Gemini API. Wait a moment and try again."
      );
      process.exit(1);
    }
    console.error(`Error: Gemini API error: ${err.message || error}`);
    process.exit(1);
  }

  const text = result.response.text();
  if (!text) {
    console.error("Error: No text response from Gemini API.");
    process.exit(1);
  }

  return text.trim();
}

function parseTestCases(raw: string): TestCase[] {
  // Try direct JSON parse first
  try {
    return JSON.parse(raw);
  } catch {
    // Try extracting from markdown code fences
    const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch) {
      try {
        return JSON.parse(fenceMatch[1]);
      } catch {
        // fall through
      }
    }

    console.error("Error: Failed to parse AI response as JSON.");
    console.error("Raw response:", raw);
    process.exit(1);
  }
}
