# `/af work`, `/af next`, `/af feedback`, `/af depends`, `/af review`, `/af loop`

Use this reference for phase execution and loop orchestration.

## `/af work <id>`

1. Detect the backend.
2. Read [core.md](../core.md).
3. Read the project-local card context.
4. Read the current column reference:
   - [../columns/01b_approved.md](../columns/01b_approved.md)
   - [../columns/02_refinement.md](../columns/02_refinement.md)
   - [../columns/03_tech-design.md](../columns/03_tech-design.md)
   - [../columns/04_implementation.md](../columns/04_implementation.md)
   - [../columns/05_final-review.md](../columns/05_final-review.md) when the human explicitly wants review guidance
   - [../columns/06_done.md](../columns/06_done.md) when closing out dependencies or completion
5. Use the backend skill only for the storage/CLI operations.

## `/af next`

Select the highest-priority workable card:

- column is `approved`, `refinement`, `tech-design`, or `implementation`
- no `needs-feedback` tag
- no `blocked` tag
- predecessors are done, unless you intentionally decide to proceed with a soft-block

Approved cards are workable. Do not skip them.

Then run `/af work <id>`.

## `/af feedback <id>`

Goal: process a card waiting on human input.

- read the pending conversation
- capture the user's answer
- route it to discussion/comments, not the finalized body
- remove `needs-feedback`
- if the response resolves the open question, update the durable body with the selected/approved answer

Backend handoff:

- GitHub Projects:
  - use issue comments + labels
- Azure DevOps:
  - use Discussion + tags
- JSON:
  - use [json-backend/workflow.md](../json-backend/workflow.md)

## `/af depends <id> [on|remove] <predecessor>`

Goal: show or modify dependencies.

- keep dependency state in the card context/body
- use provider-native relations when the backend supports them cleanly
- when showing dependencies, report each predecessor's current column

## `/af review <id>`

Goal: run the final code-review pass for a card.

- read the implementation context and branch details
- use [prompts/code-reviewer.md](../prompts/code-reviewer.md) for the review standard
- if linked PR review comments exist and the task is AgentFlow-tied, coordinate with the provider skill and `gh-address-comments` when relevant

## `/af loop`

Goal: run the Ralph Loop from the project root.

Before starting:

- ensure `.agentflow/loop.sh` exists
- ensure `.agentflow/RALPH_LOOP_PROMPT.md` exists
- ensure `.agentflow/PROJECT_LOOP_PROMPT.md` exists
- restore missing files from [runtime-files.md](../runtime-files.md)

Typical entrypoints:

```bash
.agentflow/loop.sh
.agentflow/loop.sh 50
.agentflow/loop.sh --codex 50
```

Codex is the default loop engine. Use `--claude` only when a human explicitly asks for Claude.

The loop prompt and the column refs enforce the one-card, one-column rule.
