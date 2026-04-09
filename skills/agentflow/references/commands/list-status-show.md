# `/af list`, `/af status`, `/af show`

Use this reference for read-style board operations.

## `/af list`

Goal: show cards grouped by column.

- detect the backend first
- prefer one board query, not N+1 detail calls
- preserve priority order within each column
- when `--workable` is requested, filter using the rules from [core.md](../core.md)

Backend handoff:

- GitHub Projects:
  - use `github-projects`
  - prefer one `gh project item-list --limit 100` query
- Azure DevOps:
  - use `azure-devops`
  - prefer one WIQL query for board listings
- JSON:
  - use [json-backend/list.md](../json-backend/list.md)

## `/af status`

Goal: produce a compact operational summary.

Include:

- workable cards
- cards waiting on feedback
- cards blocked by dependencies
- cards in final review
- the highest-priority next candidate if one exists

`/af status` is a summarized view over the same data as `/af list`.

## `/af show <id>`

Goal: show the full card context.

Always include:

- id and title
- current column
- priority
- tags
- dependencies
- branch, if recorded
- durable body/context
- recent discussion or comments when relevant

Backend handoff:

- GitHub Projects:
  - use `github-projects`
  - load full issue details including comments when conversation matters
- Azure DevOps:
  - use `azure-devops`
  - load full work item details and discussion history when needed
- JSON:
  - use [json-backend/show.md](../json-backend/show.md)
