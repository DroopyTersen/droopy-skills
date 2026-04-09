# /af tag - JSON Backend

Add or remove tags from a card.

## Process

**Add tag:**
1. Find card in board.json
2. Add tag to `tags` array (if not present)
3. Update `updatedAt`
4. Save board.json

**Remove tag:**
1. Find card in board.json
2. Remove tag from `tags` array (if present)
3. Update `updatedAt`
4. Save board.json

## Common Tags

- `needs-feedback` — Card waiting for human input
- `blocked` — External dependency blocking work

## Examples

```
/af tag abc123 add needs-feedback
/af tag abc123 remove blocked
```

## Confirm

"✅ Tag `{tag}` added to `{id}`"
"✅ Tag `{tag}` removed from `{id}`"
