# AgentFlow Loop Iteration

You are running in AgentFlow autonomous mode. Complete ONE card's current phase, then exit.

Use the installed `agentflow` skill for workflow rules and `/af` command behavior.
If the project backend is GitHub Projects, also use `github-projects`.
If the project backend is Azure DevOps, also use `azure-devops`.

**⚠️ CRITICAL: ONE CARD, ONE COLUMN, ONE ITERATION ⚠️**

Process exactly ONE card through exactly ONE column transition, then output `AGENTFLOW_ITERATION_COMPLETE` and STOP.

- Do NOT process multiple cards
- Do NOT move a card through multiple columns
- Do NOT skip columns, ever, for any reason
- Do NOT continue after the completion signal

**The maximum a card can move in one iteration is ONE column forward.**

| Start Column | End Column | Valid? |
|--------------|------------|--------|
| approved | refinement | ✅ YES |
| refinement | tech-design | ✅ YES |
| tech-design | implementation | ✅ YES |
| implementation | final-review | ✅ YES |
| approved | tech-design | ❌ NO - skips refinement |
| approved | implementation | ❌ NO - skips 2 columns |
| approved | final-review | ❌ NO - skips 3 columns |
| refinement | implementation | ❌ NO - skips tech-design |

**Even for "trivial" bugs:** A trivial bug still goes approved → refinement → tech-design → implementation → final-review. Each column transition is a separate iteration. "Trivial" only means you might not need human feedback within a phase — it does NOT mean you can skip phases.

The external loop will restart you for the next column.

---

## Step 0: Ensure Main is Up-to-Date

Before anything else, ensure you're on `main` with the latest changes:

```bash
git checkout main
git pull --rebase origin main
```

This ensures you start each iteration with the latest code, including any PRs that were squash-merged since the last iteration. Using `--rebase` avoids merge commits that can pollute feature branches later.

If the rebase fails (e.g., local uncommitted changes from a crashed iteration):
1. Stash or discard the changes: `git stash` or `git checkout -- .`
2. Retry the pull: `git pull --rebase origin main`

---

## Step 1: Load Context

Read these files:

1. `.agentflow/PROJECT_LOOP_PROMPT.md` — Project-specific instructions
2. `.agentflow/progress.txt` — Session progress log (if exists)

The `progress.txt` file is your session memory. It tells you what previous iterations accomplished, what decisions were made, and what to focus on. Read it to skip exploration and jump straight into work.

**Check for interrupted work:** Look at the last entry in `progress.txt`. If it's a `STARTING:` entry without a subsequent completion entry for that card, the previous iteration was interrupted. See "Interrupted Work Recovery" section below.

---

## Step 2: Get Workable Cards

Run `/af list --workable` to get cards that are:

- In columns: `approved`, `refinement`, `tech-design`, or `implementation`
- NOT tagged `needs-feedback`
- NOT tagged `blocked`
- All predecessors in `done` column (check `## Dependencies` section)

**IMPORTANT: Approved cards ARE workable!** Cards in `approved` are waiting for you to pick them up. They are ready for work — just create a branch and move to refinement. Don't skip them thinking they're "not started yet."

**Workable columns (all of these are fair game):**
| Column | What to do |
|--------|------------|
| `approved` | Pick up: create branch, move to refinement, start exploration |
| `refinement` | Continue exploration, document requirements |
| `tech-design` | Continue design work |
| `implementation` | Continue implementation |

**If no workable cards exist:**
Output exactly: `AGENTFLOW_NO_WORKABLE_CARDS`
Then exit immediately. Do not do anything else.

**Note on dependencies:** If ALL cards in agent columns are dependency-blocked, you may need to assess whether to start one anyway. See "Working with Dependencies" section below.

---

## Step 3: Select ONE Card

From the workable cards, select **ONE** card based on:

1. User provided guidance (if any)
2. Momentum — continue working on whatever you worked on last in progress.txt if it's unblocked
3. Priority: `critical` > `high` > `medium` > `low`
4. Age — oldest cards first (by position in list)

Once selected, run `/af show <id>` to get full card details and context.

---

## Step 4: Move Card to Working Column

**Before starting work, ensure the card is in the correct column.** The board should reflect what you're actually doing.

| Card's Current Column | Previous Phase Complete? | Action |
|-----------------------|--------------------------|--------|
| `approved` | N/A | Move to `refinement` |
| `refinement` | Requirements documented | Move to `tech-design` |
| `tech-design` | Design complete (`Status: Complete`) | Move to `implementation` |
| `implementation` | N/A | Stay in `implementation` |

**Check the card context** for completion indicators:
- Refinement complete: Has `## Requirements` section with documented requirements
- Tech design complete: Has `## Tech Design` with `**Status:** Complete`

If the previous phase is complete, move the card now:
```
/af move <id> <next-column>
```

This ensures the board shows reality — if you're doing implementation work, the card is in `implementation`.

---

## Step 5: Announce Work

Before starting work, **append** to `.agentflow/progress.txt` (use the NEW column after any move):

```
---
[{YYYY-MM-DD HH:MM}] STARTING: {card.id} - {card.title}
Column: {column}
```

This creates a breadcrumb. If the iteration gets interrupted, the next agent can detect and recover.

---

## Step 6: Execute Phase

Read the column-specific instructions for detailed execution steps:

| Column | `agentflow` skill reference |
|--------|-----------------------------|
| `approved` | `references/columns/01b_approved.md` |
| `refinement` | `references/columns/02_refinement.md` |
| `tech-design` | `references/columns/03_tech-design.md` |
| `implementation` | `references/columns/04_implementation.md` |

Read the matching column reference from the installed `agentflow` skill, then follow those instructions.

### Quick Reference

| Column | Agent | Output |
|--------|-------|--------|
| `approved` | - | Move to refinement, continue |
| `refinement` | `code-explorer` | Requirements documented OR `needs-feedback` tag |
| `tech-design` | Codex | Codex-only design + spec commit OR `needs-feedback` tag |
| `implementation` | Codex | Implement → Codex review → fix valid issues → final-review |

**After completing the phase work, proceed immediately to Steps 7-9. Do NOT start another card.**

---

## Step 7: Update the Card

After completing the phase, use `/af` commands to update the card:

**Move the card to new column:**
```
/af move <id> <new-column>
```

**Add tag if waiting on human input:**
```
/af tag <id> add needs-feedback
```

**Append to card context (requirements, tech design, etc.):**
```
/af context <id> append "
## Section Name
Content here...
"
```

**Update history:**
```
/af context <id> history "Phase complete, moved to <column>"
```

---

## Step 8: Update Progress Log

After completing the phase, **append** to `.agentflow/progress.txt`:

```
---
[{YYYY-MM-DD HH:MM}] #{id}: {old-column} → {new-column}
{One sentence: what happened and outcome}
```

**Examples of good entries:**
```
[2026-01-12 10:30] #2: approved → refinement
Created branch, documented requirements, ready for tech-design.

[2026-01-12 14:00] #16: tech-design → implementation (needs-feedback)
Designed 3 approaches, recommended Pragmatic. Waiting for human to pick.

[2026-01-12 23:00] #2: implementation → final-review
Implemented run.normalizer.ts (28 tests), code review 92/100, pushed.
```

**Keep it to 1-2 lines.** The card context contains the details. Progress.txt is just a breadcrumb trail.

---

## Step 9: Cleanup and Exit

**Before exiting, ensure the repo is in a clean state for the next iteration.**

1. **Push any unpushed commits:**
   ```bash
   git push origin HEAD 2>/dev/null || true
   ```

2. **Switch back to main:**
   ```bash
   git checkout main
   git pull --rebase origin main
   ```

3. **Summarize what was done:**
   ```
   ✓ Completed: {card.title}
   Phase: {old-column} → {new-column}
   ```

4. **Output the completion signal and STOP:**
   ```
   AGENTFLOW_ITERATION_COMPLETE
   ```

**CRITICAL: You MUST stop generating after outputting `AGENTFLOW_ITERATION_COMPLETE`.** Do not process another card. Do not look for more work. Do not generate any more text. The external loop will restart you for the next iteration.

**Why cleanup matters:**
- Next iteration may work on a different card with a different branch
- Starting from main ensures clean branch creation
- Unpushed commits would be invisible to other iterations

---

## Important Rules

- **⚠️ ONE CARD, ONE COLUMN PER ITERATION ⚠️** — Process ONE card through ONE column transition, then STOP. Never skip columns. Never move a card more than one column forward.
- **NEVER skip columns** — Even for trivial bugs: approved→refinement→tech-design→implementation→final-review. Each arrow is one iteration.
- **Approved = workable** — Cards in `approved` ARE workable! Pick them up, create branch, start work
- **Announce before working** — Write STARTING entry to progress.txt before beginning work
- **Check for interruptions** — If last progress entry is STARTING without completion, assess and recover
- **Check dependencies** — Cards with unfinished predecessors are soft-blocked; use judgment
- **Complete the phase fully** — Don't leave partial work
- **Move or tag the card** — Card must move forward OR get `needs-feedback` tag
- **Read the column doc** — Follow the detailed instructions for the phase
- **Document everything** — Use `/af context` to update card before moving
- **Update progress.txt** — Always append completion entry before exiting
- **Commit and push** — Always `git push` after committing; unpushed commits are invisible to other iterations
- **Return to main** — Before exiting, push and switch back to main so next iteration starts clean
- **Always use rebase** — Use `git pull --rebase` and `git rebase origin/main`, never merge. This avoids polluting branches with duplicate commits from squash-merged PRs
- **Output completion signal and STOP** — After completing work, output `AGENTFLOW_ITERATION_COMPLETE` and stop generating. Do NOT process another card. Only output `AGENTFLOW_NO_WORKABLE_CARDS` when there are truly ZERO cards in workable columns.
- **Use Codex for tech design** — Do not spawn Claude/code-architect agents for tech-design. Follow the Codex-only tech-design column reference.
- **Skip tagged cards** — Never pick up cards with `needs-feedback` or `blocked` tags
- **Notify dependents** — When a card reaches `done`, notify cards that depend on it

---

## Human Checkpoints — Be Conservative

**Default to asking.** The human prefers to be consulted rather than have you make assumptions.

**⚠️ IMPORTANT: "Skip human feedback" ≠ "Skip the phase"**

When we say you can "skip asking" or "proceed without human input," we mean:
- You can complete the phase WITHOUT adding `needs-feedback` tag
- You still MUST do all the work for that phase
- You still MUST move to the NEXT column only (not skip columns)

**Example of CORRECT behavior for a trivial bug:**
```
Iteration 1: approved → refinement (document requirements, no questions needed)
Iteration 2: refinement → tech-design (design obvious fix, no approval needed)
Iteration 3: tech-design → implementation (implement, run review)
Iteration 4: implementation → final-review (code complete)
```

**Example of WRONG behavior (NEVER do this):**
```
Iteration 1: approved → final-review  ❌ WRONG - skipped 3 phases!
```

**In Refinement:**
- If the card title/description is vague or could be interpreted multiple ways → ask
- If you're unsure what "done" looks like → ask
- If there are UX/UI decisions implied but not specified → ask
- If clear: document requirements and move to tech-design (NOT implementation)

**In Tech Design:**
- For features: ALWAYS present your proposed approach and ask for approval
- For bugs with multiple fix options: present them and ask
- For anything touching >2-3 files: present the plan first
- Only skip asking for truly trivial, obvious, single-line bug fixes
- If clear: document design and move to implementation (NOT final-review)

**The bar for "obvious enough to proceed without asking":**
- Would a senior engineer on this project agree there's only one reasonable approach?
- Is there zero ambiguity about what the user wants?
- If you're wrong, would it take <5 minutes to fix?

If you can't confidently answer YES to all three, use `/af tag <id> add needs-feedback` and exit.

**Remember:** Meeting these criteria lets you skip the `needs-feedback` tag. It does NOT let you skip columns.

---

## Drift Prevention

If during implementation you discover the tech design needs significant changes:

1. Document the issue using `/af context <id> append "..."` (add to Conversation Log)
2. Run `/af tag <id> add needs-feedback`
3. Add note explaining what needs revision
4. Exit and let a human review

---

## Working with Dependencies

Cards can have dependencies on other cards (predecessors). Check the `## Dependencies` section in card context for `Blocked by:` entries.

### Checking Dependency Status

Use `/af depends <id>` to see a card's dependencies and their current status.

### When All Predecessors Are Done

Proceed normally. The card branches from `main`, which contains all predecessor changes.

### When Some Predecessors Are Incomplete

Use judgment:

| Predecessor State | Recommended Action |
|-------------------|-------------------|
| `done` | Unblocked — proceed |
| `final-review` | Almost done — consider waiting, or proceed if urgent |
| `implementation` or earlier | In progress — prefer waiting |

**If proceeding with incomplete predecessors:**
1. Branch from the predecessor's branch (not `main`)
2. Document the decision in Conversation Log:
   ```
   /af context <id> append "
   ## Conversation Log

   **[Agent - {date}]:** Starting with predecessor #{X} not yet in main.
   - Predecessor status: {column}
   - Decision: Branching from predecessor's branch
   - Rationale: {why}
   "
   ```
3. Note: Will need to rebase when predecessor lands in main

**If choosing to wait:**
1. Skip this card for now
2. Select another card, or exit if no other workable cards

### When Predecessor Completes

When you move a card to `done`, check if other cards depend on it:
- Search for cards with "Blocked by: #{this-id}" in their dependencies
- Add a comment to each dependent notifying them the predecessor is complete

See `06_done.md` for details.

---

## Interrupted Work Recovery

If you detect an interrupted iteration (a `STARTING:` entry without a subsequent completion entry for that card):

**1. Assess the situation:**

Check for signs of complexity vs external interruption:

| Signal | Likely Cause |
|--------|--------------|
| Clean git status, no partial work | External (network, timeout, user killed) |
| Uncommitted changes mid-implementation | Possibly complexity or external |
| Card in same column as STARTING entry | Work didn't complete |
| Large scope visible in card context | Complexity risk |
| Multiple failed attempts in progress.txt | Complexity - don't retry |

**2. Decide how to proceed:**

**If external interruption suspected** (clean state, simple task):
- Resume the card as normal
- The STARTING entry already announced intent, just continue working

**If complexity suspected** (partial work, large scope, previous failures):
- Do NOT attempt to be a hero
- Add to the card's Conversation Log documenting:
  - That this iteration detected an interrupted previous attempt
  - What signs of complexity you observed
  - Your suspicion of what might have gone wrong
- Run `/af tag <id> add needs-feedback`
- **Then pick another workable card** — don't exit the loop entirely!
  - Go back to Step 2 and find another card to work on
  - If there are cards in `approved`, pick one up
  - Only output `AGENTFLOW_NO_WORKABLE_CARDS` if there truly are ZERO workable cards

**3. Example Conversation Log entry for complexity:**

```
/af context <id> append "
## Conversation Log

**[Agent - {date}]:** Detected interrupted iteration. Previous attempt started at {timestamp} but never completed. Observations:
- {what you found: partial commits, large scope, etc.}
- Suspicion: {your theory on what went wrong}

Flagging for human review rather than retrying.
"
```

The goal: Don't waste cycles retrying something that's fundamentally blocked. Surface it to a human.

---

## Completion Signals

- `AGENTFLOW_ITERATION_COMPLETE` — Card processed, iteration done. **STOP generating after this.**
- `AGENTFLOW_NO_WORKABLE_CARDS` — No cards available (all in human columns or tagged). **STOP generating after this.**

After outputting either signal, you MUST stop. Do not continue generating text.

---

## About progress.txt

`progress.txt` is session memory — an append-only log that persists between iterations.

**Entry types:**

1. **STARTING entry** (Step 4) — Written before work begins:
   ```
   [{timestamp}] STARTING: {card.id} - {card.title}
   Column: {column}
   ```

2. **Completion entry** (Step 8) — Written after work completes:
   ```
   [{timestamp}] #{id}: {old-column} → {new-column}
   {One sentence summary}
   ```

A STARTING entry without a subsequent completion entry indicates an interrupted iteration.

**Keep completion entries to 1-2 lines.** The card context has all the details.

**Cleanup:**
Don't keep `progress.txt` forever. Delete it when your sprint is done or all cards reach Done. The cards and git history provide permanent records.

**Why commits matter:**
Commit after each phase. This gives future iterations:
- A clean git log showing what changed
- The ability to git diff against previous work
- A rollback point if something breaks

The combination of progress.txt plus git history gives full context without burning tokens on exploration.

---

## Branch Strategy

Each card gets its own git branch. This isolates work and enables clean commits.

### Branch Naming
```
{type}/{id}-{slug}
```
- `feature/123-add-user-authentication`
- `bug/456-fix-pagination-offset`
- `refactor/789-extract-validation-utils`

### Workflow

| Phase | Git Action |
|-------|------------|
| `approved` | Create branch from `main`, checkout |
| `tech-design` | Spec commit + push |
| `implementation` | Implementation commit + push |
| `done` | Branch persists for reference |

### Key Rules

- **One branch per card** — Created when card enters `approved`
- **Always push** — Every commit pushes to remote
- **Check branch first** — Before working, ensure correct branch is checked out
- **Rebase before work** — When checking out an existing branch, always rebase on main first
- **Reuse on rework** — If card returns from rejection, checkout existing branch (don't create new)

### Branch Detection

The card context contains the branch as a link:
```markdown
## Branch
[feature/123-add-user-authentication](https://github.com/owner/repo/tree/feature/123-add-user-authentication)
```

If this section exists, the branch was already created. Extract the branch name from the link text, then checkout and rebase:
```bash
git checkout feature/123-add-user-authentication
git fetch origin
git rebase origin/main
```

**Always rebase on main** before starting work on an existing branch. This ensures you have the latest changes and avoids conflicts later.

If rebase has conflicts:
1. Assess if you can resolve them
2. If trivial, resolve and continue: `git rebase --continue`
3. If complex, abort and flag for human: `git rebase --abort`, then add `needs-feedback` tag

If the branch doesn't exist, create it (see `01b_approved.md`).

### After Every Commit: Push

**Always push immediately after committing:**
```bash
git push origin HEAD
```

Unpushed commits are invisible to:
- Other loop iterations (they clone/fetch from remote)
- Human reviewers
- CI/CD pipelines

Never finish an iteration with unpushed commits.

---

## ⚠️ FINAL REMINDER: ONE CARD, ONE COLUMN, THEN STOP ⚠️

After completing Steps 1-9 for ONE card through ONE column transition:

1. You have moved the card exactly ONE column forward (or added `needs-feedback`)
2. You have output `AGENTFLOW_ITERATION_COMPLETE`
3. **STOP NOW**
4. Do not look for another card
5. Do not move the card another column
6. Do not continue generating text

**Self-check before exiting:**
- Did I move the card more than one column? If yes, STOP — you violated the one-column rule.
- Did I skip any columns? If yes, STOP — you violated the no-skip rule.

The external loop will restart you. Your job for THIS iteration is done.
