# GitHub Projects Path Resolution

The GitHub Projects path means:

- `owner`
- `repo`
- `project`

When available, also resolve:

- `projectId`
- `statusFieldId`
- `statusOptions`

Resolve it in this order.

## 0. Explicit User Input

If the user provides any of these, use them first:

- Full project URL like `https://github.com/users/OWNER/projects/42`
- Full project URL like `https://github.com/orgs/ORG/projects/42`
- Repository URL like `https://github.com/OWNER/REPO`
- Tuple-like path such as `OWNER/REPO` plus an explicit project number
- Explicit `owner`, `repo`, `project`, `projectId`, `statusFieldId`, or `statusOptions`

Do not override explicit user input with inferred values.

## 1. AgentFlow Config

If `.agentflow/github.json` exists, treat it as authoritative for:

- `project`
- `owner`
- `repo`
- `projectId`
- `statusFieldId`
- `statusOptions`

Do not override this file with Git remote or local-index guesses.

## 2. Local Index

Read [local-index.md](local-index.md) and check the machine-local manifest for:

- exact `projectPath` match
- exact `remoteUrl` match

Use the manifest as a cached hint that avoids repeated discovery. If it conflicts with explicit user input or `.agentflow/github.json`, refresh it with the stronger source.

Prefer the helper script for deterministic reads:

```bash
bun <skill-root>/github-projects/scripts/path-index.ts get --project-path "/abs/path/to/project"
```

## 3. Git Remote Inference

Read the remote:

```bash
git remote get-url origin
```

If the remote host is `github.com`, infer `owner` and `repo` from common patterns such as:

- `https://github.com/OWNER/REPO.git`
- `git@github.com:OWNER/REPO.git`

Verify the inferred repo:

```bash
gh repo view OWNER/REPO
```

Project heuristic:

```bash
gh project list --owner OWNER --format json
```

- If there is exactly one plausible project, use it provisionally.
- Otherwise prefer a project whose title matches the repo name, looks like `${repo} backlog`, or clearly references AgentFlow.
- If several projects are still plausible, stop and ask the user.

Once a project number is chosen, hydrate the IDs:

```bash
gh project view PROJECT_NUM --owner OWNER --format json
gh project field-list PROJECT_NUM --owner OWNER --format json
```

Status-field heuristic:

- Prefer a field named `Status`.
- If there is no `Status` field, stop and ask the user to identify the project field used for board columns.
- If the `Status` field exists but the standard AgentFlow options do not map cleanly, stop and ask the user or fix setup first.

Important:

- Git remote inference is a bootstrap heuristic, not a source of truth.
- Treat inferred `project` as provisional until verified.
- Never invent `projectId`, `statusFieldId`, or status option IDs from the remote alone.

## 4. Ask the User

If `owner`, `repo`, or `project` is still ambiguous, ask the user for the missing path instead of guessing.

## After Successful Resolution

Update the local manifest described in [local-index.md](local-index.md) so future runs do not need to rediscover the same mapping.

Prefer the helper script for deterministic writes:

```bash
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
