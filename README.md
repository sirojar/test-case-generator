# tcgen

AI-powered test case generator from git commits. Reads your commit diffs, combines them with a customizable prompt template, and uses Claude or Gemini to generate structured test cases as JSON.

## Install

```bash
npm install -g tcgen
```

## Quick Start

```bash
# In any git repository:
tcgen init                        # Creates prompt-template.md
# Edit prompt-template.md to describe your project

# Generate test cases (Claude - default)
ANTHROPIC_API_KEY=sk-... tcgen generate --all

# Generate test cases (Gemini)
GEMINI_API_KEY=... tcgen generate --all --provider gemini
```

## Commands

### `tcgen init`

Creates a `prompt-template.md` in the current directory with a starter template. Edit this file to describe your project — the more specific you are, the better the generated test cases.

### `tcgen generate [options]`

Generates test cases from git commits.

| Option | Description | Default |
|--------|-------------|---------|
| `--from <commit>` | Start from this commit (exclusive) | Last processed commit |
| `--to <commit>` | End at this commit (inclusive) | `HEAD` |
| `--all` | Process all commits from the beginning | `false` |
| `--output <dir>` | Output directory | `test-cases` |
| `--prompt <file>` | Prompt template file | `prompt-template.md` |
| `--provider <name>` | AI provider: `claude` or `gemini` | `claude` |
| `--model <model>` | Model to use | Per provider default |
| `--dry-run` | Preview prompt without calling AI | `false` |

## Environment Variables

| Variable | Required for | Description |
|----------|-------------|-------------|
| `ANTHROPIC_API_KEY` | `--provider claude` | Your Claude API key |
| `GEMINI_API_KEY` | `--provider gemini` | Your Google Gemini API key |

## AI Providers

### Claude (default)

```bash
ANTHROPIC_API_KEY=sk-... tcgen generate --all
ANTHROPIC_API_KEY=sk-... tcgen generate --all --model claude-sonnet-4-20250514
```

Default model: `claude-sonnet-4-20250514`

### Gemini

```bash
GEMINI_API_KEY=... tcgen generate --all --provider gemini
GEMINI_API_KEY=... tcgen generate --all --provider gemini --model gemini-2.0-flash
```

Default model: `gemini-2.0-flash`

## Prompt Template

The `prompt-template.md` file is fully editable. It uses two placeholders that get replaced at runtime:

- `{{COMMIT_LOG}}` — list of commits being processed
- `{{DIFF}}` — the git diff of those commits

Everything else in the template is yours to customize: project description, instructions, emphasis on edge cases vs happy path, etc.

### Example

```markdown
# Project Context

This is a banking API with the following features:
- User accounts and KYC verification
- Fund transfers (domestic and international)
- Transaction history and statements

# Instructions

You are a QA engineer. Analyze the git diff below and generate test cases...

## Changed commits:
{{COMMIT_LOG}}

## Diff:
{{DIFF}}
```

## Output Format

Test cases are written as JSON files in the output directory (default: `test-cases/`):

```json
{
  "metadata": {
    "generatedAt": "2026-04-07T14:30:22.000Z",
    "fromCommit": "a1b2c3d",
    "toCommit": "e4f5g6h",
    "commitCount": 3,
    "model": "claude-sonnet-4-20250514"
  },
  "testCases": [
    {
      "id": "TC-20260407-001",
      "title": "Verify cart total updates when item quantity changes",
      "description": "The commit modified the cart subtotal calculation...",
      "preconditions": ["User is logged in", "At least one item in cart"],
      "steps": [
        {
          "stepNumber": 1,
          "action": "Navigate to the shopping cart page",
          "expectedOutcome": "Cart page loads with item list"
        }
      ],
      "expectedResult": "Cart total correctly reflects the updated quantity",
      "priority": "high",
      "tags": ["cart", "calculation"],
      "relatedCommit": "e4f5g6h",
      "generatedAt": "2026-04-07T14:30:22.000Z"
    }
  ]
}
```

## How It Works

1. **Reads commits** — finds new commits since the last run (tracked in `.tcgen-state.json`)
2. **Extracts diff** — gets the combined diff of those commits
3. **Builds prompt** — loads your `prompt-template.md` and injects the diff + commit log
4. **Calls AI** — sends the prompt to Claude or Gemini
5. **Writes JSON** — saves structured test cases to the output directory
6. **Updates state** — records the last processed commit for next run

## Typical Workflow

```bash
# First run — process all existing commits
tcgen generate --all

# After new commits — only processes what's new
tcgen generate

# Preview what would be sent to AI
tcgen generate --dry-run

# Use a different provider
tcgen generate --provider gemini
```

## License

MIT
