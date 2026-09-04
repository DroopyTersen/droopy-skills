# Local JSON board

Use only when `.agentflow/board.json` is the configured provider or Andrew explicitly selected it. Preserve the existing schema and unrelated items.

- The board stores `columns` and a `cards` array. Each card has a unique `id`, `title`, and `column`; retain existing metadata such as tags, timestamps, and type without requiring it for new raw ideas.
- Card bodies live in `.agentflow/cards/{id}.md`. This file is the local provider's item body, not an additional spec artifact. Store current requirements, plan, evidence, and verification there.
- Create cards only on request or approval, in New unless explicitly directed to Approved. Generate an unused ID. Do not require a type, priority, or complete description.
- Use the board UI's order when available. With no UI ordering metadata, the relative order of cards in the array defines the local board order; preserve it on unrelated edits.
- Move cards by updating `column`; update existing timestamps when appropriate. Read immediately before writing, preserve other cards, and verify the result.
- Keep dependencies as explicit card references, respecting any existing dependency field/schema.
- If the local provider has no comment storage, use brief dated decision/approval notes on the item body. Do not add embedded history tables or invent a new comment subsystem.

Stage behavior and authorization come from [core.md](core.md) and the current stage reference, not a JSON-specific execution loop.
