---
name: droopy-skills-install
description: Install one or more skills from this droopy-skills repository into project-level or user-level skill directories for Cursor, Codex, and Claude. Use when the user wants to copy a skill folder from this repo, choose which coding agents should receive it, or decide whether the install should be project-scoped or user-scoped.
---

# Droopy Skills Install

Use this skill when a user wants to install or mirror a skill from this repository.

## Progressive Disclosure

Read only the files needed for the current task:

- [references/install-flow.md](references/install-flow.md) when you need the conversational install flow and the copy-command pattern
- [references/agent-metadata.md](references/agent-metadata.md) when you need to adapt metadata or destination folders for Cursor, Codex, or Claude
- [references/catalog.md](references/catalog.md) when you need to know which skills are maintained in this repo versus only documented here

## Core Rules

- Ask only for missing inputs: skill name, install scope, and target coding agents.
- Prefer `.agents/skills` or `~/.agents/skills` as the primary install home.
- If Claude is one of the targets, also copy the skill into `.claude/skills` or `~/.claude/skills`.
- Use ordinary shell copy commands such as `mkdir`, `cp -R`, or `rsync -a`; do not invent installer scripts.
- Keep the shared source skill portable. If one agent needs special metadata, edit only that destination copy after installation.
- Never overwrite an existing skill directory without surfacing that fact and getting confirmation.
