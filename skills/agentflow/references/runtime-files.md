# Runtime Files

Use this reference when installing AgentFlow into a project or when a project is missing its local `.agentflow/` files.

## What Belongs in the Skill

Keep the reusable workflow intelligence in the installed `agentflow` skill:

- workflow rules
- command routing
- column instructions
- specialist-agent prompt references
- setup references
- the loop script and file templates under `assets/`

Do not copy those references into the project.

## What Belongs in `.agentflow/`

The project-local `.agentflow/` folder should contain runtime files only:

```text
.agentflow/
├── loop.sh
├── PROJECT_LOOP_PROMPT.md
├── RALPH_LOOP_PROMPT.md
├── github.json | azure-devops.json | board.json
├── progress.txt
├── iterations/
└── cards/                  # JSON backend only
```

## Setup Flow

When bootstrapping a project:

1. Create `.agentflow/` if it does not exist.
2. Copy [assets/loop.sh](../assets/loop.sh) to `.agentflow/loop.sh`.
3. Copy [assets/templates/PROJECT_LOOP_PROMPT.md](../assets/templates/PROJECT_LOOP_PROMPT.md) to `.agentflow/PROJECT_LOOP_PROMPT.md`.
4. Copy [assets/templates/RALPH_LOOP_PROMPT.md](../assets/templates/RALPH_LOOP_PROMPT.md) to `.agentflow/RALPH_LOOP_PROMPT.md`.
5. Copy exactly one backend config template:
   - [assets/templates/github.json](../assets/templates/github.json) to `.agentflow/github.json`
   - [assets/templates/azure-devops.json](../assets/templates/azure-devops.json) to `.agentflow/azure-devops.json`
   - [assets/templates/board.json](../assets/templates/board.json) to `.agentflow/board.json`
6. If the backend is JSON, also create `.agentflow/cards/`.
7. Mark `.agentflow/loop.sh` executable.
8. Customize `.agentflow/PROJECT_LOOP_PROMPT.md` for the project.

Run the ordinary shell copy commands yourself. No custom installer is required.

## Restore Flow

If a project already has backlog config but is missing loop files:

- copy `loop.sh`
- copy `PROJECT_LOOP_PROMPT.md`
- copy `RALPH_LOOP_PROMPT.md`
- preserve the existing config file
- do not overwrite `progress.txt`, `iterations/`, or JSON cards unless the user asks

## Loop Placement

Bundle the Ralph Loop script with the skill, but copy it into `.agentflow/` during setup.

That gives each project:

- a stable entrypoint: `.agentflow/loop.sh`
- project-local prompt files next to the loop
- freedom to customize prompts without mutating the shared skill copy
