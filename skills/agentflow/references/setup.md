# Project setup

Keep the reusable workflow in the installed skill. A project needs its backlog configuration and any genuinely project-specific helpers; normal development and verification instructions belong in its AGENTS.md and existing documentation.

1. Reuse existing configuration. If no provider was specified or configured, ask which provider to use before creating external resources.
2. Use the installed `github-projects` or `azure-devops` skill for authentication, discovering project/field IDs, and configuring the selected board. Reuse existing access; do not print credentials.
3. Configure the seven stages: New, Approved, Refinement, Tech Design, Implementation, Final Review, Done. Preserve unrelated board fields, views, and labels.
4. Copy only the selected configuration template and fill it with verified values:
   - [GitHub template](../assets/templates/github.json) to `.agentflow/github.json`.
   - [Azure template](../assets/templates/azure-devops.json) to `.agentflow/azure-devops.json`.
   - [JSON template](../assets/templates/board.json) to `.agentflow/board.json` when a local board was selected; see [JSON guidance](json-backend.md).
5. For GitHub, cache Project and Status option IDs. For Azure, discover the board-scoped WEF column field and optional split-column field; do not use generic work-item state as a substitute for column position.
6. Verify access and configuration through reads. Do not create test cards without Andrew's request or approval.

No loop script, project-loop prompt, Ralph prompt, copied stage documents, forced compaction files, or spec directories are needed. Existing historical records do not need deletion to adopt this workflow.
