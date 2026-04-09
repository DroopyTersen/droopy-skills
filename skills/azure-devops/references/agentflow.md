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

## Project-Local Reference Files

When working inside an AgentFlow project, use the backend docs in `.agentflow/azure-devops/`:

- `README.md` for setup, configuration, and core caveats
- `add.md` for creating cards
- `list.md` for board queries and workable-card filtering
- `show.md` for full card display and discussion retrieval
- `move.md` for Kanban column moves
- `context.md` for Description vs Discussion rules
- `tag.md` for tag add/remove/set flows
- `workflow.md` for `work`, `next`, `feedback`, `depends`, `review`, and `loop`

## AgentFlow-Specific Rules

- AgentFlow stores durable card context in Description and dialogue in Discussion.
- For questions or proposed approaches, write Discussion comments and add `needs-feedback`.
- Only write finalized requirements/design back into Description after the human answers.
- For status-style operations, use WIQL and the configured board column field.
- For tag removal or exact tag replacement, use `bun .agentflow/azure-devops/api.ts`.

## Helper Script

AgentFlow ships a Bun helper at `.agentflow/azure-devops/api.ts` for operations the CLI does not handle well:

```bash
bun .agentflow/azure-devops/api.ts tag remove 123 needs-feedback
bun .agentflow/azure-devops/api.ts tag set 123 "tag1; tag2"
bun .agentflow/azure-devops/api.ts field set 123 "System.Tags" "value"
```
