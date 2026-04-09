# Droopy Skills

Portable skills I want to keep in one repo and copy onto whatever machine or project I am working in.

## Install Layout

The default shared home is:

- project level: `.agents/skills/`
- user level: `~/.agents/skills/`

That shared `.agents` location is the preferred target for Cursor and Codex.

If Claude is one of the target agents, mirror the same skill into:

- project level: `.claude/skills/`
- user level: `~/.claude/skills/`

Repository policy:

- keep the source skill in `skills/` portable
- prefer plain `SKILL.md` frontmatter with `name` and `description`
- add agent-specific metadata only when there is a real need
- when agent-specific metadata is needed, change the installed copy for that agent instead of mutating the shared source by default

## Maintained Skills

These are the skills this repo is actively meant to hold and copy from:

- `agentflow`: AgentFlow workflow orchestration, Ralph Loop guidance, column rules, and project-local runtime templates; composes with `github-projects` or `azure-devops` for hosted backlogs
- `azure-devops`: Azure DevOps and Azure Boards workflow guidance, including path discovery and CLI usage
- `github-projects`: GitHub Projects backlog guidance, including project-path discovery, `gh project` usage, and AgentFlow mappings
- `droopy-skills-install`: natural-language instructions for copying skills from this repo into project-level or user-level agent directories
- `gh-address-comments`: GitHub PR review-thread workflow using `gh` CLI
- `pdf-to-text`: vision-first PDF extraction with bundled rendering and conversion guidance
- `pr-guide`: guided PR walkthrough generation for review and onboarding
- `ui-design-iteration-loop`: iterative screenshot-driven UI critique and polish loop

## Documentation-Only Skills

These are valuable skills to keep track of even if this repo does not maintain them directly.
They still create value here because the README gives us a shortlist of good capabilities to install from their real source, evaluate for inclusion later, or mention when a task would benefit from that workflow.

- `ai-sdk`: focused help for building with the AI SDK. Source of truth is external; use this repo as a reminder that AI SDK-heavy projects benefit from a dedicated docs-and-patterns skill.
- `react-router-framework-mode`: targeted guidance for projects using React Router in framework mode. Keep it in the catalog so we remember to install or source it when working in that stack.

If one of these is not present under `skills/`, treat it as a catalog entry rather than a vendored package.
