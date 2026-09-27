"""python -m anumati_extract --pdf gazette.pdf --source-id WATER-ACT-1974 ... [--dry-run]"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys

import requests

from .llm import OllamaClient
from .parse import read_pdf
from .pipeline import Department, post_drafts, run
from .schema import Source


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Draft approval rules from a gazette or department form.")
    p.add_argument("--pdf", required=True)
    p.add_argument("--source-id", required=True, help="Stable id of the instrument, e.g. WATER-ACT-1974")
    p.add_argument("--source-title", default=None)
    p.add_argument("--source-url", required=True)
    p.add_argument("--section", default="(see page)")
    p.add_argument("--effective-from", required=True, help="YYYY-MM-DD")
    p.add_argument("--api", default=os.environ.get("ANUMATI_API", "http://localhost:4000"))
    p.add_argument("--ollama", default=os.environ.get("OLLAMA_URL", "http://localhost:11434"))
    p.add_argument("--model", default=os.environ.get("ANUMATI_MODEL", "granite4.1:8b"))
    p.add_argument("--id-prefix", default="X")
    p.add_argument("--dry-run", action="store_true", help="Print drafts; send nothing")
    args = p.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    rules = requests.get(f"{args.api}/v1/approvals", timeout=30).json()
    existing = rules["data"]
    existing_edges = [(d["from_approval_id"], d["to_approval_id"]) for d in rules.get("dependencies", [])]
    departments = {a["department_id"]: Department(a["department_id"], a["department_name"], a["department_short"]) for a in existing}

    pages = read_pdf(args.pdf)
    source = Source(
        document_id=args.source_id,
        title=args.source_title,
        section=args.section,
        url=args.source_url,
        effective_from=args.effective_from,
    )
    drafts = run(
        pages,
        source=source,
        client=OllamaClient(base_url=args.ollama, model=args.model),
        existing=existing,
        existing_edges=existing_edges,
        departments=list(departments.values()),
        id_prefix=args.id_prefix,
    )
    if args.dry_run:
        print(json.dumps([d.model_dump() for d in drafts], indent=2, ensure_ascii=False))
        return 0
    token = os.environ.get("EXTRACTION_TOKEN")
    if not token:
        print("EXTRACTION_TOKEN is not set.", file=sys.stderr)
        return 2
    print(json.dumps(post_drafts(args.api, token, drafts), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
