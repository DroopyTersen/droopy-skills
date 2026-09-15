---
name: print-md-document
description: Render Markdown files as formatted printable documents, especially compact paper-saving PDFs, and optionally send them to a local printer. Use when the user asks to print a .md file, preview formatted Markdown, convert Markdown to a printable PDF/DOCX, make a smaller-font or smaller-margin print version, save paper, or send a rendered Markdown document to a Brother or other CUPS printer.
---

# Print Markdown Document

Render Markdown as a formatted document before printing. Prefer PDF preview first when the user cares about layout, page count, font size, or paper usage.

## Default Workflow

1. Resolve the Markdown file path exactly.
2. Check available printers:

```bash
lpstat -p -d
```

3. Render a PDF. For paper-saving output, use the bundled script:

```bash
bash /Users/drew/.agents/skills/print-md-document/scripts/render-md-printable.sh "<file.md>" --open
```

4. If the user asked only to preview/show/open the document, stop after opening the PDF.
5. If the user explicitly asked to print, send the PDF with `lp`:

```bash
lp -d "<printer_name>" -t "<job title>" "<rendered.pdf>"
lpstat -W not-completed -o "<printer_name>"
```

Do not print when the user asks only to show, preview, convert, or inspect the PDF.

## Rendering Choices

- Use compact PDF by default for "save paper", "smaller font", "smaller margins", "scale down", "less pages", or similar requests.
- Use normal DOCX/PDF rendering when the user wants a more spacious document:

```bash
pandoc "<file.md>" --from markdown --standalone --output "/tmp/md-print/<name>.docx"
soffice --headless --convert-to pdf --outdir "/tmp/md-print" "/tmp/md-print/<name>.docx"
open "/tmp/md-print/<name>.pdf"
```

- The compact helper requires pandoc, Python 3, pdfinfo, and Chrome or Edge. It embeds local images, wraps wide code/table cells, and uses an isolated browser profile with bounded cleanup. It validates a new PDF before replacing the output.
- Use the compact helper when precise print CSS matters. It uses Letter paper, small margins, small type, and an 80% default zoom.

## Printer Policy

- If the user names a printer, use that printer.
- If no printer is named, use the CUPS default from `lpstat -d`.
- On this machine, `Brother_HL_2240_series` is a known Brother printer, but still verify it is present before printing.
- After submitting a job, relay the CUPS job id and whether it is still queued.

## Output Location

The helper writes to `/tmp/md-print/` by default. If the user wants a durable artifact in the repo, pass `--output "<path.pdf>"` or move the generated PDF after rendering.

## Helper Examples

Compact preview only:

```bash
bash /Users/drew/.agents/skills/print-md-document/scripts/render-md-printable.sh "project-planning/notes/example.md" --open
```

Compact PDF at a specific path:

```bash
bash /Users/drew/.agents/skills/print-md-document/scripts/render-md-printable.sh "notes/example.md" --output "/tmp/example-compact.pdf"
```

Even tighter output:

```bash
bash /Users/drew/.agents/skills/print-md-document/scripts/render-md-printable.sh "notes/example.md" --scale 0.72 --margin "0.22in 0.25in" --open
```
