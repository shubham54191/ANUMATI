"""The shape of a draft rule — the same one the API's /v1/rules/drafts accepts.

A draft without a citation cannot be built: `source` is required, and so is a
section. That mirrors the database constraint on the server side.
"""
from __future__ import annotations

import re
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

EdgeType = Literal["statutory", "documentary", "physical", "practice"]

# The confidence each edge type is given, as the product states it.
EDGE_CONFIDENCE: dict[str, float] = {
    "statutory": 1.0,
    "documentary": 0.9,
    "physical": 1.0,
    "practice": 0.5,
}


class Source(BaseModel):
    document_id: str = Field(min_length=2, max_length=80)
    title: Optional[str] = None
    section: str = Field(min_length=1, max_length=120)
    url: str
    effective_from: str

    @field_validator("effective_from")
    @classmethod
    def iso_date(cls, v: str) -> str:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
            raise ValueError("effective_from must be YYYY-MM-DD")
        return v


class Extraction(BaseModel):
    page: Optional[int] = None
    excerpt: Optional[str] = Field(default=None, max_length=4000)
    model: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    flags: list[str] = Field(default_factory=list)


class ProposedEdge(BaseModel):
    from_approval_id: str
    edge_type: EdgeType
    confidence: float = Field(gt=0, le=1)
    rationale: str = Field(min_length=5, max_length=1000)
    evidence_document: Optional[str] = None


class ApprovalDraft(BaseModel):
    approval_id: str = Field(pattern=r"^[A-Z][A-Z0-9-]{1,15}$")
    name: str = Field(min_length=3, max_length=200)
    department_id: str
    department_name: str
    department_short: str
    stage: Literal["pre_establishment", "pre_operation"]
    statutory_days: int = Field(ge=0, le=3650)
    deemed_exists: bool
    deemed_days: Optional[int] = Field(default=None, ge=1, le=3650)
    deemed_reference: Optional[str] = None
    required_documents: list[str] = Field(default_factory=list)
    produces_document: Optional[str] = None
    conditional_on: Optional[str] = None
    source: Source
    extraction: Extraction = Field(default_factory=Extraction)
    proposed_edges: list[ProposedEdge] = Field(default_factory=list)

    @model_validator(mode="after")
    def deeming_needs_its_provision(self) -> "ApprovalDraft":
        # The most dangerous thing a rule can claim is that silence grants a
        # clearance. It is refused unless the provision that says so is named.
        if self.deemed_exists and (self.deemed_days is None or not self.deemed_reference):
            raise ValueError("a deeming clause needs its period and the provision that grants it")
        return self


class LlmApproval(BaseModel):
    """What the model is asked to return for one clearance found on a page.

    Deliberately narrower than ApprovalDraft: the model reads text, it does not
    decide ids, departments' canonical codes or which edges exist.
    """

    name: str
    authority: str
    time_limit_days: Optional[int] = None
    deemed_approval: bool = False
    deemed_days: Optional[int] = None
    deemed_provision: Optional[str] = None
    documents_required: list[str] = Field(default_factory=list)
    document_issued: Optional[str] = None
    section: str
    quote: str = Field(description="The sentence on the page that states the time limit or requirement.")


class LlmPage(BaseModel):
    approvals: list[LlmApproval] = Field(default_factory=list)
