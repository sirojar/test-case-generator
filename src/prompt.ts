import fs from "node:fs";

export function loadTemplate(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    console.error(
      `Error: Prompt template not found at "${filePath}". Run "tcgen init" to create one or use --prompt to specify a path.`
    );
    process.exit(1);
  }
  return fs.readFileSync(filePath, "utf-8");
}

export function buildPrompt(
  template: string,
  diff: string,
  commitLog: string
): string {
  return template
    .replace("{{COMMIT_LOG}}", commitLog)
    .replace("{{DIFF}}", diff);
}
