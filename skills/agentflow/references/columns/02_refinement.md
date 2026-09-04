# Refinement

Clarify what should happen and gather the evidence needed to design the change. The column also signals that the card has been claimed.

If the existing requirements and evidence are already sufficient, review them and move forward without writing a ceremonial Refinement section. Otherwise explore deeply: relevant implementation, callers, data flow, related tests, established patterns, and available issue, PR, trace, or runtime evidence. Stop when the current behavior, likely change surface, and important constraints are understood. Do the work directly; no named explorer agent is required.

Infer collaboration versus autonomy from the kickoff, as described in [core.md](../core.md). Resolve factual questions through research. Ask Andrew only about material decisions that research and his instructions do not settle. Leave the card here with a short pending-decision note when needed; no feedback-tag loop is required.

Update the body with useful information only:

- Goal or problem and relevant current behavior/evidence.
- Observable acceptance criteria.
- Scope and non-goals when they prevent confusion.
- A short table: `File or area | Why it matters`, covering important entry points, execution paths, tests, and patterns for the next worker.
- Bug reproduction steps or refactor behavior-preservation requirements when applicable.
- Likely or high-impact failure cases, without speculative extreme-edge requirements.
- Verification scenarios and commands when already apparent. A complete verification plan is required by the end of Tech Design, not necessarily here.

Reproduce bugs when feasible. Strong trace, log, test, or execution-path evidence can substitute for difficult or intermittent reproduction; record what is proven and what remains uncertain.

Preserve durable evidence while rewriting stale content. Once requirements and material decisions are clear, move to [Tech Design](03_tech-design.md) without asking for another stage-transition approval. An obvious localized fix may proceed to Implementation under the Tech Design exception.
