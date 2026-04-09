# /af show - JSON Backend

Display full card information.

## Process

1. Find card in `.agentflow/board.json`
2. Read context file `.agentflow/cards/{id}.md`
3. Display combined information

## Display Order

1. Card ID, title
2. Current column
3. Priority, tags
4. Full context file content
5. History timeline (from context)

## Output Format

```
# `abc123` Add OAuth login

**Column:** Tech Design
**Priority:** high
**Tags:** none
**Created:** 2026-01-10
**Updated:** 2026-01-11

---

[Full context file content]
```
