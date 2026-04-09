# GitHub Projects Local Index

Use a machine-local manifest to remember how a local project path maps to GitHub Projects.

## Preferred Location

Prefer a user-level manifest next to the user-level skill, not the project-local skill copy.

- if installed in `~/.codex/skills/github-projects`, use `~/.codex/skills/github-projects/state/path-index.json`
- if installed in `~/.claude/skills/github-projects`, use `~/.claude/skills/github-projects/state/path-index.json`
- if running directly from this shared repo copy, the fallback path is `skills/github-projects/state/path-index.json`

Do not write machine-local cache files into project repos unless the user explicitly asks for that.

## Preferred Interface

Prefer the helper script over manual JSON editing:

```bash
bun <skill-root>/github-projects/scripts/path-index.ts file
bun <skill-root>/github-projects/scripts/path-index.ts list
bun <skill-root>/github-projects/scripts/path-index.ts get --project-path "/abs/path/to/project"
bun <skill-root>/github-projects/scripts/path-index.ts upsert \
  --project-path "/abs/path/to/project" \
  --remote-url "https://github.com/OWNER/REPO.git" \
  --owner "OWNER" \
  --repo "REPO" \
  --project "42" \
  --project-url "https://github.com/users/OWNER/projects/42" \
  --project-id "PVT_..." \
  --status-field-id "PVTSSF_..." \
  --status-options-json '{"new":"...","approved":"...","refinement":"...","tech-design":"...","implementation":"...","final-review":"...","done":"..."}' \
  --source "git-remote"
```

The script defaults to the user-level state file for the current skill family and creates the file if needed.

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
  "remoteUrl": "https://github.com/OWNER/REPO.git",
  "owner": "OWNER",
  "repo": "REPO",
  "project": 42,
  "projectUrl": "https://github.com/users/OWNER/projects/42",
  "projectId": "PVT_...",
  "statusFieldId": "PVTSSF_...",
  "statusOptions": {
    "new": "...",
    "approved": "...",
    "refinement": "...",
    "tech-design": "...",
    "implementation": "...",
    "final-review": "...",
    "done": "..."
  },
  "source": "user|agentflow-config|local-index|git-remote",
  "updatedAt": "2026-04-09"
}
```

## Read Rules

When resolving the path:

1. Try exact `projectPath` match first.
2. If that fails, try exact `remoteUrl` match.
3. Treat the index as a cached hint, not a stronger source than explicit user input or `.agentflow/github.json`.

## Write Rules

Update or insert an entry after any successful resolution from:

- explicit user input
- `.agentflow/github.json`
- verified Git remote inference

Refresh the entry if:

- the current repo path changed
- the remote URL changed
- the user corrected the project number or owner
- AgentFlow config now provides stronger values

If only `owner`, `repo`, and `project` are known, you may store a partial entry and enrich it later with `projectId`, `statusFieldId`, and `statusOptions`.

## Safety Rules

- Keep only machine-local paths here.
- Do not store tokens, PATs, or secrets.
- Do not assume an old cached project is still correct if the current project config disagrees.
