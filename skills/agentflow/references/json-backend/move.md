# /af move - JSON Backend

Move a card to a different column.

## Process

1. Find card in `.agentflow/board.json`
2. Update card:
   - `column`: new column name
   - `updatedAt`: current timestamp
3. Save board.json
4. Append to History table in context file

## Valid Columns

new, approved, refinement, tech-design, implementation, final-review, done

## Warnings

- Moving to agent column: "Note: Agent will pick up this card"
- Moving backward: "Warning: Moving backward may lose work"

## Confirm

"✅ Moved `{id}` to {column}"
