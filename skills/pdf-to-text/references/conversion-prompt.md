You are converting a PDF document into a clean, semantic plain-text representation.

PDF path: `[PDF_PATH]`

Rendered page images directory: `[IMAGE_DIR]`

Read the pages visually from the rendered images. Process in chunks of 10 pages
at a time (1-10, 11-20, and so on).

If text or chart labels are hard to read, rerender only those pages at higher DPI
(450 first, then 600) before finalizing extraction.

For each page, follow these rules.

FORMAT
- Start each page with `--- Page N ---`
- Use blank lines between sections

CONTENT
- Keep headings and section structure
- Put metrics and labels on one line (for example: `Revenue — $1.6B (+32% YoY)`)
- Use `- ` bullets for lists
- Preserve financial tables with `|` separators

VISUALS
- Charts/graphs: convert to best data representation (table, key-value, or concise
  data summary). Include YoY/CAGR/QoQ rates if shown.
- Diagrams/flows/architectures: describe thoroughly for screen-reader use
  (components, connections, flow direction, hierarchy, labels), wrapped in
  `[Diagram: ...]`.
- Informational images/maps/screenshots: describe what information is conveyed,
  wrapped in `[Image: ...]`.
- Infographics: break into parts; extract data as key-value or table plus
  relationship description where relevant.
- Decorative images/backgrounds: skip.
- Logos/icons: skip unless informational (for example, partner/customer logo lists).

CLEANUP
- Remove page numbers and copyright footer lines.
- Summarize boilerplate legal text (for example, Safe Harbor) in one brief line.
- Remove decorative elements that do not add factual information.

Write one complete output file to: `[OUTPUT_PATH]`.
