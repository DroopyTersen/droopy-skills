# Complete code review packet

Use only when the user asks for **all changed files / full diffs / a complete code review packet**. Standard and Inline evidence retain their existing curated behavior.

Analyze with PR Guide and choose a meaningful reading order. Then let the deterministic builder assemble full diffs; do not manually copy, excerpt, or summarize the patches.

## Pin and inspect

For a GitHub PR, retrieve its title, base and head commit OIDs, changed-file count, and **every paginated file entry** using `gh`. The PR files endpoint can cap large results; compare the retrieved count with `changedFiles` and stop if incomplete. Fetch the pinned commits into the local repository. Re-read the PR head after collection and confirm it is unchanged. Use Git's merge base for the PR comparison, not the current moving base branch. Analyze that same pinned snapshot.

Write a JSON plan with the base/head **full commit IDs** and every file from the pinned PR inventory exactly once, using the new path for renames. The files array is the agent-selected reading order. Notes are optional per-file narrative. Save the ordinary PR Guide as a separate Markdown file.

```json
{
  "title": "PR 123: Add offline reading",
  "base": "FULL_BASE_COMMIT_ID",
  "head": "FULL_HEAD_COMMIT_ID",
  "files": [
    {"path": "src/reading.ts", "note": "Start with the public reading workflow."},
    {"path": "src/storage.ts", "note": "Then inspect persistence."},
    {"path": "tests/reading.test.ts", "note": "Finish with observable behavior."}
  ]
}
```

For a local branch comparison, the immutable Git inventory is authoritative. Never fetch an arbitrary private PR just to demonstrate delivery.

## Assemble and verify

```bash
python3 ~/.agents/skills/pr-guide/scripts/build-review-packet.py \
  --repo /path/to/repo --plan /path/to/plan.json \
  --guide /path/to/guide.md --output /path/to/review.md
bash ~/.agents/skills/print-md-document/scripts/render-md-printable.sh \
  /path/to/review.md --output /path/to/review.pdf
```

The builder checks the ordered plan against the pinned Git inventory, rejects duplicates/missing files, includes every textual patch without a line limit, labels binary changes, and emits `review.diff` plus `review.manifest.json` with section hashes. Added, deleted, renamed, mode-only, submodule, generated and lock files all count. Binary summaries and submodule commit changes are printed; binary payloads and nested submodule histories are not textual PR diffs. Non-UTF-8 text stops assembly rather than being silently corrupted.

The PDF may soft-wrap long lines; the `.diff` sidecar preserves exact bytes and signs. Inspect the PDF visually and verify extracted code for representative long lines, multi-page hunks and final sections. Do not claim completeness if the inventory disagrees, rendering clips/omits material, or any deliberate redaction is required. Resolve sensitive values before uploading; if redaction is necessary, identify omissions and call it a redacted packet.

For reMarkable delivery, compose with `send-to-remarkable`; retain the PDF, plan, exact diff and manifest locally. A delivery request authorizes that document's upload.
