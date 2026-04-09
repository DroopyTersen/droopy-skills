---
name: azure-devops
description: Use when working with Azure DevOps, Azure Boards, work items, WIQL, Kanban boards, or the Azure CLI commands `az boards` and `az devops`. Also use for AgentFlow projects that use `.agentflow/azure-devops.json`.
---

# Azure DevOps

This folder is intended to be copyable into either a project-level or user-level skills directory.

Use this skill for Azure Boards and work item workflows, especially when the task involves:

- `az boards` or `az devops`
- WIQL queries
- Azure Boards Kanban columns
- Work item tags, relations, discussion history, or board moves
- AgentFlow projects backed by `.agentflow/azure-devops.json`

## Progressive Disclosure

Read only the files needed for the current intent:

- [references/path-resolution.md](references/path-resolution.md) when you need to discover or verify `organization`, `project`, `team`, and `board`
- [references/local-index.md](references/local-index.md) when you want to reuse or update the machine-local project-path manifest
- [references/agentflow.md](references/agentflow.md) when the project uses AgentFlow
- [references/azure-boards-cli.md](references/azure-boards-cli.md) when you need Azure CLI, WIQL, work-item, tag, relation, or discussion commands
- [scripts/path-index.ts](scripts/path-index.ts) when you need deterministic reads or writes of the machine-local manifest

## Core Rules

- Path resolution order: explicit user input, then `.agentflow/azure-devops.json`, then local index, then Git remote inference, then ask the user.
- Treat Git remote inference as provisional until verified.
- Never invent `boardColumnField` or `boardColumnDoneField`.
- If the task is both AgentFlow-related and Azure DevOps-related, use this skill alongside `agentflow`.
