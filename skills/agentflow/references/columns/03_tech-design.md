# Column: Tech Design

**Actor:** Agent (with optional human feedback loop)
**Agent:** `code-architect` + Codex (dual design)
**Commit:** Spec commit

---

## Summary

Design the technical approach for implementing the work item. This phase focuses on **how** to build it. The goal is to resolve all technical unknowns and create a plan detailed enough that implementation is mostly execution.

**⚠️ THIS PHASE IS NEVER SKIPPED**

Every card must go through tech-design, even trivial bugs. The question is only whether you need human approval before moving to implementation.

### Default Behavior: Research Four Approaches (Dual Design)

**For most work items, research and present FOUR approaches from two sources:**

**From Claude (3 approaches):**
1. 🟣 **Minimal** — The smallest change that solves the problem. Quick to implement, but may cut corners or accumulate tech debt. Good for time-sensitive fixes.

2. 🟣 **Idealistic** — The "right" way if we had unlimited time. Clean architecture, full test coverage, handles all edge cases. May be over-engineered for the actual need.

3. 🟣 **Pragmatic** — A balanced middle ground. Addresses the core problem well, maintainable code, reasonable scope. Often the best choice.

**From Codex (1 approach):**
4. 🟢 **Codex Design** — Independent architecture proposal from OpenAI Codex. May offer novel perspectives or catch things Claude missed.

**Then get human feedback:**
- Compare and contrast all four approaches
- Explain trade-offs (time, complexity, maintainability, risk)
- Note unique insights from each source
- Make a recommendation with rationale
- Ask the human which approach (or blend) to use
- Add `needs-feedback` tag and exit

### When to Skip Multi-Approach Analysis

**⚠️ "Skip multi-approach analysis" ≠ "Skip tech-design phase"**

You may proceed without presenting approaches if ALL of these are true:
- It's a small bug fix with an obvious, single-line or trivial fix
- There is genuinely only ONE reasonable approach (not three)
- No architectural decisions, new patterns, or design choices involved
- The fix is low-risk and easily reversible

**For features**: Always present three approaches.
**For bugs**: Present approaches if the fix touches >2-3 files or has multiple solutions.
**For refactors**: Always present three approaches.

When in doubt, research the approaches and ask. A 5-minute pause for human input beats hours of rework.

**"Skip multi-approach analysis" means:**
- ✅ Document the single obvious approach and move to implementation (without `needs-feedback` tag)
- ❌ It does NOT mean skip tech-design entirely
- ❌ It does NOT mean jump straight to final-review

**Even a trivial single-line bug fix:**
1. Gets a tech-design entry documenting the fix approach
2. Gets a spec commit
3. Moves to implementation (next iteration)
4. Then gets implemented (separate iteration)

---

## Definition of Done

- Dual design completed (Claude + Codex)
- Four approaches presented with clear source attribution (🟣 Claude / 🟢 Codex)
- Technical approach documented with rationale
- Decision section including which source was selected
- Files to create/modify listed
- Verification steps specified (specific commands)
- All unknowns resolved
- Spec committed

---

## Execution Steps

### Step 1: Read Card Context

```
Read the card's context (title, description, type, and Refinement section)
```

Review the Refinement section for:
- Functional requirements
- Acceptance criteria
- Edge cases
- Any answered questions in Conversation Log

### Step 2: Launch Architecture Agents (in parallel)

Launch Claude code-architect agents **and** Codex **in parallel**. Four independent perspectives: three from Claude (with different focuses) and one from Codex.

#### 2a: Start Codex Design (runs in background)

```bash
# Get context for Codex
REFINEMENT=$(cat << 'EOF'
{Refinement section from card}
EOF
)

codex exec "You are a software architect. Design an implementation approach for this task.

Task: {card.title}

Requirements:
$REFINEMENT

Provide a complete architecture design including:
1. Overview (2-3 sentences)
2. Files to create (table: file path, purpose)
3. Files to modify (table: file path, changes)
4. Key design decisions with rationale
5. Code sketch (key interfaces/signatures)
6. Trade-offs analysis (dev time, risk, maintainability, testability)
7. Implementation sequence (numbered steps)

Be specific about file paths. Show actual code sketches.
Format as markdown." \
  --full-auto \
  --output-last-message .agentflow/codex-architecture.txt \
  --sandbox read-only &

CODEX_PID=$!
echo "Codex architecture design started (PID: $CODEX_PID)"
```

#### 2b: Launch Claude Architect Agents (in parallel)

```
# Agent 1: Minimal Changes
Agent("code-architect")
> Task: {card.title}
> Requirements: {from Refinement section}
> Focus: MINIMAL CHANGES
> Design the smallest change that solves the problem.
> Maximize reuse of existing code and patterns.
> Prioritize: low risk, fast implementation, minimal footprint.
> Accept trade-offs: may not be the cleanest, may accumulate some tech debt.

# Agent 2: Clean Architecture
Agent("code-architect")
> Task: {card.title}
> Requirements: {from Refinement section}
> Focus: CLEAN ARCHITECTURE
> Design the "right" way if we had unlimited time.
> Prioritize: maintainability, elegant abstractions, full edge case handling.
> Accept trade-offs: may be more effort, could be over-engineered for the need.

# Agent 3: Pragmatic Balance
Agent("code-architect")
> Task: {card.title}
> Requirements: {from Refinement section}
> Focus: PRAGMATIC BALANCE
> Design a balanced approach: quality + reasonable scope.
> Prioritize: addresses core problem well, maintainable, ships soon.
> Accept trade-offs: may not be perfect, but good enough and sustainable.
```

#### 2c: Wait for Codex

```bash
wait $CODEX_PID
echo "Codex architecture design complete"
cat .agentflow/codex-architecture.txt
```

Each source (3 Claude agents + Codex) will independently:
- Analyze the problem through their specific lens
- Design an implementation approach
- List files to create/modify
- Identify risks and trade-offs

### Step 2d: Review and Synthesize

After all four designs complete:

1. **Review all approaches** — read each agent's output (including Codex)
2. **Form your opinion** — which fits best for THIS specific task? Consider:
   - Is this a small fix or large feature?
   - How urgent is it?
   - How complex is the problem?
   - What's the project's current state (early vs mature)?
3. **Note concrete differences** — where do the approaches actually diverge in implementation?
4. **Note Codex insights** — did Codex suggest anything the Claude agents missed?

### Step 3: Present Approaches for Human Feedback (Default)

**Default behavior — present to user and get feedback:**

1. **Brief summary of each approach** — 2-3 sentences capturing the essence
   - Approach 1: Minimal (Claude)
   - Approach 2: Clean Architecture (Claude)
   - Approach 3: Pragmatic (Claude)
   - Approach 4: Codex Design (🟢 clearly labeled as from Codex)
2. **Trade-offs comparison** — table or bullet list comparing key dimensions (all 4 approaches)
3. **Concrete implementation differences** — where do the approaches actually diverge?
   - Different files touched?
   - Different abstractions created?
   - Different levels of test coverage?
4. **Your recommendation with reasoning** — which approach fits THIS task and WHY
5. **Ask the user** which approach they prefer (or what blend)

**Important: Codex Attribution**
- Always label Codex's approach with 🟢 to distinguish it from Claude's approaches
- In the comparison table, mark the Source column (Claude vs Codex)
- When storing the final design, record which source was selected

Then:
- Post approaches to card **discussion** (not body — see backend docs)
- Add `needs-feedback` tag
- Exit this iteration — human will respond in discussion

**Important:** Proposed approaches are options, not decisions. Never put multiple approaches in the card body. The body only gets the final chosen design.

**Exception — skip to finalize (rare):**

Only skip presenting approaches if ALL of these are true:
- Trivial bug fix (single-line or <10 lines changed)
- Genuinely only ONE way to fix it
- Zero design decisions involved
- Low risk, easily reversible

If skipping, document why in the card context, then proceed to Step 5.

### Step 4: Human Responds (only if tagged)

This step happens outside the Ralph Loop:
1. Human reviews tech design options (in discussion)
2. Human responds in discussion:
   - Approves approach, OR
   - Selects from options, OR
   - Provides feedback
3. Human removes `needs-feedback` tag

Next Ralph iteration picks up the card and continues.

### Step 5: Finalize Design

1. Read human's decision from discussion (see backend docs for how)
2. **Now update the card body** with the chosen design only:
   - Add Tech Design section with the selected approach
   - Include Decision section noting which approach was chosen and why
   - Do NOT include unchosen approaches in the body
   - Do NOT include conversation in the body
3. Ensure documentation includes:
   - Files to create/modify
   - Implementation sequence
   - Verification steps (specific commands)
   - TDD plan

### Step 6: Create Spec Commit and Push

```bash
git add .
git commit -m "spec({type}): {title}"
git push -u origin HEAD
```

The `-u` flag sets upstream tracking for the branch.

Note: The `/af` command handles staging the appropriate files for the backend.

Examples:
- `spec(feature): add user authentication`
- `spec(bug): fix pagination offset`
- `spec(refactor): extract validation utils`

### Step 7: Update Card and Move

1. Append Tech Design section to card context (see template below)
2. Update History table
3. Move card to `implementation` column

---

## By Work Item Type

### Feature

**Focus:** How do we build this new functionality?
**Design Depth:** Medium to High

**Document:**
- Component architecture
- New interfaces/types
- Integration approach
- Data flow (if complex)
- Test strategy

### Bug

**Focus:** What went wrong? How do we fix it safely?
**Design Depth:** Low to Medium

**Document:**
- Root cause identification
- Fix approach
- Regression prevention
- Failing test case (often helpful to write before fixing)

### Refactor

**Focus:** How do we transform current state to desired state?
**Design Depth:** Medium to High

**Document:**
- Current state documentation
- Desired state specification
- Migration/transformation steps
- Behavior preservation verification

---

## Card Context Update

### If Human Input Needed (awaiting feedback)

**Post to discussion** (see backend docs for how):

```
Agent (YYYY-MM-DD): Tech Design Options

I've analyzed four approaches for this work item (3 from Claude + 1 from Codex).

## 🟣 Approach 1: Minimal (Claude)
{The smallest change that solves the problem}
- **Pros:** Quick to implement, low risk
- **Cons:** May accumulate tech debt
- **Complexity:** Low | **Risk:** Low

## 🟣 Approach 2: Clean Architecture (Claude)
{The "right" way if we had unlimited time}
- **Pros:** Handles all edge cases, easy to extend
- **Cons:** Significant effort, may be over-engineered
- **Complexity:** High | **Risk:** Medium

## 🟣 Approach 3: Pragmatic (Claude)
{Balanced middle ground}
- **Pros:** Addresses core problem well, maintainable
- **Cons:** {trade-off}
- **Complexity:** Medium | **Risk:** Low

## 🟢 Approach 4: Codex Design
{Codex's independent architecture proposal}
- **Pros:** {from Codex output}
- **Cons:** {from Codex output}
- **Complexity:** {assessment} | **Risk:** {assessment}

## Comparison
| Aspect | 🟣 Minimal | 🟣 Clean | 🟣 Pragmatic | 🟢 Codex |
|--------|------------|----------|--------------|----------|
| Source | Claude | Claude | Claude | Codex |
| Effort | Low | High | Medium | {assess} |
| Maintainability | Fair | Excellent | Good | {assess} |
| Edge cases | Partial | Full | Most | {assess} |
| Unique insights | - | - | - | {any novel ideas?} |

## Recommendation
I recommend **Approach {N}** ({source}) because {reasoning specific to this task}.

Which approach would you prefer? Or a blend?
```

**Attribution labels:**
- 🟣 **Claude** - purple circle for Claude's approaches
- 🟢 **Codex** - green circle for Codex's approach

**Do NOT update card body.** Proposed approaches belong in discussion until human selects one.

### If Complete (moving to implementation)

```markdown
---

## Tech Design
**Date:** {YYYY-MM-DD}
**Agent:** code-architect + Codex
**Status:** Complete

### Requirements Summary
**Must Have:**
- Requirement 1

**Constraints:**
- Constraint 1

### Decision
**Approaches Considered:**
1. 🟣 **Minimal** (Claude) — {brief summary}
2. 🟣 **Clean Architecture** (Claude) — {brief summary}
3. 🟣 **Pragmatic** (Claude) — {brief summary}
4. 🟢 **Codex Design** — {brief summary}

**Selected:** {Name} (Source: {Claude|Codex}) (or blend: "{description}")

**Rationale:** {Why this approach was chosen, including human's input}

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
| UI test | {scenario} | {expected behavior} |

**TDD Plan:**
- [ ] Write test for {scenario 1}
- [ ] Write test for {scenario 2}

### Spec Commit
**SHA:** `{sha}`
**Branch:** `{branch-name}`
**Date:** {YYYY-MM-DD}
```

**Note:** No Conversation Log in the body. The discussion about approach selection lives in the discussion area (see backend docs).

---

## Tag Handling

| Condition | Action |
|-----------|--------|
| Multiple viable approaches | Add `needs-feedback`, document options |
| Significant decision needed | Add `needs-feedback`, document recommendation |
| Human approved/selected | Remove `needs-feedback`, finalize design |
| External blocker | Add `blocked`, document reason |

---

## Entry Criteria

- Refinement phase complete
- Functional requirements documented
- No `needs-feedback` or `blocked` tag

---

## Exit Criteria

- Dual design completed (Claude + Codex)
- Technical design documented with source attribution
- Human approved approach (if feedback was needed)
- Decision section included with selected source (🟣 Claude or 🟢 Codex)
- Verification steps specified
- Spec committed
- Card moved to `implementation`

---

## Dual Design Philosophy

Two sources provide independent perspectives. Focus is on **finding the best approach**, not on which source wins.

**Why dual design?**
- Different models approach problems differently
- Codex may suggest patterns Claude wouldn't consider
- Independent analysis reduces blind spots
- Cross-checking validates good ideas

**What to look for in Codex's design:**
- Novel architectural patterns
- Different file organization
- Alternative abstractions
- Unique trade-off analysis

**Attribution matters:**
- 🟣 Purple = Claude's approaches
- 🟢 Green = Codex's approach
- Recording the source helps evaluate which model provides better architecture advice over time

---

## Important Notes

- **Do not implement in this phase** - only design and plan
- **Exception for bugs:** Writing a failing test is acceptable and encouraged
- **Be specific about verification** - vague plans lead to skipped verification
- **Junior developer test:** If a junior couldn't execute this plan, add more detail
- **Document the decision** - future readers should understand why
- **Always attribute the source** - helps track which model provides better architecture advice

---

## Next Column

> **Implementation**
