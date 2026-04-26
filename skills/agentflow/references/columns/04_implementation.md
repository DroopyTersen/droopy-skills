# Column: Implementation

**Actor:** Agent
**Reviewer:** Codex only by default
**Commit:** Implementation commit, plus optional review-fix commit

---

## Summary

Execute the tech design. Write tests first, implement the solution, run verification, and get Codex code review. The tech design should have resolved unknowns, so this phase is primarily execution.

This column is typically agent-only with no human interaction unless blocked or drift is detected.

AgentFlow must not call Claude for implementation review by default. Use Claude only if the human explicitly asks for it.

## Definition of Done

- tests written before implementation when possible
- implementation complete per tech design
- Codex code review completed
- valid review suggestions implemented or documented as skipped
- implementation committed
- review fixes committed separately if applicable
- all verification steps passing
- card moved to Final Review

---

## Execution Steps

### Step 1: Read Card Context

Read the card title, description, Refinement section, and Tech Design section.

Find the Tech Design section:

- look for `## Tech Design` with `**Status:** Complete`
- if no complete tech design exists, exit with: `Waiting for tech design to complete`

### Step 2: Write Tests First

Follow the project TDD rules.

- Bugs: write a failing test that reproduces the bug before implementation.
- Features: write tests for happy path and important edge cases.
- Refactors: verify existing tests cover behavior before changing structure.

### Step 3: Implement the Solution

Follow the tech design:

- create new files as specified
- modify existing files as planned
- follow project conventions from `.agentflow/PROJECT_LOOP_PROMPT.md`
- keep scope limited to the card
- do not stage unrelated working tree changes

### Step 4: Cursory Verification

Adapt commands to the project, preferring the project prompt:

```bash
bun run typecheck
bun test
bun run build
```

### Step 5: Codex Code Review

Run Codex review only. Do not launch Claude/code-reviewer agents unless the human explicitly asks.

```bash
BRANCH=$(git branch --show-current)
FILES_CHANGED=$(git diff --name-only main..HEAD | tr '\n' ', ')

codex exec "You are a senior code reviewer. Review the changes on branch '$BRANCH' compared to main.

Files changed: $FILES_CHANGED

Focus on:
1. Bugs and logic errors
2. Security vulnerabilities
3. Missing error handling in critical paths
4. Performance issues with meaningful impact
5. Violations of existing project patterns

For each issue provide:
- file path and line number when possible
- what the problem is
- why it matters
- concrete fix recommendation

Skip style preferences, minor optimizations, and speculative suggestions.
Only report issues you can defend from the code." \
  --full-auto \
  --output-last-message .agentflow/codex-review.txt \
  --sandbox read-only
```

Post the review to the card:

```bash
gh issue comment {ISSUE_NUMBER} --body "## Codex Code Review

$(cat .agentflow/codex-review.txt)"
```

### Step 6: Synthesize and Apply Valid Suggestions

Evaluate each Codex suggestion:

- real bug, security issue, or logic error: fix it
- concrete maintainability issue tied to project patterns: evaluate and fix if worthwhile
- style preference or speculation: document as skipped

If fixes are made:

```bash
bun test
git add .
git commit -m "fix({scope}): address Codex review feedback"
git push origin HEAD
```

### Step 7: Full Verification

Run every verification step from the Tech Design:

```bash
bun test
bun run typecheck
bun run build
```

Run any required integration, harness, or UI checks documented in the tech design or project prompt.

If verification cannot be completed, do not move the card forward. Add `blocked` with a clear explanation.

### Step 8: Create Implementation Commit and Push

```bash
git add .
git commit -m "{type}({scope}): {title}"
git push origin HEAD
```

If review fixes were committed first, ensure the implementation and review-fix commits are both pushed.

### Step 9: Update Card and Move

1. Append Implementation and Codex Code Review sections to card context/body.
2. Update the History table.
3. Move the card to `final-review`.

---

## Drift Prevention

If implementation reveals the tech design needs significant changes:

1. stop implementation
2. document the issue in discussion/comments
3. add `needs-feedback`
4. explain what needs revision
5. exit this iteration

Do not continue implementing if the design is wrong.

## Verification Blockers

If any expected verification step cannot be completed:

1. stop immediately
2. add `blocked`
3. comment with the failed step, error, attempted fixes, and what is needed to unblock
4. exit the iteration

The card must not move to Final Review while verification is incomplete.

## Card Context Update

```markdown
---

## Implementation
**Date:** {YYYY-MM-DD}

### Tests Written
| Test File | Coverage |
|-----------|----------|
| `path/to/test.ts` | {what it tests} |

### Changes Made
| File | Change | Description |
|------|--------|-------------|
| `path/to/new.ts` | Created | New component for X |
| `path/to/existing.ts` | Modified | Added Y functionality |

### Verification Results
| Step | Result | Notes |
|------|--------|-------|
| Type check | Pass | No errors |
| Unit tests | Pass | 15 passed, 2 new |
| Build | Pass | |
| Manual/UI testing | Pass | {scenario} |

### Codex Code Review
**Date:** {YYYY-MM-DD}

#### Suggestions Received
- {suggestion 1}
- {suggestion 2}

#### Implemented
| Suggestion | Why Valid |
|------------|-----------|
| Add null check in parseInput() | Prevents crash on malformed input |

#### Skipped
| Suggestion | Why Not |
|------------|---------|
| Rename variable | Style preference only |

### Commits
**Implementation:** `{sha1}` - {type}({scope}): {title}
**Review Fixes:** `{sha2}` - fix({scope}): address Codex review feedback
**Branch:** `{branch-name}`
```

## Exit Criteria

- tests written and passing
- implementation matches tech design
- Codex review completed
- valid Codex suggestions handled
- implementation committed
- review fixes committed separately if applicable
- verification passed
- card moved to `final-review`

## Important Notes

- Write tests before implementation, especially for bugs.
- Follow the tech design; return to tech-design if it is wrong.
- Do not call Claude/code-reviewer by default.
- Run full verification before moving forward.
- Keep review fixes in a separate commit when possible.

---

## Next Column

> **Final Review**
