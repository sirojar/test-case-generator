#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import {
  ensureGitRepo,
  getLastProcessedCommit,
  saveLastProcessedCommit,
  getCommitRange,
  getDiff,
  formatCommitLog,
} from "./git.js";
import { loadTemplate, buildPrompt } from "./prompt.js";
import { generateTestCases } from "./ai.js";
import { writeTestCases } from "./output.js";
import type { RunConfig } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name("tcgen")
  .description("AI-powered test case generator from git commits")
  .version("0.1.0");

// ---- init command ----
program
  .command("init")
  .description("Initialize prompt-template.md in the current directory")
  .action(() => {
    const dest = path.resolve("prompt-template.md");
    if (fs.existsSync(dest)) {
      console.log("prompt-template.md already exists. Skipping.");
      return;
    }

    // Copy bundled template
    const templateSrc = path.resolve(__dirname, "..", "templates", "prompt-template.md");
    if (!fs.existsSync(templateSrc)) {
      console.error("Error: Bundled template not found. Reinstall tcgen.");
      process.exit(1);
    }

    fs.copyFileSync(templateSrc, dest);
    console.log("Created prompt-template.md — edit it to describe your project.");
  });

// ---- generate command ----
program
  .command("generate")
  .description("Generate test cases from git commits")
  .option("--from <commit>", "Start from this commit (exclusive)")
  .option("--to <commit>", "End at this commit (inclusive)", "HEAD")
  .option("--all", "Process all commits from the beginning", false)
  .option("--output <dir>", "Output directory", "test-cases")
  .option("--prompt <file>", "Prompt template file", "prompt-template.md")
  .option("--model <model>", "Claude model to use", "claude-sonnet-4-20250514")
  .option("--dry-run", "Preview prompt without calling AI", false)
  .action(async (opts) => {
    await ensureGitRepo();

    // Resolve from-commit
    let fromCommit: string | null = opts.from || null;
    if (!fromCommit && !opts.all) {
      const state = getLastProcessedCommit();
      if (state) {
        fromCommit = state.lastProcessedCommit;
      } else {
        console.error(
          'Error: No previous run found. Use --all to process all commits or --from <commit> to specify a starting point.'
        );
        process.exit(1);
      }
    }

    const config: RunConfig = {
      fromCommit,
      toCommit: opts.to,
      outputDir: opts.output,
      promptFile: opts.prompt,
      model: opts.model,
      dryRun: opts.dryRun,
      all: opts.all,
    };

    // Get commits
    const commits = await getCommitRange(config.fromCommit, config.toCommit);
    if (commits.length === 0) {
      console.log(
        `No new commits${fromCommit ? ` since ${fromCommit.substring(0, 7)}` : ""}.`
      );
      process.exit(0);
    }

    console.log(`Found ${commits.length} commit(s) to process.`);

    // Get diff
    const diff = await getDiff(config.fromCommit, config.toCommit);
    if (!diff.trim()) {
      console.log("No changes found in the diff. Nothing to generate.");
      process.exit(0);
    }

    // Build prompt
    const commitLog = formatCommitLog(commits);
    const template = loadTemplate(path.resolve(config.promptFile));
    const prompt = buildPrompt(template, diff, commitLog);

    // Dry run — print and exit
    if (config.dryRun) {
      console.log("\n--- Constructed Prompt ---\n");
      console.log(prompt);
      console.log("\n--- End Prompt ---");
      console.log(`\nCharacters: ${prompt.length}`);
      return;
    }

    // Call AI
    console.log(`Generating test cases with ${config.model}...`);
    const testCases = await generateTestCases(prompt, config.model);

    if (testCases.length === 0) {
      console.log("AI returned no test cases (changes may be trivial).");
      process.exit(0);
    }

    // Write output
    const latestCommitHash = commits[0].hash;
    const metadata = {
      generatedAt: new Date().toISOString(),
      fromCommit: config.fromCommit || "initial",
      toCommit: latestCommitHash,
      commitCount: commits.length,
      model: config.model,
    };

    const filePath = writeTestCases(config, metadata, testCases);
    console.log(`Generated ${testCases.length} test case(s) → ${filePath}`);

    // Save state
    saveLastProcessedCommit(latestCommitHash);
  });

program.parse();
