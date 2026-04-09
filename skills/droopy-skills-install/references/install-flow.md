# Install Flow

Use this flow when installing a skill from the `skills/` folder in this repository.

## Ask Only What Is Missing

Collect these inputs in this order:

1. Which skill or skills should be installed.
2. Whether the install should be `project` level or `user` level.
3. Which coding agents should receive a copy: `cursor`, `codex`, `claude`, or a combination.

If the user already gave some of those, do not re-ask them.

## Resolve the Source Folder

Resolve the source skill directory in this order:

1. An explicit repo path from the user.
2. The current repository, if it contains `skills/<skill-name>/SKILL.md`.
3. Ask the user where their `droopy-skills` repo lives.

Do not fabricate a source skill folder that does not exist.

## Pick the Destination

Use these defaults unless the user says otherwise:

- Project scope:
  - shared install root: `<project-root>/.agents/skills/`
  - Claude mirror root: `<project-root>/.claude/skills/`
- User scope:
  - shared install root: `~/.agents/skills/`
  - Claude mirror root: `~/.claude/skills/`

For Cursor and Codex, the shared `.agents/skills` location is the preferred home.

If Claude is selected, also copy the same skill folder into the matching `.claude/skills` location.

## Run the Copy Commands

Use ordinary shell commands. `rsync -a` is preferred because it is explicit about copying a directory tree, but `cp -R` is acceptable.

Example project-level install for Cursor and Codex:

```bash
mkdir -p .agents/skills
rsync -a /abs/path/to/droopy-skills/skills/azure-devops/ .agents/skills/azure-devops/
```

Example user-level install for Cursor, Codex, and Claude:

```bash
mkdir -p ~/.agents/skills ~/.claude/skills
rsync -a /abs/path/to/droopy-skills/skills/azure-devops/ ~/.agents/skills/azure-devops/
rsync -a /abs/path/to/droopy-skills/skills/azure-devops/ ~/.claude/skills/azure-devops/
```

If multiple skills were requested, repeat the copy for each skill.

## Verify

After copying:

- confirm each destination contains `SKILL.md`
- tell the user exactly which directories were written
- if a destination already existed and the user chose not to overwrite it, say so clearly
