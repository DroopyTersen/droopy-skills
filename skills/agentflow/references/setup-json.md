# AgentFlow JSON Backend Setup

This guide helps you set up the local JSON file-based backend for AgentFlow.

The JSON backend stores all state in local files — no external services required. This is ideal for:
- Local development and experimentation
- Projects not using GitHub
- Offline work
- Simple single-developer workflows

## Runtime Files

Before configuring the backend, ensure the local `.agentflow/` runtime files exist.

Use [runtime-files.md](runtime-files.md) and copy:

- `assets/loop.sh` to `.agentflow/loop.sh`
- `assets/templates/PROJECT_LOOP_PROMPT.md` to `.agentflow/PROJECT_LOOP_PROMPT.md`
- `assets/templates/RALPH_LOOP_PROMPT.md` to `.agentflow/RALPH_LOOP_PROMPT.md`

## Setup

### Step 1: Create Board File

Copy `assets/templates/board.json` from the installed `agentflow` skill to `.agentflow/board.json`:

```json
{
  "version": "1.0",
  "columns": [
    { "id": "new", "name": "New" },
    { "id": "approved", "name": "Approved" },
    { "id": "refinement", "name": "Refinement" },
    { "id": "tech-design", "name": "Tech Design" },
    { "id": "implementation", "name": "Implementation" },
    { "id": "final-review", "name": "Final Review" },
    { "id": "done", "name": "Done" }
  ],
  "cards": []
}
```

### Step 2: Create Cards Directory

```bash
mkdir -p .agentflow/cards
```

Card context will be stored as markdown files in this directory.

### Step 3: Verify Setup

```bash
# Check board.json exists
cat .agentflow/board.json

# Check cards directory exists
ls -la .agentflow/cards/
```

---

## How It Works

### Board State

The `board.json` file tracks:
- Available columns
- All cards with their metadata

Card structure:
```json
{
  "id": "abc123",
  "title": "Add user authentication",
  "type": "feature",
  "column": "new",
  "priority": "high",
  "tags": [],
  "created": "2025-01-15T10:30:00Z",
  "updated": "2025-01-15T10:30:00Z"
}
```

### Card Context

Each card has a corresponding markdown file at `.agentflow/cards/{id}.md`:

```markdown
# Add user authentication

## Type
feature

## Priority
high

## Description
Implement user login and registration...

---

## History
| Date | Column | Actor | Notes |
|------|--------|-------|-------|
| 2025-01-15 | New | Human | Created |
```

### Discussion Log

Agent-human dialogue stays in the card markdown file under `## Conversation Log`.

---

## File Structure

After setup, your `.agentflow/` directory looks like:

```
.agentflow/
├── board.json           # Board state (cards array)
├── cards/               # Card context files
│   └── abc123.md        # Card context + conversation log
├── loop.sh              # External loop script
├── PROJECT_LOOP_PROMPT.md
├── RALPH_LOOP_PROMPT.md
├── progress.txt         # Created on first loop iteration
└── iterations/          # Created by loop.sh
```

---

## Quick Reference

After setup, use these commands:
- `/af add <title>` — Create card (generates ID, creates files)
- `/af list` — List all cards by column
- `/af show <id>` — Show card details
- `/af move <id> <column>` — Move card
- `/af next` — Work on next available card

See `/af` for full command reference.

---

## Migrating to GitHub

If you later want to switch to GitHub Projects:

1. Configure the GitHub backend using [setup-github.md](setup-github.md)
2. For each card in `board.json`:
   - Create a GitHub issue with the card content
   - Add to the project
   - Set the status column

The JSON backend files can be kept as backup or deleted.
