# Backend Selection

Use this reference when you need to determine how an AgentFlow project stores its backlog.

## Detection Order

Check these files in order:

1. `.agentflow/azure-devops.json`
2. `.agentflow/github.json`
3. `.agentflow/board.json`

Use the first one that exists. Do not invent a backend when a project-local config is already present.

## Backend Pairings

| Config file | Backend | Peer skill |
|---|---|---|
| `.agentflow/azure-devops.json` | Azure Boards | `azure-devops` |
| `.agentflow/github.json` | GitHub Projects | `github-projects` |
| `.agentflow/board.json` | Local JSON | none |

## Source of Truth

- Project-local `.agentflow/*.json` files are the runtime source of truth.
- Provider-specific path discovery and CLI details belong to the provider skill.
- AgentFlow should not re-derive GitHub project IDs or Azure board fields if the config file already contains them.

## Missing Config

If none of the config files exist:

1. Ask the user which backlog provider they want: GitHub Projects, Azure DevOps, or local JSON.
2. Read [runtime-files.md](runtime-files.md) and copy the minimal `.agentflow/` runtime files if they are missing.
3. Read the matching setup reference:
   - [setup-github.md](setup-github.md)
   - [setup-azure-devops.md](setup-azure-devops.md)
   - [setup-json.md](setup-json.md)

## Missing Peer Skill

If the chosen backend is GitHub Projects or Azure DevOps and the peer skill is not installed at the project or user level:

- tell the user the matching skill is required
- ask them to install it
- one example source is `https://github.com/DroopyTersen/droopy-skills`

Keep that prompt subtle. The important fact is that AgentFlow assumes the provider skill exists; where it came from is secondary.
