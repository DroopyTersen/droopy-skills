# `/af add`

Use this reference for new-card creation.

## Goal

Create a new card in the `new` column with enough initial context for a human to approve it later.

## Gather Inputs

You need:

- title
- description
- type: `feature`, `bug`, or `refactor`
- priority: `critical`, `high`, `medium`, or `low`

If the user did not give all of that:

- infer obvious values only when confidence is high
- default priority to `medium` if the user does not care
- ask for type or description only when the missing field would make the card unclear

## Initial Body Template

Use the structure from [columns/01_new.md](../columns/01_new.md):

```markdown
# {Title}

## Type
{feature | bug | refactor}

## Priority
{critical | high | medium | low}

## Description
{Initial description}

---

## History
| Date | Column | Actor | Notes |
|------|--------|-------|-------|
| {YYYY-MM-DD} | New | Human | Created |
```

## Backend Handoff

After reading [backend-selection.md](../backend-selection.md):

- GitHub Projects:
  - use `github-projects`
  - read its `references/agentflow.md` and `references/github-projects-cli.md`
  - create an issue, apply the type label, add it to the project, and set status to `New`
- Azure DevOps:
  - use `azure-devops`
  - read its `references/agentflow.md` and `references/azure-boards-cli.md`
  - create a work item, write Description, set tags/paths, and set the board column to `New`
- JSON:
  - use [json-backend/add.md](../json-backend/add.md)

## Confirmation

Confirm the new card ID and title after creation.
