# /af add - JSON Backend

Create a new card in the New column.

## Process

1. **Read board:** `.agentflow/board.json`
2. **Generate ID:** 6-char alphanumeric
3. **Gather info:**
   - Ask user for description (or use title if simple)
   - Ask user for type: feature, bug, or refactor
   - Ask user for priority (default: medium)
4. **Create card object:**
   ```json
   {
     "id": "{generated}",
     "title": "{title}",
     "type": "{type}",
     "column": "new",
     "priority": "{priority}",
     "tags": [],
     "createdAt": "{ISO timestamp}",
     "updatedAt": "{ISO timestamp}"
   }
   ```
5. **Add to board.cards array**
6. **Save board.json**
7. **Create context file** `.agentflow/cards/{id}.md`:
   ```markdown
   # {title}

   ## Type
   {Feature | Bug | Refactor}

   ## Priority
   {critical | high | medium | low}

   ## Description
   {description}

   ---

   ## History
   | Date | Column | Actor | Notes |
   |------|--------|-------|-------|
   | {YYYY-MM-DD} | New | Human | Created |
   ```

## Confirm

"✅ Created card `{id}`: {title}"
