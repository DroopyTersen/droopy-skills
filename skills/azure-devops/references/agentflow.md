# AgentFlow Azure DevOps Reference

Use this reference when the project has `.agentflow/azure-devops.json`.

## Source of Truth

Read `.agentflow/azure-devops.json` first. It defines:

- `organization`
- `project`
- `team`
- `board`
- `areaPath`
- `iterationPath`
- `workItemType`
- `boardColumnField`
- `boardColumnDoneField`
- `boardColumns`
- `boardColumnDone`

Do not guess these values. Use the config file.

If this file exists, it overrides Git remote inference. Use remote inference only to bootstrap setup in repositories that do not yet have this config.

## Concept Mapping

| AgentFlow concept | Azure DevOps implementation |
|---|---|
| Card | Work item |
| Board column | Board-scoped WEF Kanban field |
| Card body | `System.Description` |
| Conversation log | Discussion / `System.History` updates |
| Tags | `System.Tags` |
| Dependencies | Work item relations |

## Coordination with AgentFlow

The `agentflow` skill owns workflow, approval, stage transitions, and next-card selection. This skill owns provider operations. Read project-local `.agentflow/azure-devops.json`. No loop or prompt runtime files are required.

- Keep current requirements and implementation plans in Description; record approvals, material discoveries, and completion evidence in Discussion. Ask questions in the active conversation unless external discussion was requested.
- Create cards only when requested or approved; default to New. Explicitly set and verify the configured Kanban column.
- Query status using the configured board-scoped column field. Use the visible Approved-column order when choosing next work; do not substitute work-item ID or generic priority. Use Computer Use when the view's rank is unavailable through provider tools.
- Record dependencies as work-item relations plus readable references and the actual prerequisite.
- No mandatory `needs-feedback` tag or manual removal is required. Preserve unrelated tags.
- For exact tag replacement/removal, use documented REST/PATCH operations. If an existing project has `.agentflow/azure-devops/api.ts`, inspect and reuse its supported operations rather than assuming that helper exists in every project.
- Read current Description and Discussion before editing and verify the result after mutation.
