# /af context - JSON Backend

Update the card context file.

## Actions

### `append` — Add content to context file

1. Read `.agentflow/cards/{id}.md`
2. Append new content
3. Save file
4. Update `updatedAt` in board.json

### `history` — Add row to History table

1. Read context file
2. Find the History table
3. Add new row: `| {YYYY-MM-DD} | {column} | Agent | {notes} |`
4. Save file
5. Update `updatedAt` in board.json

## Examples

```
/af context abc123 append "
## Refinement
**Date:** 2026-01-11
**Status:** Complete

### Requirements
- User can log in with Google OAuth
- Session persists for 7 days
"

/af context abc123 history "Requirements documented, ready for tech design"
```

## Conversation Log

For JSON backend, conversation is stored in the context file:

```markdown
## Conversation Log

**Agent (2026-01-10):** I have questions...

**Human (2026-01-10):** Here are my answers...
```

Add entries with:
```
/af context abc123 append "
**Agent (2026-01-11):** Tech design complete.
"
```
