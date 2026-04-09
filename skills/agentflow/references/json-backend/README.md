# Local JSON Backend

Uses local files for board state and card context.

## Detection

Backend is active when `.agentflow/board.json` exists.

## File Structure

```
.agentflow/
├── board.json              # Board state (cards array)
└── cards/
    └── {id}.md             # Card context files
```

## board.json Schema

```json
{
  "cards": [
    {
      "id": "abc123",
      "title": "Add OAuth login",
      "type": "feature",
      "column": "refinement",
      "priority": "high",
      "tags": ["needs-feedback"],
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-01-11T14:30:00Z"
    }
  ]
}
```

## Core Patterns

### Read Board
```typescript
const board = JSON.parse(Bun.file('.agentflow/board.json').text());
```

### Find Card
```typescript
const card = board.cards.find(c => c.id === id);
```

### Update Card
```typescript
card.column = 'tech-design';
card.updatedAt = new Date().toISOString();
```

### Save Board
```typescript
Bun.write('.agentflow/board.json', JSON.stringify(board, null, 2));
```

### Read Card Context
```typescript
const context = Bun.file(`.agentflow/cards/${id}.md`).text();
```

### Write Card Context
```typescript
Bun.write(`.agentflow/cards/${id}.md`, content);
```

## Card Identification

Cards are identified by **6-character alphanumeric ID** (e.g., `abc123`).

Generate with:
```typescript
const id = Math.random().toString(36).substring(2, 8);
```

## Card Context

Card context is stored in `.agentflow/cards/{id}.md`. This file accumulates information as the card moves through phases.

## Conversation Log

Unlike GitHub (which uses comments), JSON backend stores conversation in the card context file under `## Conversation Log` section.

```markdown
## Conversation Log

**Agent (2026-01-10):** I have questions about the OAuth scope...

**Human (2026-01-10):** Use Google OAuth only, with email scope.
```

## Tags

Tags are stored in the card's `tags` array in board.json:
```json
"tags": ["needs-feedback", "blocked"]
```
