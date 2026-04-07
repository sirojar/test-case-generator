import fs from "node:fs";
import path from "node:path";
import type { RunConfig, TestCase, TestCaseOutput } from "./types.js";

export function writeTestCases(
  config: RunConfig,
  metadata: TestCaseOutput["metadata"],
  testCases: TestCase[]
): string {
  const output: TestCaseOutput = {
    metadata,
    testCases,
  };

  // Create output directory if it doesn't exist
  const outputDir = path.resolve(config.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  // Generate filename with timestamp
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "-")
    .substring(0, 19);
  const fileName = `tc-${timestamp}.json`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");

  return filePath;
}
