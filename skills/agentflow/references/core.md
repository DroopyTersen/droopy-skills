# Shared workflow

## Intent and authority

Andrew is the gatekeeper for creating cards and approving them for work. New means consideration; Approved means the work deserves doing. Neither a suggestion nor a status move automatically starts execution.

When asked to work a card, read its body, comments, dependencies, linked PR feedback, and current board status. Infer the working style from the kickoff: brainstorming and grilling requests invite collaboration; implementation requests invite autonomous research and execution. When unclear, begin research and ask only about material decisions that cannot be inferred. A request limited to planning remains limited to planning.

For a written Tech Design, get human approval before implementation unless Andrew explicitly waived that checkpoint. An earlier generic request to work the card is not itself a waiver. Reuse clear approval already given in the conversation; record it on the item with Andrew's name and the actual date. Approval of an outlined verification plan includes its scoped harness and eval runs; do not ask again merely because they use APIs or existing credentials. Respect any explicit budget or environment constraints.

An explicit merge or PR-completion request authorizes the named action and its necessary conflict resolution and verification. Deployment is included only when requested. During Final Review, a bare "approved" needs the concise clarification: "Do you want me to merge this PR?" Do not ask again after an explicit merge instruction.

## Selection and ownership

- A card named by Andrew takes precedence. When asked for the next card, use the visible order of Approved, skipping blocked cards and briefly explaining why. Do not substitute issue number, age, priority labels, or API arrival order for visible rank.
- A recommendation request such as "what should I work on?" only recommends. Work starts when requested.
- Recheck status and ownership before claiming a card. Move it to Refinement and verify the result immediately so another worker does not select it. A status move is not an atomic lock: if competing ownership becomes apparent, resolve that before duplicating work.
- Resume the selected active card through stages within the current task, respecting approval checkpoints. Do not stop merely because a stage changed or select another card automatically after finishing.
- Dependencies can exist on Approved cards. Record linked issue/work-item references and the exact prerequisite, using provider relations when supported. Check whether the prerequisite is actually satisfied; issue closure alone may not prove merge or deployment.

## Durable context

The item body is the source of truth for current requirements, relevant evidence, the important-files table, acceptance criteria, the implementation plan, and verification requirements. Reuse existing detail rather than duplicating a section for each stage. Rewrite obsolete material while preserving useful trace IDs, screenshots, reproduction evidence, issue/PR links, constraints, and decisions.

Use item comments for approvals, material discoveries or plan changes, and a compact implementation/completion record. Ask questions in the current conversation; post discussion externally only when requested. A short card note may identify the pending decision. Do not require manual feedback-tag removal, embedded history or conversation tables, separate planning files, or plan commits. Existing historical artifacts can remain linked.

Explain ordinary implementation adjustments when useful and keep moving. Only a departure that materially changes agreed behavior, requirements, scope, contracts, risk, or the overall approach may need renewed approval. Document such a departure comprehensively in an item comment: discovery and evidence, original assumption, changed approach and rationale, affected behavior/scope, and verification consequences. Decide whether human judgment is actually needed; do not halt for routine file, helper, or interface details.

## Verification and progress

Verification is always required. By the end of Tech Design, account for unit tests, integration tests, CLI harness runs, evals, and end-to-end Computer Use. Many items need all five. Specify scenarios, expected outcomes, commands where known, and a reason for any inapplicable layer. Include repository-required checks as well. Obvious fixes without a written plan still need these verification decisions before completion.

Test real behavior with independent expectations. Avoid tautological tests, brittle implementation assertions, prompt-string checks, and unnecessary mocks. New automated tests are required when they add meaningful regression or contract coverage; existing meaningful tests can satisfy coverage. Never confuse "no new tests" with "no verification."

Investigate failures and continue useful independent work. Required failed or unavailable checks prevent the initial handoff to Final Review. Explain the exact gap, attempted remedies, and what remains needed. Never count an unrun check as passed.

Use a task branch before editing implementation code. Worktrees are optional; follow repository guidance and preserve unrelated work. Read [Final Review](columns/05_final-review.md) for merge, local-main synchronization, and requested deployment.
