# Final Review

The work is implemented, independently reviewed, verified after cleanup, and available in a linked PR with a PR-Guide description. This is Andrew's review and feedback stage. Do not repeat a mandatory review cycle merely because the card entered this column.

## Feedback and approval

- When Andrew requests revisions, address them while keeping the card in Final Review unless he explicitly asks to send it back. Read the PR feedback, make changes, obtain appropriate focused review, rerun the complete required verification after changes, and refresh the PR guide and evidence.
- Clearly record any newly discovered correctness or verification blocker and do not merge while it remains unresolved. Optional cleanup remains nonblocking PR feedback.
- If Andrew says only "approved," ask: "Do you want me to merge this PR?" Approval alone is not an instruction to merge or close the work item.
- "Merge the PR" or "complete the PR" explicitly authorizes completion. An instruction to merge and deploy includes both actions and their verification; do not re-request those permissions.

## Merge and requested delivery

1. Read the PR's actual head, base, current checks, unresolved feedback, and latest target branch. For an existing PR, its declared base is authoritative unless Andrew requests a change.
2. Resolve integration conflicts and relevant compatibility issues with incoming changes while preserving both intended behaviors. Ordinary conflict resolution is within the merge request. Ask only if incompatible requirements or consequential choices cannot be settled from existing decisions.
3. If integration or conflict resolution changes the code, repeat the required verification on the integrated result and address new failures. Check current merge requirements before merging.
4. Merge as explicitly requested using the repository's normal method. Verify the merge result and required post-merge checks.
5. After merging into `main`, fetch the latest remote state and update local `main`, including other changes merged in the meantime. Locate the checkout that owns `main` using Git worktree information; fast-forward it safely. If no checkout owns it, safely fast-forward the local branch ref or use an appropriate clean checkout. Do not switch another active task's branch, overwrite dirty work, reset divergence, or delete local work. If synchronization cannot be completed safely, report the exact blocker and preserve the work.
6. Deploy only the environment(s) Andrew requested and independently verify the requested delivery. Use repository deployment guidance and existing scoped authorization.

## Exit

Move to [Done](06_done.md) when the requested scope and required checks are complete. A merge-only request does not need a deployment. If merge succeeded but a requested deployment, required verification, or local-main update remains blocked, keep the card here, document what succeeded and what remains, and continue resolving it within scope.
