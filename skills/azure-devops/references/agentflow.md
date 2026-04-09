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

## Coordination with the `agentflow` Skill

When the task is both AgentFlow-related and Azure Boards-related:

- `agentflow` owns the workflow, columns, loop, and `/af` command intent
- `azure-devops` owns `az boards`, WIQL, work-item mutation details, and board field semantics

Do not assume a modern AgentFlow project still keeps backend docs in `.agentflow/azure-devops/`. The durable project-local files are the runtime files such as:

- `.agentflow/azure-devops.json`
- `.agentflow/PROJECT_LOOP_PROMPT.md`
- `.agentflow/RALPH_LOOP_PROMPT.md`
- `.agentflow/progress.txt`
- `.agentflow/loop.sh`

## AgentFlow-Specific Rules

- AgentFlow stores durable card context in Description and dialogue in Discussion.
- For questions or proposed approaches, write Discussion comments and add `needs-feedback`.
- Only write finalized requirements/design back into Description after the human answers.
- For status-style operations, use WIQL and the configured board column field.
- For tag removal or exact tag replacement, prefer REST/PATCH flows over fragile CLI-only approximations.
