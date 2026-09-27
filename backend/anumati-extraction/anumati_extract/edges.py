"""Step 3 — the edge inferencer. The novelty claim, in about thirty lines.

If approval B's application form requires a document that approval A issues,
then A is a prerequisite of B — stated by the department's own form, not
assumed by us. That is a *documentary* edge, confidence 0.9.
"""
from __future__ import annotations

import re
from typing import Iterable, Mapping

from .schema import EDGE_CONFIDENCE, ProposedEdge

_STOP = re.compile(r"\b(copy of|certified|self[- ]attested|the|a|an|of|original)\b")


def normalise(name: str) -> str:
    s = name.lower()
    s = _STOP.sub(" ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def infer_documentary_edges(
    draft_id: str,
    required_documents: Iterable[str],
    issuers: Mapping[str, str],
) -> list[ProposedEdge]:
    """`issuers` maps a produced-document name to the approval id that issues it."""
    index = {normalise(doc): approval for doc, approval in issuers.items() if doc}
    edges: list[ProposedEdge] = []
    seen: set[str] = set()
    for doc in required_documents:
        # "NA order or MIDC lease particulars": either alternative satisfies it.
        for alt in re.split(r"\s+or\s+", doc, flags=re.I):
            source = index.get(normalise(alt))
            if not source or source == draft_id or source in seen:
                continue
            seen.add(source)
            edges.append(
                ProposedEdge(
                    from_approval_id=source,
                    edge_type="documentary",
                    confidence=EDGE_CONFIDENCE["documentary"],
                    rationale=f"The application form for {draft_id} requires '{alt.strip()}', which {source} issues.",
                    evidence_document=alt.strip(),
                )
            )
    return edges
