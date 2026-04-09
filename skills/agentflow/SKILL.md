---
name: agentflow
description: Use when the user mentions AgentFlow, Ralph Loop, cards, backlog columns, `/af` commands, working the next task, or wants a Kanban workflow for AI-assisted development. AgentFlow owns the workflow and loop orchestration; provider skills own GitHub Projects or Azure DevOps CLI details.
---

# AgentFlow

Use this skill for the workflow layer of AgentFlow:

- interpreting `/af` commands or natural backlog requests
- enforcing the seven-column process
- deciding what happens in refinement, tech-design, implementation, and final-review
- running or restoring the Ralph Loop
- setting up project-local `.agentflow/` runtime files

## Progressive Disclosure

Read only the files needed for the current intent:

- [references/backend-selection.md](references/backend-selection.md) when you need to detect the backend or decide which peer skill to use
- [references/runtime-files.md](references/runtime-files.md) when setting up a project or restoring missing `.agentflow/` runtime files
- [references/command-router.md](references/command-router.md) when interpreting `/af` commands or natural-language requests
- [references/core.md](references/core.md) for shared concepts like columns, tags, priorities, dependencies, and body-vs-discussion rules
- [references/commands/add.md](references/commands/add.md) for `/af add`
- [references/commands/list-status-show.md](references/commands/list-status-show.md) for `/af list`, `/af status`, and `/af show`
- [references/commands/move-tag-context.md](references/commands/move-tag-context.md) for `/af move`, `/af tag`, and `/af context`
- [references/commands/workflow.md](references/commands/workflow.md) for `/af work`, `/af next`, `/af feedback`, `/af depends`, `/af review`, and `/af loop`
- [references/columns/](references/columns/) only for the current card's column
- [references/setup-github.md](references/setup-github.md), [references/setup-azure-devops.md](references/setup-azure-devops.md), or [references/setup-json.md](references/setup-json.md) when configuring a project
- [references/prompts/](references/prompts/) only when launching the specialist agent for the current phase
- [references/json-backend/](references/json-backend/) only when the project uses the local JSON backend
- [assets/loop.sh](assets/loop.sh) and [assets/templates/](assets/templates/) when you need to copy runtime files into `.agentflow/`

## Core Rules

- AgentFlow owns workflow policy. `github-projects` owns GitHub CLI and project-field behavior. `azure-devops` owns Azure CLI, WIQL, and board-field behavior.
- Detect the backend from project-local config, not from guesswork: `.agentflow/azure-devops.json`, then `.agentflow/github.json`, then `.agentflow/board.json`.
- If the backend clearly requires `github-projects` or `azure-devops` and that peer skill is not installed at the project or user level, ask the user to install it. One example source is `https://github.com/DroopyTersen/droopy-skills`.
- Keep only runtime state in `.agentflow/`. Do not copy the whole skill into `.agentflow/`.
- Never skip columns. Even trivial bugs still move one phase at a time.
- Approved cards are workable.
- Ralph Loop means one card, one column transition, one iteration.
