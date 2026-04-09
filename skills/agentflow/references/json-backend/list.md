# /af list - JSON Backend

List all cards grouped by column.

## Process

1. Read `.agentflow/board.json`
2. Group cards by column
3. Sort within each column by priority, then createdAt

## Flags

**`--workable`**: Filter to cards where:
- Column is: approved, refinement, tech-design, or implementation
- No `needs-feedback` in tags
- No `blocked` in tags
- All predecessors in done (check `## Dependencies` in card context)

## Output Format

```
## New (2)
- `abc123` Add OAuth login [high]
- `def456` Fix navbar bug [medium]

## Approved (1)
- `ghi789` Implement search [high]

## Refinement (1) 🤖
- `jkl012` Add dark mode [medium] ⏸️

## Tech Design (0) 🤖

## Implementation (1) 🤖
- `mno345` Update dashboard [medium]

## Final Review (1) 👀
- `pqr678` Add caching [low] — score: 85/100

## Done (3) ✅
- `stu901` Initial setup
```

## Indicators

- 🤖 = Agent-workable column
- ⏸️ = Has `needs-feedback` tag
- 🚫 = Has `blocked` tag
- ⏳ = Has unfinished predecessors
- 👀 = Awaiting human review
