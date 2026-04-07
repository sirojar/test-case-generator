export interface TestStep {
  stepNumber: number;
  action: string;
  expectedOutcome: string;
}

export interface TestCase {
  id: string;
  title: string;
  description: string;
  preconditions: string[];
  steps: TestStep[];
  expectedResult: string;
  priority: "high" | "medium" | "low";
  tags: string[];
  relatedCommit: string;
  generatedAt: string;
}

export interface TestCaseOutput {
  metadata: {
    generatedAt: string;
    fromCommit: string;
    toCommit: string;
    commitCount: number;
    model: string;
  };
  testCases: TestCase[];
}

export interface StateFile {
  lastProcessedCommit: string;
  lastRunAt: string;
}

export interface RunConfig {
  fromCommit: string | null;
  toCommit: string;
  outputDir: string;
  promptFile: string;
  model: string;
  dryRun: boolean;
  all: boolean;
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}
