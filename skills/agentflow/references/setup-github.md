# AgentFlow GitHub Setup

This guide helps you set up a GitHub Project as your AgentFlow backend.

## Runtime Files

Before configuring the backlog provider, ensure the local `.agentflow/` runtime files exist.

Use [runtime-files.md](runtime-files.md) and copy the bundled loop assets/templates into the project if they are missing.

## Install the Backlog Skill

AgentFlow assumes a standalone `github-projects` skill is available at either the project level or user level.

If it is not installed yet, ask the user to install one. One example source is:

```text
https://github.com/DroopyTersen/droopy-skills
```

## Prerequisites

1. **GitHub CLI (gh)** installed and authenticated
   ```bash
   gh auth status
   ```

2. **Project scopes** - Add project access to your auth token:
   ```bash
   gh auth refresh -s project
   ```

3. **A GitHub Project** (new Projects, not classic) linked to your repository

---

## Step 1: Create GitHub Project

If you don't have a project yet:

1. Go to your GitHub profile → Projects → New project
2. Choose "Board" layout
3. Note the project number from the URL (e.g., `github.com/users/YOU/projects/42` → project 42)

---

## Step 2: Configure Status Field

The project needs a "Status" field with these exact options:
- New
- Approved
- Refinement
- Tech Design
- Implementation
- Final Review
- Done

**To configure via CLI:**

```bash
# Get owner from git remote
REMOTE=$(git remote get-url origin)
OWNER=$(echo "$REMOTE" | sed -E 's#.*(github\.com[:/])([^/]+)/.*#\2#')
PROJECT={YOUR_PROJECT_NUMBER}

# Get project ID
PROJECT_ID=$(gh project view $PROJECT --owner $OWNER --format json | jq -r '.id')

# Get Status field ID
STATUS_FIELD_ID=$(gh project field-list $PROJECT --owner $OWNER --format json | jq -r '.fields[] | select(.name == "Status") | .id')

# Update Status field with all options (via GraphQL)
gh api graphql --input - << EOF
{
  "query": "mutation(\$input: UpdateProjectV2FieldInput!) { updateProjectV2Field(input: \$input) { projectV2Field { ... on ProjectV2SingleSelectField { id options { id name } } } } }",
  "variables": {
    "input": {
      "projectId": "$PROJECT_ID",
      "fieldId": "$STATUS_FIELD_ID",
      "singleSelectOptions": [
        {"name": "New", "description": "Awaiting human review and approval", "color": "GRAY"},
        {"name": "Approved", "description": "Ready for agent to pick up", "color": "GREEN"},
        {"name": "Refinement", "description": "Agent exploring codebase and documenting requirements", "color": "BLUE"},
        {"name": "Tech Design", "description": "Agent designing implementation approach", "color": "PURPLE"},
        {"name": "Implementation", "description": "Agent implementing and testing", "color": "ORANGE"},
        {"name": "Final Review", "description": "Awaiting human review of implementation", "color": "YELLOW"},
        {"name": "Done", "description": "Complete", "color": "GREEN"}
      ]
    }
  }
}
EOF
```

---

## Step 3: Create Required Labels

AgentFlow uses labels for card types and status tags.

**Type labels** (use GitHub defaults where possible):
- `enhancement` — feature (default label)
- `bug` — bug (default label)
- `refactor` — refactor (create this one)

**Tag labels** (critical for agent workflow):
- `needs-feedback` — waiting for human input
- `blocked` — blocked by external dependency

**Create the missing labels:**
```bash
gh label create "refactor" --color "1D76DB" --description "Code refactor"
gh label create "needs-feedback" --color "FBCA04" --description "Waiting for human input"
gh label create "blocked" --color "B60205" --description "Blocked by external dependency"
```

---

## Step 4: Get Project IDs

You need to cache the project and field IDs to avoid repeated API calls.

```bash
# Get owner/repo from git remote
REMOTE=$(git remote get-url origin)
OWNER=$(echo "$REMOTE" | sed -E 's#.*(github\.com[:/])([^/]+)/.*#\2#')
REPO=$(echo "$REMOTE" | sed -E 's#.*(github\.com[:/][^/]+/)([^.]+)(\.git)?#\2#')
PROJECT={YOUR_PROJECT_NUMBER}

# Get project node ID
PROJECT_ID=$(gh project view $PROJECT --owner $OWNER --format json | jq -r '.id')
echo "projectId: $PROJECT_ID"

# Get Status field ID and all option IDs
gh project field-list $PROJECT --owner $OWNER --format json | jq '.fields[] | select(.name == "Status")'
```

The Status field output looks like:
```json
{
  "id": "PVTSSF_lAHOABC...",
  "name": "Status",
  "options": [
    {"id": "599ada18", "name": "New"},
    {"id": "0511d83b", "name": "Approved"},
    ...
  ]
}
```

---

## Step 5: Create Configuration File

Copy `assets/templates/github.json` from the installed `agentflow` skill to `.agentflow/github.json`, then fill in the IDs from Step 4:

```json
{
  "project": 42,
  "owner": "YourUsername",
  "repo": "your-repo",
  "projectId": "PVT_kwHOABC123...",
  "statusFieldId": "PVTSSF_lAHOABC...",
  "statusOptions": {
    "new": "599ada18",
    "approved": "0511d83b",
    "refinement": "20148574",
    "tech-design": "e37dee26",
    "implementation": "e44105fc",
    "final-review": "8b044c34",
    "done": "d5a74bed"
  }
}
```

**Notes:**
- `project` — the project number from the URL
- `owner` and `repo` — can also be derived from git remote if omitted
- `projectId` — the GraphQL node ID (starts with `PVT_`)
- `statusFieldId` — the Status field ID (starts with `PVTSSF_`)
- `statusOptions` — map column names to option IDs

---

## Step 6: Link Project to Repository

Ensure your project is linked to the repository:

1. Go to your GitHub Project
2. Settings → Manage access → Link a repository
3. Select your repository

This allows issues created in the repo to be added to the project.

---

## Step 7: Verify Setup

Test your setup:

```bash
# Check gh auth
gh auth status

# Check project access
PROJECT=$(jq -r '.project' .agentflow/github.json)
OWNER=$(jq -r '.owner // empty' .agentflow/github.json)
if [ -z "$OWNER" ]; then
  REMOTE=$(git remote get-url origin)
  OWNER=$(echo "$REMOTE" | sed -E 's#.*(github\.com[:/])([^/]+)/.*#\2#')
fi

gh project view $PROJECT --owner $OWNER

# List project items
gh project item-list $PROJECT --owner $OWNER --format json | jq '.items | length'
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `unknown command "project"` | Upgrade gh CLI: `brew upgrade gh` or `gh upgrade` |
| `authentication token is missing required scopes` | Run `gh auth refresh -s project` |
| `Could not resolve to a ProjectV2` | Check project number and owner |
| `Resource not accessible` | Ensure project is linked to repo |

---

## Quick Reference

After setup, use these commands:
- `/af add <title>` — Create card
- `/af list` — List all cards
- `/af next` — Work on next card
- `/af status` — Board overview

See `/af` for full command reference.
