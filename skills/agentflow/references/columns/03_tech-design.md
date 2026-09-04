# Tech Design

The implementation plan explains how to satisfy the requirements. Keep it on the item body, with the functional specification from Refinement. No separate spec files or commits.

## When a written plan is needed

Write a plan for changes with multiple steps, files, behavior boundaries, or meaningful risk. A truly obvious localized fix may move directly to Implementation after recording its root cause, intended fix, and appropriate verification. Honor a user-requested design/approval checkpoint even for a small fix.

## Two design passes

For each written plan:

1. A native sub-agent drafts the simplest complete design from the requirements, evidence, relevant files, and repository instructions. It inspects the code itself and includes useful code snippets and required tests. Do not request three named variants or speculative architecture.
2. A separate native sub-agent critiques the draft against the same source context. It independently checks the relevant code, every acceptance criterion, risks, tests, and verification. Push to remove unnecessary files, branches, states, abstractions, dependencies, and steps while preserving correctness.
3. The main agent resolves valid criticism and produces one polished plan. Mention alternatives only when a consequential choice remains. Do not publish raw sub-agent transcripts.

If the plan was already developed collaboratively with Andrew, use it as the first-pass draft rather than inventing a competing design; still obtain independent critique before implementation. If native delegation is unavailable, perform distinct drafting and skeptical review passes in the current context. Do not start nested CLI processes.

## Plan contents

- Concise overview and chosen approach with rationale.
- Files to create, change, move, or delete; group each file's changes together.
- Useful code sketches/diffs for interfaces, data shapes, control flow, and otherwise ambiguous edits. Snippets remain a defining part of a coding plan, without reproducing entire files.
- Ordered implementation steps, constraints, material risks, and any unresolved decisions.
- Required meaningful automated tests, covering changed logic, calculations, parsing, permissions, state transitions, regressions, and contracts as applicable. Existing coverage can suffice when it proves the behavior. Reject tautological/brittle tests and unjustified mocking; universal tests-first ordering is not required.
- Verification plan accounting for all five layers: unit, integration, CLI harness, evals, and end-to-end Computer Use. For each, give scenarios and success conditions or a concrete reason it does not apply. Include commands where known and required repository checks. Many cards should exercise all five layers.

Challenge each new abstraction, dependency, optional mode, and file: it must solve a present problem. Prefer existing patterns, simple control flow, lower cyclomatic complexity, and fewer concepts. Do not add a layer merely to look architectural.

## Approval and handoff

Present the final plan to Andrew and wait for human approval before implementation unless he explicitly waived this checkpoint. A generic "work this card" is not a waiver. Clear statements such as "approved," "implement it," "go ahead with this plan," or "document this and mark it approved" count; do not request the same approval again.

Record actual approval in an item comment, for example `Tech Design approved by Andrew on YYYY-MM-DD`, using the real date. Record an explicit waiver accurately instead of claiming approval of an unseen design. A later critique that materially changes an already-approved plan needs the normal material-change judgment; routine refinements do not reopen approval.

Move to [Implementation](04_implementation.md) and create or reuse the task branch before code changes. A request explicitly limited to documenting approval does not also direct implementation. Worktrees are optional.
