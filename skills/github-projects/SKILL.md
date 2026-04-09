---
name: github-projects
description: Use when working with GitHub Projects, GitHub issue-backed backlogs, the GitHub CLI commands `gh project`, `gh issue`, or `gh api graphql` for board management, or AgentFlow projects that use `.agentflow/github.json`.
---

# GitHub Projects

This folder is intended to be copyable into either a project-level or user-level skills directory.

Use this skill for GitHub Projects backlog and issue workflows, especially when the task involves:

- `gh project`
- `gh issue`
- `gh api graphql`
- GitHub Project item status fields
- issue labels, comments, or issue-body backlog context
- AgentFlow projects backed by `.agentflow/github.json`

## Progressive Disclosure

Read only the files needed for the current intent:

- [references/path-resolution.md](references/path-resolution.md) when you need to discover or verify `owner`, `repo`, `project`, `projectId`, or status-field metadata
- [references/local-index.md](references/local-index.md) when you want to reuse or update the machine-local project-path manifest
- [references/agentflow.md](references/agentflow.md) when the project uses AgentFlow
- [references/github-projects-cli.md](references/github-projects-cli.md) when you need `gh project`, `gh issue`, GraphQL, or linked-PR commands
- [scripts/path-index.ts](scripts/path-index.ts) when you need deterministic reads or writes of the machine-local manifest

## Core Rules

- Path resolution order: explicit user input, then `.agentflow/github.json`, then local index, then Git remote inference, then ask the user.
- Treat Git remote inference and project-selection heuristics as provisional until verified.
- Prefer a single `gh project item-list --limit 100` query over N+1 `gh issue view` calls for board listings.
- Keep generic PR review-comment handling in `gh-address-comments`; this skill owns backlog and project-board workflows.
- If the task is both AgentFlow-related and GitHub Projects-related, use this skill alongside `agentflow`.
