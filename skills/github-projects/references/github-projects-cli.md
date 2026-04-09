# GitHub Projects CLI Reference

## Setup

Use these checks before troubleshooting project commands:

```bash
gh --version
gh auth status
gh auth refresh -s project
```

If the repository itself is in scope, verify access:

```bash
gh repo view OWNER/REPO
```

## Core Rule: Prefer One Project Query

For board listings, `gh project item-list` already contains the issue body, labels, status, and item ID. Prefer one query over N+1 follow-up calls.

```bash
gh project item-list PROJECT_NUM --owner OWNER --limit 100 --format json | \
  jq '[.items[] | select(.content.number != null)]'
```

Important details:

- Always use `--limit 100` so newly added items without status are included.
- Filter out entries whose `content` is null because deleted issues leave orphaned project items.
- Only fall back to `gh issue view` when you need full comments or a direct issue mutation.

## Inspect Projects and Fields

Use these reads to hydrate project metadata:

```bash
gh project list --owner OWNER --format json
gh project view PROJECT_NUM --owner OWNER --format json
gh project field-list PROJECT_NUM --owner OWNER --format json
```

For AgentFlow, look for a `Status` field whose options map cleanly to:

- `New`
- `Approved`
- `Refinement`
- `Tech Design`
- `Implementation`
- `Final Review`
- `Done`

## Create an Issue

```bash
gh issue create \
  --repo OWNER/REPO \
  --title "My New Feature" \
  --body-file /tmp/issue-body.md \
  --label "enhancement"
```

Use `bug` for bugs, `enhancement` for features, and `refactor` for refactors.

## Add Issue to a Project

```bash
gh project item-add PROJECT_NUM --owner OWNER --url ISSUE_URL
```

Then find the item ID:

```bash
gh project item-list PROJECT_NUM --owner OWNER --limit 100 --format json | \
  jq -r '[.items[] | select(.content.number != null)] | .[] | select(.content.number == ISSUE_NUMBER) | .id'
```

## Move an Item

Use `gh project item-edit` with the cached IDs:

```bash
gh project item-edit \
  --project-id PVT_... \
  --id ITEM_ID \
  --field-id PVTSSF_... \
  --single-select-option-id OPTION_ID
```

This is the reliable way to move a card between AgentFlow columns.

## Read and Update an Issue

Show full issue details including comments:

```bash
gh issue view ISSUE_NUMBER --repo OWNER/REPO --json number,title,body,labels,state,comments
```

Edit labels:

```bash
gh issue edit ISSUE_NUMBER --repo OWNER/REPO --add-label "needs-feedback"
gh issue edit ISSUE_NUMBER --repo OWNER/REPO --remove-label "blocked"
```

Edit body:

```bash
gh issue view ISSUE_NUMBER --repo OWNER/REPO --json body -q '.body' > /tmp/issue-body.md
gh issue edit ISSUE_NUMBER --repo OWNER/REPO --body-file /tmp/issue-body.md
```

Comment:

```bash
gh issue comment ISSUE_NUMBER --repo OWNER/REPO --body "**Agent (YYYY-MM-DD):** Message"
```

## Linked Pull Requests and Review Comments

Find PRs that close or reference an issue:

```bash
gh pr list --repo OWNER/REPO --state all --json number,title,state,closingIssuesReferences | \
  jq '.[] | select(.closingIssuesReferences[]?.number == ISSUE_NUMBER)'
```

Fetch inline review comments:

```bash
gh api repos/OWNER/REPO/pulls/PR_NUMBER/comments
```

Fetch top-level PR conversation comments:

```bash
gh pr view PR_NUMBER --repo OWNER/REPO --json comments
```

## Configure the Status Field via GraphQL

When the project needs its single-select options created or fixed, use GraphQL:

```bash
gh api graphql --input - <<'EOF'
{
  "query": "mutation($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) { updateProjectV2Field(input: { fieldId: $fieldId, singleSelectOptions: $options }) { projectV2Field { ... on ProjectV2SingleSelectField { options { id name } } } } }",
  "variables": {
    "fieldId": "PVTSSF_...",
    "options": [
      {"name": "New", "color": "GRAY"},
      {"name": "Approved", "color": "BLUE"},
      {"name": "Refinement", "color": "PURPLE"},
      {"name": "Tech Design", "color": "PINK"},
      {"name": "Implementation", "color": "YELLOW"},
      {"name": "Final Review", "color": "ORANGE"},
      {"name": "Done", "color": "GREEN"}
    ]
  }
}
EOF
```

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `authentication token is missing required scopes` | Missing project scope | Run `gh auth refresh -s project` |
| `Could not resolve to a ProjectV2` | Wrong owner or project number | Verify with `gh project view` |
| Item missing from listing | No status or default limit too low | Use `--limit 100` |
| Slow board listing | N+1 `gh issue view` loop | Use one `gh project item-list` query |
| Status move fails | Wrong `projectId`, `statusFieldId`, or option ID | Re-read `.agentflow/github.json` or refresh field metadata |
