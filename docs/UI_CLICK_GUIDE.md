# ANUMATI — Screen and Click Guide

What every button, link, tab and control does: what opens, where it opens, how big it is, and what you see.

| | |
|---|---|
| App | `anumati-web` (Next.js 14) with `backend/anumati-server` (API + worker) |
| Checked against | The code in `D:\sih-2026`, 27 Sep 2026 — updated after the UX pass the same day (§16) |
| Sizes | From the Tailwind classes in the code. `h-9` = 36 px, `w-[392px]` = 392 px, `max-w-lg` = 512 px (1 unit = 4 px). "Fits content" means no size is set. |
| Breakpoints | `sm` 640 px · `md` 768 px · `lg` 1024 px · `xl` 1280 px · `2xl` 1536 px |

---

## 0. Read this first

### 0.1 Two modes

| | Demo mode | Live mode |
|---|---|---|
| Switched by | `NEXT_PUBLIC_ANUMATI_API` not set | `NEXT_PUBLIC_ANUMATI_API=http://…:4000` |
| Badge on every screen | **DEMO · OFFLINE** (grey) | **LIVE · v1.3** plus **· DEMO** and/or **· RECORDED** (amber), or green when neither applies |
| Accounts | 2 local accounts: `officer/admin`, `applicant/demo` | Server accounts, checked by the server |
| Files, clocks, decisions | Simulated in the browser; lost on reload | Stored in PostgreSQL; every change is a server command |
| Pages that need the server | Show a "needs the ANUMATI server" notice | Work |

### 0.2 Accounts and where each lands after sign-in

| User / password | Role | Lands on | Can open |
|---|---|---|---|
| `applicant` / `demo` (also `deccan` / `demo` in live) | applicant | `/roadmap/new` | Roadmap, simulator, standard, My applications (live) |
| `officer` / `admin` | officer, single-window facilitation desk | `/matrix` | Console (dispatch, revise, finalise), standard |
| `mpcb`, `midc`, `fire`, `dish`, `msedcl`, `ceig`, `labour` / `demo` (live only) | officer, one department | `/matrix` | Console, acting only on its own desks |
| `committee` / `demo` (live only) | committee | `/committee` | Committee desk, console (read + committee actions) |
| `reviewer` / `demo` (live only) | reviewer | `/rules` | Rule review |
| — | admin | `/matrix` | Everything |

**Gate rules (AuthGate).**
- Opening a page your role may not use sends you to your own home page.
- With no session you are sent to `/login`.
- While the session is read, a full-screen centred "CHECKING SESSION…" label shows.
- A session saved in one mode is thrown away in the other.
- In live mode, a 401 from the server signs you out and sends you to `/login`.

### 0.3 Route map

| Route | Who | Chrome (top bar) | What it is |
|---|---|---|---|
| `/` | — | — | Redirects to `/login` |
| `/login` | everyone | own layout | Sign-in |
| `/roadmap/new` | applicant, admin | Applicant bar | Setup wizard |
| `/roadmap/[id]` | applicant, admin | Applicant bar | Project roadmap board |
| `/roadmap/[id]/simulate` | applicant, admin (department view) | Applicant bar | Reform simulator |
| `/standard` | anyone, no sign-in | Applicant bar | OAGS open standard |
| `/applications` | applicant, admin — live | Applicant bar | My applications |
| `/applications/[id]` | applicant, admin — live | Applicant bar | One application, draft to decision |
| `/matrix` | officer, committee, admin | Officer bar | Clearance console |
| `/committee` | committee, admin — live | Desk bar | Empowered Committee desk |
| `/rules` | reviewer, admin — live | Desk bar | Rule review |

---

## 1. Top bars and shared controls

### 1.1 Applicant top bar (wizard, roadmap, simulator, standard, applications)

56 px tall (`h-14`), full width, pinned to the top; the page scrolls under it.

| Control | Where | On click → opens | Size / placement | What you see |
|---|---|---|---|---|
| Logo + **ANUMATI** | Far left | Page → `/roadmap/new` (other roles are bounced home) | 20 px icon + wordmark | — |
| **Official** pill | After logo | Not clickable | Only at `lg`+ | — |
| Subtitle | Middle, roadmap page only | Not clickable | Takes the leftover width, cut with "…"; hidden below `md` | e.g. "Food processing & packaging — Pune, Maharashtra — MIDC Chakan" |
| **Roadmap** | Nav | Page → `/roadmap/new` | Full bar height; active = blue + 2 px underline | Active on wizard, roadmap, simulator |
| **My applications** | Nav, **live only** | Page → `/applications` | Same | Active on application pages |
| **Standard** | Nav | Page → `/standard` | Same | — |
| Mode badge | Right of nav | Opens the **What is real here** card (Data · Saved · Government systems · Signing) under the badge; Esc or a click outside closes it | 24 px pill; card 300 px wide; hidden below `md` | See 1.4 |
| **Explain** | Right | Toggles the "how this works" notes; remembered in this browser | 32 px button; highlighted when on | On the applicant side only the wizard has an Explain note |
| Version line | Right | Not clickable | Only at `2xl`+, not on the roadmap page | "Rules v1.3 · N approvals · N flagged" |
| Avatar + name / designation | Far right | Not clickable | 32 px circle; text only at `xl`+, cut at 132 px | e.g. "Sahyadri Agro Foods Pvt Ltd / Applicant" |
| **Sign out** icon | Far right | Clears the session, replaces the page with `/login` | 32 × 32 px | Missing on a fresh load of `/standard` (that page does not read the session) |

A hidden **Skip to main content** link appears when you press Tab.

### 1.2 Officer top bar (console)

64 px tall (`h-16`), full width.

| Control | Where | On click → opens | Size / placement | What you see |
|---|---|---|---|---|
| Logo + **ANUMATI** + **MATRIX 2.0** | Far left | Not clickable | Pill hidden below `sm` | — |
| **Clearance Console** | Nav | Current page | 2 px blue underline | — |
| **Standard** | Nav | Page → `/standard` | — | — |
| **Committee** | Nav, committee and admin only | Page → `/committee` | — | — |
| **Rules** | Nav, admin only | Page → `/rules` | — | — |
| Mode badge | After nav | Opens the **What is real here** card | Hidden below `md` | See 1.4 |
| **N Open files · N in conflict · N past SLA** | Right | Not clickable | 36 px chips; hidden below `xl` | "in conflict" turns red and "past SLA" amber when above 0 |
| **Explain** | Right | Shows/hides every Explain note in the console | 32 px | — |
| Avatar + name | Right | Not clickable | Text hidden below `lg`, max 164 px | — |
| **Sign out** icon | Far right | Page → `/login` | 32 × 32 px | — |

### 1.3 Desk top bar (Committee, Rule review)

56 px tall (`h-14`).

| Control | On click | Shown to |
|---|---|---|
| **ANUMATI** wordmark | Nothing (plain text) | All |
| **Clearance Console** | Page → `/matrix` | officer, committee, admin |
| **Committee** | Page → `/committee` | committee, admin |
| **Rule review** | Page → `/rules` | reviewer, admin |
| **Standard** | Page → `/standard` | officer, committee, reviewer, admin |
| Mode badge | Click: the What is real here card | All; hidden below `md` |
| Avatar / **Sign out** | Sign out → `/login` | All |

### 1.4 Mode badge — every state

Fetched once per page load from `GET /v1/meta`; no retry until reload.

| State | Label | Colour | Tooltip |
|---|---|---|---|
| Demo build | DEMO · OFFLINE | grey | "No server: everything runs in this browser on the seeded rule base. Nothing is stored." |
| Live, first 4 s | CONNECTING… | red | — |
| Live, no answer after 4 s | SERVER UNREACHABLE | red | — |
| Live, demo data or recorded answers | LIVE · v1.3 · DEMO · RECORDED | amber | "Demo data and demo accounts. Rules v1.3 · engine … · government systems: recorded answers · signing: demo key, not a DSC" |
| Live, real systems | LIVE · v1.3 | green | Same format, "live" / "officer DSC" |

### 1.5 Keyboard

| Key | Where | Effect |
|---|---|---|
| **A** | Applicant pages | Applicant view; roadmap jumps to Roadmap & Dependencies |
| **D** | Applicant pages | Department view; roadmap jumps to All Approvals |
| **Esc** | Applicant pages | Closes the open dialog if nothing has been typed in it (it never also closes the panel behind it); with no dialog open, closes the approval side panel |
| **Esc** | Console | Closes the revision packet and the tie-breaker overlay (the tie-breaker only while its reason box is empty) |
| **Ctrl/⌘ + Enter** | Console thread box | Sends the message |

Shortcuts are ignored while typing in a field or while Cmd/Ctrl/Alt is held.

---

## 2. Sign-in — `/login`

**Layout.** Full screen, background `#F1F5F9`, content centred up to 1440 px. A masthead, one large rounded card, a footer. At `lg`+ the card splits 52 : 48 — brand panel on the left (at least 560 px tall), the form in its own white card on the right. Below `lg` the halves stack.

| Control | Where | On click → opens | Size / placement | What you see |
|---|---|---|---|---|
| **Username / Email ID** | Form | Text input | 52 px tall, full width | "Enter your username or email" |
| **Password** | Form | Password input | 52 px tall | "Enter your password" |
| Eye icon | End of password field | Shows / hides the password | 16 px | — |
| **Remember me** (ticked by default) | Under password | Ticked: the session survives closing the browser. Unticked: kept for this tab only | 17 px box | — |
| **Forgot password?** | Right of Remember me | Opens a help note in place, under the row | Full form width | Demo: the two fixed accounts. Live: "ANUMATI does not reset passwords — ask your department's MAITRI administrator" |
| **Login →** | Full width | Signs in; page is replaced with your role's home. Enter also submits. | 56 px tall | "Signing in…" while waiting; red error box above the button on failure |
| **Continue as the demo applicant** | Under "OR" | Signs in as applicant → `/roadmap/new` | 52 px tall, full width | Note: "In deployment this is MAITRI 2.0 sign-in…" |
| Mode badge | Under the note | Opens the "What is real here" card | 24 px pill | See 1.4 |
| **Demo accounts on this server** | Under badge — **live only, when the server is in demo mode** | Expands in place | Full card width | 5 rows of user / password and who they are |
| A `user / pass` inside that list | Expanded list | Fills both fields; **does not submit** | Mono text | — |
| "Need help?" note | Card foot | Not clickable | — | "Sign-in problems go to your department's MAITRI 2.0 administrator." |
| **Open standard (OAGS)** | Page footer | Page → `/standard` | Text link | — |

**Messages:** "Enter both a user id and a password." · "That user id and password do not match a demo account." (demo) · the server's message, or "Sign-in failed. Try again." (live) · "Could not reach the ANUMATI server. Check that it is running."

---

## 3. Setup wizard — `/roadmap/new`

**Layout.** One centred column 960 px wide, 64 px below the bar: the form (660 px) and a side column (268 px).

| Control | Where | On click → opens | Size / placement | What you see |
|---|---|---|---|---|
| **Sector** | Form row 1 (label column 150 px) | Browser dropdown | 44 px tall | Food processing & packaging. Textile, Cold storage, Auto components, Warehousing are listed **greyed out** — "not in the rule base yet" |
| **Location** | Row 2 | Browser dropdown | 44 px | Pune — MIDC Chakan (default), Pune — Talegaon MIDC. Nashik, Solapur greyed out |
| **Land** | Row 3 | Browser dropdown | 44 px | MIDC plot (default), Private land |
| **Size band** | Row 4 | Browser dropdown | 44 px | Under 10 / 10–50 / **50–100** (default) / Over 100 |
| **Stage** | Row 5 | Browser dropdown | 44 px | New setup. Expansion, Renewal greyed out |
| Coverage note | Under the five rows | Not clickable | Full form width | "Rule base v1.3 covers food processing in Pune district, for a new setup…" |
| Condition chips: **Steam boiler +1**, **Built height over 15 m +2**, **Hazardous materials +3**, **Exports produce +1**, **Contract labour over 20 +1** | "Conditions — optional" band | Each toggles on/off (dark border when on) | 30 px chips, wrap | Steam boiler, Hazardous, Exports and Contract labour start on — the answers behind the published headline numbers |
| **Generate roadmap →** | Bottom of form | Page → `/roadmap/RM-4F2A81?sector=…&location=…&stage=…&size=…&midc_land=…&boiler=1|0…` — every answer, including chips switched off | 44 px primary | The roadmap board |
| **View the schema →** | "Open standard" card | Page → `/standard` | Text link | — |
| Rule base card | Side column | Not clickable | 268 px | v1.3, as of date, approvals, edges, awaiting review, source documents |
| Explain note | Under form | Visible only with Explain on | up to 672 px | "Every roadmap is stored against the rule version…" |

**What carries over to the roadmap:** every answer. Location names the project on the roadmap and the printed checklist; Size band becomes an employee count (6 / 30 / 72 / 130); Land and every chip — on or off — set the conditions. Opening the wizard from **Change answers** fills in the earlier answers and says so ("Your earlier answers are filled in.").

---

## 4. Project roadmap — `/roadmap/[id]`

**Layout.** Scrolling area, content centred up to 1560 px, 28 px side padding.
- Row 1: header + clock switch.
- Row 2: four number cards (together at least 620 px, growing) + Dependency Evidence card (296 px).
- Row 3: the board card (at least 660 px, growing) + a right column (296 px).
- Row 4: footer line.
- The approval side panel floats over everything from the right.

**URL options:** `?pane=graph|register|documents|track|precheck` picks the first tab; `?role=applicant|department` sets the view (and wins over `pane`). Opens by default in the Applicant view, graph tab, Statutory clock, All Dependencies.

### 4.1 Header, clock switch, number cards

| Control | Where | On click → opens | Size / placement | What you see |
|---|---|---|---|---|
| Header block | Top-left | Not clickable | 48 px icon tile | "Project Roadmap" / sector — location · size band |
| Stage pill | Header | Not clickable | Fits content | "New setup — greenfield" |
| **Applicant [A]** / **Department [D]** | Header, far right | Switches view in place. Applicant → graph tab. Department → All Approvals tab and shows **Simulate reforms** in the footer. | 36 px buttons | — |
| **Statutory** / **Observed** | Row 1, right | Rebuilds the roadmap in place on that clock (cards, graph, table) | 32 px segmented control | Caption: "EVERY DAY COUNT CITED TO A SECTION" / "x/y APPROVALS · n REPORTS · MEDIAN" |
| **Approvals · Sequential · Critical path · Time saved** | Row 2 | Not clickable | ≥196 px each; 38 px numbers | e.g. "↓ x %" badge on Critical path |
| **Dependency Evidence** | Row 2, right | Not clickable; pills have tooltips | 296 px | "N filings", counts by statutory / documentary / physical / practice |

### 4.2 Board tabs

46 px tall tabs; active = blue 2 px underline.

| Tab | Opens | Height of content |
|---|---|---|
| **Roadmap & Dependencies** | Critical-path strip + dependency graph (4.3) | graph drawing area 560 px |
| **Timeline View** | Lanes by department (4.4) | 680 px |
| **All Approvals (N)** | Approvals table (4.5) | 760 px |
| **Document Ledger** | Document reuse table (4.6) | 760 px |
| **Pre-Check** | Readiness, risk, inspections, renewals (4.7) | 760 px, scrolls |
| **View: Critical Path / All Dependencies** | Graph tab only, right end. Critical Path hides every line except links between critical approvals. | 28 px buttons |

### 4.3 Roadmap & Dependencies tab

**Critical Path strip** (red-tinted, full board width):

| Control | On click → opens | Size | What you see |
|---|---|---|---|
| Approval cards (first 4 on the critical path) | Selects the approval → **approval side panel** (4.9); click again to close | 150 × 92 px; row scrolls sideways | ID, name, "N d", tag CRITICAL / STAT / DOC / PHYS / PRAC |
| "Final approvals & operations" card | Not clickable | 166 × 92 px, green | Remaining days, "N STEPS" |
| Total block | Not clickable | 118 px | "Total (critical path) N days ↓ x %" |

**Dependency Graph box** (52 px title bar + 560 px drawing area, full board width):

| Control | On click → opens | Size | What you see |
|---|---|---|---|
| **+ Expand all** | Animates to standard zoom (0.82), 320 ms | 32 px button | — |
| **Fit to screen** | Animates to fit everything, 320 ms | 32 px button | — |
| Approval box | Selects → **approval side panel**. Hover lifts it, rings linked approvals, fades other links. | 200 × 76 px; each day row 150 px tall | ID, name, "N d"; Observed clock adds red/green "+N/−N"; tag CRITICAL, DEEMED Nd, CONDITIONAL or department. Not draggable. |
| Empty canvas | Click deselects (closes panel). Drag = pan, wheel = zoom (0.3–1.6), double-click = zoom in. | — | "Day N / Parallel" row labels |
| **+ / − / fit** buttons | Zoom in / out / fit | 28 × 28 px stack, bottom-left | — |
| "Dependency type" key | Not clickable; rows have tooltips | Bottom-right | Statutory, Documentary, Physical, Practice — not law, Critical path |

### 4.4 Timeline View tab (680 px)

| Control | On click → opens | Size / placement | What you see |
|---|---|---|---|
| **SIMULATED DAY** slider | Moves "today"; bars, statuses and activity recalculate | 220 px, toolbar left | "Day N of M" (starts at 35 %) |
| **You are [— pick a department —]** | Department view only. Dropdown; enables that department's lane buttons | 32 px | — |
| "N SLA breach(es)" | Not clickable | Red pill, only when N > 0 | — |
| **0–X d / 0–Y d** | Switches the timeline scale | Pills, when useful | — |
| **Activity** | `lg`+ only. Opens / closes a column on the right of this tab | **268 px wide**, full tab height, scrolls | "ACTIVITY AS OF DAY N" and events |
| Approval name (lane start) | Selects → **approval side panel** | 248 px column | Name, status disc, "CP" for critical path |
| Bar | Not clickable; tooltip | Fills width, 22 px track | "Name · day a to b · N day window" |
| **Raise a query / Resolve query** | Department view, `lg`+, your department only. Changes the row in place (not saved) | 24 px buttons in a 128 px column | Others show "Read-only"; "OVERRUN" tag when late |

### 4.5 All Approvals tab (760 px)

| Control | On click → opens | Size / placement | What you see |
|---|---|---|---|
| **Filter by approval, department or act** | Filters as you type | 320 × 32 px | "N of M shown" |
| Approval row | Selects → **approval side panel** | Full width. Columns: # 32 · Approval (fills) · Department 168 · Waits on 118 · Window 104 · Statutory 72 · Observed 96 · Deemed 78 | Name, ID, CRITICAL PATH / UNDER REVIEW, Marathi name, act + section, days |
| "Waits on" chips | Not clickable; tooltip | 19 px tall | e.g. "A10 · Statutory" |
| **Clear the filter** | Empty state; clears the filter | 36 px | "Nothing matches that" |

Headings "Pre-establishment" / "Pre-operation" stay pinned while scrolling.

### 4.6 Document Ledger tab (760 px)

| Control | On click → opens | Size / placement | What you see |
|---|---|---|---|
| Summary band | Not clickable | Full width | Document asks · Distinct documents · State already holds · A verified link would remove (−x %) · Worst offender |
| **Filter by document or department** | Filters as you type | 320 × 32 px | "N duplicated · M asked once only" |
| "Issued by **A##**" | Selects the issuing approval → **approval side panel** | Inline link | "· Department · available day N" |
| Counter chips "A## dN" | Not clickable; tooltip | 300 px column | — |
| **Clear the filter** | Clears the filter | 36 px | "Nothing matches that" |

### 4.7 Pre-Check tab (760 px, scrolls; centred column up to 1100 px)

| Control | On click → opens | Size / placement | What you see |
|---|---|---|---|
| Summary + 4 tiles | Not clickable | 2 columns, 4 at `sm`+ | "x of y would be turned away"; Ready / Would be refused / Blocking gaps / Advisory |
| Approval row (› / ⌄ or ✓) | **Expands in place** (one open at a time; first not-ready row starts open) | Full width | ID, name, dept, "filable dN", READY or "N BLOCKING" |
| Gap cards | Not clickable | Full width | DOCUMENT MISSING / PRIOR ORDER PENDING / FORMS DISAGREE, the problem and the fix |
| **Raise a grievance on A##** | Opens the **Raise a grievance** dialog (4.10) | 28 px | "Goes to the Empowered Committee, not back to the same desk." |
| **WHITE / GREEN / ORANGE / RED** | Risk card: recalculates the score in place (ORANGE default) | 24 px segmented control | "x / 100", LOW / MEDIUM / HIGH RISK, scrutiny line, factor bars |
| **Prior objections** box | Recalculates the score (0–9) | 64 × 28 px | — |
| Site inspections card | Not clickable | Full width | "N inspections · N visits · N trips avoided" |
| Renewal calendar card | Not clickable | Full width | Expiry dates, days left, IN DATE / 60 / 30 / 7 DAYS / LAPSED |

### 4.8 Right column and footer line

Right column (296 px, not clickable): **Dependency Type**, **Key Insights**, **From X to Y days** progress bar.

| Control | Where | On click → opens | Size | What you see |
|---|---|---|---|---|
| ID + rules text | Footer left | Not clickable | — | "RM-4F2A81 · Rules v1.3 · N approvals · K flagged · engine 8f31c04" |
| **✎ Change answers** | Footer left | Page → `/roadmap/new?…` with your current answers filled in | 28 px | — |
| **Print checklist** | Footer right | Switches to All Approvals, then opens the **browser print dialog** 80 ms later | 36 px | A4 print of the approval register with tick boxes |
| **Start an application** | Footer right — **live and role applicant only** | Opens the **Start an application** dialog (4.10) | 36 px, blue | — |
| **→ Simulate reforms** | Footer right — **Department view only** | Page → `/roadmap/[id]/simulate` | 36 px, navy | — |

### 4.9 Approval side panel

- **Opened by** selecting an approval anywhere: critical-path card, graph box, table row, "Issued by", timeline lane name.
- **Size:** 384 px wide (`w-[384px]`), full height under the top bar, pinned to the right edge.
- **Behaviour:** floats over the board (no backdrop; the board stays usable), slides in 18 px from the right, scrolls on its own, stays open when you switch tabs.
- **Closed by:** X, Esc, clicking the same item again, clicking empty graph canvas.

| Control | On click → opens | Size | What you see |
|---|---|---|---|
| **X** | Closes the panel | 14 px icon | — |
| Header | Not clickable | — | ID (red if critical), ON CRITICAL PATH / UNDER REVIEW, name, department |
| Three figures | Not clickable | 3 columns | Statutory days · Earliest start · Deemed at N days / not available |
| Prerequisites · N / Unlocks · N / Documents required · N | Not clickable | — | Linked approvals with type tags and reasons; document chips |
| **› Read the N reports behind this** | **Expands in place** (only when observed data exists) | Full panel width | Median days vs statutory, report cards, SEEDED PILOT DATA tag |
| Source link ↗ | Opens the act's source page in a **new browser tab** | Text link | Document, section, effective date, rule version, confidence, checked by |
| **⚠ Report a rejection** | Opens **Report what actually happened** dialog | 36 px, half width | — |
| **Version history** | Opens **Version history** dialog | 36 px, half width | — |

### 4.10 Dialogs on the roadmap page

Shared dialog: fixed, centred, 24 px margin, backdrop at 20 %, **up to 512 px wide** (`max-w-lg`), height fits content, 200 ms entrance. Focus moves to its first field and stays inside the dialog (Tab wraps); it returns to the button that opened it on close. **Esc or a backdrop click closes it — unless you have typed something**, then only Cancel or ✕ does, so a stray key never throws your words away.

| Dialog | Opened from | Size | Controls inside | What happens |
|---|---|---|---|---|
| **Report what actually happened** | Side panel → Report a rejection | ≤ 512 px | 4 choices; **Days you actually waited** (90 px, only for "longer"); **In your words** (3 lines); **Save report** (disabled until filled); **Cancel** | "Saved against A##. It counts towards the observed median straight away…" and a box: "Kept in this browser only. This build does not send field reports to a server yet." |
| **Version history** | Side panel → Version history | ≤ 512 px, 132 px label column | Close only | Rule version, review status, confidence, provision, in-force dates, checked by / on |
| **Raise a grievance** | Pre-Check → Raise a grievance on A## — **demo mode only** | ≤ 512 px | **Days pending** (84 px, default 30); **What has happened**; **Send to the Empowered Committee**; **Cancel** | Confirmation citing MAITRI Act s. 8, and "Offline demo: saved in this browser…". In live mode the Pre-Check shows instead: "Stuck after filing? Raise a grievance on the desk from **My applications →**" |
| **Start an application from this roadmap** | Footer → Start an application (live, applicant) | **≤ 460 px**, backdrop 30 %. Same close rules as the shared dialog (the pre-filled name counts as typed only once you change it) | **Project name** (pre-filled, 200 chars max); **Start from the sample unit's documents** (ticked — it lacks only a board resolution); **Cancel**; **Create draft** (disabled under 3 chars; spinner) | Calls `POST /v1/roadmap` then `POST /v1/applications`, then page → `/applications/APP-YYYY-NNNN`. Errors in red inside the dialog, with the next step. |

---

## 5. Reform simulator — `/roadmap/[id]/simulate`

Always uses statutory days.

**Applicant view (default after reload):** a centred message "This one belongs to the department" and one button **Switch to the department view** (36 px) that shows the simulator in place.

**Department view:** a 52 px strip, then two columns — levers on the left (**668 px**, scrolls), results on the right (fills the rest, scrolls).

| Control | Where | On click → opens | Size | What you see |
|---|---|---|---|---|
| **Reset** | Strip | Unselects every lever | 36 px | — |
| **Back to roadmap** | Strip | Page → `/roadmap/[id]` (stays in Department view) | 36 px | — |
| **⬇ Export brief** | Strip, far right | **Downloads** `anumati-reform-brief-{id}-{date}.md` at once | 36 px, primary | Effect table, selected and refused levers |
| Lever row | Left column | Selects / unselects; results recalculate with all selected levers. L1 and L2 start selected. | Full width; savings column 190 px, bar up to 132 px | Name, type tag, reason, "−N d" |
| Refused lever | Left column | **Disabled** (lock, struck through) | — | "REFUSED" and the reason |
| Results | Right column | Not clickable; numbers count up over 620 ms | Today bar 420 px | "With selected reforms N days", further saving, levers applied, highest-impact lever, statutory guardrail |

---

## 6. OAGS standard — `/standard`

Anyone, no sign-in. Three bands centred up to 1200 px. The endpoints work in both modes (served by the web app itself).

| Control | On click → opens | Size | What you see |
|---|---|---|---|
| **Read the schema →** | Raw JSON Schema in a **new browser tab** | 44 px, primary | — |
| **⬇ Download our dataset** | Downloads `oags-mh-food-v1.3.json` | 44 px | — |
| Endpoint rows (GET schema / export / approvals) | Each opens in a **new tab** (export downloads) | Full-width rows | Method, path, note (note at `xl`+) |
| **POST /api/v1/standard/validate** row | Not clickable | — | — |
| **try ours** | Validates this app's own export; results in place | Small link | — |
| **Choose an OAGS JSON file** | Opens the **computer's file picker** (.json), validates in place | Full width × 74 px, dashed | "Checking…", then 4 checks with ✓/✗, "VALID / REJECTED", findings list up to **168 px** tall |

---

## 7. My applications — `/applications` (live)

In demo mode the applicant sees a bare notice instead: "Filing an application needs the ANUMATI server" with a **Back to the roadmap** link (centred, 440 px column).

**Layout.** Applicant bar, then a centred column **960 px** wide. Loads `GET /v1/applications`.

| Control | Where | On click → opens | Size | What you see |
|---|---|---|---|---|
| **New roadmap →** | Top right | Page → `/roadmap/new` | 36 px, blue | — |
| Application row (whole row) | List card | Page → `/applications/{id}` | Row: ID column 120 px, project fills, status, date 96 px (hidden below `sm`), arrow | ID, project, status (DRAFT grey · SUBMITTED / IN CLEARANCE blue · RETURNED amber · CLEARED / COMPLETED green), date |

Loading: three pulsing rows (64 px). Empty: "No applications yet — Build a roadmap, then choose "Start an application" under it."

---

## 8. One application — `/applications/[id]` (live)

**Layout.** Applicant bar, then a centred column **1180 px** wide, sections stacked 16 px apart. Loads `GET /v1/applications/{id}` and reloads by itself whenever a department changes the file (live event stream).

**Header.** "← My applications" link · ID · status pill · "Rules v1.3 · engine …" · project name (24 px) · applicant · location · "filed {date}".

### 8.1 Draft stage

**Section: Pre-check — what the counter would say today** (right side: "Ready to file" green, or "N of M would be refused" red)

| Control | Where | On click → opens / calls | Size | What you see |
|---|---|---|---|---|
| 4 tiles | Top | Not clickable | 2 cols, 4 at `sm`+ | File now · Blocked now · Later waves · Advisory notes |
| Gap list | Under tiles | Not clickable | Red cards | "A11 · MSEDCL — Load requirement is on MSEDCL's list and is not in the dossier." + the fix |
| **File N approvals now** | Bottom of section | `POST /v1/applications/{id}/submit` — the server re-runs the pre-check, builds the file from the current wave and dispatches it | 40 px, blue; **disabled until the pre-check passes** | Page switches to the filed stage, pill → IN CLEARANCE. If the server refuses, its own gap list replaces this one. |

Below it, two panels side by side at `lg`+ (stacked below):

**Common application form** — 8 inputs (36 px each): Plot number, Built-up area (sq m), Connected load (kVA), Water draw (KLD), Employees, Investment (₹ lakh), PAN, GSTIN.

| Control | On click → calls | What you see |
|---|---|---|
| **Save form** (disabled until something changes) | `PATCH /v1/applications/{id}` | "Saved. Every department's form now reads these figures." The pre-check recalculates. Emptying a field does not clear the saved value. |

**Documents** (PDF, PNG or JPEG)

| Control | On click → opens / calls | Size | What you see |
|---|---|---|---|
| "Still needed for this wave: …" | — | 12 px text | Missing document names |
| **Which document is this?** | Type, or pick from suggestions of missing documents | 36 px, full width | Starts with the first missing one |
| **Choose file** | Opens the **computer's file picker** (pdf/png/jpeg) | Native | File name |
| **Upload** | Browser computes SHA-256 → `POST …/documents` → compares with the server's hash | 36 px, blue | "Received · SHA-256 76fc2da2… matches your copy." or red "The server received different bytes…" |
| In the dossier (N) | — | 12 px rows | ✓ name and the first 10 hash characters (hover = full), or "sample" |

### 8.2 Filed stage

**Section: Where your file is** (right side: "Day N")

| Control | Where | On click → calls | Size | What you see |
|---|---|---|---|---|
| Status sentence | Top | — | — | e.g. "17 of 17 desks still deciding." |
| Revision packet | Only when sent back | — | Amber box | Packet ID, objections, approvals carried forward, days to reply |
| **What you changed** + **Resubmit to the objecting desks** | Inside the packet | `resubmit` command | 36 px; needs 3+ chars | File returns to the objecting desks |
| Desk row (one per desk) | List | — | Bordered card | Dept, approval, name, OPEN / PROCESSING / APPROVED / REJECTED / WITH COMMITTEE / DEEMED APPROVED |
| Clock line | In the row (open desks) | — | 11.5 px | "7 d left in the service limit" · "Overdue by N d — the Committee can take it over" · "Clock paused — waiting on you (21 d left when it resumes)" · "Deemed approved in N d under its own Act" / "No deeming clause — lapse goes to the Committee" · "N d paused on queries" · "Starts when the approvals it needs are issued" |
| Query box | When a desk asked a question | — | Amber box | "MIDC asks: Please confirm the plot boundary…" |
| **Your answer** + **Answer · restart clock** | Query box | `answer_query` command | 36 px; needs 3+ chars | Box disappears, clock resumes |
| **Raise a grievance on A##** | Bottom of an open desk row | Opens an **inline form** in the row | Link text | Reason box (10+ chars) and "MAITRI Act, 2023 — s. 8(1)(g). It goes to the Committee, not back to {DEPT}." |
| **Send to the Empowered Committee** | Inline form | `POST /v1/grievances` | 32 px, navy | Row now says "Grievance GRV-… is with the Empowered Committee." |
| **Cancel** | Inline form | Closes the form | 32 px | — |

**Section: Messages on this file** — last 8 messages (yours blue on the right, departments grey on the left). **Write to the departments on this file** + **Send** (3+ chars) posts a `post_message` command.

**Section: Grievances** (only if any) — GRV ID, approval, department, status, reason, and "Committee: {resolution}" once resolved. Nothing to click.

When the status is **returned**, the Documents panel from 8.1 appears again below, full width, so the applicant can add what was asked for.

### 8.3 Record of this application

The ledger panel (§11): **Verify chain**, signatures if any, and the file's ledger rows (scrolls, max 560 px). The applicant gets no sign buttons.

---

## 9. Clearance console — `/matrix`

### 9.1 Layout

The page never scrolls; each column scrolls on its own.

```
┌──────────────────────── Officer top bar · 64 px ─────────────────────────────────────────┐
├──────────────┬───────────────────────────────────────────────────────┬────────────────────┤
│ MY QUEUE     │ CENTRE — fills remaining width, scrolls               │ CONTEXT PANEL      │
│ 292 px       │  Conflict banner (only in conflict)                   │ 392 px             │
│ header 54 px │  File header + phase stepper                          │ tabs (52 px strip):│
│ file rows    │  Review flow (canvas 804 px, 1028 px with tie-breaker,│ Thread · Data      │
│ (scroll)     │               scrolls sideways if narrower)           │ Matrix · Scope ·   │
│              │  Conflict resolution screen  OR  Phase summary        │ SLA · Visits ·     │
│              ├───────────────────────────────────────────────────────┤ Redress · Audit    │
│              │ DECISION BAR — pinned to the bottom of the centre     │ (tab body scrolls) │
└──────────────┴───────────────────────────────────────────────────────┴────────────────────┘
Overlays: Tie-breaker (≤ 896 px) · Revision packet (≤ 512 px) · Error toast (≤ 560 px, 96 px from bottom)
```

- **Demo** holds three seeded files: APP-2026-0148 (veto rule, not dispatched), APP-2026-0151 (tie-break rule, day 5), APP-2026-0155 (weighted rule, day 6).
- **Live** loads the files your role may see and follows every change from the server. `?file=APP-…` opens that file (the Committee desk links this way).
- **Empty:** "Nothing on your desk — A file appears here the moment it is dispatched to your department."
- **Loading:** "Loading your files…".

### 9.2 Left column — My queue (292 px)

| Control | On click → opens | Size | What you see |
|---|---|---|---|
| Queue row (whole card) | Loads that file **in place** in the centre and right columns (no page change). Also: right panel → Thread, overlays close, **clock stops**, "Post as" clears. | Full column width, height fits content | File ID, rule pill (VETO / TIE-BREAK / WEIGHTED, or red CONFLICT), project (2 lines), applicant, status and "day N" |

Status line: Awaiting dispatch · N DESKS REVIEWING (blue) · N past SLA (amber) · Conflict detected · With tie-breaker · Phase cleared · Sent for revision · Rejection overruled — cleared · Rejection sustained · Phase failed on score.

### 9.3 Centre — file header, flow, summary

**Conflict banner** (only in conflict or with the tie-breaker open; not clickable): red "Conflict detected — technical rejection during parallel review phase", or amber "Escalated — awaiting tie-breaker panel", with who approved, who rejected, the time and the rule.

**File header** (full centre width): ID | applicant | location, project title (23 px), phase name.

| Control | Shown to | On click → opens | Size | What you see |
|---|---|---|---|---|
| **Dispatch to all N departments** | Before dispatch. Demo: always. Live: facilitation desk and admin only. | Every desk goes to review, every clock starts; registry checks start by themselves | 40 px, blue | Desks turn PROCESSING |
| **DAY** tile | After dispatch | Not clickable | 44 px | Day number |
| **CLOCK** ▶/⏸ | Demo; live only for facilitation/admin on a demo server | Runs the clock: **one simulated day every 1.4 s**. Stops by itself when nothing is pending, the file settles, you switch files, or a command fails. | 32 px inside a 44 px group | Play / Pause; disabled when settled |
| **+1 D** | Same as CLOCK | Advances one day in place. Can raise an SLA warning, a deemed approval (Act has a deeming clause), or a transfer to the Committee (no clause). A desk with an open query only adds a paused day. | 32 px | — |
| **Reset** | **Demo only** | Puts the file back to its seeded state; stops the clock, closes overlays | 44 px | — |

**Phase stepper** (not clickable): PHASE 1 Initial Review → PHASE 2 Parallel Review → PHASE 3 Final Decision, each done / current / halted / ahead, plus a verdict pill (HALTED — TECHNICAL VETO, SUSPENDED — EQUAL WEIGHT, WITH THE TIE-BREAKER PANEL, ALL DEPARTMENTS CLEARED …).

**Review flow** (not clickable; cards lift on hover). Canvas 804 px wide (1028 px with the tie-breaker node), height = desks × 96 px (min 190 px); scrolls sideways when narrower.
- DISPATCH node: 150 × 74 px.
- One department node per desk: 300 × 74 px. Shows department, veto shield, state pill, approval, officer, clock label, a 2 px line for SLA used, ESCALATED dN tag.
- PHASE GATE: 152 × 74 px (Blocked / Open / Waiting).
- TIE-BREAKER: 200 × 74 px, dashed amber, only while open.

**Conflict resolution screen** — replaces the phase summary while two desks disagree. Three equal cards: THE CONFLICT CAUSE (red), THE SYSTEM RULES (blue, with the authority line), WHAT THAT MEANS (green).

| Control | On click → opens | Size |
|---|---|---|
| **Open clarification thread** | Switches the **right panel** to Thread | 36 px |
| **Send for revision** (veto rule) | Builds a revision packet (15 days to reply), settles the file as "sent for revision", **opens the Revision packet dialog**, stops the clock | 36 px, full card width, green |
| **Route to {panel}** / **Open tie-breaker panel** (tie-break rule) | Escalates if needed and **opens the Tie-breaker overlay** at once; stops the clock | 36 px, full card width, green |
| (weighted rule) | No button — "N desks still to score…" or "The threshold has decided."; score card below | — |
| **Finalise approval** | Always disabled here ("Disabled while the phase is in conflict") | 36 px |

**Phase summary** — shown when there is no conflict or the file is settled. Left part fills, right column **320 px** (stacked below `lg`).

| Control | Shown when | On click → opens | Size |
|---|---|---|---|
| **View the revision packet** | File sent for revision | Opens the **Revision packet dialog** | 36 px |
| **Open the tie-breaker panel** | Tie-breaker open | Opens the **Tie-breaker overlay** | 36 px, amber, 320 px wide |
| **Finalise approval** | Always shown; enabled only when dispatched, no conflict, nothing pending, no rejection, score passes | Settles the file as "Phase cleared"; stops the clock | 44 px, primary, 320 px wide |

It also shows the outcome card once settled, four tiles (Approved / Deemed approved / Rejected / Still open), the auto-escalation box, and for the weighted rule the **Consolidated score** card (large score out of 100, pass mark, bar, per-department weights).

### 9.4 Bottom — Decision bar

Pinned to the bottom of the centre column; height fits content and wraps.

| Control | On click → opens | Size | What you see / rules |
|---|---|---|---|
| **Desk chip** (one per open desk) | Opens the **action strip inline** to its right; click again to close | 32 px, mono | "MIDC A05", QUERY tag if a query is open. **Live:** other departments' desks show 🔒 and are disabled ("Only MPCB can act here — you are signed in for midc"). Committee: all locked. |
| Who is acting | — | — | Demo: "Acting as {officer}, {designation}". Live: "{DEPT} desk". |
| **Remarks** input | Typing (2000 chars) | 28 × 260 px | "Remarks (optional)" (demo) / "Reason (required to reject)" (live) |
| **Score** input (weighted rule) | Digits 0–100 | 28 × 68 px | "0–100" |
| **Approve** | Decides in place (track, counts, audit). A clash turns the centre into the conflict screen and posts notes in the Thread. | 28 px | Disabled while busy or while a query is open |
| **Reject** | **Arms** the rejection: the button becomes red **Confirm reject** with **Keep reviewing** beside it and a line saying what will happen ("Halts the phase for every desk…" / for the weighted rule, "the consolidated score decides"). Disarms itself after 6 s. **Confirm reject** commits. | 28 px | **Live: disabled until the reason has 10+ characters** — a "n/10 to reject" counter shows beside the box. If the server refuses, what you typed stays in the box. |
| **Raise query** | Switches the strip to query mode | 28 px | Disabled if a query is already open or the desk is not in review |
| **Send query · pause clock** | Opens a query; **only this desk's clock pauses**; "Query: …" posted to the Thread | 28 px | Needs 10+ chars |
| **Cancel** | Leaves query mode | 28 px | — |
| **Simultaneous clash — A approve + B reject** | Demo; live only for facilitation/admin on a demo server. Commits both decisions with one timestamp. | 36 px, amber, far right | 0148 = MIDC + MPCB · 0151 = DISH + MFS · 0155 = MSEDCL + CEIG |

### 9.5 Right — Context panel (392 px)

Tab strip at least 52 px tall; each tab 32 px. Clicking a tab swaps the panel body in place. Badges: Thread (message count), Data Matrix (mismatches, red), SLA (past SLA + escalated, amber).

**Thread** — cross-departmental clarification. Messages auto-scroll to the newest.

| Control | On click → opens | Size | Rules |
|---|---|---|---|
| **Resolve & re-evaluate as {DEPT}** | The rejecting desk goes back to PROCESSING; conflict banner and screen disappear; tie-breaker closes | 36 px, full panel width, green | Demo: always. Live: only the rejecting department (or admin). |
| **Post as** chips (SINGLE WINDOW + desks) | Picks who the next message is from | 24 px chips | SINGLE WINDOW: demo, facilitation, admin. Live officers see only their own desks. Hidden for the Committee. |
| Message box | Typing; Ctrl/⌘+Enter sends | 2 rows | "Write to the other department…" |
| **Send** (icon) | Posts the message | 36 px | Disabled while empty |

**Data Matrix** — registry answers (API Setu etc.).

| Control | On click | Size | What you see |
|---|---|---|---|
| **Re-validate all** | Fetches again the records not yet fetched or unavailable (live: whole file) | 32 px | "{fetched}/{total} fetched" |
| **Fetch / Re-fetch** (per record) | Card shows FETCHING, then the answer after 0.7–1.8 s (demo) | 24 px | NOT FETCHED / FETCHING / VERIFIED / FLAGGED / UNAVAILABLE, source, value (red on mismatch), used by |

**Scope** — who owns which form field.

| Control | On click | Size | What you see |
|---|---|---|---|
| **READING AS** chips | Highlights the parameters that desk owns (view only) | 22 px chips | — |
| Parameter row | **Expands in place** (one at a time) | Full width | "Verified by {DEPT}, day N · signed" / "Unverified — your review" / "Owned by {DEPT}" → field values |
| **Mark {DEPT} parameters reviewed** | Marks that desk's groups verified | 32 px | Footnote: signing is mocked in this build |

**SLA** — no buttons. One card per desk: clock label, deemed countdown, the deeming clause or escalation tier; amber when overdue, blue with 2 days or less; TRANSFERRED ON DAY N; "How the ladder works" box.

**Visits** — no buttons. Joint inspections for **this file's** approvals: "N inspections → N visits", then either "N trips avoided" (green) or "No visits can be combined on this file — its inspections fall more than 7 days apart". A file with no site-inspection approvals says so.

**Redress** — *Demo:* grievances raised on the roadmap page in **this browser**, with **Acknowledge** / **Mark resolved** on session-raised ones. *Live:* the server's grievances **for this file**, read-only, with status and the Committee's resolution; committee/admin get **Resolve on the Committee desk →**. A department officer sees why not: "A grievance leaves the department it is about…"

**Audit** — the file's event timeline, newest first.
- Demo: a note "Demo mode: this trail lives in the browser…".
- Live: the **ledger panel** (compact) above the events — **Verify chain** and **Sign {DEPT}'s decision** (see §11).

### 9.6 Overlays

**Tie-breaker overlay**

| | |
|---|---|
| Opens from | Route to {panel} · Open tie-breaker panel |
| Placement | Fixed over the whole screen, centred, 24 px margin |
| Size | Up to **896 px** wide (`max-w-4xl`); body scrolls |
| Backdrop | Dim; **click closes it** |
| Esc | Closes it, unless a reason has been typed |

| Control | On click | Size |
|---|---|---|
| **✕** | Closes; the file stays escalated | 16 px icon |
| **Reason for the panel's decision** | Typing | 3 rows, full width |
| **Overrule {DEPT} & approve** | Rejections become approvals, file cleared, overlay closes | 36 px, primary |
| **Sustain rejection** | File returns to the applicant, overlay closes | 36 px |

Shows the panel name and authority, the department in favour (green) and the one objecting (red) side by side from `md`, the panel members, and "Signing as {you} for {chair}".

**Revision packet dialog**

| | |
|---|---|
| Opens | Automatically after Send for revision, or from View the revision packet |
| Size | Up to **512 px** wide |
| Closes by | Backdrop click, Esc, ✕ or Close |

| Control | On click | Size |
|---|---|---|
| **✕** | Closes | 16 px |
| **Print the packet** | Browser print dialog | 36 px |
| **Close** | Closes | 36 px, primary |

Shows the packet ID, who raised it, days to reply, **To be corrected** (red cards) and **Carried forward — do not re-file**.

**Error toast** (live)

| | |
|---|---|
| Placement | 96 px above the bottom, centred, up to **560 px** wide |
| Shows | Whenever the server refuses a command, e.g. "Only MPCB can act on the MPCB desk. You are signed in for midc." |
| Closes by | ✕ only (does not fade by itself). Shows "That did not go through", the server's message, and **Next:** the step to take (e.g. 409 → "Someone changed it while you were working. Reload…") |

### 9.7 Who sees what in the console

| Element | Demo | Live: department officer | Live: facilitation / admin | Live: committee |
|---|---|---|---|---|
| Dispatch | Yes | No | Yes | No |
| CLOCK / +1 D / Clash | Yes | No | Only on a demo server | No |
| Reset | Yes | No | No | No |
| Desk chips | All | Own department only | Admin all; facilitation none | None |
| Reject reason | Optional | 10+ chars | 10+ chars | — |
| Resolve & re-evaluate | Yes | If own department rejected | Admin | No |
| Audit | Browser note | Verify + sign own decisions | Admin signs any | Verify only |

---

## 10. Empowered Committee — `/committee` (live)

**Layout.** Desk bar, then a grid up to **1280 px**: queue on the left (fills), ledger sidebar on the right (**380 px**, stacked below at < `lg`). Loads `GET /v1/committee/queue` and reloads on every live change. Order: Deadlock → Transferred → Grievance → Past limit.

Header "Empowered Committee — Deadlocks, lapsed desks and grievances — each with the provision that brought it here." and "N items". Loading: 3 skeleton cards (112 px). Empty: "Nothing has reached the Committee".

| Card kind | Pill | Why it is here | Authority shown |
|---|---|---|---|
| Deadlock | red | "{A} approved while {B} rejected. Equal authority — the Committee decides." | the file's rule |
| Transferred | amber "Transferred — s. 5" | "{DEPT} missed its N-day limit." | MAITRI Act, 2023 — s. 5 |
| Grievance | blue | the applicant's reason | s. 8(1)(g) |
| Past limit | grey | "{DEPT} is past its limit on {A}." | s. 8(1)(c) |

| Control | Card | On click → calls | Size | What you see |
|---|---|---|---|---|
| Application ID | All | Page → `/matrix?file={id}` | Mono link | Console with that file |
| **The Committee's reasons** box | All except Past limit | Typing (2000 chars) | 2 rows | — |
| **Grant A##** / **Refuse** | Transferred | `committee_decide` command | 32 px; 3+ chars | Card disappears |
| **Overrule the objection** / **Sustain the objection** | Deadlock | `tie_break` command | 32 px; 3+ chars | Card disappears; application becomes completed / returned |
| **Resolve grievance** | Grievance | `POST /v1/grievances/{id}/resolve` | 32 px; **5+ chars** | Card disappears; applicant sees RESOLVED and the reason |
| **Review the file in the console →** | Past limit | Page → `/matrix?file={id}` | Link | — |
| **Anchor today's head** | Sidebar, in the chain box | `POST /v1/ledger/anchor` | 28 px | "Anchored 2026-09-27: row #73 · 1f91a759…" (also runs by itself at 23:55 IST) |

The sidebar shows the **whole** ledger (§11) without signatures.

---

## 11. Ledger panel (application page, console Audit tab, Committee sidebar)

| Control | On click → calls | Size | What you see |
|---|---|---|---|
| **Verify chain** | `GET /v1/ledger/verify` — recomputes the **whole** chain on the server | 28 px, spinner while checking | Before: "Every row carries the hash of the one before it…". Green "Intact — 73 rows recomputed, head #73 1f91a7596b…." or red "Broken at row #N (…). Everything after it is untrusted." |
| Signatures | Shown when there is a file and signatures exist or you can sign | Bordered box; **DEMO KEY · NOT A DSC** badge in demo signing | Each: approval, certificate, **verifies** / **DOES NOT VERIFY** (re-checked every load) |
| **Sign {DEPT}'s approved decision on A##** | Officer (own department) / admin only. Demo signing: `POST /v1/sign`. External DSC: fetches the payload and opens the form below. | 32 px, full width, blue | Amber note: "Demo signer — this build holds a test key…" |
| External DSC form | Inline | 10 px mono boxes: payload (read-only), **Signature (base64)**, **-----BEGIN CERTIFICATE-----** | "Sign this payload with your DSC utility (SHA-256)…" |
| **Verify and record** / **Cancel** | `POST /v1/sign/record` / closes | 28 px | "Signature verified against the certificate and recorded." |
| Ledger rows | — | Scroll area up to **560 px** tall, newest first | "#45 decision.signed A05 · 26 Sept, 05:25 pm · midc · APP-2026-0200 · d6324cb7a42a…" (hover = full hash). Hidden in the console (compact). |

---

## 12. Rule review — `/rules` (live)

**Layout.** Desk bar, centred column **1080 px**.

| Control | On click → calls | Size | What you see |
|---|---|---|---|
| Tab **Awaiting review** (default) | `GET /v1/rules?status=draft` | 40 px tabs | Draft cards. Empty: "No drafts waiting". Loading: 2 skeletons (140 px). |
| Tab **Published** | `?status=published` | — | Cards with "Reviewer's note: …" |
| Tab **Rejected** | `?status=rejected` | — | Same |
| Source ↗ icon | Opens the source document in a **new tab** | 12 px | — |
| **Your note — what you checked against the source** | Typing (1000 chars) | 36 px, full width | — |
| **Publish as new rule version** | `POST /v1/rules/{A}/{v}/publish` | 32 px, blue; **5+ chars** | Card leaves the tab; new rule-set version v1.x+1. Refused with the cycle path if it would create a loop. |
| **Reject draft** | `POST …/reject` | 32 px, red outline; 5+ chars | Card moves to Rejected |

A rule card shows: ID + version, name, confidence (amber under 80 %), Department, Service limit, Deemed, Source, the quoted excerpt with page, documents, proposed dependency edges, and pipeline flags.

---

## 13. Gaps — status after the UX pass

| # | Gap found on 27 Sep | Now |
|---|---|---|
| 1 | Wizard ignored Sector, Location, Stage | **Fixed.** Every answer travels to the roadmap. Options the rule base does not cover are listed but greyed out, so the roadmap can never be the food-processing one under another label. |
| 2 | Two grievance systems | **Fixed in live mode.** The Pre-Check points to My applications; the console Redress tab reads the server. The browser-only dialog remains in the offline demo and says so. |
| 3 | Report a rejection was browser-only | **Disclosed.** Button reads "Save report" and the confirmation says it stays in this browser. A server endpoint does not exist yet. |
| 4 | Dead controls on sign-in | **Fixed.** English ▾ removed; Remember me works; Forgot password? opens a help note; support and footer links replaced by real text and a real link. The wizard's "View the schema →" is a link. |
| 5 | Change answers reset the wizard | **Fixed.** The wizard reopens with the earlier answers. |
| 6 | Inconsistent dialog closing | **Fixed.** One rule for every dialog (§4.10). |
| 7 | Visits used the default roadmap | **Fixed.** Bound to the file's approvals. |
| 8 | Explain did nothing on three pages | **Fixed.** Notes added on the roadmap, graph, simulator and standard. |
| 9 | Sign-out missing on `/standard` | **Fixed.** |
| 10 | Sample dossier needed ~10 uploads | **Fixed.** The sample lacks exactly one document (Board resolution): the pre-check refuses one approval, one upload clears it. |

Still open, by design or by size:
- The three-column console is a desktop layout. Below 1024 px it scrolls sideways rather than collapsing the context panel into a drawer.
- Field reports have no server endpoint.
- Delay analytics for the Committee are not built.

---

## 14. What is saved, and where

| Data | Where | Survives |
|---|---|---|
| Session, Explain on/off | This browser (`localStorage`) | Reloads |
| Rejection reports, roadmap grievances | This browser (`localStorage`) | Reloads; never reaches the server |
| View, tab, selected approval, clock, conditions on the roadmap | Memory | Moving between pages; reset on a full reload |
| Console files (demo) | Memory | Lost on reload |
| Applications, documents, files, decisions, queries, grievances, signatures, ledger (live) | PostgreSQL on the server | Everything; ledger rows cannot be edited or deleted |

---

## 15. Messages you may see (live mode)

The page shows the server's message word for word.

| When | Message |
|---|---|
| Token missing / expired (you are signed out) | "Sign in first." · "Your session has expired or the token is not valid. Sign in again." |
| Wrong role for a page action | "This needs the {role} role; you are signed in as {role}." |
| Acting on another department's desk | "Only {DEPT} can act on the {DEPT} desk. You are signed in for {dept}." |
| Reject with a short reason | "A rejection must state its reasons (MAITRI Act, 2023 — s. 4(3))." |
| Second query on a desk | "{DEPT} already has a query open." |
| Filing when the pre-check fails | "The file would be refused at the counter. Fix these first." |
| Filing twice | "Already {status}." |
| Upload of a wrong file type / too large | "Only PDF, PNG and JPEG files are accepted." · "Files must be under 20971520 bytes." |
| Grievance on a decided desk | "{A##} is already decided ({state})." |
| Two people changed the file at once | "The file changed while you were working on it. Reload and try again." |
| Publishing a rule that loops | "Publishing this would create a dependency cycle. A → B → … → A" |
| Signing someone else's decision | "An officer signs only their own department's decision." |
| Bad DSC signature | "The signature does not match this decision and certificate." |
| Advancing the clock on a real server | "The clock moves by itself. Advancing it is a demo control." |
| Any bad input the server rejects | "The request did not match the expected shape." (the field-level reason, e.g. PAN format, is not shown) |
| Server down | "Could not reach the ANUMATI server. Check that it is running." |

---

## 16. UX pass, 27 Sep — what changed on screen

| Area | Change |
|---|---|
| Every disabled button | Keeps its tooltip (disabled buttons no longer swallow the pointer), and the important ones say why in text next to them — **Finalise approval** ("Not yet — 4 departments are still deciding (MSEDCL, CEIG, DISH, MPCB)"), **File N approvals now** ("Not yet — 1 approval in today's wave would be refused"), Reject, Publish, Committee decisions (character counters). |
| Loading | Buttons name what they are doing: Dispatching…, Filing…, Saving…, Uploading…, Sending…; the decision bar shows "Saving…" while a command is with the server. |
| Errors | Every error shows the server's words plus **Next:** — the step to take, chosen by the kind of failure (403 other department, 409 reload, 0 server down…). Typed text survives a refused command. |
| Mode badge | Now a button: the **What is real here** card lists Data, Saved, Government systems, Signing, Rules · engine. |
| Status words | One vocabulary everywhere: WAITING (was OPEN), PROCESSING, **QUERY OPEN** (a desk that has asked the applicant — its clock is stopped), APPROVED, REJECTED, DEEMED APPROVED, WITH COMMITTEE. |
| Application page | A summary strip first — STATUS · DAY · DESKS DECIDED (with bar) · **YOUR NEXT ACTION** (amber when it is yours: "Answer MIDC's query — its clock is paused until you do"). Desks waiting on you are listed first. |
| Console header | Breadcrumb: Clearance Console › APP-… › Initial review / Parallel review / Conflict / Final decision. The phase stepper keeps its names readable; the verdict chip wraps below. |
| Conflict screen | A numbered strip of what happened, in order: who approved, who rejected, which rule applies, what is available now. |
| SLA tab | **SLA HEALTH** line first: within limit · near limit · overdue · paused (query) · with Committee · waiting. |
| Data Matrix | Each record says what its state means and what to do next; a mismatch "is flagged, never an automatic rejection". |
| Thread | Department messages show the approval they are about ("Re: A15 Consent to Establish"). |
| All Approvals | Quick filters: **Critical path**, **Deemed clause**, **Under review**, with counts; the empty state clears both filters. |
| Ledger | Signatures header counts verified / failing / to sign. |
| Committee | Every card says **After your decision:** what the decision will do. |
| Dialogs | Focus trapped and returned; Esc and backdrop close unless you have typed; Esc never closes the panel behind a dialog; 200 ms entrance. |
| Buttons | 1 px press feedback; motion stops under reduced-motion settings. |
