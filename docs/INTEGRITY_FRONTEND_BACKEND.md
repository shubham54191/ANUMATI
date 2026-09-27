# Document integrity and per-department scope — where it lives, what the backend owes

| | |
|---|---|
| Covers | The two "protections": the applicant cannot fake an approval seal, and one department's approval never clears another department's parameters |
| Status | **Frontend is built.** Backend is not. |
| Written | 26 Sep 2026 |

---

## 0. Read this first: four claims in the original write-up are wrong

The text this spec came from over-claims. Do not put these on a slide or in the
README, because a technical judge will take them apart in Q&A.

| Original claim | What is actually true |
|---|---|
| "The system **encrypts** the hash with the private key… the **decryption** will fail" | You **sign** a hash and **verify** a signature. Signing is not encryption. Saying "encrypt with the private key" is the tell that the author has not implemented this. |
| "Private key **hardcoded** into the government server" | Never. A hardcoded key means anyone with server access forges every department's seal. The key stays on the officer's DSC token, or in a department HSM. The signature must be the officer's act, not the server's. |
| "**Mathematically impossible to fake**" (implying the document is genuine) | The seal proves exactly two things: **this exact file** was approved, and **by this officer**. It proves nothing about whether the content is true. A forged third-party NOC uploaded as a PDF still hashes fine. |
| "How the **Water Department catches it**" | It does not catch it. In that scenario the missing emergency exit is a fire and building issue; the Water officer reviews water and will not see it. Scope isolation stops a bad approval from **spreading** into other domains. It does not **detect** the bad approval. |

Two more to drop: "Context-Isolated Authorization Scopes (Granular Tokenization)"
is jargon — call it **field-level verification ownership**. And "flashing
amber/red" reads as a gimmick; plain status labels read as serious.

What actually catches a bribed or careless officer is elsewhere in the product:
rule-based pre-validation, cross-form mismatch detection, risk-based scrutiny
forcing a full inspection, joint random inspection under MAITRI Act s. 16, and
the signed audit trail making the decision non-repudiable.

---

## 1. Frontend — already built, and where to find it

Nothing below needs to be written. It needs to be **found**, because it sits in
a tab most people never open.

### 1.1 Parameter ownership — officer console

| | |
|---|---|
| File | `components/matrix/ParameterScope.tsx` |
| Route | `/matrix` → right rail → **Scope** tab |
| Data | `ApplicationFile.parameters: ParameterGroup[]` in `types/matrix.ts` |
| Action | `useMatrixStore().verifyParameters(deptId)` |

What it shows: a **READING AS** switcher across the departments on the file
(MIDC · MPCB · FIRE · LABOUR), then every parameter group in one of three
states.

| State | Reads as | Meaning |
|---|---|---|
| Verified | green, "Verified by MIDC, day 0 · signed" | That department cleared its own parameters and the clearance is signed |
| Yours, unverified | blue, "Unverified — your review" | You own these and nobody has cleared them. This is the state the whole feature exists for |
| Someone else's | neutral, "Owned by MPCB · not yet verified" | Context on your screen, never clearance for your decision |

Expanding a row shows the actual field values the officer would read off the
form, plus `signature_ref` when the group is signed.

The footer is the honest line, and it must stay:

> Signed with the officer's own DSC in a deployment. Mocked here — this build
> holds no keys and signs nothing.

### 1.2 Provenance and evidence — applicant side

| File | Shows |
|---|---|
| `components/roadmap/ProvenanceBlock.tsx` | Which provision the rule came from, its version, who checked it |
| `components/roadmap/EvidenceBlock.tsx` | Field reports behind an observed day count |
| `components/roadmap/ApprovalDetailPanel.tsx` → **Version history** | Rule version, review status, confidence, provision and section, in-force dates, who checked it and when, and whether a review is open |

### 1.3 Cross-form mismatch — the thing that actually detects

| File | Shows |
|---|---|
| `components/precheck/ReadinessList.tsx` | "Connected load declared as 1250 kVA on A11, 1600 kVA on A22 — correct one of the forms so both departments see the same figure" |
| `components/matrix/DataMatrixPanel.tsx` | A fetched record that contradicts the file, marked FLAGGED |

This is the honest answer to "what if an officer approves a bad file". Not
cryptography — arithmetic on two forms that disagree.

### 1.4 What was deliberately not built

Real DSC/PKI signing. No keys are generated, held, or used anywhere in this
build. `signature_ref` is an opaque string. Say "integrates with the officer's
existing DSC", never "we sign documents".

---

## 2. Backend — what it owes, none of it built yet

Everything above runs on seeded client-side data. A deployment needs these.

### 2.1 Parameter ownership

```
GET  /v1/applications/{id}/parameters
     -> ParameterGroup[]  (id, label, fields[], owner_dept, owner_short,
                           verified_by_dept, verified_on_day, signature_ref)

POST /v1/applications/{id}/parameters/{groupId}/verify
     body   { dept_id, officer_id }
     effect sets verified_by_dept, verified_on_day, signature_ref
     rule   REJECT unless dept_id === group.owner_dept
```

That last rule is the whole feature. It belongs on the server, not in the UI.
A UI that greys out a button is a convenience; a server that refuses the write
is the control. Today only the UI enforces it.

### 2.2 Signing

```
POST /v1/sign
     body   { document_hash, approval_id, officer_id }
     does   sends the hash to the officer's DSC token or the department HSM
     gets   back a detached signature
     stores { approval_id, document_hash, signature, cert_serial, signed_at }
     never  holds a private key itself
```

Verification is a pure function of `(document_bytes, signature, cert)` and can
run anywhere, including the client.

Legal basis to cite: **IT Act 2000 s. 3** (authentication by digital signature)
and **s. 5** (legal recognition of digital signatures).

### 2.3 Prior approvals must not come from applicant uploads

This is the real fix for "what if the applicant fakes the seal", and it is a
backend decision, not a UI one.

| Source | Trust |
|---|---|
| MAITRI record, DigiLocker issued document, department's own signed output | Accepted as a prerequisite |
| A PDF the applicant uploaded | Accepted as a **document**, never as a **prerequisite approval** |

Pre-validation (`lib/compliance/prevalidate.ts`) should refuse any prerequisite
that arrives as a plain upload with no verifiable signature. Today it checks
presence, not provenance.

### 2.4 Audit

Every verify and every signature lands in the trail with source, officer, and
timestamp, because a decision taken on an automatically fetched record has to be
as auditable as one taken on paper. `components/matrix/AuditTrail.tsx` already
renders this shape; the backend has to persist it.

---

## 3. How to demo it in 40 seconds

1. `/matrix`, open APP-2026-0148, **Dispatch**, then **Simultaneous clash**.
2. Right rail → **Scope**.
3. Click **MPCB** in READING AS. Say: *"MIDC ne site aur structure sign kiya hai
   — MPCB ki screen par wo sirf context hai. Effluent aur water abhi bhi MPCB ka
   apna kaam hai, aur koi doosra desk uske liye cover nahi de sakta."*
4. Expand **Site and structure** to show the signature reference.
5. Point at the footer line: this build signs nothing, it integrates with the
   officer's existing DSC.

Then the honest close: *"Ye bura approval pakadta nahi hai. Ye usko phailne se
rokta hai, aur record chhod jaata hai ki kisne kya clear kiya. Pakadne ka kaam
pre-check, cross-form mismatch aur joint inspection karte hain."*

---

## 4. Q&A

| Question | Answer |
|---|---|
| "Can the applicant fake a seal?" | No. Seals are signed with the officer's DSC and the applicant never holds the key. And prior approvals are pulled from the issuing system, not uploaded. |
| "What if an officer approves a bad plan?" | The seal covers only that officer's fields, so nobody downstream treats it as their clearance. Detection comes from rule checks, cross-form mismatch, and random joint inspection under s. 16. The signed record shows exactly who approved it. |
| "Does a signature prove the document is true?" | No. It proves who approved which exact file. Truth is checked by the rules engine and by inspection. |
| "Is this built?" | The ownership model and the three-state view are built and on screen. The signing is mocked, and the UI says so. |
