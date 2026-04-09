# Agent Metadata

Use this file only when the install target includes multiple coding agents or when the user asks about metadata differences.

## Portable Baseline

The shared source skill in this repository should stay as portable as possible:

- required frontmatter: `name`
- required frontmatter: `description`
- optional shared folders: `references/`, `scripts/`, `assets/`

Start with the most portable version of the skill and copy that first.

## Destination Rules

- Cursor: prefer `.agents/skills/` or `~/.agents/skills/`
- Codex: prefer `.agents/skills/` or `~/.agents/skills/`
- Claude: use `.claude/skills/` or `~/.claude/skills/`

That means `.agents/skills` is the canonical shared destination for Cursor and Codex, while Claude usually needs a mirrored copy in `.claude/skills`.

## Metadata Differences

Only adapt metadata when there is a concrete need.

- Cursor accepts standard `SKILL.md` frontmatter and also supports optional fields such as `license`, `compatibility`, `metadata`, and `disable-model-invocation`.
- Claude supports standard `SKILL.md` frontmatter and also documents Claude-specific fields such as `allowed-tools`, `argument-hint`, `user-invocable`, `model`, `effort`, and `context`.
- Codex can keep the shared `SKILL.md` portable and place Codex-specific UI metadata in `agents/openai.yaml`.

## Editing Rule

If one target needs agent-specific metadata:

1. Copy the shared skill first.
2. Apply the metadata change only in that target's installed copy.
3. Leave the shared source skill unchanged unless every target should inherit that change.

This keeps the repo source portable while still allowing agent-specific behavior when needed.
