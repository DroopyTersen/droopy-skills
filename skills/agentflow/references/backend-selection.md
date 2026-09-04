# Backlog provider

Use explicit task context and existing project configuration. The established detection order is `.agentflow/azure-devops.json`, then `.agentflow/github.json`, then `.agentflow/board.json`. Do not infer IDs from a repository name when configuration already supplies them.

| Configuration | Provider guidance |
| --- | --- |
| `azure-devops.json` | Installed `azure-devops` skill: board-scoped Kanban fields, work-item relations, Description and Discussion |
| `github.json` | Installed `github-projects` skill: issue-backed Project items, status fields, issue/PR comments |
| `board.json` | [Local JSON guidance](json-backend.md) |

Provider tools and CLIs remain useful; removing the AgentFlow CLI does not remove `gh`, `az`, or existing reliable helpers. Provider skills supply mechanics; [core.md](core.md) supplies workflow and approval rules. Do not let older provider examples reintroduce automatic card creation, priority sorting, feedback-tag gates, or spec commits.

Use project-local helpers when present, particularly a paginated board query. Include comments and linked PR review threads when decisions depend on them. Filter using repository identity as well as issue number when a board spans repositories. Re-read current bodies before replacing them, preserve concurrent updates, and verify status/body changes after mutation.

For next-card selection, inspect the board's visible order, using Computer Use if provider data does not expose the active view's order. Never substitute creation time, issue number, labels, or an unverified API ordering. If the relevant view or rank cannot be established, report the missing information instead of pretending a card is first.

Preserve native dependency links and a readable item section identifying prerequisites. Use real provider status and relevant delivery evidence rather than assuming issue open/closed equals stage. Existing labels are metadata, not mandatory human-operated gates.

If configuration is missing and setup was requested, read [setup.md](setup.md). If a provider skill is unavailable, use verified available provider tooling or explain the specific missing capability; do not rebuild a workflow engine.
