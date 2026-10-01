# Technical narration

Use the portions that fit the source. Preserve complete coverage within the requested scope; this guide helps translate technical structure into speech. It does not set a fixed outline for every recording.

## Code walkthroughs

Give the listener the structural context that a visible code listing normally supplies. Explain the function or component's purpose, its name, each input, its output, and what the caller does with the result. Introduce that information where it helps understanding, then follow execution in meaningful steps.

- Name the purpose of a group of operations before walking through it. Explain what changes and why the next step follows. Keep all behavior-bearing details, including configuration and setup when they affect use or reproduction.
- Follow one execution path to its outcome. Before explaining another branch, re-establish the relevant state and name the condition that changes. Cover each branch and its result, including early returns and failures.
- Preserve exact decision semantics: equality at a threshold, inclusive versus exclusive bounds, missing versus empty values, and exception versus ordinary return. Explain operators in words when that conveys their full meaning.
- For an object, give the meaning of each field and who consumes it. Group related fields without dropping them. For a loop, explain what repeats, what changes, and what ends it. For asynchronous work, explain what waits, what runs concurrently, and any ordering constraints present in the source.
- Cover side effects, state changes, retries, cleanup, and error handling where present. Carry source comments that explain intent into the walkthrough. Preserve literal strings, model or dependency versions, endpoints, and parameter values when they are part of the explanation or usable example.
- Translate punctuation, nesting, and boilerplate into their meaning. Do not recite every brace or replace a snippet with only its headline purpose. If exact syntax is the subject, read the relevant tokens precisely and explain what they do.

For example, consider a hypothetical function that returns an acceptance decision and its evidence:

> The function takes two inputs: the request being checked and the minimum confidence required to accept it. It returns a decision and the evidence for that decision.
>
> First, follow the accepted path. The confidence must be at least the threshold, so a value exactly equal to the threshold qualifies. When that condition holds, the function returns the accepted decision with its evidence.
>
> Now return to the same check with confidence below the threshold. The function returns the rejected decision with its evidence. Both paths return a result to the caller.

This example demonstrates orientation and an explicit branch reset. In a real script, use the source's actual inputs, field names, conditions, and complete outcomes.

## Solution designs and architecture

Introduce the problem, constraints, and component responsibilities. Explain a diagram by naming its components, boundaries, connections, and the meaning of its arrows or other notation. Trace a request, event, or data item through the relevant interactions, then cover the other paths and relationships. Make direction and ownership explicit.

Preserve the design's assumptions, alternatives, rationale, tradeoffs, failure behavior, operational constraints, and unresolved questions. Keep proposed behavior distinct from verified implementation. A concrete trace helps explain the design but does not replace details that the trace never reaches. Avoid inventing missing implementation decisions.

## Pull-request walkthroughs

When a PR guide is requested, use its source-grounded narrative and supporting diff. Retain the guide's scope, including the problem, previous behavior, changed behavior, implementation, cross-file relationships, tests, and limitations. Follow an order that lets the listener understand dependencies before details.

Introduce a file or symbol by its responsibility, then explain each included change and its consequences. Translate the meaningful code changes into complete spoken walkthroughs. Preserve reviewer concerns and the exact limits of verification; a passing type check does not establish a successful runtime interaction.

Complete coverage applies to the requested walkthrough or review scope. Do not silently reduce an already complete PR guide to highlights. An exhaustive diff readout is a separate scope that Andrew can request. Keep exact paths and identifiers in speech when they locate a change or distinguish related components.

## Technical numbers and comparisons

State the experiment or scenario before its results. Introduce each metric's meaning and units. Keep values attached to their condition names, including baselines. Preserve sample sizes, thresholds, denominators, versions, uncertainty, and caveats. Explain tables in a consistent row or column order, with enough repeated labels to keep the values identifiable.

Avoid implying that a confidence score, observed success rate, and acceptance threshold mean the same thing. Keep separate runs distinct. If the source presents inconsistent figures, flag the discrepancy without inventing a reconciliation.
