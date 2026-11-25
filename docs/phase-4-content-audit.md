# Phase 4A content audit

Branch: `phase-4a-content-audit`  
Updated: 2026-11-24 (confirmation pass)  
Scope: verified facts, conflicts, confirmations, and remaining gaps. No case study UI in this phase.

## Sources used

- SiddhantaPortfolioV2: `src/content/projects.ts`, `about.ts`, `skills.ts`, `lab.ts`, `public/projects/*`
- Live portfolio: https://siddhantashrestha.com.np/
- Old portfolio repo: https://github.com/SiddhantaShrestha/SiddhantaPortfolio
- Public repos / READMEs for CiteDocs, Job Post Automation (LinkedIn n8n export), Research Evaluation Agent, YouTube Chatbot, RecipeNest
- Owner confirmations supplied for Phase 4A final content update

## Method

- Confirmed owner statements update ownership, contribution breadth, and product scope.
- Public repos still bound what can be described as **documented implementation detail**.
- Conflicts that remain are marked explicitly.
- No credentials or secret values are copied into this repo.

---

## 1. Recruit Nepal — confirmed

**Type:** Professional full-stack engineering work (major project).  
**Ownership:** Collaborative team product. Extensive personal contributions across the system. Not sole developer.

### Confirmed contribution areas

1. Employer dashboards and interfaces
2. Backend APIs and integrations
3. AI-powered CV extraction
4. Candidate search and matching
5. Recruiter workflows
6. Application tracking and management
7. Relevant Intern Nepal CRM development and integrations
8. Broader frontend and backend platform development

### Verified / retained evidence

- Live product: https://recruitnepal.com
- Stack confirmed by owner for Phase 4C Group A: Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui (Radix), TanStack Query, Zustand, React Hook Form, Zod, NextAuth, Framer Motion, Socket.IO, Node.js, Express, PostgreSQL, Sequelize, pgvector, Redis, BullMQ, JWT, Azure AI Document Intelligence, OpenAI, Anthropic, Gemini
- Homepage screenshot: `public/projects/recruitnepal.png`
- Applicant review screenshot: `public/projects/recruit-nepal-applicant-review.png`
  - Reviewed for Phase 4A: rows labeled Demo Applicant A/B; treated as test/demo data
  - Caption states test server; not production
- User metric: **7,597 unique users as of November 2026**, labeled as a **project-reported figure**, not independently audited, and not personal growth attribution

### Remaining gaps

1. Private infrastructure / internal diagrams stay unpublished by design.
2. No public application source repository.
3. Additional production-safe screenshots still optional.

---

## 2. Job Post Automation — confirmed

**Type:** AI and workflow automation.  
**Ownership:** Developed collaboratively with a team.

### Confirmed publishing platforms

1. LinkedIn
2. Facebook
3. Instagram

### Documented vs product scope

| Layer                                                                                  | Status                                                                                         |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Webhook intake, validation, Gemini caption/poster, Google Drive logo, LinkedIn publish | Documented in public n8n repo / README / diagram                                               |
| Facebook and Instagram publishing                                                      | Confirmed for the team project; **not** fully documented in the public LinkedIn-focused export |

Do **not** invent Facebook/Instagram API nodes, schedulers, or metrics. Case study copy states those channels as confirmed outputs and keeps node-level detail on the LinkedIn export.

### Remaining gaps

1. Public artifacts for Facebook/Instagram workflows (if any can be shared later).
2. Whether sample published posts are safe to show.

Previous LinkedIn-only portfolio wording is treated as incomplete and was updated in `projects.ts`.

---

## 3. Research Evaluation Agent — confirmed

**Ownership:** Independently developed.

### Confirmed workflow

1. Retrieve relevant information
2. Generate an initial response
3. Evaluate against defined criteria
4. Revise when score &lt; 8
5. Grounding / claim verification

**Stack:** Python, Groq, evaluation agents.  
**OpenClaw:** not part of this project (must not be listed).  
**UI framework:** unconfirmed. Do not claim Next.js or Streamlit as the shipped UI.

### Links

- Vercel demo (verified HTTP 200): https://autonomous-research-eval-agent.vercel.app — **included** in project links
- Render GET `/health` returned `{"status":"ok"}` after cold start — operational only, **not** linked as a user-facing demo

### Remaining gaps

1. Confirm exact UI framework when ready.
2. Optional scored-report screenshot.

---

## 4. RecipeNest — confirmed

**Ownership:** Independently developed.  
**Type:** Full-stack recipe management application.

### Confirmed features

1. User registration and authentication
2. Recipe browsing and searching
3. Recipe creation and management
4. Recipe categories and filtering
5. Favorites and saved recipes
6. Administrative dashboard
7. eSewa payment integration

### Stack

- React, Express, MongoDB, Node.js, eSewa
- **Payment:** eSewa only
- `@paypal/react-paypal-js` may exist as an unused frontend dependency; **not** a working PayPal integration

### Security (outstanding remediation — separate repo)

- `backend/.env` is committed on RecipeNest `main` with potentially sensitive non-placeholder values.
- Key **names** only were noted in the earlier audit; values were never copied here.
- **Do not** display, log, or publish secret values.
- **Do not** modify the RecipeNest repository without approval.
- **Do not** claim credentials are secured or rotated until that work is actually done.
- Status: **open remediation task**.

### Remaining gaps

1. Secret rotation / `.env` removal in the separate repo.
2. Optional additional screenshots beyond browsing UI.

---

## 5. CiteDocs — confirmed

**Ownership:** Independently developed.

### Confirmed implementation areas

1. Document uploading and processing
2. Embedding generation and semantic retrieval
3. Permission-based document access controls
4. AI question answering with source citations
5. Backend and database architecture
6. Frontend interface
7. Retrieval evaluation and improvements
8. Application deployment

### Verified tech / outcome

- Next.js, PostgreSQL/pgvector, Prisma, Ollama, optional Gemini
- Hit@5 **36/41 (~87.8%)** at **300-character** passages (retrieval evaluation context, not a generic accuracy score)
- Live demo + GitHub linked

### Screenshots

- Live demo requires authentication.
- Phase 4A does **not** fabricate screenshots.
- Keep existing evidence panel.
- Status: **screenshots pending** until a safe, non-sensitive capture is available.

---

## 6. YouTube Chatbot — confirmed retain

Keep Phase 4A technical audit as established:

- Streamlit, LangChain, FAISS, Hugging Face embeddings, OpenRouter
- Retrieval k=4; English captions
- Live demo, screenshot, public repo

**Ownership:** not explicitly confirmed. Language stays **neutral** (not “independently” or “collaboratively”) until verified.

### Remaining gaps

1. Ownership confirmation.
2. Optional evaluation metrics beyond the qualitative demo.

---

## Homepage / route compatibility

- `Project.caseStudy` remains optional.
- Slugs, routes, metadata shape, and 3D workstation unchanged.
- Card-facing fields (`summary`, `description`, `highlights`, `stack`, `links`) updated only where confirmations corrected incomplete or inaccurate wording (notably Job Post channels, Recruit Nepal breadth, RecipeNest features/stack, Research Agent demo link).
- No Phase 4B UI components in this pass.

## Confirmation checklist status

| Item                                            | Status                            |
| ----------------------------------------------- | --------------------------------- |
| Recruit Nepal breadth + collaborative ownership | Confirmed                         |
| Recruit Nepal test screenshot (demo rows)       | Accepted for use                  |
| Recruit Nepal 7,597 as project-reported         | Confirmed wording                 |
| Job Post LinkedIn + Facebook + Instagram        | Confirmed; repo detail = LinkedIn |
| Job Post collaborative ownership                | Confirmed                         |
| Research Agent independent + workflow + Groq    | Confirmed                         |
| Research Agent Vercel demo link                 | Confirmed include                 |
| Research Agent no OpenClaw / no unconfirmed UI  | Confirmed                         |
| RecipeNest independent + features + eSewa only  | Confirmed                         |
| CiteDocs independent + contribution list        | Confirmed                         |
| CiteDocs screenshots                            | Pending                           |
| YouTube ownership                               | Still open                        |
| RecipeNest `.env` remediation                   | Still open (separate repo)        |
