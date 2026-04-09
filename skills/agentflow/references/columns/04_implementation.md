# Column: Implementation

**Actor:** Agent
**Agent:** `code-reviewer` (after implementation)
**Commit:** Implementation commit

---

## Summary

Execute the tech design. Write tests first (TDD preferred), implement the solution, run verification, and get code review. The tech design should have resolved all unknowns, so this phase is primarily execution.

This column is typically agent-only with no human interaction (unless blocked or drift detected).

---

## Definition of Done

- Tests written (before implementation when possible)
- Implementation complete per tech design
- Dual code review completed (Claude + Codex)
- Suggestions synthesized (valid ones implemented, others documented as skipped)
- Implementation committed
- Review fixes committed (if any valid suggestions were implemented)
- All verification steps passing
- Card moved to Final Review

---

## Execution Steps

### Step 1: Read Card Context

```
Read the card's context (title, description, Refinement, and Tech Design sections)
```

Find the Tech Design section:
- Look for `## Tech Design` with `**Status:** Complete`
- If no complete tech design found, exit: "Waiting for tech design to complete"

### Step 2: Write Tests First (TDD)

Before implementing, write tests based on the verification plan:

**Features:**
- Write tests for happy path
- Write tests for edge cases

**Bugs:**
- Write failing test that reproduces the bug

**Refactors:**
- Verify existing tests cover behavior to preserve

### Step 3: Implement the Solution

Follow the tech design:
- Create new files as specified
- Modify existing files as planned
- Follow project conventions from `PROJECT_LOOP_PROMPT.md`
- Follow the implementation sequence from tech design

### Step 4: Cursory Verification

Quick checks to catch obvious issues:

```bash
# Adapt these to the project (check PROJECT_LOOP_PROMPT.md)
bun run typecheck || npm run typecheck || npx tsc --noEmit
bun test || npm test
bun run build || npm run build
```

### Step 5: Complete Implementation

If using TDD, iterate until tests pass:
- Make the failing tests pass
- Refactor if needed while keeping tests green

### Step 6: Dual Code Review (Claude + Codex)

Run both Claude's code-reviewer agent and OpenAI Codex in parallel. Two independent reviewers catch more issues than one. Focus is on **actionable suggestions**, not scores.

#### 6a: Launch Reviews in Parallel

**Start Codex review first (runs in background):**

```bash
# Create review prompt with context
BRANCH=$(git branch --show-current)
FILES_CHANGED=$(git diff --name-only main..HEAD | tr '\n' ', ')

codex exec "You are a code reviewer. Review the changes on branch '$BRANCH' compared to main.

Files changed: $FILES_CHANGED

Focus on finding real issues:
1. Bugs and logic errors (most important)
2. Security vulnerabilities
3. Missing error handling in critical paths
4. Performance issues with significant impact

For each issue, provide:
- File path and line number
- What the problem is
- Why it matters
- Concrete fix (before/after code)

Skip style preferences, minor optimizations, and speculative suggestions.
Only suggest what you can verify from the actual code.
Format as markdown." \
  --full-auto \
  --output-last-message .agentflow/codex-review.txt \
  --sandbox read-only &

CODEX_PID=$!
echo "Codex review started (PID: $CODEX_PID)"
```

**Run Claude code-reviewer agent:**

```
Agent("code-reviewer")
> Review the changes for this card
> Card: {card.title}
> Tech design: {from card}
> Files changed: {list of files}
```

**Wait for Codex to complete:**

```bash
wait $CODEX_PID
echo "Codex review complete"
cat .agentflow/codex-review.txt
```

#### 6b: Post Reviews to GitHub Issue

Post each review as a separate comment on the card's GitHub issue so the human can review them individually.

**Get the issue number from the card context** (look for the GitHub issue link).

**Post Claude's review:**

```bash
gh issue comment {ISSUE_NUMBER} --body "## 🟣 Claude Code Review

$(cat << 'EOF'
{Claude's review output here}
EOF
)"
```

**Post Codex's review:**

```bash
gh issue comment {ISSUE_NUMBER} --body "## 🟢 Codex Code Review

$(cat .agentflow/codex-review.txt)"
```

**Labels to distinguish:**
- 🟣 **Claude** - purple circle
- 🟢 **Codex** - green circle

#### 6d: Synthesize Suggestions

Collect suggestions from both reviewers. Evaluate each one:

| Signal | Likely Valid | Action |
|--------|--------------|--------|
| Both reviewers found it | High confidence | Fix it |
| Clear bug/security issue | Valid regardless of source | Fix it |
| Concrete before/after code | Reviewer is confident | Evaluate merit |
| Vague or speculative | Likely false positive | Skip it |
| Style preference only | Low value | Skip it |

**Questions to ask for each suggestion:**
- Is this a real bug or just a preference?
- Does the suggested fix actually improve the code?
- Would ignoring this cause problems?

Create a decision list:

```markdown
## Review Synthesis

### Will Implement
| Suggestion | Source | Why |
|------------|--------|-----|
| Add null check in parseInput() | Both | Prevents crash on malformed input |
| Use parameterized query | Codex | Fixes SQL injection vulnerability |

### Skipping
| Suggestion | Source | Why Not |
|------------|--------|---------|
| Rename 'data' to 'userData' | Codex | Style preference, existing convention |
| Add try-catch around X | Claude | Error already handled upstream |
```

#### 6e: Implement Valid Suggestions

Work through the "Will Implement" list:

1. Apply each fix
2. Run tests after each to catch regressions
3. If a fix is complex, assess if it's blocking or can be follow-up

```bash
# After each fix
bun test  # or npm test
```

#### 6f: Commit Review Fixes

If any fixes were made, create a dedicated commit:

```bash
git add .
git commit -m "fix({scope}): address code review feedback

Applied from dual review (Claude + Codex):
- {fix 1}
- {fix 2}

Reviewed and skipped:
- {suggestion}: {why}"

git push origin HEAD
```

**Note:** Separate commit from implementation. Documents that code was reviewed and improved.

### Step 7: Full Verification

Execute all verification steps from tech design:

```bash
# All tests
bun test

# Type check
bun run typecheck

# Build
bun run build

# Integration tests (if applicable)
bun test integration/

# UI testing via Claude Chrome (if applicable)
```

All verification must pass before proceeding.

**If verification cannot be completed:** See [Verification Blockers](#verification-blockers) below.

### Step 8: Create Implementation Commit and Push

```bash
git add .
git commit -m "{type}({scope}): {title}"
git push origin HEAD
```

This pushes to the feature branch established in the Approved phase.

**Type mapping:**
- feature → `feat`
- bug → `fix`
- refactor → `refactor`

**Examples:**
- `feat(auth): add OAuth login with Google provider`
- `fix(pagination): correct offset calculation`
- `refactor(validation): extract shared utilities`

### Step 9: Update Card and Move

1. Append Implementation and Code Review sections to card context
2. Update History table
3. Move card to `final-review` column

---

## Drift Prevention

If during implementation you discover the tech design needs significant changes:

1. Stop implementation
2. Document the issue in Conversation Log
3. Add `needs-feedback` tag
4. Add note explaining what needs revision
5. Exit this iteration (human will review)

Do NOT continue implementing if the design is wrong.

---

## By Work Item Type

### Feature

**TDD Approach:**
1. Write tests for happy path
2. Write tests for edge cases
3. Implement until tests pass
4. Refactor with green tests

**Verification:** Full test coverage for new code

### Bug

**TDD Approach:**
1. Write failing test that reproduces bug
2. Implement fix
3. Verify test passes
4. Run regression tests

**Verification:** Bug test passes, existing tests still pass

### Refactor

**TDD Approach:**
1. Ensure existing tests cover behavior
2. Make incremental changes
3. Keep tests green throughout

**Verification:** All existing tests still pass, behavior unchanged

---

## Dual Code Review Philosophy

Two reviewers provide independent perspectives. Focus is on **valid suggestions**, not scores.

**Why dual review?**
- Different models catch different issues
- Suggestions found by both are high-confidence
- Reduces false negatives (missed bugs)
- Cross-checking filters out false positives (bad suggestions)

**What makes a suggestion valid?**
- Identifies a real bug, security issue, or logic error
- Provides concrete before/after code
- The fix demonstrably improves the code
- Not just a style preference or speculative concern

**What to skip:**
- Vague concerns without concrete fixes
- Style preferences that don't affect functionality
- Speculative suggestions about "potential" issues
- Minor optimizations with unclear benefit

---

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

#### Cursory Verification
- Type check: Pass
- Build: Pass
- Basic tests: Pass

#### Full Verification
| Step | Result | Notes |
|------|--------|-------|
| Type check | Pass | No errors |
| Unit tests | Pass | 15 passed, 2 new |
| Integration tests | Pass | 5 passed |
| Build | Pass | |
| UI testing | Pass | Tested via Claude Chrome |

---

## Dual Code Review
**Date:** {YYYY-MM-DD}

### Suggestions Received

**From Claude (code-reviewer):**
- {suggestion 1}
- {suggestion 2}

**From Codex:**
- {suggestion 1}
- {suggestion 2}

### Review Synthesis

#### Implemented
| Suggestion | Source | Why Valid |
|------------|--------|-----------|
| Add null check in parseInput() | Both | Prevents crash on malformed input |
| Use parameterized query | Codex | Fixes SQL injection |

#### Skipped
| Suggestion | Source | Why Not |
|------------|--------|---------|
| Rename variable | Codex | Style preference only |
| Add extra logging | Claude | Not needed for this feature |

### Commits
**Implementation:** `{sha1}` - {type}({scope}): {title}
**Review Fixes:** `{sha2}` - fix({scope}): address code review feedback
**Branch:** `{branch-name}`
```

---

## Tag Handling

| Condition | Action |
|-----------|--------|
| Tech design needs revision | Add `needs-feedback`, document issue |
| Verification cannot be completed | Add `blocked`, document reason |
| External blocker | Add `blocked`, document reason |
| Generally no tags in this phase | Proceed through to final-review |

---

## Verification Blockers

If you cannot complete any expected verification step, **do not move the card forward**. This includes situations such as:

- **UI verification unavailable** - Claude Chrome extension not configured or accessible
- **Test harness broken** - Tests fail to run due to environment issues (not test failures)
- **Build system errors** - Build fails due to missing dependencies or configuration
- **Integration environment down** - External services needed for verification are unavailable
- **Missing tools** - Required tools (typecheck, linter, etc.) not installed or configured

### When Blocked on Verification

1. **Stop immediately** - Do not proceed to commit or move the card
2. **Add `blocked` tag** to the card
3. **Add detailed comment** to the Conversation Log explaining:
   - Which verification step failed
   - What error or issue was encountered
   - What was attempted to resolve it
   - What is needed to unblock (e.g., "Chrome extension needs to be enabled", "test database needs to be running")
4. **Exit this iteration** - Allow human to review and resolve

### Card Update for Verification Blocker

```markdown
---

### Conversation Log

**Agent ({YYYY-MM-DD}):**
Blocked on verification. Unable to complete: {verification step}

**Issue:** {Detailed description of what failed}

**Attempted:** {What was tried to resolve it}

**Needed to unblock:** {What human action or configuration is required}

---
```

### Example Blockers

| Verification Step | Blocker Example | Comment |
|-------------------|-----------------|---------|
| UI testing | "Claude Chrome MCP not available in non-interactive mode" | "Need to configure --mcp-config for Chrome extension or run verification manually" |
| Type check | "npx tsc command not found" | "TypeScript not installed, run: bun install" |
| Integration tests | "Connection refused to localhost:5432" | "PostgreSQL database not running, start with: docker-compose up -d" |
| Build | "Module '@/components' not found" | "Path aliases not configured, check tsconfig.json" |

**Critical:** The card must NOT move to Final Review if verification is incomplete. A blocked card with clear documentation allows humans to either fix the environment or manually verify and move the card forward.

---

## Entry Criteria

- Tech design complete (`Status: Complete`)
- Spec committed
- Verification steps documented
- No `needs-feedback` or `blocked` tag

---

## Exit Criteria

- Tests written and passing
- Implementation matches tech design
- Dual code review completed (Claude + Codex)
- Suggestions synthesized and documented (implemented vs skipped with reasons)
- Implementation committed
- Review fixes committed (if any valid suggestions were implemented)
- All verification steps passed
- Card moved to `final-review`

---

## Important Notes

- **TDD is preferred** - write tests before implementation
- **For bugs, start with a failing test** - it proves you understand the bug
- **Follow the tech design** - don't deviate without good reason
- **Run full verification** - don't skip steps from the verification plan
- **Dual review is required** - run both Claude and Codex reviewers
- **Focus on valid suggestions** - real bugs and security issues, not style preferences
- **Document decisions** - record what was implemented AND what was skipped (with reasons)
- **Commit fixes separately** - review fixes get their own commit after implementation
- **Sequence: Cursory → Dual Review → Fix → Full Verify** - catches issues early

---

## Next Column

> **Final Review**
