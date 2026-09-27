# anumati-extraction

Offline pipeline that reads a notified instrument (gazette, Act, department form) and
proposes approval rules for the ANUMATI rule base. **It only ever drafts.** Every draft
lands in the Rule review queue, and a named reviewer publishes or rejects it with a note.
It runs on a machine with a local model; it is never in a request path.

```
PDF ──pdfplumber (OCR fallback: tesseract)──▶ pages
    ──local model via Ollama (JSON, schema-checked)──▶ approvals per page
    ──pydantic validation──▶ drafts (invalid ones are dropped and logged, not "fixed")
    ──documentary edges (produces X ▶ requires X)──▶ proposed dependencies
    ──flags (duplicate name, no time limit stated, orphan, cycle, OCR page)──▶
    POST /v1/rules/drafts  (EXTRACTION_TOKEN)
```

## Run

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
ollama pull granite4.1:8b            # or any local model; --model to choose

# See what it would propose, send nothing
python -m anumati_extract --pdf water-act.pdf --source-id WATER-ACT-1974 \
  --source-url https://example.gov.in/water-act.pdf --effective-from 1974-03-23 --dry-run

# Send drafts to the review queue
export EXTRACTION_TOKEN=...          # same value as the server's EXTRACTION_TOKEN
python -m anumati_extract --pdf water-act.pdf --source-id WATER-ACT-1974 \
  --source-url https://example.gov.in/water-act.pdf --effective-from 1974-03-23 \
  --api http://localhost:4000
```

## Limits, stated plainly

- A model reading a statute gets things wrong. Every number it proposes carries its page and
  the excerpt it came from so a reviewer can check it against the source in seconds; nothing
  it proposes is used until a person publishes it.
- Only **documentary** edges are inferred automatically. Statutory and practice dependencies
  are proposed by the reviewer, because they need judgement the text alone does not give.
- Scanned PDFs depend on OCR quality; the confidence score drops accordingly.

## Tests

```bash
pip install -r requirements-dev.txt
python -m pytest -q                  # no model needed — the client is stubbed
```
