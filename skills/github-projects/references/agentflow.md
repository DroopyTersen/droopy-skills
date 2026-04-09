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

## Project-Local Reference Files

When working inside an AgentFlow project, use the backend docs in `.agentflow/github/`:

- `README.md` for setup, configuration, and performance caveats
- `add.md` for creating cards
- `list.md` for board queries and workable-card filtering
- `show.md` for full card display, comments, and linked PR checks
- `move.md` for status moves
- `context.md` for issue body vs issue comments rules
- `tag.md` for label add/remove flows
- `workflow.md` for `work`, `next`, `feedback`, `depends`, `review`, and `loop`
- `pr-feedback.md` for AgentFlow-specific linked-PR remediation

## AgentFlow-Specific Rules

- AgentFlow stores durable card context in the issue body and dialogue in issue comments.
- For questions or proposed approaches, add an issue comment and add the `needs-feedback` label.
- Only write finalized requirements or chosen designs back into the issue body after the human responds.
- For list and status operations, prefer a single `gh project item-list --limit 100` query and read labels/body from that response.
- Always include `comments` when using `gh issue view` for `show`, `feedback`, or conversation-sensitive flows.
- Keep generic PR review-comment remediation in `gh-address-comments`. Use `.agentflow/github/pr-feedback.md` when the work is explicitly tied to an AgentFlow card and linked PR.
