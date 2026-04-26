# AgentFlow Final Review Verification

Verify all cards in "Final Review" status through automated tests, code review, and live UI testing. Post verification results back to the card discussion for the active backend.

## Process Overview

1. **Scan the board** — Get all Final Review cards via `/af list`
2. **Prioritize by complexity** — Test simplest fixes first (CSS/display → behavior → new modules)
3. **For each card** — Checkout branch, verify tests pass, test in UI, post results to the card

## Detailed Steps

### Step 1: Get Final Review Cards

Run `/af list` and focus on cards in `Final Review`.

If you need backend-specific detail reads:

- GitHub Projects: use `github-projects` to read the issue body/comments and linked PRs
- Azure DevOps: use `azure-devops` to read work item Description/Discussion
- JSON: read `.agentflow/cards/{id}.md`

### Step 2: Create Verification Todo List

Use TodoWrite to track progress. Order by complexity:

| Complexity | Signs | Examples |
|------------|-------|----------|
| **Simple** | 1-2 files, CSS only, no new tests | Border fixes, display order |
| **Medium** | Behavior change, few files, some tests | Callback fixes, simple logic |
| **Complex** | New modules, 4+ files, 20+ new tests | Normalizers, hooks, projections |

### Step 3: Environment Setup

**Ensure .env exists** (needed for AI players, API calls):
```bash
# If missing, copy from sibling project or create
[ -f .env ] || echo "Create .env with required API keys"
```

**Dev server management:**
```bash
# Check if already running
lsof -i :5173

# If not running, start it
bun run dev &

# If running on wrong branch, restart after checkout
pkill -f "vite" && sleep 1 && bun run dev &
```

**Note:** Dev server has hot reload — for most changes, you don't need to restart after switching branches. Only restart if:
- Server crashed
- Major dependency changes
- .env file was added/changed

### Step 4: For Each Card

#### 4a. Checkout the Branch
```bash
git checkout <branch-name>
# Branch name is in issue body under "## Branch"
```

#### 4b. Run Automated Checks
```bash
# Type check
bun run typecheck

# Run tests (note the count!)
bun test

# Check for new tests (compare to baseline)
# More tests = implementation added test coverage
```

#### 4c. Codex Code Review

Get the diff context:
```bash
BRANCH=$(git branch --show-current)
FILES_CHANGED=$(git diff --name-only main..HEAD | tr '\n' ', ')
echo "Branch: $BRANCH"
echo "Files: $FILES_CHANGED"
```

Run Codex review. Do not run Claude/code-reviewer by default unless the human explicitly asks.

```bash
codex exec "You are a senior code reviewer. Review the changes on branch '$BRANCH' compared to main.

Files changed: $FILES_CHANGED
Card: #{issue_number} - {title}

Focus on bugs, regressions, security issues, missing error handling, and violations of project patterns.
Skip style preferences and speculative suggestions.
Return concise markdown with file/line references and concrete fixes." \
  --full-auto \
  --output-last-message .agentflow/codex-review.txt \
  --sandbox read-only
```

Verify:
- Implementation matches issue requirements
- Code follows project patterns
- No obvious bugs or regressions

#### 4d. UI Testing (if applicable)

**For component fixes — use Storybook (if available):**
```
Navigate to: http://localhost:5173/storybook/<component-name>
```
Take screenshot, verify the fix visually.

**For app flow fixes — manual testing:**
1. Navigate to the relevant page
2. Perform actions that exercise the fix
3. Verify expected behavior

**What to verify per fix type:**
- **Display fixes:** Screenshot shows correct rendering
- **Order fixes:** Items appear in expected sequence
- **Behavior fixes:** Perform action, observe correct result
- **Popup/overlay fixes:** Trigger condition, verify it appears/behaves correctly

#### 4e. Post Verification Result

Write the result back using the backend's conversation surface:

- GitHub Projects: issue comment
- Azure DevOps: Discussion comment
- JSON: append to `## Conversation Log`

Use this structure:

```markdown
**Agent Verification (YYYY-MM-DD):**

## Verification Results

### Code Review
- ✅ Implementation matches requirements
- ✅ Changes are minimal and focused
- Files changed: `file1.ts`, `file2.ts`

### Test Results
- ✅ Type check: Pass
- ✅ All tests: XXXX/XXXX pass (Y new tests)
- ✅ Build: Success

### UI Verification
- ✅ Tested via [storybook/manual testing]
- ✅ [Specific observation about the fix working]

### Commit
- SHA: <commit-sha>
- Branch: <branch-name>

## Verdict
APPROVED FOR MERGE

[One sentence summary]
```

### Step 5: Update Todo and Continue

Mark current card complete in TodoWrite, move to next card.

## Troubleshooting

**Dev server won't start:**
```bash
lsof -i :5173  # Check what's using port
kill -9 <PID>  # Kill it
```

**Tests failing unexpectedly:**
- Ensure you're on the correct branch
- Run `bun install` to update dependencies
- Check if tests require specific environment variables

## Summary Output

After completing all cards, provide summary:
- Total cards verified: X
- Approved: Y
- Needs changes: Z
- Skipped: W (with reasons)
