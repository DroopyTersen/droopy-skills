# Azure DevOps Local Index

Use a machine-local manifest to remember how a local project path maps to Azure DevOps.

## Preferred Location

Prefer a user-level manifest next to the installed skill, not inside project repos.

- If installed at `~/.codex/skills/azure-devops`, use `~/.codex/skills/azure-devops/state/path-index.json`
- If installed at `~/.claude/skills/azure-devops`, use `~/.claude/skills/azure-devops/state/path-index.json`
- If you are running the shared repo copy directly, the helper falls back to `skills/azure-devops/state/path-index.json`

Do not write machine-local cache files into project repos unless the user explicitly asks for that.

## Preferred Interface

Prefer the helper script over manual JSON editing:

```bash
bun <skill-root>/azure-devops/scripts/path-index.ts file
bun <skill-root>/azure-devops/scripts/path-index.ts list
bun <skill-root>/azure-devops/scripts/path-index.ts get --project-path "/abs/path/to/project"
bun <skill-root>/azure-devops/scripts/path-index.ts upsert \
  --project-path "/abs/path/to/project" \
  --remote-url "https://dev.azure.com/ORG/PROJECT/_git/REPO" \
  --organization "https://dev.azure.com/ORG" \
  --project "PROJECT" \
  --team "TEAM" \
  --board "Backlog items" \
  --board-url "https://dev.azure.com/ORG/PROJECT/_boards/board/t/TEAM/BOARD" \
  --source "git-remote"
```

`<skill-root>` is typically `.codex/skills`, `.claude/skills`, or the shared repo's `skills` directory.

The script defaults to the installed skill's user-level state file when it recognizes a Codex or Claude skill path, and otherwise falls back to `state/path-index.json` beside the skill.

## File Format

If the file does not exist, create:

```json
{
  "version": 1,
  "entries": []
}
```

Each entry should look like:

```json
{
  "projectPath": "/abs/path/to/project",
  "remoteUrl": "https://dev.azure.com/ORG/PROJECT/_git/REPO",
  "organization": "https://dev.azure.com/ORG",
  "project": "PROJECT",
  "team": "TEAM",
  "board": "Backlog items",
  "boardUrl": "https://dev.azure.com/ORG/PROJECT/_boards/board/t/TEAM/BOARD",
  "source": "user|agentflow-config|local-index|git-remote",
  "updatedAt": "2026-04-07"
}
```

## Read Rules

When resolving the path:

1. Try exact `projectPath` match first.
2. If that fails, try exact `remoteUrl` match.
3. Treat the index as a cached hint, not a stronger source than explicit user input or `.agentflow/azure-devops.json`.

## Write Rules

Update or insert an entry after any successful resolution from:

- explicit user input
- `.agentflow/azure-devops.json`
- verified Git remote inference

Refresh the entry if:

- the current repo path changed
- the remote URL changed
- the user corrected the team or board
- AgentFlow config now provides stronger values

## Safety Rules

- Keep only machine-local paths here.
- Do not store tokens, PATs, or secrets.
- Do not assume an old cached board is still correct if the current project config disagrees.
