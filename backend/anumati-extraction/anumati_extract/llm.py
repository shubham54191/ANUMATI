"""Step 2 — a local open-weight model reads each page into a fixed JSON shape.

Ollama serves the model on the same machine (IBM Granite 4.1, Apache 2.0, by
default). Nothing leaves the state's infrastructure and there is no per-call
fee. Temperature is 0 and the output is constrained by a JSON schema; anything
that still fails validation is dropped and logged, never repaired by guessing.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass

import requests
from pydantic import ValidationError

from .schema import LlmPage

log = logging.getLogger(__name__)

PROMPT = """You read Indian statutory text and government application forms.
From the page below, list every licence, registration, consent or approval it
creates or describes. For each, give only what the page itself states:
its name, the authority that grants it, the time limit in days for deciding it,
whether silence past a period counts as approval and the provision that says so,
the documents an applicant must submit, the document the approval itself issues,
the section number, and the exact sentence that states the time limit or requirement.
If the page does not state something, leave it null. Do not infer. Do not use
outside knowledge.

PAGE {page} OF {source}:
---
{text}
---"""


@dataclass
class OllamaClient:
    base_url: str = "http://localhost:11434"
    model: str = "granite4.1:8b"
    timeout: int = 600

    def extract_page(self, text: str, page: int, source: str) -> LlmPage:
        body = {
            "model": self.model,
            "stream": False,
            "options": {"temperature": 0},
            "format": LlmPage.model_json_schema(),
            "messages": [{"role": "user", "content": PROMPT.format(page=page, source=source, text=text[:12000])}],
        }
        for attempt in (1, 2):
            res = requests.post(f"{self.base_url}/api/chat", json=body, timeout=self.timeout)
            res.raise_for_status()
            content = res.json().get("message", {}).get("content", "")
            try:
                return LlmPage.model_validate(json.loads(content))
            except (json.JSONDecodeError, ValidationError) as exc:
                log.warning("page %s attempt %s: model output did not validate: %s", page, attempt, exc)
        return LlmPage(approvals=[])
