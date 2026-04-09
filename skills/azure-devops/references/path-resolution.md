# Azure DevOps Path Resolution

The Azure DevOps path means:

- `organization`
- `project`
- `team`
- `board`

Resolve it in this order.

## 0. Explicit User Input

If the user provides any of these, use them first:

- Full board URL like `https://dev.azure.com/ORG/PROJECT/_boards/board/t/TEAM/BOARD`
- Git URL like `https://dev.azure.com/ORG/PROJECT/_git/REPO`
- Tuple-like path such as `ORG/PROJECT/TEAM/BOARD`
- Explicit `organization`, `project`, `team`, or `board` names

Do not override explicit user input with inferred values.

## 1. AgentFlow Config

If `.agentflow/azure-devops.json` exists, treat it as authoritative for:

- `organization`
- `project`
- `team`
- `board`
- `boardColumnField`
- `boardColumnDoneField`

Do not override this file with Git remote or local-index guesses.

## 2. Local Index

Read [local-index.md](local-index.md) and check the machine-local manifest for:

- exact `projectPath` match
- exact `remoteUrl` match

Use the manifest as a cached hint that avoids repeated discovery. If it conflicts with explicit user input or `.agentflow/azure-devops.json`, refresh it with the stronger source.

Prefer the helper script for deterministic reads:

```bash
bun <skill-root>/azure-devops/scripts/path-index.ts get --project-path "/abs/path/to/project"
```

## 3. Git Remote Inference

Read the remote:

```bash
git remote get-url origin
```

If the remote host is `dev.azure.com` or `ssh.dev.azure.com`, infer `organization` and `project` from common patterns such as:

- `https://dev.azure.com/ORG/PROJECT/_git/REPO`
- `https://ORG@dev.azure.com/ORG/PROJECT/_git/REPO`
- `git@ssh.dev.azure.com:v3/ORG/PROJECT/REPO`

Verify the inferred project:

```bash
az devops project show --project "PROJECT" --organization "https://dev.azure.com/ORG"
```

If that succeeds, list teams:

```bash
az devops team list --project "PROJECT" --org "https://dev.azure.com/ORG" -o json
```

Team heuristic:

- If there is exactly one team, use it.
- Otherwise prefer a team whose name matches the project or looks like the default project team.
- If several teams are still plausible, stop and ask the user.

Board heuristic:

- If the chosen team has exactly one obvious board, use it provisionally.
- Otherwise prefer a requirement-level board with a standard name such as `Stories` or `Backlog items`.
- If several boards are still plausible, stop and ask the user.

Important:

- Git remote inference is a bootstrap heuristic, not a source of truth.
- Treat inferred `team` and `board` as provisional until verified.
- Never invent WEF board field names from the remote.

## 4. Ask the User

If `organization`, `project`, `team`, or `board` is still ambiguous, ask the user for the missing path instead of guessing.

## After Successful Resolution

Update the local manifest described in [local-index.md](local-index.md) so future runs do not need to rediscover the same mapping.

Prefer the helper script for deterministic writes:

```bash
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
