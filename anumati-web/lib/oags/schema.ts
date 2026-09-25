/**
 * The Open Approval Graph Schema, v0.1.
 *
 * The /standard page cites this file by name, so it exists as one object rather
 * than as prose about an object: the page, the export endpoint and the
 * validator all read from here, and a change to the schema cannot leave any of
 * them describing a different shape.
 *
 * Plain JSON Schema draft 2020-12, no dialect extensions, so another state can
 * feed it to whatever validator they already run.
 */

export const OAGS_VERSION = "0.1";
export const OAGS_SCHEMA_ID = "https://anumati.dev/oags/v0.1/approval-graph.schema.json";

const SOURCE_REF = {
  type: "object",
  description:
    "Where a rule comes from. A rule without a source cannot be checked, so all three fields are required.",
  required: ["document_id", "section", "url"],
  additionalProperties: true,
  properties: {
    document_id: { type: "string", minLength: 1, examples: ["MRTP-ACT-1966"] },
    section: { type: "string", minLength: 1, examples: ["s. 45(5)"] },
    url: { type: "string", format: "uri", minLength: 1 },
    effective_from: { type: ["string", "null"], format: "date" },
    effective_to: { type: ["string", "null"], format: "date" },
  },
} as const;

export const OAGS_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: OAGS_SCHEMA_ID,
  title: "Open Approval Graph Schema",
  version: OAGS_VERSION,
  description:
    "Approvals, their statutory timelines, and the typed dependencies between them, each carrying the provision it comes from and how sure the publisher is of it.",
  type: "object",
  required: ["oags_version", "jurisdiction", "approvals", "dependencies"],
  additionalProperties: true,
  properties: {
    oags_version: { const: OAGS_VERSION },
    jurisdiction: {
      type: "object",
      required: ["country", "state"],
      properties: {
        country: { type: "string", minLength: 1 },
        state: { type: "string", minLength: 1 },
        sector: { type: ["string", "null"] },
      },
    },
    rules_version: { type: "string" },
    rules_as_of: { type: "string", format: "date" },
    licence: { type: "string", examples: ["CC-BY-4.0"] },

    approvals: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "name", "department_short", "statutory_days", "source"],
        additionalProperties: true,
        properties: {
          id: { type: "string", pattern: "^[A-Za-z0-9_.-]+$" },
          name: { type: "string", minLength: 1 },
          department_id: { type: "string" },
          department_name: { type: "string" },
          department_short: { type: "string", minLength: 1 },
          stage: { enum: ["pre_establishment", "pre_operation"] },

          statutory_days: { type: "integer", minimum: 0, maximum: 3650 },

          // Deeming is a power of the parent statute. A publisher that claims
          // one has to name the provision that grants it; the validator
          // enforces the pairing, not just the presence of the flag.
          deemed_exists: { type: "boolean" },
          deemed_days: { type: ["integer", "null"], minimum: 0 },
          deemed_reference: { type: ["string", "null"] },

          required_documents: { type: "array", items: { type: "string" } },
          produces_document: { type: ["string", "null"] },
          conditional_on: { type: ["string", "null"] },

          confidence: { type: "number", minimum: 0, maximum: 1 },
          review_status: { enum: ["draft", "in_review", "published"] },
          source: SOURCE_REF,
        },
      },
    },

    dependencies: {
      type: "array",
      items: {
        type: "object",
        required: ["from_approval_id", "to_approval_id", "edge_type", "confidence", "source"],
        additionalProperties: true,
        properties: {
          from_approval_id: { type: "string", minLength: 1 },
          to_approval_id: { type: "string", minLength: 1 },

          // The part nobody else writes down: what kind of thing makes one
          // approval wait on another.
          edge_type: {
            enum: ["statutory", "documentary", "physical", "practice"],
            description:
              "statutory: the law orders it. documentary: one produces a paper the other requires. physical: the work cannot happen in the other order. practice: neither, it is how the office runs.",
          },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          rationale: { type: "string" },
          evidence_document: { type: ["string", "null"] },
          condition: { type: ["string", "null"] },
          source: SOURCE_REF,
        },
      },
    },
  },
} as const;
