# Project Context

This is an e-commerce application with the following features:
- User authentication (login, register, password reset)
- Product catalog with search and filtering
- Shopping cart and checkout flow
- Order management and history
- Payment processing

Edit this section to describe YOUR project. The more specific you are, the better the generated test cases will be.

---

# Instructions

You are a QA engineer. Analyze the git diff below and generate test cases.

For each meaningful change, produce test cases that cover:
- Happy path (normal usage)
- Edge cases and boundary conditions
- Error/failure scenarios where relevant

Focus on **functional** test cases a manual QA tester could execute.
Do NOT generate test cases for trivial changes (typo fixes, comment-only changes, formatting).

If the diff contains no testable changes, return an empty JSON array `[]`.

## Changed commits:
{{COMMIT_LOG}}

## Diff:
{{DIFF}}

Respond ONLY with a JSON array of test case objects matching this schema:
[
  {
    "id": "TC-YYYYMMDD-NNN",
    "title": "Short description of what is being tested",
    "description": "Detailed explanation of what and why",
    "preconditions": ["Setup needed before test"],
    "steps": [
      {
        "stepNumber": 1,
        "action": "What the tester does",
        "expectedOutcome": "What should happen"
      }
    ],
    "expectedResult": "Overall expected outcome",
    "priority": "high | medium | low",
    "tags": ["relevant", "tags"],
    "relatedCommit": "short SHA"
  }
]
