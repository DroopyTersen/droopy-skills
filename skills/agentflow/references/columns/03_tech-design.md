# Column: Tech Design

**Actor:** Agent, with optional human feedback loop
**Agent:** Codex only
**Commit:** Spec commit

---

## Summary

Design the technical approach for implementing the work item. This phase focuses on **how** to build it. The goal is to resolve technical unknowns and create a plan detailed enough that implementation is mostly execution.

**This phase is never skipped.**

Every card must go through tech-design, even trivial bugs. The question is only whether the design is obvious enough to proceed without human approval.

## Default Behavior: Codex-Only Design

Use Codex as the architecture engine for tech design. Do not spawn Claude architect agents, do not request three Claude alternatives, and do not label approaches as Claude-sourced.

For most work items, produce one recommended Codex design with enough supporting analysis to make the tradeoffs clear. When multiple viable approaches exist, Codex should compare them in its own output and recommend one.

Human feedback is required when:

- the work is a feature or refactor with meaningful design choices
- the bug fix touches more than 2-3 files
- there are multiple reasonable implementation strategies
- the design changes UX, rules, data contracts, persistence, or public APIs
- the agent is not highly confident the chosen approach matches the user's intent

If feedback is needed, post the Codex design and recommendation to discussion/comments, add `needs-feedback`, and exit.

## When to Skip Human Feedback

Skipping human feedback does not skip tech-design.

You may proceed without adding `needs-feedback` only when all of these are true:

- it is a small bug fix with an obvious, single approach
- there are no architectural decisions, new patterns, or UX choices
- the change is low-risk and easy to reverse
- a senior engineer on this project would likely agree with the approach

Even then, document the design, create the spec commit, and move the card to implementation. Implementation still happens in a later iteration.

## Definition of Done

- Codex-only technical design completed
- technical approach documented with rationale
- files to create/modify listed
- implementation sequence documented
- verification steps specified with concrete commands
- TDD plan included
- all known unknowns resolved or tagged `needs-feedback`
- spec committed
- card moved to `implementation` when ready

---

## Execution Steps

### Step 1: Read Card Context

Read the card's title, description, type, priority, labels, comments/discussion, and Refinement section.

Review refinement for:

- functional requirements
- acceptance criteria
- edge cases
- dependencies
- user decisions already made
- unanswered questions

### Step 2: Run Codex Architecture Pass

Use Codex for the architecture design. If you are already running inside Codex, do the architecture work directly in this context instead of spawning a second Codex process. If you are running from another agent environment, run Codex non-interactively:

```bash
REFINEMENT=$(cat << 'EOF'
{Refinement section from card}
EOF
)

codex exec "You are a senior software architect. Design the implementation approach for this AgentFlow card.

Task: {card.title}

Requirements:
$REFINEMENT

Use Codex only. Do not ask Claude agents for alternative designs.

Produce markdown with:
1. Recommended approach
2. Alternatives considered, if there are meaningful alternatives
3. Files to create with purpose
4. Files to modify with exact changes
5. Key interfaces, data shapes, or code sketches
6. Risks and tradeoffs
7. Implementation sequence
8. TDD plan
9. Verification commands and manual checks
10. Open questions, if any

Be specific about file paths and project conventions." \
  --full-auto \
  --output-last-message .agentflow/codex-architecture.txt \
  --sandbox read-only
```

### Step 3: Decide Whether Human Feedback Is Needed

Read the Codex architecture output and decide:

- If open questions remain, post the design to discussion/comments, add `needs-feedback`, and exit.
- If multiple viable approaches need a human preference, post the options and recommendation, add `needs-feedback`, and exit.
- If the approach is clear and low-risk, finalize it in the card body and continue.

Do not put unchosen alternatives or agent-human conversation in the durable card body. Keep those in discussion/comments.

### Step 4: Finalize Design

Update the card body with the finalized design only:

- add a `## Tech Design` section
- mark `**Status:** Complete`
- identify Codex as the design source
- summarize requirements
- document the chosen approach and rationale
- list files to create/modify
- include implementation sequence
- include verification steps
- include TDD plan

### Step 5: Create Spec Commit and Push

```bash
git add .
git commit -m "spec({type}): {title}"
git push -u origin HEAD
```

The `/af` command or backend workflow should stage the appropriate files for the backend. Do not stage unrelated working tree changes.

### Step 6: Update Card and Move

1. Append the finalized Tech Design section to card context/body.
2. Add or update the History table.
3. Move the card to `implementation`.

---

## By Work Item Type

### Feature

Document component architecture, new interfaces/types, integration approach, data flow if complex, and test strategy.

### Bug

Document root cause, fix approach, regression prevention, and the failing test to write first.

### Refactor

Document current state, desired state, migration steps, behavior preservation checks, and rollback risk.

---

## Discussion Template When Human Input Is Needed

```markdown
Agent ({YYYY-MM-DD}): Tech Design Recommendation

Codex analyzed this work item and recommends:

## Recommended Approach
{summary}

## Alternatives Considered
{only include if meaningful alternatives exist}

## Tradeoffs
| Aspect | Assessment |
|--------|------------|
| Effort | {Low/Medium/High} |
| Risk | {Low/Medium/High} |
| Maintainability | {assessment} |
| Testability | {assessment} |

## Open Questions / Decision Needed
{specific question for the human}
```

Then add the `needs-feedback` tag and stop.

## Card Body Template When Complete

```markdown
---

## Tech Design
**Date:** {YYYY-MM-DD}
**Agent:** Codex
**Status:** Complete

### Requirements Summary
**Must Have:**
- Requirement 1

**Constraints:**
- Constraint 1

### Decision
**Selected:** Codex recommended approach

**Rationale:** {why this approach fits the requirements and project constraints}

### Technical Design

{Comprehensive documentation of the chosen approach}

#### Files to Create
| File | Purpose |
|------|---------|
| `path/to/new.ts` | What it does |

#### Files to Modify
| File | Changes |
|------|---------|
| `path/to/existing.ts` | What changes |

#### Implementation Sequence
1. {First step}
2. {Second step}
3. {etc.}

### Verification Steps
| Step | Command | Expected |
|------|---------|----------|
| Type check | `bun run typecheck` | No errors |
| Unit tests | `bun test` | All pass |
| Build | `bun run build` | Success |
| Manual test | {scenario} | {expected behavior} |

### TDD Plan
- [ ] Write failing test for {scenario 1}
- [ ] Write failing test for {scenario 2}

### Spec Commit
**SHA:** `{sha}`
**Branch:** `{branch-name}`
**Date:** {YYYY-MM-DD}
```

## Tag Handling

| Condition | Action |
|-----------|--------|
| Human decision needed | Add `needs-feedback`, document the question |
| Human approved/selected | Remove `needs-feedback`, finalize design |
| External blocker | Add `blocked`, document reason |

## Exit Criteria

- Codex-only design documented
- human feedback captured or explicitly not needed
- verification plan and TDD plan included
- spec committed
- card moved to `implementation`

## Important Notes

- Do not implement in this phase; design and plan only.
- Exception for bugs: writing a failing test is acceptable and encouraged.
- Be specific about verification; vague plans lead to skipped verification.
- If a junior engineer could not execute the plan, add more detail.
- Do not spawn Claude architect agents for tech design.

---

## Next Column

> **Implementation**
