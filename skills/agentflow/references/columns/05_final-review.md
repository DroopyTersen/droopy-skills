# Column: Final Review

**Actor:** Human
**Agent:** None
**Commit:** None (already committed)

---

## Summary

Final human approval gate. Human reviews the complete work—requirements, design, implementation, and code review—then decides to approve, request changes, or reject.

The Ralph Loop skips cards in this column. This is a human-only phase.

---

## Definition of Done

Human has made a decision:
- **Approved:** Move to Done
- **Changes Requested:** Back to Implementation with feedback
- **Rejected:** Back to Tech Design or Refinement with feedback

---

## What Happens

Card arrives from Implementation with code committed.

### Step 1: Review the Card

Review the complete card context containing:
- Original requirements and acceptance criteria
- Tech design and decision rationale
- Implementation summary (files changed)
- Verification results
- Code review findings and score
- Commit SHAs

### Step 2: Optional Additional Verification

Optionally perform additional verification:
- Manual testing
- UI review via Claude Chrome
- Code inspection
- Run tests locally
- Check staging/production deployment

### Step 3: Make Decision

| Decision | When to Use | Next Column |
|----------|-------------|-------------|
| **Approve** | Work is complete, meets requirements | Done |
| **Request Changes** | Mostly correct, needs minor adjustments | Implementation |
| **Reject** | Approach is fundamentally wrong | Tech Design or Refinement |

### Step 4: Document and Move

**If Approving:**
1. Mark acceptance criteria checkboxes as complete
2. Add Final Review section with approval
3. Move card to `done`

**If Requesting Changes:**
1. Document specific changes needed in Conversation Log
2. Move card back to `implementation`
3. Agent picks up on next loop iteration

**If Rejecting:**
1. Document why the approach doesn't work in Conversation Log
2. Specify which column to return to
3. Move card back to `tech-design` or `refinement`
4. Agent reworks from that phase

---

## Review Checklist

- [ ] Requirements met (acceptance criteria satisfied)
- [ ] Tech design followed appropriately
- [ ] Code review issues addressed
- [ ] Verification results acceptable
- [ ] No obvious issues in implementation
- [ ] Code quality meets project standards
- [ ] Branch pushed with all commits

---

## Card Context Updates

### If Approved

```markdown
---

## Final Review
**Date:** {YYYY-MM-DD}
**Reviewer:** {name}
**Decision:** Approved

### Acceptance Criteria
- [x] Criterion 1 (verified)
- [x] Criterion 2 (verified)
- [x] Edge case scenario (verified)

### Review Notes
{Any observations or comments}

### Git Info
| Field | Value |
|-------|-------|
| Branch | `{branch-name}` |
| Spec Commit | `{sha}` |
| Implementation Commit | `{sha}` |

---

## Completed
**Date:** {YYYY-MM-DD}

### Summary
| Field | Value |
|-------|-------|
| Type | {feature / bug / refactor} |
| Branch | `{branch-name}` |
| Spec Commit | `{sha}` |
| Implementation Commit | `{sha}` |
| Code Review Score | {XX}/100 |
```

### If Changes Requested

```markdown
---

## Conversation Log

... (previous entries) ...

**Human ({date}):** I've reviewed the implementation. Two issues:
1. The error message on line 45 isn't user-friendly
2. Missing loading state on the submit button

Please address these and re-run verification.

---

## History
| Date | Column | Actor | Notes |
|------|--------|-------|-------|
| ... | ... | ... | ... |
| {date} | Final Review | Human | Changes requested |
```

Then move card back to `implementation`. No `needs-feedback` tag needed—agent picks up immediately.

### If Rejected

```markdown
---

## Conversation Log

... (previous entries) ...

**Human ({date}):** After testing, this approach won't scale. The polling mechanism will create too much server load. Let's go back to Tech Design and consider WebSockets instead.

---

## History
| Date | Column | Actor | Notes |
|------|--------|-------|-------|
| ... | ... | ... | ... |
| {date} | Final Review | Human | Rejected - return to Tech Design |
```

Then move card back to `tech-design` or `refinement`.

---

## Decisions Explained

### Approved

Work is complete and meets requirements.

**Use when:**
- All acceptance criteria are satisfied
- Implementation is correct
- Code quality is acceptable
- No issues found during review

### Changes Requested

Implementation is mostly correct but needs minor adjustments.

**Use when:**
- Minor code issues found
- Missing edge case handling
- Documentation gaps
- Small behavior adjustments

Agent will pick up the card, read the feedback, address issues, and re-run code review.

### Rejected

The approach is fundamentally wrong and needs rework.

**Use when:**
- Wrong technical approach chosen
- Requirements were misunderstood
- Architecture doesn't fit the need
- Major rework required

Agent will rework from the specified phase.

---

## Entry Criteria

- Implementation complete
- Code review completed (score >= 70)
- Implementation committed
- Card moved from Implementation

---

## Exit Criteria

- Human has reviewed
- Decision made and documented
- Card moved to next column

---

## Important Notes

- **Review the full context** - understand the journey, not just the code
- **Check acceptance criteria** - these are your primary measure of success
- **Provide actionable feedback** - if rejecting or requesting changes, be specific
- **Use the right action** - small fixes = changes requested, major issues = rejected
- **No tag needed** - agent picks up cards in `implementation` automatically

---

## Future: Pull Request Creation

When PR workflow is enabled, Final Review will:
1. Create PR from feature branch to main
2. Add PR link to card context
3. Human reviews PR alongside card

For now, branches remain without PRs. Code is reviewed via the card's Code Review section.

---

## Next Column

> **Done** (if approved)

< **Implementation** (if changes requested)

< **Tech Design** or **Refinement** (if rejected)
