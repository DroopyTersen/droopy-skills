# AgentFlow GitHub Projects Reference

Use this reference when the project has `.agentflow/github.json`.

## Source of Truth

Read `.agentflow/github.json` first. It defines:

- `project`
- `owner`
- `repo`
- `projectId`
- `statusFieldId`
- `statusOptions`

Do not guess these values. Use the config file.

If this file exists, it overrides Git remote inference. Use remote inference only to bootstrap setup in repositories that do not yet have this config.

## Concept Mapping

| AgentFlow concept | GitHub Projects implementation |
|---|---|
| Card | GitHub issue |
| Board | GitHub Project (ProjectsV2) |
| Board column | Project `Status` single-select field |
| Card body | Issue body |
| Conversation log | Issue comments |
| Tags | Issue labels |
| Priority | Item position in column |
| PR review feedback | Linked pull request comments |

## Coordination with the `agentflow` Skill

When the task is both AgentFlow-related and GitHub Projects-related:

- `agentflow` owns the workflow, columns, loop, and `/af` command intent
- `github-projects` owns `gh` commands, GraphQL field metadata, issue/project mutations, and linked-PR inspection

Do not assume a modern AgentFlow project still keeps backend docs in `.agentflow/github/`. The durable project-local files are the runtime files such as:

- `.agentflow/github.json`
- `.agentflow/PROJECT_LOOP_PROMPT.md`
- `.agentflow/RALPH_LOOP_PROMPT.md`
- `.agentflow/progress.txt`
- `.agentflow/loop.sh`

## AgentFlow-Specific Rules

- AgentFlow stores durable card context in the issue body and dialogue in issue comments.
- For questions or proposed approaches, add an issue comment and add the `needs-feedback` label.
- Only write finalized requirements or chosen designs back into the issue body after the human responds.
- For list and status operations, prefer a single `gh project item-list --limit 100` query and read labels/body from that response.
- Always include `comments` when using `gh issue view` for `show`, `feedback`, or conversation-sensitive flows.
- Keep generic PR review-comment remediation in `gh-address-comments`. When the work is explicitly tied to an AgentFlow card and linked PR, combine that skill with the `agentflow` card context and this skill's linked-PR queries.
