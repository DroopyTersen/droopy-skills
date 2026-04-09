# Azure Boards CLI Reference

## Setup

Use these checks before troubleshooting board commands:

```bash
az --version
az extension list
az login
az devops configure --defaults organization=https://dev.azure.com/ORG project=PROJECT
```

If the `azure-devops` extension is missing, install it with:

```bash
az extension add --name azure-devops
```

## Core Rule: Prefer Literal Values

When building WIQL inside an AI-controlled shell, shell interpolation often breaks quoting. Read the needed values first, then place them directly in the command you run.

The usual values are:

- Organization URL
- Project name
- Area path
- Work item type
- Board column field (`WEF_*_Kanban.Column`)
- Board done field (`WEF_*_Kanban.Column.Done`)

## Query Work Items

Use WIQL for list/status style operations:

```bash
az boards query \
  --wiql "SELECT [System.Id], [System.Title], [System.Tags], [WEF_GUID_Kanban.Column] FROM WorkItems WHERE [System.AreaPath] = 'PROJECT'" \
  --org "https://dev.azure.com/ORG" \
  --project "PROJECT" \
  -o json
```

Use WIQL to return only the fields you need for board listings. Avoid N+1 `work-item show` calls unless you need the full item body.

## Show a Work Item

Use:

```bash
az boards work-item show --id 123 --expand all --org "https://dev.azure.com/ORG" -o json
```

This is the main read for:

- `System.Title`
- `System.Description`
- `System.State`
- `System.Tags`
- board column fields
- relations

Do not pass `--project` to `work-item show`; the command does not accept it.

## Get Full Discussion History

`System.History` from `work-item show` only exposes the latest history entry. To get every discussion comment, use the updates API:

```bash
az devops invoke \
  --area wit \
  --resource updates \
  --route-parameters id=123 \
  --org "https://dev.azure.com/ORG" \
  -o json
```

Filter for updates that include `System.History` when you need the actual discussion trail.

## Create a Work Item

```bash
az boards work-item create \
  --title "My New Feature" \
  --type "Product Backlog Item" \
  --project "PROJECT" \
  --org "https://dev.azure.com/ORG" \
  -o json
```

Common follow-up updates:

- Description
- Area path
- Iteration path
- Tags
- Board column field

## Update Fields

Examples:

```bash
az boards work-item update --id 123 --title "New title" --org "https://dev.azure.com/ORG"
az boards work-item update --id 123 --description "<p>HTML description</p>" --org "https://dev.azure.com/ORG"
az boards work-item update --id 123 --discussion "<b>Agent:</b> update" --org "https://dev.azure.com/ORG"
az boards work-item update --id 123 --fields "System.AreaPath=PROJECT" --org "https://dev.azure.com/ORG"
```

## Kanban Columns

For reliable board moves, update the board-scoped WEF field, not just `System.State`.

Example:

```bash
az boards work-item update \
  --id 123 \
  --fields "WEF_GUID_Kanban.Column=Refinement" \
  --org "https://dev.azure.com/ORG"
```

Important details:

- WEF column fields are board-specific.
- A work item on multiple boards can have multiple `WEF_*_Kanban.Column` fields.
- Use the field configured for the board you care about.

## Description and Discussion Use HTML

Azure DevOps expects HTML in:

- `System.Description`
- discussion/history content

Use tags like `<p>`, `<br>`, `<ol>`, `<li>`, and `<b>`. Do not assume markdown will round-trip cleanly.

## Tags

Azure DevOps stores tags in `System.Tags` as a semicolon-separated string.

Read current tags:

```bash
az boards work-item show \
  --id 123 \
  --org "https://dev.azure.com/ORG" \
  --query "fields.\"System.Tags\"" \
  -o tsv
```

Append tags with `work-item update`:

```bash
az boards work-item update \
  --id 123 \
  --fields "System.Tags=existing-tag; new-tag" \
  --org "https://dev.azure.com/ORG"
```

Important limitation:

- The CLI path above is safe for append-style updates.
- It is not reliable for true replacement/removal flows.
- Use REST PATCH when tags must be replaced exactly.

## Relations and Dependencies

Show relations:

```bash
az boards work-item show --id 123 --expand all --org "https://dev.azure.com/ORG" -o json
```

Add a dependency:

```bash
az boards work-item relation add \
  --id 123 \
  --relation-type "System.LinkTypes.Dependency-Reverse" \
  --target-id 100 \
  --org "https://dev.azure.com/ORG"
```

Remove a dependency:

```bash
az boards work-item relation remove \
  --id 123 \
  --relation-type "System.LinkTypes.Dependency-Reverse" \
  --target-id 100 \
  --org "https://dev.azure.com/ORG"
```

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Expecting field name or expression` | WIQL quoting broke | Use literal values in one command |
| `missing a FROM clause` | Query was truncated/malformed | Rebuild the WIQL string |
| `--organization must be specified` | Variable expansion failed | Pass `--org` literally |
| `unrecognized arguments: --project` | Used `--project` with `work-item show` | Remove `--project` |
| `expand parameter can not be used with fields` | Mixed incompatible flags | Use `--expand all` alone |

## When REST Is Better

Prefer REST over raw CLI when you need:

- Exact tag replacement/removal
- Full discussion history
- Board metadata beyond the easy CLI flows
- Deterministic patch operations across multiple fields
