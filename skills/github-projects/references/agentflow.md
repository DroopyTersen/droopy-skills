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

## Coordination with AgentFlow

The `agentflow` skill owns workflow, approval, stage transitions, and next-card selection. This skill owns provider operations. Read project-local `.agentflow/github.json`; reuse an existing paginated query helper when present. No loop or prompt runtime files are required.

- Keep current requirements and the implementation plan in the issue body. Record approvals, material discoveries, and completion evidence in comments. Ask questions in the active conversation unless external discussion was requested.
- Create cards only when requested or approved. Default to New and explicitly set/requery the Project status after adding an item; do not assume provider automation chose the correct column.
- Use the actual Project status, not issue open/closed state. Read visible Approved-column order when selecting the next card; do not sort by issue number or age. Use Computer Use if the active board view's order is unavailable through provider tools.
- Prefer paginated board reads over N+1 issue queries or a truncated first page. Inspect repository identity on multi-repository boards.
- Include comments when reading a card whose decisions or approvals matter. Read linked PR comments and review threads when addressing revisions.
- Record dependencies through native relationships when available and an explicit `## Dependencies` section with issue references and the required condition, such as `Blocked by: #123`.
- No mandatory `needs-feedback` label or manual tag removal is required. Preserve unrelated labels.
- Use `gh-address-comments` for PR-comment mechanics when appropriate, while following AgentFlow's current stage and permission rules.
