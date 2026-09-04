# Four implementation reviews

Run these after implementation and the first complete verification pass. Use four separate native sub-agents, independently and in parallel when supported. Each gets the requirements, approved plan and later decisions, actual branch changes against the correct base (including uncommitted implementation edits), repository instructions, and verification evidence.

Reviewers inspect code and report findings; the main agent owns edits, commits, and consolidation. Scope reviews to this branch and the directly relevant callers/contracts. Trace a concrete effect into surrounding code when necessary; do not audit unrelated untouched areas. Use native execution without model branding or nested CLI orchestration.

## 1. Thermo-nuclear code quality

Use `thermo-nuclear-code-quality-review` when available, scoped to this change. Apply these standards even if that skill is unavailable:

- Search hard for a restructuring that deletes complexity rather than redistributing it.
- Reduce cyclomatic complexity, nesting, scattered special cases, unnecessary modes, pass-through wrappers, casts, and unclear optionality.
- Preserve behavior while improving directness, cohesion, type contracts, and reuse of canonical code.
- Challenge file-size growth and loss of cohesion; splitting files or introducing helpers must actually simplify understanding, not merely satisfy a size threshold.
- Prefer fewer concepts and moving parts. Ambitious simplification is welcome when justified by the changed code; adding layers is not inherently cleaner.

## 2. Architecture of the changed code

Borrow the useful philosophy of `improve-codebase-architecture`; do not invoke its separate discovery, candidate-selection, documentation, or grilling process.

- A module is useful when it hides substantial implementation behind a small understandable interface. Include invariants, ordering, failure modes, and configuration in the interface's conceptual cost.
- Look for shallow modules and pass-through wrappers whose interfaces are almost as complex as their implementation.
- Apply the deletion test: would removing the module eliminate needless indirection or scatter necessary complexity across callers?
- A seam should represent a real variation or responsibility boundary, not a hypothetical future extension point.
- Keep related knowledge and changes together. Consolidate tightly coupled pieces when doing so makes the code simpler and easier to verify through its real interface.
- Respect established domain language and architectural decisions relevant to the changed area. Do not require new glossary or ADR files.

## 3. Requirements correctness

- Trace each acceptance criterion to implementation and meaningful verification evidence.
- Check intended user behavior, scope, preservation requirements, and approved decisions against the delivered behavior.
- Distinguish proven behavior from assumptions and untested claims.
- Identify missing requirements, incorrect interpretations, unintended behavior changes, and tests that only repeat their setup or implementation.

## 4. Bugs, security, and runtime behavior

- Inspect reachable logic errors, error handling, permissions/ownership, data integrity, state transitions, async ordering, and significant performance regressions.
- Consider realistic failure paths and changed external contracts, using code and runtime evidence.
- Identify missing regression coverage and misleading mocks or brittle assertions.
- Report a concrete trigger, evidence, impact, and fix. Do not invent extreme edge cases or pad the review with speculative findings.

## Consolidation and cleanup

Finish all useful reviews even after a critical finding. The main agent deduplicates and evaluates findings on their merits; reviewer agreement is not proof and a reviewer cannot grant merge permission.

Fix clear defects and justified simplifications. Use judgment for aggressive cleanup: implement it within scope when justified, or surface the decision to Andrew. Bugs, unmet requirements, and required verification failures block the initial Final Review handoff. Optional refactoring can wait for Andrew in clearly nonblocking PR feedback comments describing the suggestion, benefit, scope, and recommendation; link those comments from the card. Do not automatically create follow-up cards.

Document important finding resolutions and reasons for declining substantial suggestions. After cleanup, rerun the complete required verification plan, even when the changes seem small. Obtain focused follow-up review when fixes leave a concrete concern; do not impose an endless review quota.

If native sub-agents are unavailable, perform four separate review passes locally and disclose the lack of independent reviewers. Do not silently claim independent review occurred.
