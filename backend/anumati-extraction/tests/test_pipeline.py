import json
import os

import pytest
import requests

from anumati_extract.edges import infer_documentary_edges, normalise
from anumati_extract.llm import OllamaClient
from anumati_extract.parse import read_pdf
from anumati_extract.pipeline import Department, post_drafts, run, to_draft
from anumati_extract.schema import ApprovalDraft, LlmApproval, LlmPage, Source
from anumati_extract.validate import find_cycle, flag_drafts

SOURCE = Source(document_id="TEST-GAZETTE", section="r. 4", url="https://example.gov.in/g.pdf", effective_from="2026-09-01")
MPCB = Department("mpcb", "Maharashtra Pollution Control Board", "MPCB")


def gazette_pdf(tmp_path):
    from fpdf import FPDF

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=11)
    pdf.multi_cell(
        0,
        6,
        "Rule 4. Registration of refrigerant stock. Every cold storage unit shall apply to the "
        "Maharashtra Pollution Control Board for registration. The Board shall decide the application "
        "within thirty days. The application shall be accompanied by the Consent to Establish and a "
        "refrigerant inventory.",
    )
    path = tmp_path / "gazette.pdf"
    pdf.output(str(path))
    return path


def test_reads_a_digital_pdf_without_ocr(tmp_path):
    pages = read_pdf(gazette_pdf(tmp_path))
    assert len(pages) == 1
    assert pages[0].ocr is False
    assert "thirty days" in pages[0].text


def test_normalises_document_names():
    assert normalise("Certified copy of the Consent to Establish") == normalise("consent to establish")


def test_infers_a_documentary_edge_from_the_form():
    edges = infer_documentary_edges(
        "X01",
        ["Consent to Establish", "Refrigerant inventory"],
        {"Consent to Establish": "A15", "Refrigerant inventory": ""},
    )
    assert [(e.from_approval_id, e.edge_type, e.confidence) for e in edges] == [("A15", "documentary", 0.9)]


def test_either_alternative_satisfies_an_or_requirement():
    edges = infer_documentary_edges("X01", ["NA order or MIDC lease particulars"], {"MIDC lease particulars": "A05"})
    assert edges[0].from_approval_id == "A05"


def test_refuses_a_deeming_clause_without_its_provision():
    with pytest.raises(ValueError):
        ApprovalDraft(
            approval_id="X01", name="Thing", department_id="mpcb", department_name="MPCB", department_short="MPCB",
            stage="pre_establishment", statutory_days=30, deemed_exists=True, deemed_days=30,
            deemed_reference=None, source=SOURCE,
        )


def test_flags_a_quote_the_model_invented(tmp_path):
    page = read_pdf(gazette_pdf(tmp_path))[0]
    honest = LlmApproval(name="Refrigerant registration", authority="MPCB", time_limit_days=30, section="r. 4",
                         quote="The Board shall decide the application within thirty days.")
    invented = honest.model_copy(update={"quote": "Silence for fifteen days shall be deemed approval."})
    assert "quote_not_found_on_page" not in to_draft(honest, approval_id="X01", page=page, source=SOURCE, departments=[MPCB], model="t").extraction.flags
    assert "quote_not_found_on_page" in to_draft(invented, approval_id="X02", page=page, source=SOURCE, departments=[MPCB], model="t").extraction.flags


def test_never_grants_a_deeming_the_model_could_not_cite(tmp_path):
    page = read_pdf(gazette_pdf(tmp_path))[0]
    item = LlmApproval(name="Refrigerant registration", authority="MPCB", time_limit_days=30, deemed_approval=True, deemed_days=30,
                       deemed_provision=None, section="r. 4", quote="The Board shall decide")
    d = to_draft(item, approval_id="X01", page=page, source=SOURCE, departments=[MPCB], model="t")
    assert d.deemed_exists is False
    assert "deeming_claimed_without_provision" in d.extraction.flags


def test_finds_cycles():
    assert find_cycle([("A", "B"), ("B", "C"), ("C", "A")]) == ["A", "B", "C", "A"]
    assert find_cycle([("A", "B"), ("B", "C")]) is None


def test_runs_end_to_end_with_a_stubbed_model(tmp_path):
    pages = read_pdf(gazette_pdf(tmp_path))

    def fake_extract(text, page, source):
        return LlmPage(approvals=[LlmApproval(
            name="Refrigerant stock registration", authority="Maharashtra Pollution Control Board",
            time_limit_days=30, section="r. 4", documents_required=["Consent to Establish", "Refrigerant inventory"],
            document_issued="Refrigerant registration", quote="The Board shall decide the application within thirty days.",
        )])

    drafts = run(
        pages, source=SOURCE, client=OllamaClient(model="stub"),
        existing=[{"id": "A15", "produces_document": "Consent to Establish"}],
        existing_edges=[], departments=[MPCB], extract=fake_extract,
    )
    assert len(drafts) == 1
    d = drafts[0]
    assert d.department_id == "mpcb"
    assert d.statutory_days == 30
    assert [e.from_approval_id for e in d.proposed_edges] == ["A15"]
    assert d.extraction.page == 1


def test_asks_ollama_for_schema_constrained_output_at_temperature_zero(monkeypatch):
    seen = {}

    class R:
        def raise_for_status(self):
            pass

        def json(self):
            return {"message": {"content": json.dumps({"approvals": []})}}

    def fake_post(url, json=None, timeout=None):
        seen.update(url=url, body=json)
        return R()

    monkeypatch.setattr(requests, "post", fake_post)
    OllamaClient().extract_page("text", 1, "SRC")
    assert seen["url"].endswith("/api/chat")
    assert seen["body"]["options"]["temperature"] == 0
    assert seen["body"]["format"]["type"] == "object"


API = os.environ.get("ANUMATI_API")
TOKEN = os.environ.get("EXTRACTION_TOKEN")


@pytest.mark.skipif(not (API and TOKEN), reason="needs a running ANUMATI API and EXTRACTION_TOKEN")
def test_posts_drafts_into_the_review_queue(tmp_path):
    pages = read_pdf(gazette_pdf(tmp_path))
    rules = requests.get(f"{API}/v1/approvals", timeout=10).json()

    def fake_extract(text, page, source):
        return LlmPage(approvals=[LlmApproval(
            name="Refrigerant stock registration", authority="Maharashtra Pollution Control Board",
            time_limit_days=30, section="r. 4", documents_required=["Consent to Establish"],
            quote="The Board shall decide the application within thirty days.",
        )])

    drafts = run(pages, source=SOURCE, client=OllamaClient(model="stub"), existing=rules["data"],
                 existing_edges=[], departments=[MPCB], id_prefix="T", extract=fake_extract)
    out = post_drafts(API, TOKEN, drafts)
    assert out and "version" in out[0], out
