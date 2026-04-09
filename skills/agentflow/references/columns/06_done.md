# Column: Done

**Actor:** None
**Agent:** None
**Commit:** None

---

## Summary

Terminal state. Work is complete, approved, and committed. The card remains as permanent documentation of the work performed.

The Ralph Loop ignores cards in this column.

---

## Definition of Done

N/A - This is the terminal state.

---

## What Happens

Card arrives from Final Review after approval.

- Work item is complete
- Card context contains the full history
- Commits (spec and implementation) are in repository history
- Card remains for future reference
- Dependent cards are notified (if any)

### Notify Dependent Cards

When a card reaches Done, check if any other cards depend on it:

**For GitHub backend:**
```bash
# Search for issues that have this card as a predecessor
# Look for "Blocked by: #THIS_NUMBER" in issue bodies
gh search issues "Blocked by: #{NUMBER}" --repo {OWNER}/{REPO} --json number,title
```

**For JSON backend:**
```
Search all card context files for:
- "Blocked by:" containing this card's ID
```

**For each dependent found:**
Add a comment notifying them the predecessor is complete:

```
/af context {dependent-id} append "
## Conversation Log

**[Agent - {date}]:** Predecessor #{this-id} ({title}) has been completed and merged to main.
- This card is now unblocked from that dependency
- Check remaining dependencies with \`/af depends {dependent-id}\`
"
```

This helps dependent cards know when they can proceed or rebase onto main.

---

## Card Final State

```markdown
# {Title}

## Type
{feature | bug | refactor}

## Priority
{priority}

## Description
{Original description}

---

## Refinement
**Date:** {date}
**Agent:** code-explorer
**Status:** Complete

### Functional Requirements
{Requirements documented}

### Acceptance Criteria
- [x] Criterion 1
- [x] Criterion 2

---

## Tech Design
**Date:** {date}
**Agent:** code-architect
**Status:** Complete

### Decision
{Approaches considered and selection rationale}

### Technical Design
{Comprehensive design documentation}

### Spec Commit
**SHA:** `{sha}`

---

## Implementation
**Date:** {date}

### Changes Made
{Files created/modified}

### Verification Results
{All verification passed}

---

## Code Review
**Date:** {date}
**Agent:** code-reviewer
**Score:** {XX}/100
**Verdict:** PASS

### Implementation Commit
**SHA:** `{sha}`

---

## Final Review
**Date:** {date}
**Reviewer:** {name}
**Decision:** Approved

---

## Completed
**Date:** {date}

### Summary
| Field | Value |
|-------|-------|
| Type | {feature / bug / refactor} |
| Branch | `{branch-name}` |
| Spec Commit | `{sha}` |
| Implementation Commit | `{sha}` |
| Code Review Score | {XX}/100 |
| Duration | {days from created to done} |

---

## Conversation Log

{Full conversation history between agent and human}

---

## History
| Date | Column | Actor | Notes |
|------|--------|-------|-------|
| {date} | New | Human | Created |
| {date} | Refinement | Agent | Recon complete |
| {date} | Refinement | Human | Questions answered |
| {date} | Refinement | Agent | Requirements documented |
| {date} | Tech Design | Agent | Approaches proposed |
| {date} | Tech Design | Human | Approach selected |
| {date} | Tech Design | Agent | Design finalized, spec committed |
| {date} | Implementation | Agent | Tests written, code complete |
| {date} | Implementation | Agent | Code review: {score}/100 |
| {date} | Implementation | Agent | Verification passed, committed |
| {date} | Final Review | Human | Approved |
| {date} | Done | - | Complete |
```

---

## Archival

Done cards can be:
- **Left in place** for reference (recommended initially)
- **Archived** periodically (backend-specific location)
- **Deleted** after a retention period

The card serves as permanent documentation of:
- What was built and why
- Decisions made along the way
- Who reviewed and approved
- Commit references for traceability
- Branch name for future reference

---

## Entry Criteria

- Final Review approved

---

## Exit Criteria

None (terminal state)

---

## Important Notes

- **Cards are documentation** - they capture the full journey
- **Commits are linked** - spec and implementation commits are recorded
- **History tells the story** - the history table shows progression
- **Keep for reference** - valuable for understanding past decisions
- **Dependents are notified** - when this card completes, cards that depend on it are informed

---

## Previous Column

< **Final Review** (arrives after approval)
