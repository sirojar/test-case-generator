import fs from "node:fs";
import path from "node:path";
import { simpleGit, type SimpleGit } from "simple-git";
import type { CommitInfo, StateFile } from "./types.js";

const STATE_FILE = ".tcgen-state.json";
const MAX_DIFF_CHARS = 90_000;

let git: SimpleGit;

function getGit(cwd?: string): SimpleGit {
  if (!git) {
    git = simpleGit(cwd);
  }
  return git;
}

export async function ensureGitRepo(cwd?: string): Promise<void> {
  const isRepo = await getGit(cwd).checkIsRepo();
  if (!isRepo) {
    console.error(
      "Error: Not a git repository. Run this from a project with git initialized."
    );
    process.exit(1);
  }
}

export function getLastProcessedCommit(): StateFile | null {
  const statePath = path.resolve(STATE_FILE);
  if (!fs.existsSync(statePath)) {
    return null;
  }
  const content = fs.readFileSync(statePath, "utf-8");
  return JSON.parse(content) as StateFile;
}

export function saveLastProcessedCommit(sha: string): void {
  const state: StateFile = {
    lastProcessedCommit: sha,
    lastRunAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.resolve(STATE_FILE),
    JSON.stringify(state, null, 2),
    "utf-8"
  );
}

export async function getCommitRange(
  from: string | null,
  to: string
): Promise<CommitInfo[]> {
  const g = getGit();

  if (from) {
    const log = await g.log({ from, to });
    return log.all.map((c) => ({
      hash: c.hash,
      message: c.message,
      author: c.author_name,
      date: c.date,
    }));
  }

  // No "from" means get all commits up to "to"
  const log = await g.log([to]);
  return log.all.map((c) => ({
    hash: c.hash,
    message: c.message,
    author: c.author_name,
    date: c.date,
  }));
}

export async function getDiff(
  from: string | null,
  to: string
): Promise<string> {
  const g = getGit();
  let diff: string;

  if (from) {
    diff = await g.diff([from, to]);
  } else {
    // No "from" — show full tree diff from root
    diff = await g.raw(["diff-tree", "-p", "--root", to]);
  }

  if (diff.length > MAX_DIFF_CHARS) {
    console.warn(
      `Warning: Diff is ${diff.length} characters, truncating to ${MAX_DIFF_CHARS}.`
    );
    diff = diff.substring(0, MAX_DIFF_CHARS) + "\n\n[DIFF TRUNCATED]";
  }

  return diff;
}

export function formatCommitLog(commits: CommitInfo[]): string {
  return commits
    .map(
      (c) =>
        `- ${c.hash.substring(0, 7)} ${c.message} (${c.author}, ${c.date})`
    )
    .join("\n");
}
