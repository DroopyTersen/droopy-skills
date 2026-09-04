# Implementation

Own the full sequence here: code, verify, four reviews, cleanup, verify again, commit/push, and PR creation. There is no separate review column before Final Review.

## Implement

Read the current item body, approval comments, dependencies, and linked PR feedback. Use the approved Tech Design when one is needed. Missing formal design text is acceptable for the obvious-fix exception or an explicit user instruction to skip it; column placement alone does not prove approval of a substantive plan.

Use a task branch and follow repository conventions. Implement the smallest clear solution and the plan's required meaningful tests. Tests-first can help reproduce a bug, but is not a universal ordering requirement. Preserve unrelated work.

Routine discoveries can change implementation details without halting progress. Keep the item accurate. For material departures, use the comprehensive comment and judgment rules in [core.md](../core.md); seek renewed approval only when the decision actually requires Andrew.

## Verify, review, and verify again

1. Run the complete planned verification and repository-required checks. Always verify; existing coverage can satisfy a layer, but a skipped or unavailable check is not a pass.
2. Resolve failures within scope and continue useful independent checks. Required failures, missing requirements, and unavailable required checks block the initial move to Final Review.
3. Once the implementation appears complete and verified, run the [four independent reviews](../reviews.md).
4. Consolidate findings and apply justified fixes and cleanup. Optional aggressive refactoring may be left for Andrew as nonblocking PR feedback; correctness gaps may not.
5. Rerun all required verification after cleanup, including applicable unit tests, integration tests, CLI harness runs, evals, and Computer Use end-to-end checks. This second pass is required even when cleanup seems minor. If there were no changes, the first evidence remains valid.

Record commands/scenarios, outcomes, relevant environment and code revision, and links to useful evidence. Report failures honestly and keep working on what can be resolved without expanding scope.

## Publish for review

- Commit coherent changes, staging only intended files, and push the task branch. No mandatory separate implementation/review-fix commits.
- Create or update the PR against the intended base. Use the `pr-guide` skill to write the PR description: explain the problem and outcome, start at the best high-level entry point, order the walkthrough by abstraction and dependencies, link key files, and include verification evidence. Scale detail to the change. If the skill is unavailable, use this same walkthrough structure directly.
- Link the card and PR. Keep optional cleanup decisions in PR feedback comments, clearly marked nonblocking, with links from the card.
- Add one concise item comment covering actual changes, meaningful deviations, review outcomes, and verification evidence. Rewrite misleading body content rather than appending repetitive stage reports.
- Verify the published PR/body and card updates, then move the card to [Final Review](05_final-review.md). The PR should be ready for Andrew to review; do not merge, complete it, enable auto-merge, or deploy without his explicit instruction.
