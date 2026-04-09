# `/af move`, `/af tag`, `/af context`

Use this reference for state changes that are smaller than a full work iteration.

## `/af move <id> <column>`

Goal: move a card to a new AgentFlow column.

- validate the target column against [core.md](../core.md)
- update the board/status field through the backend
- append a history entry when the backend/body model supports it
- confirm the final column

Backend handoff:

- GitHub Projects:
  - use `github-projects`
  - move the project item by editing the `Status` field
- Azure DevOps:
  - use `azure-devops`
  - update the configured board column field, not just `System.State`
- JSON:
  - use [json-backend/move.md](../json-backend/move.md)

## `/af tag <id> <add|remove> <tag>`

Goal: add or remove workflow tags such as `needs-feedback` and `blocked`.

Backend handoff:

- GitHub Projects:
  - use `github-projects`
  - edit issue labels
- Azure DevOps:
  - use `azure-devops`
  - edit `System.Tags`
- JSON:
  - use [json-backend/tag.md](../json-backend/tag.md)

## `/af context <id> ...`

Goal: update the card's durable body/context, discussion, or history.

Apply the body-vs-discussion rules from [core.md](../core.md):

- finalized requirements, chosen design, branch, and history belong in the durable body
- open questions, options awaiting selection, and agent-human dialogue belong in discussion/comments

Action forms:

- `append`: add new durable content or conversation content in the correct place
- `history`: append a row to the card history table

Backend handoff:

- GitHub Projects:
  - durable body goes in the issue body
  - conversation goes in issue comments
- Azure DevOps:
  - durable body goes in `System.Description`
  - conversation goes in Discussion / History
- JSON:
  - use [json-backend/context.md](../json-backend/context.md)
