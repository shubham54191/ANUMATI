"""The whole run: PDF → pages → model → drafts → edges → flags → review queue."""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Callable, Optional

import requests
from pydantic import ValidationError

from .edges import infer_documentary_edges
from .llm import OllamaClient
from .parse import Page
from .schema import ApprovalDraft, Extraction, LlmApproval, LlmPage, Source
from .validate import flag_drafts

log = logging.getLogger(__name__)


@dataclass
class Department:
    id: str
    name: str
    short: str


def _department_for(authority: str, known: list[Department]) -> Department:
    a = authority.lower()
    for d in known:
        if d.short.lower() in a or d.name.lower() in a:
            return d
    slug = re.sub(r"[^a-z0-9]+", "-", a).strip("-")[:30] or "unknown"
    return Department(slug, authority.strip()[:200], authority.strip()[:40].upper())


def to_draft(
    item: LlmApproval,
    *,
    approval_id: str,
    page: Page,
    source: Source,
    departments: list[Department],
    model: str,
    stage: str = "pre_establishment",
) -> ApprovalDraft:
    dept = _department_for(item.authority, departments)
    flags = ["ocr_page"] if page.ocr else []
    if item.quote and item.quote.strip()[:40].lower() not in page.text.lower():
        # The model's "quote" is not on the page. Keep the draft, but say so loudly.
        flags.append("quote_not_found_on_page")
    deemed = bool(item.deemed_approval and item.deemed_days and item.deemed_provision)
    if item.deemed_approval and not deemed:
        flags.append("deeming_claimed_without_provision")
    return ApprovalDraft(
        approval_id=approval_id,
        name=item.name.strip()[:200],
        department_id=dept.id,
        department_name=dept.name,
        department_short=dept.short,
        stage=stage,  # type: ignore[arg-type]
        statutory_days=max(0, item.time_limit_days or 0),
        deemed_exists=deemed,
        deemed_days=item.deemed_days if deemed else None,
        deemed_reference=item.deemed_provision if deemed else None,
        required_documents=[d.strip() for d in item.documents_required if d.strip()][:80],
        produces_document=(item.document_issued or None),
        source=source.model_copy(update={"section": item.section or source.section}),
        extraction=Extraction(page=page.number, excerpt=(item.quote or "")[:4000], model=model, confidence=0.7, flags=flags),
    )


def run(
    pages: list[Page],
    *,
    source: Source,
    client: OllamaClient,
    existing: list[dict],
    existing_edges: list[tuple[str, str]],
    departments: list[Department],
    id_prefix: str = "X",
    extract: Optional[Callable[[str, int, str], LlmPage]] = None,
) -> list[ApprovalDraft]:
    """`existing` is the published rule base (from GET /v1/approvals)."""
    extract = extract or client.extract_page
    drafts: list[ApprovalDraft] = []
    n = 0
    for page in pages:
        for item in extract(page.text, page.number, source.document_id).approvals:
            n += 1
            try:
                drafts.append(
                    to_draft(item, approval_id=f"{id_prefix}{n:02d}", page=page, source=source, departments=departments, model=client.model)
                )
            except ValidationError as exc:
                # Dropped and logged, never patched up by guessing.
                log.warning("page %s item %s dropped: %s", page.number, n, exc.errors()[0].get("msg"))

    issuers = {a["produces_document"]: a["id"] for a in existing if a.get("produces_document")}
    issuers.update({d.produces_document: d.approval_id for d in drafts if d.produces_document})
    with_edges = [
        d.model_copy(update={"proposed_edges": infer_documentary_edges(d.approval_id, d.required_documents, issuers)})
        for d in drafts
    ]
    return flag_drafts(with_edges, existing_edges)


def post_drafts(api: str, token: str, drafts: list[ApprovalDraft]) -> list[dict]:
    """Send every draft to the review queue. None of them is live until a person publishes it."""
    out = []
    for d in drafts:
        res = requests.post(
            f"{api}/v1/rules/drafts",
            json=d.model_dump(),
            headers={"authorization": f"Bearer {token}"},
            timeout=30,
        )
        if res.status_code >= 400:
            log.error("draft %s refused: %s %s", d.approval_id, res.status_code, res.text[:300])
            out.append({"approval_id": d.approval_id, "error": res.status_code})
        else:
            out.append(res.json())
    return out
