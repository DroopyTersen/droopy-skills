# Multiagent Guide Style Guide

This file captures guidance for writing sections of the multi-agent guide. It is a set of patterns and principles, not a rigid template. Each section can tailor its own structure based on the material.

## Ground Every Section in Real-World Practice

**This is the most important rule in this document.**

Before writing or editing any section of the guide, review how the relevant pattern was implemented in the reference project:

- **`~/code/core/nri-spark`** — Has the best SQL agent and delegated subagent patterns. Use it as the source of battle-tested implementations to generalize from.

### Rules for Using the Reference Implementation

- **Do not copy code directly.** Read the patterns, understand the design decisions, then generalize for the NATP scenario.
- **Never reference the project by name or path in the guide.** No "as done in nri-spark," no `/Users/drew/code/...` paths, no identifiers that only exist in that codebase.
- **Generalize identifiers.** If the reference calls something `createResourcingAgent`, the guide calls it `createLeadAgent`. Translate app-specific framings to the NATP scenario.

The goal is that a reader adopting this template gets a battle-tested pattern without needing access to the reference codebase or any knowledge of where the pattern came from.

## The NATP Running Example

Every section of this guide uses the same real-world scenario to ground explanations. The consistency lets readers build cumulative context across sections rather than learning a new scenario in each one.

### The Canonical User Turn

> *"I just had a call with NATP. What projects have we done with them in the past, and do we have any pre-sales artifacts already saved for this new tax agent project?"*

The user is a consultant at a professional services firm. NATP is a customer (National Association of Tax Professionals) with a new tax-agent project in pre-sales.

### The Fan-Out

Answering the prompt requires three data sources. The lead agent delegates in parallel to three subagents:

```
Lead Agent
├── SQL Subagent        → query project database for past NATP engagements
├── SharePoint Subagent → search pre-sales folder via Graph API for pitch decks and SOW drafts
└── Web Research Agent  → look up NATP's public announcements and recent news
```

The SQL subagent alone will make roughly **eight tool calls** across schema exploration, query attempts, retries, and joins. The other two subagents have their own iterative loops. Partial failure (for example, SharePoint Graph API timing out) is plausible and should be treated as a first-class outcome.

### How to Ground Each Artifact in NATP

| Artifact | NATP grounding |
|---|---|
| **Prose examples** | "When the NATP turn runs..." rather than abstract hypotheticals |
| **Mermaid diagrams** | Participants are `Client`, `API Layer`, `Lead Agent`, and the three NATP subagents by name |
| **Code snippets** | NATP tool names: `delegate_sql_research`, `delegate_sharepoint_research`, `delegate_web_research` |
| **Wire-format samples** | Tool-call IDs like `sql-1`, `sp-1`, `web-1`; trace IDs like `tr_7x2mn1` |
| **ASCII illustrations** | UI progress-card stacks show the three subagents side by side |

Reference sections that document an AI SDK primitive in isolation can use abstract examples. Once the primitive is placed in context, switch back to NATP.

## Use Illustrative Content Liberally

Walls of text are easy to write and hard to read. Break them up. Every few paragraphs of prose should be punctuated with something visual:

- A **code snippet** showing the pattern in action
- A **Mermaid diagram** for a flow or architecture view
- An **ASCII tree or illustration** for hierarchies, UI mockups, or before/after contrasts
- A **wire-format sample** showing what actually flows between layers

If a section runs more than two screens of continuous prose, that is a signal to add an illustration. A reader should be able to skim by scrolling through the visuals and still come away with the core ideas.

## Voice and Tone

- **Direct and concrete.** "The API Layer owns both the `start` and `finish` events," not "the start and finish events are owned by one authority."
- **Confident.** The guide documents a pattern that is known to work. Do not hedge with "might," "could," or "in some cases" unless the qualification matters.
- **Grounded in NATP.** Prefer "When the SharePoint subagent times out..." over "If a subagent times out..."
- **No hype.** Avoid "powerful," "elegant," "seamless," "magical," "robust," "cutting-edge."
- **Teach the decision, not just the mechanic.** When a non-obvious choice is made (e.g., `sendStart: false`), explain why and what would go wrong otherwise.

## Code Snippets

- Start each code block with a relative-path filename comment: `// app/chat/routes/api.chat.ts`. No absolute paths, no line-range annotations.
- Use the generic template identifiers (`createLeadAgent`, `UIMessage`, `UIMessageStreamWriter`, the three `delegate_*_research` tools, etc.). No codebase-specific identifiers from the reference implementation.
- Explain WHY in inline comments, not WHAT:
  ```typescript
  sendStart: false,   // API layer already emitted start with traceId
  ```
- Use `/* ... */` for omitted function bodies, `// ...` for trimmed list items, and `...` inside object literals.

## Mermaid Diagrams

- Use `sequenceDiagram` for temporal flows (how a turn unfolds over time). Keep to 3-4 participants. Canonical set: `Client`, `API Layer`, `Lead Agent`, `Delegation Tools`.
- Use `flowchart TB` with `subgraph` for static layered architecture (Client, API Layer, Agents, Persistence). Keep total nodes under ~15; split if larger.
- Use dotted arrows (`-.->`) for sideband or async paths (sideband events, trace writes).
- Name NATP subagents explicitly: `SQL Subagent`, `SharePoint Subagent`, `Web Subagent`.
- Follow a dense diagram with a short "Three things to notice:" paragraph so the reader takes away the key insights.

## ASCII Illustrations

ASCII is a first-class artifact. Use it when a Mermaid diagram would be overkill, when showing a before/after contrast, when mocking up the UI, or when showing tree-shaped information. Keep under ~20 lines.

Canonical patterns from the existing sections:

**Subagent delegation tree:**

```
Lead Agent
├── SQL Subagent        → query project database for past NATP engagements
├── SharePoint Subagent → search pre-sales folder via Graph API
└── Web Research Agent  → look up NATP's public announcements
```

**UI progress-card stack:**

```
▼ SQL Agent           [8 tool calls]  ✓ done
▼ SharePoint Agent    [2 tool calls]  ⚠ partial — Graph API timeout after 8s
▼ Web Research Agent  [3 tool calls]  ✓ done
```

**Propagation tree** (writer flow, trace inheritance):

```
API Layer creates SSE stream
    │
    └── passes writer to Lead Agent
            │
            ├── passes writer to delegate_sql_research
            │       └── SQL Subagent writes tool events via same writer
            ...
```

**Before/after contrast:**

```
Without remapping (collision):
  SQL subagent emits:        {"type":"tool-call","toolCallId":"tc_1",...}
  SharePoint subagent emits: {"type":"tool-call","toolCallId":"tc_1",...}
  → reducer sees two "tc_1" events → state corruption

With remapping:
  SQL subagent emits:        {"type":"tool-call","toolCallId":"sql_tc_1",...}
  SharePoint subagent emits: {"type":"tool-call","toolCallId":"sp_tc_1",...}
  → every event is unique → clean merge
```

**Trace hierarchy:**

```
Root trace: "NATP projects query"                  12.3s
  └── Lead Agent                                    2.1s
       └── delegate_research (tool call)
            ├── SQL Subagent                        6.1s
            ├── SharePoint Subagent                 4.2s
            └── Web Research Subagent               3.8s
```

## Wire-Format Samples

Show the reader what actually flows over the SSE connection.

**DevTools-style table** (representative slice of a full turn): columns are `Id`, `Type`, `Data`, `Time`. Show 10-20 rows with realistic synthetic IDs (`msg_0j3kp9`, `tr_7x2mn1`, `tc_0`, `sql-1`). Follow with a paragraph explaining how the UI reduces each event type.

**Simple event list** (focused slice): for showing a small number of related events without the full table context. Just the raw JSON on separate lines.

## Writing Style Notes

### Em Dashes

Do not use em dashes. Use a period, colon, comma, or parentheses instead. If an em dash feels like the only option, split the sentence into two. This applies to every file in the guide.

### Bold Emphasis

Bold the first appearance of a key term the reader will encounter repeatedly. Do not bold routine nouns. Do not bold inside code spans.

### Bullet Lists

- **Bold lead-ins** when each item is a named thing with a description
- **Plain bullets** when items are parallel facts or a checklist

### Avoid

- "In conclusion"
- "It's important to note"
- "As you can see"
- "This provides..."
- "Leverage" as a verb
- Exclamation points

## Cross-References

- Format for internal links: `[NN - Title](./NN-filename.md)` in Related Sections blocks, with a one-line hook after a colon.
- Use `→ See [Section Title](./NN-filename.md)` as a lightweight inline cross-reference when a topic deserves its own chapter but you want to keep the current section moving.
- Verify linked filenames exist. Broken links are a recurring drift point.
- External links only to resources the reader can actually access (AI SDK docs, public API documentation). No internal dashboards or private repos.
