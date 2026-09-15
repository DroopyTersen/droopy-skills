---
name: read-remarkable
description: Read Andrew's saved reMarkable documents, PDF highlights, handwritten feedback, notebooks, or live screen share. Use for “check my annotations,” “read my notes,” or “look at what I'm drawing” on reMarkable.
---

# Read reMarkable

Resolve the document and requested scope from the conversation or a fresh library listing. Ask only when the target is genuinely unclear. A reading request authorizes retrieving that content through existing authenticated access. Preserve documents and annotations; reading feedback alone does not authorize implementing code changes or editing tablet content.

## Choose the source

- **Saved annotations, notes, or a named document:** prefer a fresh device PDF export when USB is connected. Use the signed-in cloud document viewer when unplugged or when browser viewing is sufficient. No live screen share is required.
- **Current drawing or current screen:** use the live stream at `https://app.remarkable.com/screenshare` in authenticated **Chrome**. Reuse an existing tab. If inactive, ask Andrew to choose **Share Screen** on the tablet, then check again. Capture a fresh screenshot for every current-content request; the accessibility tree alone may only expose an image container.

## Retrieve saved content

USB web interface is `http://10.11.99.1/`. List `/documents/` or `/documents/<folder-id>` and match `VissibleName`, `ID`, and `Type`. Verify the exact document against a fresh listing; never reuse a sample document ID from instructions. The currently verified native export is:

```bash
curl --noproxy '*' --fail --show-error --max-time 120 \
  'http://10.11.99.1/download/<verified-document-id>/pdf' \
  --output '/absolute/document-annotated.pdf'
pdfinfo '/absolute/document-annotated.pdf'
```

This endpoint produced the tablet-rendered MetaGPT PDF with its real highlights and handwriting during setup. Its export had 29 pages; physical page 10 matched the tablet view. Reverify content on each retrieval, and recheck the tablet's served app if an update changes endpoints. Confirm notebook export behavior with the requested notebook rather than assuming PDF acceptance proves every notebook format.

For cloud access, `~/.local/bin/rmapi -ni -json ls /` (or `find /`) provides fresh names and IDs without interactive login. Use authenticated Chrome's My files/document viewer to open the selected result and inspect the requested pages. The ordinary cloud document viewer was verified to display the same synced highlights and handwriting without screen share. Cloud content can lag an offline tablet; report this boundary rather than calling it current device state. Prefer a native browser PDF download if offered and verify its marks. `rmapi get` supplies document assets; upstream `geta` has limited annotation rendering, so do not assume its output matches the tablet's export. Never print authentication files, codes, or tokens.

## Read and report feedback

Use the **PDF** skill to render exported pages and inspect actual pixels. Page 10 of the verified export had no structured PDF `/Annots`, and its handwriting was absent from extracted text: visual reading was necessary. Do not use text extraction alone to conclude there are no annotations. Capture sufficient resolution for handwriting, zoom or crop when useful, and retain a usable local export.

Cover the requested scope. If asked to check all annotations, inspect all pages (contact sheets can locate marks, followed by detailed views); do not infer whole-document coverage from one page. Distinguish physical PDF page number from a printed page label where they differ.

Summarize feedback by **page and passage**, **visible mark or handwriting**, and **interpretation**. Separate uncertain transcription from your interpretation; don't invent illegible words. Show the relevant image when useful or requested. State whether evidence came from a fresh device export, synced cloud viewer, or live stream, and identify pages not inspected. No daemon or background capture is needed.
