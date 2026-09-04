---
name: agentflow
description: Manage AgentFlow cards and carry selected work through research, technical design, implementation, verification, review, and completion in Codex or Claude. Use for AgentFlow boards, backlog items, stage changes, or requests to work the next card.
---

# AgentFlow

Work directly in the current Codex or Claude task. AgentFlow defines the board workflow; the product manages execution, context, and native sub-agents. No AgentFlow CLI, shell loop, iteration files, or nested agent processes are needed.

Read [core.md](references/core.md), then only the current stage and the provider information needed for the request.

| Stage | Meaning |
| --- | --- |
| [New](references/columns/01_new.md) | Captured for consideration; any level of detail |
| [Approved](references/columns/01b_approved.md) | Eligible work, ordered visually on the board |
| [Refinement](references/columns/02_refinement.md) | Claimed work; research and clarify requirements as needed |
| [Tech Design](references/columns/03_tech-design.md) | Write and critique the implementation plan; await human approval |
| [Implementation](references/columns/04_implementation.md) | Code, verify, review, clean up, verify again, and open the PR |
| [Final Review](references/columns/05_final-review.md) | Ready for Andrew's review and requested revisions |
| [Done](references/columns/06_done.md) | Requested delivery and verification are complete |

## Working rules

- Create cards only when Andrew requests or approves their creation. Suggest evidence-backed cards without creating them automatically.
- Moving a card to Approved makes it eligible; it does not start work. A named card wins. When asked to work the next card, take the top unblocked Approved card in the board's visible order.
- Claim selected work by moving it to Refinement immediately and confirming the change. Existing requirements may satisfy Refinement without new writing. Obvious localized fixes may skip formal Tech Design.
- Infer collaboration versus autonomous work from the kickoff. Research independently when unclear. Human approval before implementing a written Tech Design is still required unless explicitly waived.
- Carry forward existing authorization. Normal card updates, approval records, reviews, verification, commits, pushes, and PR creation belong to authorized execution. Merge, PR completion, auto-merge, and deployment need an explicit request.
- Keep requirements and plans on the card. Use comments for decisions, approvals, material changes, and completion evidence. Do not create spec files, spec commits, embedded history tables, or author/model branding.

## Supporting references

- [Backend selection](references/backend-selection.md): configuration and board order; compose with `github-projects` or `azure-devops` for provider operations.
- [Setup](references/setup.md): configure a new project without copying workflow instructions into it.
- [Local JSON](references/json-backend.md): only for existing or explicitly selected local boards.
- [Implementation reviews](references/reviews.md): the four independent reviews after initial verification.

Repository instructions supply actual commands, environments, and conventions. Use the `thermo-nuclear-code-quality-review` skill for that review when available and the `pr-guide` skill for the PR description. The review reference includes the required criteria if a review skill is unavailable. Do not invoke the standalone `improve-codebase-architecture` exploration or grilling workflow.
