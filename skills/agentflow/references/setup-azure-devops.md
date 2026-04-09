# AgentFlow Azure DevOps Setup

This guide helps you set up Azure Boards as your AgentFlow backend.

## Runtime Files

Before configuring the backlog provider, ensure the local `.agentflow/` runtime files exist.

Use [runtime-files.md](runtime-files.md) and copy the bundled loop assets/templates into the project if they are missing.

## Install the Backlog Skill

AgentFlow assumes a standalone `azure-devops` skill is available at either the project level or user level.

If it is not installed yet, ask the user to install one. One example source is:

```text
https://github.com/DroopyTersen/droopy-skills
```

## Prerequisites

1. **Azure CLI** installed with the Azure DevOps extension:
   ```bash
   az --version
   az extension add --name azure-devops  # If not already installed
   ```

2. **Authenticated** to Azure:
   ```bash
   az login
   ```

3. **Azure DevOps organization and project** with a Kanban board

---

## Step 1: Configure Azure CLI Defaults

```bash
az devops configure --defaults organization=https://dev.azure.com/YOUR_ORG project=YOUR_PROJECT
```

Verify access:
```bash
az devops project show --project YOUR_PROJECT
```

---

## Step 2: Configure Kanban Board Columns

Go to your Azure Boards Kanban board and configure columns:

1. Navigate to **Boards → Boards** in Azure DevOps
2. Select the board for your backlog level (e.g., "Backlog items" or "Stories")
3. Click the **gear icon** (⚙️) → **Columns**
4. Configure exactly these 7 columns (case-sensitive):

| Column | Purpose |
|--------|---------|
| `New` | Human creates cards |
| `Approved` | Human approves for agent work |
| `Refinement` | Agent explores requirements |
| `Tech Design` | Agent designs approaches |
| `Implementation` | Agent implements |
| `Final Review` | Human reviews |
| `Done` | Complete |

**Tips:**
- You may need to add columns and rename existing ones
- Map workflow states to columns (multiple columns can map to the same state)
- Avoid split columns initially (simplifies setup)

---

## Step 3: Discover Board Column Field Names

Azure DevOps stores Kanban columns in board-specific fields. We need to find them.

**Method: Get from an existing work item**

1. Create a test work item (or use an existing one)
2. Drag it on the board to ensure the column field is populated
3. Run:

```bash
# Get the work item ID, then find the Kanban column field
az boards work-item show --id YOUR_WORK_ITEM_ID -o json | jq -r '.fields | keys[] | select(test("_Kanban\\.Column$"))'
```

You should see something like:
```
WEF_XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX_Kanban.Column
```

Also check for the split-column done field (optional):
```bash
az boards work-item show --id YOUR_WORK_ITEM_ID -o json | jq -r '.fields | keys[] | select(test("_Kanban\\.Column\\.Done$"))'
```

---

## Step 4: Create Configuration File

Copy `assets/templates/azure-devops.json` from the installed `agentflow` skill to `.agentflow/azure-devops.json`, then fill in the discovered values:

```json
{
  "organization": "https://dev.azure.com/YOUR_ORG",
  "project": "YOUR_PROJECT",
  "team": "YOUR_TEAM",
  "board": "Backlog items",
  "areaPath": "YOUR_PROJECT",
  "iterationPath": "YOUR_PROJECT",
  "workItemType": "Product Backlog Item",
  "boardColumnField": "WEF_XXXXXXXX_Kanban.Column",
  "boardColumnDoneField": "WEF_XXXXXXXX_Kanban.Column.Done",
  "boardColumns": {
    "new": "New",
    "approved": "Approved",
    "refinement": "Refinement",
    "tech-design": "Tech Design",
    "implementation": "Implementation",
    "final-review": "Final Review",
    "done": "Done"
  },
  "boardColumnDone": {
    "new": false,
    "approved": false,
    "refinement": false,
    "tech-design": false,
    "implementation": false,
    "final-review": false,
    "done": false
  }
}
```

**Field descriptions:**
- `organization` — Full org URL (e.g., `https://dev.azure.com/contoso`)
- `project` — Project name
- `team` — Team name (usually `{Project} Team`)
- `board` — Board name (e.g., `Backlog items`, `Stories`)
- `areaPath` — Area path for new work items
- `iterationPath` — Iteration path for new work items
- `workItemType` — Work item type to create (depends on process: `Product Backlog Item` for Scrum, `User Story` for Agile)
- `boardColumnField` — The WEF field from Step 3
- `boardColumnDoneField` — The WEF done field (optional, for split columns)
- `boardColumns` — Maps AgentFlow column keys to exact Azure column names
- `boardColumnDone` — Split column settings (all false if not using split columns)

---

## Step 5: Create Tags

AgentFlow uses tags for workflow status:

```bash
# Tags are created automatically when first used, but you can verify they work:
az boards work-item update --id YOUR_WORK_ITEM_ID --fields "System.Tags=needs-feedback"
```

Common tags:
- `needs-feedback` — Waiting for human input
- `blocked` — External dependency blocking work

---

## Step 6: Verify Setup

Test the configuration:

```bash
# Verify config file
cat .agentflow/azure-devops.json | jq .

# Test creating a work item
ORG=$(jq -r '.organization' .agentflow/azure-devops.json)
PROJECT=$(jq -r '.project' .agentflow/azure-devops.json)
TYPE=$(jq -r '.workItemType' .agentflow/azure-devops.json)

az boards work-item create --title "Test Card" --type "$TYPE" --project "$PROJECT" --org "$ORG"

# Test querying work items
AREA=$(jq -r '.areaPath' .agentflow/azure-devops.json)
az boards query --wiql "SELECT [System.Id], [System.Title] FROM workitems WHERE [System.TeamProject] = '$PROJECT' AND [System.AreaPath] UNDER '$AREA'" --org "$ORG" --project "$PROJECT"

# Test moving via Kanban column field
COLUMN_FIELD=$(jq -r '.boardColumnField' .agentflow/azure-devops.json)
az boards work-item update --id YOUR_WORK_ITEM_ID --fields "$COLUMN_FIELD=Approved" --org "$ORG"
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `azure-devops extension not found` | Run `az extension add --name azure-devops` |
| `Please run 'az login'` | Authenticate with `az login` |
| `TF400813: not authorized` | Check your permissions in Azure DevOps |
| `The field 'WEF_...' does not exist` | Work item may not be on the board; drag it on the board first |
| `Tags only add, don't replace` | Use the `azure-devops` skill's REST/PATCH guidance for exact tag replacement or removal |

---

## Process Template Notes

Azure DevOps has different process templates with different work item types:

| Process | Requirement Type | Bug | Task |
|---------|-----------------|-----|------|
| Scrum | Product Backlog Item | Bug | Task |
| Agile | User Story | Bug | Task |
| Basic | Issue | Issue | Task |
| CMMI | Requirement | Bug | Task |

Use the Requirement-level type (first column) as your `workItemType` so cards appear on the primary Kanban board.

---

## Quick Reference

After setup, use these commands:
- `/af add <title>` — Create card
- `/af list` — List all cards
- `/af next` — Work on next card
- `/af status` — Board overview

See `/af` for full command reference.
