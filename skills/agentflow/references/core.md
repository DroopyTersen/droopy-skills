# AgentFlow Core Concepts

Shared concepts for all backends. Backend-specific implementation is in `azure-devops/`, `github/`, or `json/` directories.

## Commands Overview

| Command | Description |
|---------|-------------|
| `/af add <title>` | Create new card |
| `/af list [--workable]` | List cards by column |
| `/af status` | Quick board overview |
| `/af show <id>` | Show card details |
| `/af move <id> <column>` | Move card to column |
| `/af tag <id> <action> <tag>` | Add/remove tags |
| `/af context <id> <action> <content>` | Update card context |
| `/af work <id>` | Work on specific card |
| `/af next` | Work on next available card |
| `/af feedback <id>` | Respond to needs-feedback card |
| `/af depends <id> [on|remove] <predecessor>` | Manage dependencies |
| `/af review <id>` | Run code review |
| `/af loop` | Instructions for external loop |

## Columns

```
new → approved → refinement → tech-design → implementation → final-review → done
 👤      👤          🤖            🤖             🤖              👤          ✅
```

| Column | Actor | Description |
|--------|-------|-------------|
| `new` | Human | Awaiting review and approval |
| `approved` | Human | Ready for agent to pick up |
| `refinement` | Agent | Exploring codebase, documenting requirements |
| `tech-design` | Agent | Designing implementation approach |
| `implementation` | Agent | Writing tests, implementing, reviewing |
| `final-review` | Human | Awaiting human approval |
| `done` | - | Complete |

**Agent-workable columns:** approved, refinement, tech-design, implementation

## Tags

| Tag | Meaning | Effect |
|-----|---------|--------|
| `needs-feedback` | Agent has questions for human | Card skipped by `/af next` |
| `blocked` | External dependency blocking work | Card skipped by `/af next` |

## Card Types

| Type | Label (GitHub) | Description |
|------|----------------|-------------|
| feature | `enhancement` | New functionality |
| bug | `bug` | Defect fix |
| refactor | `refactor` | Code improvement |

## Priority Order

`critical` > `high` > `medium` > `low`

Cards sorted by priority, then by age (oldest first).

## Dependencies

Cards can depend on predecessors. Store in card context:

```markdown
## Dependencies
Blocked by: #123, #456
```

**Dependency states:**
| Predecessor State | This Card |
|-------------------|-----------|
| `done` | Unblocked - branch from main |
| `final-review` | Soft-blocked - use judgment |
| Earlier columns | Harder-blocked - prefer waiting |

Use `/af depends <id>` to check status.

## Workable Card Criteria

A card is "workable" when ALL conditions are met:
1. Column is: approved, refinement, tech-design, or implementation
2. No `needs-feedback` tag
3. No `blocked` tag
4. All predecessors in `done` column

## Agent Invocation

| Phase | Agent | Purpose |
|-------|-------|---------|
| Refinement | `code-explorer` | Codebase reconnaissance, find relevant files |
| Tech Design | `code-architect` | Design approaches, trade-off analysis |
| Implementation | `code-reviewer` | Code review, scoring |

**Invocation pattern:**
```
Agent("code-explorer")
> {task description from card context}
```

## Phase Execution

When working a card, read:
1. `.agentflow/PROJECT_LOOP_PROMPT.md` — Project-specific context
2. The matching column reference in the installed `agentflow` skill under `references/columns/`
3. Card context (issue body or `.agentflow/cards/{id}.md`)

The column docs contain full phase workflows.

## Card Content Model

Cards have two content areas with different purposes:

| Area | Purpose | Content | Persistence |
|------|---------|---------|-------------|
| **Body** | Source of truth | Finalized requirements, chosen design, history | Permanent |
| **Discussion** | Conversation | Questions, proposed options, Q&A dialogue | Ephemeral |

**The rule:** Only put finalized, approved content in the body. All questions, proposals awaiting selection, and agent-human dialogue go in discussion.

**Why this matters:**
- Body is what readers see first — it should be the spec, not a chat log
- Discussion captures the decision-making process without cluttering the spec
- Backends implement this differently (see backend docs)

### Content Routing

| Content Type | Destination |
|--------------|-------------|
| Questions for human | Discussion |
| Multiple approaches for selection | Discussion |
| Agent-human Q&A | Discussion |
| Progress updates | Discussion |
| Finalized requirements | Body |
| Chosen design (after human selects) | Body |
| History table | Body |

### Backend Implementations

| Backend | Body | Discussion |
|---------|------|------------|
| Azure DevOps | Work Item Description (HTML) | Work Item Discussion (HTML) |
| GitHub | Issue body | Issue comments |
| JSON | `cards/{id}.md` | `## Conversation Log` inside `cards/{id}.md` |

See backend-specific docs for implementation details.

## Error Handling Principles

| Condition | Response |
|-----------|----------|
| No backend config | "No AgentFlow backend configured. Check for `.agentflow/azure-devops.json`, `.agentflow/github.json`, or `.agentflow/board.json`" |
| Card not found | "Card {id} not found" |
| Invalid column | "Unknown column: {col}. Valid: new, approved, refinement, tech-design, implementation, final-review, done" |
| Has needs-feedback | "Card {id} is waiting for feedback. Use `/af feedback {id}` to respond." |
| Has blocked tag | "Card {id} is blocked. Check card for details." |
| Has unfinished predecessors | "Card {id} is waiting on predecessors. Use `/af depends {id}` for details." |

## Confirmation Messages

Always confirm actions:
- Create: "✅ Created {id}: {title}"
- Move: "✅ Moved {id} to {column}"
- Tag: "✅ Tag `{tag}` {added to|removed from} {id}"
- Dependency: "✅ {id} now depends on {predecessor}"
