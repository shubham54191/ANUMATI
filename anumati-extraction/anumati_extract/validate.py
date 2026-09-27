"""Step 4 — checks run before a draft is sent for review.

They do not block: a reviewer sees every draft. They flag, so the reviewer
reads the risky ones first.
"""
from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from .schema import ApprovalDraft


def find_cycle(edges: Iterable[tuple[str, str]]) -> list[str] | None:
    graph: dict[str, list[str]] = defaultdict(list)
    nodes: set[str] = set()
    for a, b in edges:
        graph[a].append(b)
        nodes.update((a, b))
    state: dict[str, int] = {}
    stack: list[str] = []

    def visit(n: str) -> list[str] | None:
        state[n] = 1
        stack.append(n)
        for m in graph[n]:
            if state.get(m) == 1:
                return stack[stack.index(m):] + [m]
            if state.get(m) is None:
                found = visit(m)
                if found:
                    return found
        stack.pop()
        state[n] = 2
        return None

    for n in sorted(nodes):
        if state.get(n) is None:
            found = visit(n)
            if found:
                return found
    return None


def flag_drafts(drafts: list[ApprovalDraft], existing_edges: list[tuple[str, str]]) -> list[ApprovalDraft]:
    """Attach flags: cycles, orphans, duplicate names, missing time limits, OCR pages."""
    names: dict[str, int] = defaultdict(int)
    for d in drafts:
        names[d.name.strip().lower()] += 1

    all_edges = list(existing_edges) + [(e.from_approval_id, d.approval_id) for d in drafts for e in d.proposed_edges]
    cycle = find_cycle(all_edges)

    out: list[ApprovalDraft] = []
    for d in drafts:
        flags = list(d.extraction.flags)
        if names[d.name.strip().lower()] > 1:
            flags.append("duplicate_name")
        if d.statutory_days == 0:
            flags.append("no_time_limit_stated")
        if not d.proposed_edges and not d.produces_document:
            flags.append("orphan")
        if cycle and d.approval_id in cycle:
            flags.append("cycle:" + "->".join(cycle))
        out.append(d.model_copy(update={"extraction": d.extraction.model_copy(update={"flags": sorted(set(flags))})}))
    return out
