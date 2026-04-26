# Workflow Commands - JSON Backend

Commands for working on cards: `/af work`, `/af next`, `/af feedback`, `/af depends`, `/af review`, `/af loop`.

---

## /af work <id>

Work on a specific card.

### Process

1. **Find card** in `.agentflow/board.json`
2. **Verify** column is agent-workable (approved, refinement, tech-design, implementation)
3. **Check blockers:**
   - Has `needs-feedback` tag? → Stop, explain what's needed
   - Has `blocked` tag? → Stop, show blocker details
4. **Read context:**
   - `.agentflow/PROJECT_LOOP_PROMPT.md`
   - `.agentflow/cards/{id}.md`
   - the matching `agentflow` skill column reference under `references/columns/`
5. **Execute phase** (see column docs for full details)

### Phase Summary

| Column | Action |
|--------|--------|
| approved | Move to refinement, start exploration |
| refinement | Run code-explorer, document requirements or ask questions |
| tech-design | Run code-architect, propose approaches or finalize design |
| implementation | Write tests, implement, run code-reviewer, commit |

---

## /af next

Work on highest priority workable card.

### Process

1. Read board.json
2. Filter to workable cards:
   - Column in [approved, refinement, tech-design, implementation]
   - No `needs-feedback` tag
   - No `blocked` tag
   - All predecessors in done
3. Sort by priority (critical→low), then createdAt (oldest first)
4. If no cards: "No workable cards. All waiting on human input."
5. Select first card
6. Announce: "Working on: `{id}` {title} ({column})"
7. Execute `/af work {id}`

### Dependency Handling

If ALL cards are dependency-blocked, assess whether to start one:
- Predecessor in `final-review` → May proceed if confident it lands soon
- Predecessor in earlier column → Warn and suggest waiting

If proceeding, document the decision in the Conversation Log.

---

## /af feedback <id>

Respond to a card waiting for human input.

### Process

1. Find card, verify it has `needs-feedback` tag
2. Read `.agentflow/cards/{id}.md`
3. Display pending questions from Conversation Log
4. Prompt human for responses
5. Append to Conversation Log:
   ```markdown
   **Human (YYYY-MM-DD):** {response}
   ```
6. Remove `needs-feedback` from tags array
7. Update `updatedAt`, save board.json

### Quick Form

```
/af feedback abc123 "Use Redis for sessions"
```

Adds answer, removes tag in one step.

### Confirm

"✅ Feedback recorded. Card `{id}` is now workable."

---

## /af depends <id> [on|remove] <predecessor>

Manage card dependencies.

### Show Dependencies (no action)

```
/af depends abc123
```

1. Read `.agentflow/cards/{id}.md`
2. Parse `## Dependencies` section
3. For each predecessor, check its column in board.json
4. Display:
   ```
   Dependencies for `abc123`:
     `xyz789` Add user auth — ✅ done
     `def456` Add OAuth — 🔄 implementation

   Status: Partially blocked (1 predecessor not done)
   ```

### Add Dependency

```
/af depends abc123 on xyz789
```

1. Read context file
2. Find or create `## Dependencies` section
3. Add/update: `Blocked by: \`xyz789\`, \`def456\``
4. Save context file

### Remove Dependency

```
/af depends abc123 remove xyz789
```

1. Read context file
2. Remove predecessor from `Blocked by:` line
3. Save context file

### Confirm

"✅ `{id}` now depends on `{predecessor}`"
"✅ Dependency on `{predecessor}` removed from `{id}`"

---

## /af review <id>

Run code review on implementation.

### Process

1. Find card, verify it's in implementation or final-review
2. Read `.agentflow/cards/{id}.md` for tech design and implementation details
3. Run Codex review with context
4. Output review markdown

Can be used standalone outside the normal workflow.

---

## /af loop

External bash script for terminal use.

### From Terminal (Recommended)

```bash
.agentflow/loop.sh              # Codex, 20 iterations
.agentflow/loop.sh 50           # Codex, custom max
```

The script pipes `.agentflow/RALPH_LOOP_PROMPT.md` to Codex by default. Each iteration:
1. Codex runs `/af list --workable`, selects card, executes phase
2. Codex updates card, pushes commits, returns to main, exits
3. Script checks for `AGENTFLOW_NO_WORKABLE_CARDS` or continues

### From Another Agent Environment

Do not run the loop in the background from inside another agent unless that agent can safely manage long-running child processes.

If you need an in-agent loop, execute one iteration at a time:
```
Read .agentflow/RALPH_LOOP_PROMPT.md and execute exactly one iteration.
Output AGENTFLOW_ITERATION_COMPLETE or AGENTFLOW_NO_WORKABLE_CARDS, then stop.
```

### Output Files

| File | Purpose |
|------|---------|
| `.agentflow/loop_status.txt` | Quick status summary (read this first) |
| `.agentflow/iterations/` | Per-iteration output (last 5 kept) |
| `.agentflow/progress.txt` | Accumulated work log across iterations |

### Checking Progress

When user asks "how's the loop?":

1. Read `loop_status.txt` for current state
2. Read `progress.txt` for completed work
3. Optionally run `/af status` for board state
4. Summarize for user

```bash
cat .agentflow/loop_status.txt
tail -50 .agentflow/progress.txt
```

### Exit Conditions

- No workable cards remain
- Max iterations reached
- User interrupts (Ctrl+C)
