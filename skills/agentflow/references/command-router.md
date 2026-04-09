# Command Router

Use this reference when the user speaks naturally about AgentFlow or explicitly uses `/af` commands.

## Intent Mapping

| User says | Treat as |
|---|---|
| "add a card for X", "track X", "I need to do X" | `/af add` |
| "show the board", "what's on my board?", "list cards" | `/af list` |
| "status", "what should I work on?", "what is workable?" | `/af status` |
| "show card 123", "details on 123" | `/af show 123` |
| "move 123 to done" | `/af move 123 done` |
| "add blocked tag to 123" | `/af tag 123 add blocked` |
| "append this note to 123" | `/af context 123 append ...` |
| "work on 123" | `/af work 123` |
| "work on the next thing", "keep going" | `/af next` |
| "I answered the questions on 123" | `/af feedback 123` |
| "123 depends on 45" | `/af depends 123 on 45` |
| "review the code on 123" | `/af review 123` |
| "start the Ralph Loop", "run AgentFlow autonomously" | `/af loop` |
| "set up AgentFlow" | backend setup flow |

## Execution Order

For any command:

1. Read [backend-selection.md](backend-selection.md).
2. Read [core.md](core.md).
3. Read the smallest command reference that matches the request:
   - [commands/add.md](commands/add.md)
   - [commands/list-status-show.md](commands/list-status-show.md)
   - [commands/move-tag-context.md](commands/move-tag-context.md)
   - [commands/workflow.md](commands/workflow.md)
4. If the backend is GitHub or Azure DevOps, use the matching peer skill alongside `agentflow`.
5. If the backend is JSON, use [json-backend/](json-backend/) for the storage operations.

## Setup Requests

When the user is configuring AgentFlow:

- use [runtime-files.md](runtime-files.md) for the local `.agentflow/` files
- then read the matching setup reference:
  - [setup-github.md](setup-github.md)
  - [setup-azure-devops.md](setup-azure-devops.md)
  - [setup-json.md](setup-json.md)

## Autonomous Loop Requests

When the user wants autonomous execution:

- ensure `.agentflow/loop.sh`, `.agentflow/RALPH_LOOP_PROMPT.md`, and `.agentflow/PROJECT_LOOP_PROMPT.md` exist
- restore them from the skill assets if needed
- use [commands/workflow.md](commands/workflow.md) plus the current column doc
