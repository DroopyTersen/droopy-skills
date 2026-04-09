# Column: New

**Actor:** Human
**Agent:** None
**Commit:** None

---

## Summary

Entry point for all work items. Human creates the initial card with a title, description, type, and priority using `/af add`.

Cards remain in this column until a human reviews and approves them. The Ralph Loop does NOT pick up cards from this column.

---

## Definition of Done

A card exists with:
- Title
- Description
- Type (feature, bug, refactor)
- Priority (critical, high, medium, low)

Human has reviewed and moved the card to `approved`.

---

## What Happens

### Human Creates Work Item

Use `/af add <title>` to create a card:
1. Provide a title (brief, descriptive)
2. Write a description (enough context for the agent)
3. Select type: feature, bug, or refactor
4. Set priority: critical, high, medium, or low

### System Creates Card

The card is created with initial content (storage location depends on backend).

### Human Approval

When ready to start work on a card:
1. Review the card title and description
2. Ensure it has enough context for the agent
3. Move the card to `approved` column

---

## Card Template

```markdown
# {Title}

## Type
{feature | bug | refactor}

## Priority
{critical | high | medium | low}

## Description
{Initial description from human}

---

## History
| Date | Column | Actor | Notes |
|------|--------|-------|-------|
| {date} | New | Human | Created |
```

---

## Entry Criteria

None (this is the starting point)

---

## Exit Criteria

- Title and description provided
- Type selected
- Priority set
- Human has reviewed and approved
- Card moved to `approved` column

---

## Tips for Good Cards

### Feature
**Good Title:** "Add user authentication with OAuth"
**Good Description:** "Users should be able to log in with Google. Need to store user profiles and handle session management."

### Bug
**Good Title:** "Pagination returns duplicate items on page 2"
**Good Description:** "When viewing the products list, clicking to page 2 shows some items from page 1. Happens consistently."

### Refactor
**Good Title:** "Extract validation logic into shared utilities"
**Good Description:** "Validation code is duplicated across UserForm, ProductForm, and CheckoutForm."

---

## Next Column

> **Approved** (moved by human when ready for agent work)
