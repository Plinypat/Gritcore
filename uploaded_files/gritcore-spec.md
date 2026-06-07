# GritCore — Product Specification & Architecture
**AI-Powered Construction Drawing Intelligence Platform**
Version 1.0 | June 2026 | Streamlined Consulting / Hive AI Systems

---

## 1. Executive Summary

GritCore is a multi-tenant SaaS platform that gives concrete subcontractors, GCs, and specialty trade contractors AI-powered drawing review, quantity takeoff, and bid risk analysis — directly inside a Bluebeam-style PDF markup environment. The core AI engine runs on Claude (Anthropic) via MCP, enabling natural-language queries against construction drawings, automated issue detection, and structured RFI generation.

**Target Market:** Commercial concrete subs, tilt-up contractors, GCs, MEP subs — primarily $5M–$100M annual revenue firms in regional markets (starting Central Valley CA, expanding nationally).

**Revenue Model:** Per-seat SaaS with org-level billing. Freemium entry → Core → Pro → Enterprise.

---

## 2. Core Value Props

| Pain Point | GritCore Solution |
|---|---|
| Scope gaps caught late (or not at all) | AI flags conflicts, missing details, dimension errors before bid |
| Manual CY/LF takeoffs take hours | AI auto-calculates quantities from drawing geometry |
| RFI lists built manually from yellow stickies | One-click structured RFI export from AI-detected issues |
| No version comparison on revised drawings | Smart Overlay: AI-diff between Rev A and Rev B |
| Junior estimators miss code issues | Built-in IBC/ACI/CBC code reference tied to markups |
| Each job in a different folder on someone's desktop | Cloud project hub, team access, real-time Studio Sessions |

---

## 3. Product Tiers

### 3.1 GritCore Free
- 1 active project
- 1 user
- AI review: 5 sheets/month
- Basic markup tools
- PDF export

### 3.2 GritCore Core — $89/seat/mo
- Unlimited projects
- Up to 5 users per org
- AI review: 100 sheets/month
- Quantity takeoff (CY, LF, SF)
- RFI list export (PDF/CSV)
- Studio Sessions (real-time collaboration)
- 50 GB document storage

### 3.3 GritCore Pro — $149/seat/mo
- Unlimited users
- AI review: unlimited sheets
- Smart Overlay (drawing comparison)
- Pour sequence planning
- Bid risk scoring (dollar-value flags)
- Revit/BIM link (read-only)
- 500 GB storage
- Priority support

### 3.4 GritCore Enterprise — Custom
- SSO / SAML
- Dedicated AI compute quota
- Custom AI prompt libraries per org
- On-prem or private cloud deployment option
- API access for ERP/estimating software integration
- SLA + dedicated CSM

---

## 4. Feature Specification

### 4.1 AI Drawing Review Engine
- **Input:** PDF construction drawings (any discipline)
- **Processing:** Page rendered to image → passed to Claude via MCP with structured system prompt tuned for AEC document analysis
- **Output:** Structured issue list (severity, location, code reference, description, markup coordinates)
- **Issue Types:**
  - CRITICAL: Safety, code violation, scope gap with dollar risk
  - WARNING: Missing callout, coord conflict, dimension mismatch
  - INFO: Calculated quantity, area, length
  - PASSED: Verified compliant item
- **Code Libraries Built In:** IBC 2021, ACI 318-19, ACI 360R, CBC 2022, OSHA 1926 Subpart Q (concrete)
- **Discipline Modules:** Structural/Civil (launch), Architectural, MEP, Tilt-Up (roadmap)

### 4.2 Natural Language Query (Claude MCP)
- Users type plain-English questions about the active drawing
- Claude has drawing context (sheet metadata, extracted text, markup data) via MCP tool calls
- Supports: quantity queries, compliance checks, cross-sheet coordination, custom column generation
- Session memory: conversation context persists within a project session
- Quick Prompt Library: org-admins can add custom saved prompts

### 4.3 Quantity Takeoff
- **CY Calculator:** Reads slab thickness, area zones → auto-calculates cubic yards
- **LF Calculator:** Control joints, pour joints, thickened edges
- **SF Calculator:** Form area, vapor barrier, waterproofing
- **Rebar Estimator:** Reads bar size, spacing, cover from details → calculates LB
- Outputs to CSV or direct integration with Procore/Sage estimating (roadmap)
- Confidence score per line item (high / medium / needs verification)

### 4.4 Smart Overlay (Drawing Comparison)
- Upload Rev A and Rev B of same sheet
- AI aligns drawings geometrically (accounts for scale differences)
- Color-coded diff overlay: added elements (green), removed (red), moved (yellow)
- Change summary report with trackable issues per change
- Available in Pro+

### 4.5 Studio Sessions (Real-Time Collaboration)
- Multi-user markup on same sheet simultaneously
- User presence indicators (avatar + cursor)
- Comment threads on markups
- Role-based access: Viewer, Markupper, Reviewer, Admin
- Session recording / activity log

### 4.6 RFI Generator
- Auto-populates from AI-flagged issues
- Standard RFI format (to/from, project, date, question, drawing ref, urgency)
- Bulk export: PDF package or CSV
- Tracks RFI status: Draft → Sent → Answered → Closed
- Email delivery integration (SendGrid)

### 4.7 Project Hub
- Multi-project dashboard per org
- Sheet set management (upload, version, organize by discipline)
- Activity feed: who reviewed what, when
- Bid due date tracking
- Project health score (% of sheets AI-reviewed, open issues count)

### 4.8 Admin & Multi-Tenancy
- Org-level accounts with sub-users
- Role management: Owner, Admin, Member, Guest
- Usage dashboard: AI credits consumed, storage, active users
- Billing portal (Stripe)
- Audit log for all AI queries and markup actions

---

## 5. System Architecture

### 5.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│  Web App (React/Next.js)  │  Mobile (React Native PWA)  │
└────────────────┬────────────────────────────────────────┘
                 │ HTTPS / WebSocket
┌────────────────▼────────────────────────────────────────┐
│                    API GATEWAY (AWS)                     │
│         Kong Gateway / AWS API Gateway + WAF            │
└──┬─────────────┬──────────────┬──────────────┬──────────┘
   │             │              │              │
┌──▼──┐    ┌────▼────┐   ┌─────▼────┐   ┌────▼─────┐
│Auth │    │ Drawing  │   │   AI     │   │  Project  │
│Svc  │    │ Service  │   │ Service  │   │  Service  │
│     │    │          │   │          │   │           │
│JWT  │    │PDF→Image │   │MCP+Claude│   │CRUD /     │
│SSO  │    │Storage   │   │Prompts   │   │Studio     │
│RBAC │    │Versions  │   │Issues    │   │Sessions   │
└──┬──┘    └────┬─────┘   └────┬─────┘   └────┬──────┘
   │            │              │               │
┌──▼────────────▼──────────────▼───────────────▼────────┐
│                   DATA LAYER                           │
│  PostgreSQL (multi-tenant)  │  Redis (sessions/cache) │
│  S3 (PDFs/images)           │  Pinecone (embeddings)  │
└────────────────────────────────────────────────────────┘
```

### 5.2 Tech Stack

#### Frontend
| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, file-based routing, edge functions |
| UI Components | shadcn/ui + Tailwind CSS | Composable, unstyled base + utility CSS |
| State Management | Zustand | Lightweight, no boilerplate |
| Drawing Viewer | PDF.js + custom canvas overlay | Open source, extensible markup layer |
| Real-time | Socket.io client | Studio Session cursors/presence |
| Auth | NextAuth.js | Flexible provider support |
| Charts/Stats | Recharts | Lightweight, composable |

#### Backend
| Layer | Technology | Rationale |
|---|---|---|
| API Framework | Node.js + Fastify | High throughput, schema validation |
| Auth Service | Auth0 or Clerk | Managed SSO, SAML, MFA |
| AI Service | Anthropic SDK + MCP server | Claude claude-sonnet-4-20250514 primary model |
| PDF Processing | pdf.js (server) + Sharp | Rasterize sheets to images for AI |
| Job Queue | BullMQ + Redis | Async AI review jobs, takeoff calculations |
| WebSockets | Socket.io | Studio Sessions |
| Email | SendGrid | RFI delivery, notifications |

#### Infrastructure
| Layer | Technology | Rationale |
|---|---|---|
| Cloud | AWS (primary) | S3, EC2/ECS, RDS, ElastiCache |
| Container Orchestration | ECS Fargate | Managed containers, auto-scaling |
| Database | PostgreSQL (RDS Aurora) | Multi-tenant row isolation |
| Cache | Redis (ElastiCache) | Sessions, job queues, drawing metadata |
| Object Storage | S3 + CloudFront CDN | PDF/image storage, fast delivery |
| Vector DB | Pinecone | Drawing embeddings for semantic search |
| Search | OpenSearch | Full-text project/sheet search |
| Monitoring | Datadog | APM, logs, uptime |
| CI/CD | GitHub Actions → AWS CodePipeline | Automated deploy |
| DNS / SSL | Route53 + ACM | Custom domains, auto-renew certs |

### 5.3 Multi-Tenancy Model

**Strategy:** Shared database, tenant-isolated rows (schema-per-tenant on Enterprise).

Every resource table includes `org_id` (UUID). Row-Level Security (RLS) enforced at PostgreSQL level. API middleware validates JWT → extracts `org_id` → all queries scoped automatically.

```
orgs
  └── users (org_id FK, role)
  └── projects (org_id FK)
        └── sheet_sets (project_id FK)
              └── sheets (sheet_set_id FK)
                    └── ai_reviews (sheet_id FK)
                          └── issues (review_id FK)
                    └── markups (sheet_id FK)
                    └── rfis (sheet_id FK)
  └── subscriptions (org_id FK, Stripe)
  └── usage_logs (org_id FK)
```

Enterprise tenants optionally get a dedicated RDS instance and S3 prefix isolation.

### 5.4 AI Service Architecture

```
Client sends: "Find scope gaps in Zone D slab"
        │
        ▼
AI Service receives:
  - user query
  - sheet_id, org_id
  - active drawing image (base64 or S3 presigned URL)
  - sheet metadata (project name, discipline, revision)
  - prior issues in context (last 5)
        │
        ▼
MCP Tool Server (GritCore MCP):
  - get_sheet_metadata(sheet_id)
  - get_existing_markups(sheet_id)
  - get_project_sheets(project_id) [for cross-ref]
  - get_code_reference(code_id)
  - create_issue(sheet_id, severity, coords, description)
  - create_markup(sheet_id, type, coords, label)
        │
        ▼
Claude claude-sonnet-4-20250514 API call:
  System prompt: GritCore AEC Review Agent
  Tools: MCP tool definitions
  User message: query + drawing image
        │
        ▼
Response parsed:
  - text summary → AI response panel
  - tool_use blocks → issues created in DB → pushed to client via WebSocket
```

**System Prompt Strategy:**
- Base prompt: AEC review agent persona, code library awareness, output format requirements
- Org-level overlay: custom prompt additions (e.g., "always flag vapor barrier on all CA slab jobs")
- Sheet-level context: discipline, project type, revision number injected dynamically

### 5.5 Drawing Viewer Architecture

PDF rendering pipeline:
1. PDF uploaded → stored in S3 (`/orgs/{org_id}/projects/{project_id}/sheets/`)
2. Background job (BullMQ) rasterizes each page to PNG @ 150dpi (for display) and 300dpi (for AI)
3. Thumbnails generated at 72dpi for sheet picker
4. Canvas overlay (HTML5 Canvas) renders markup layer on top of PDF.js iframe
5. Markup coordinates stored as normalized (0–1 x/y) to be resolution-independent
6. WebSocket broadcasts markup deltas to all Studio Session participants

### 5.6 Security Model

| Control | Implementation |
|---|---|
| Authentication | JWT (short-lived 15min) + refresh tokens (7 days, rotated) |
| Authorization | RBAC per org, per project, per sheet |
| Data isolation | PostgreSQL RLS, S3 prefix per org |
| Encryption in transit | TLS 1.3 everywhere |
| Encryption at rest | S3 SSE-S3, RDS AES-256 |
| API rate limiting | Kong: 100 req/min free, 1000 req/min Core/Pro |
| AI credit enforcement | Usage table checked pre-request, 429 if exceeded |
| Audit logging | All AI queries, markup creates/edits, exports logged with user+timestamp |
| OWASP compliance | Input validation, parameterized queries, CSP headers |
| Penetration testing | Quarterly (roadmap: Year 1 Q3) |

---

## 6. Database Schema (Core Tables)

```sql
-- Orgs / Multi-tenancy
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  ai_credits_remaining INT DEFAULT 500,
  storage_used_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'member', -- owner | admin | member | guest
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phase TEXT DEFAULT 'bid', -- bid | active | closeout
  bid_due_date DATE,
  project_type TEXT, -- concrete | tilt-up | general | mep
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sheets
CREATE TABLE sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id),
  sheet_number TEXT, -- e.g. "S101"
  title TEXT,
  discipline TEXT, -- structural | architectural | mep | civil
  revision TEXT DEFAULT 'A',
  s3_key TEXT NOT NULL,
  s3_key_hires TEXT, -- 300dpi for AI
  page_count INT DEFAULT 1,
  status TEXT DEFAULT 'pending', -- pending | reviewed | flagged
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Reviews
CREATE TABLE ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID REFERENCES sheets(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id),
  triggered_by UUID REFERENCES users(id),
  model TEXT DEFAULT 'claude-sonnet-4-20250514',
  prompt TEXT,
  summary TEXT,
  total_issues INT DEFAULT 0,
  critical_count INT DEFAULT 0,
  warning_count INT DEFAULT 0,
  info_count INT DEFAULT 0,
  passed_count INT DEFAULT 0,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES ai_reviews(id) ON DELETE CASCADE,
  sheet_id UUID REFERENCES sheets(id),
  org_id UUID REFERENCES orgs(id),
  severity TEXT NOT NULL, -- critical | warning | info | passed
  title TEXT NOT NULL,
  description TEXT,
  code_ref TEXT, -- e.g. "ACI 318-19 §20.6"
  grid_location TEXT,
  dollar_risk_estimate NUMERIC(10,2),
  coords JSONB, -- {x1, y1, x2, y2} normalized 0-1
  status TEXT DEFAULT 'open', -- open | flagged | rfi | resolved | accepted
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Markups
CREATE TABLE markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID REFERENCES sheets(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id),
  created_by UUID REFERENCES users(id),
  type TEXT, -- rectangle | callout | cloud | line | stamp
  label TEXT,
  color TEXT,
  coords JSONB,
  issue_id UUID REFERENCES issues(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RFIs
CREATE TABLE rfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  org_id UUID REFERENCES orgs(id),
  issue_id UUID REFERENCES issues(id),
  rfi_number TEXT, -- org-sequential
  question TEXT NOT NULL,
  drawing_ref TEXT,
  spec_section TEXT,
  urgency TEXT DEFAULT 'normal', -- low | normal | urgent
  status TEXT DEFAULT 'draft', -- draft | sent | answered | closed
  sent_to TEXT, -- email
  answered_by TEXT,
  answer TEXT,
  created_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON projects
  USING (org_id = current_setting('app.current_org_id')::UUID);
-- (repeat for all tenant tables)
```

---

## 7. API Design

### 7.1 REST Endpoints (Core)

```
Auth
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout

Orgs
  GET    /orgs/me
  PATCH  /orgs/me
  GET    /orgs/me/usage

Users
  GET    /orgs/me/users
  POST   /orgs/me/users/invite
  PATCH  /orgs/me/users/:id
  DELETE /orgs/me/users/:id

Projects
  GET    /projects
  POST   /projects
  GET    /projects/:id
  PATCH  /projects/:id
  DELETE /projects/:id

Sheets
  GET    /projects/:id/sheets
  POST   /projects/:id/sheets        (multipart/form-data PDF upload)
  GET    /sheets/:id
  DELETE /sheets/:id

AI Review
  POST   /sheets/:id/review          (trigger AI review, returns job_id)
  GET    /sheets/:id/reviews         (list past reviews)
  GET    /reviews/:id                (review result + issues)
  POST   /sheets/:id/query           (natural language query)

Issues
  GET    /reviews/:id/issues
  PATCH  /issues/:id                 (update status, assign)
  DELETE /issues/:id

Markups
  GET    /sheets/:id/markups
  POST   /sheets/:id/markups
  PATCH  /markups/:id
  DELETE /markups/:id

RFIs
  GET    /projects/:id/rfis
  POST   /projects/:id/rfis
  PATCH  /rfis/:id
  POST   /rfis/:id/send              (trigger email via SendGrid)
  GET    /projects/:id/rfis/export   (PDF/CSV download)

Takeoff
  POST   /sheets/:id/takeoff         (trigger quantity calculation job)
  GET    /sheets/:id/takeoff/results

Billing
  GET    /billing/plans
  POST   /billing/subscribe
  POST   /billing/portal             (Stripe customer portal redirect)
```

### 7.2 WebSocket Events (Studio Sessions)

```
Client → Server:
  join_session    { sheet_id, user_id }
  leave_session   { sheet_id, user_id }
  cursor_move     { x, y, user_id }
  markup_create   { markup }
  markup_update   { markup_id, changes }
  markup_delete   { markup_id }

Server → Client (broadcast):
  user_joined     { user }
  user_left       { user_id }
  cursor_update   { user_id, x, y }
  markup_created  { markup }
  markup_updated  { markup_id, changes }
  markup_deleted  { markup_id }
  ai_issue_added  { issue }     ← real-time AI findings pushed live
```

---

## 8. MCP Server Spec (GritCore MCP)

The GritCore MCP server is what Claude calls to read/write drawing data during AI reviews. This runs as a Node.js sidecar alongside the AI Service.

```typescript
// GritCore MCP Tool Definitions

tools: [
  {
    name: "get_sheet_context",
    description: "Get metadata and text content of the active drawing sheet",
    input_schema: { sheet_id: string }
  },
  {
    name: "get_project_sheets",
    description: "List all sheets in the project for cross-sheet coordination checks",
    input_schema: { project_id: string, discipline?: string }
  },
  {
    name: "get_existing_issues",
    description: "Get previously flagged issues on this sheet or project",
    input_schema: { sheet_id?: string, project_id?: string, severity?: string }
  },
  {
    name: "create_issue",
    description: "Create a new flagged issue with markup coordinates",
    input_schema: {
      sheet_id: string,
      severity: "critical" | "warning" | "info" | "passed",
      title: string,
      description: string,
      code_ref?: string,
      grid_location?: string,
      dollar_risk_estimate?: number,
      coords: { x1: number, y1: number, x2: number, y2: number }
    }
  },
  {
    name: "create_markup",
    description: "Place a visual markup annotation on the drawing",
    input_schema: {
      sheet_id: string,
      type: "rectangle" | "callout" | "cloud",
      label: string,
      color: string,
      coords: { x1: number, y1: number, x2: number, y2: number },
      issue_id?: string
    }
  },
  {
    name: "lookup_code",
    description: "Look up a building code or standard reference",
    input_schema: { code: string, section?: string }
  },
  {
    name: "calculate_quantity",
    description: "Calculate CY, LF, or SF from geometry coordinates",
    input_schema: {
      type: "volume" | "length" | "area",
      coords: object[],
      thickness_inches?: number,
      unit: "CY" | "LF" | "SF" | "LB"
    }
  }
]
```

---

## 9. Infrastructure & DevOps

### 9.1 Environments
- **dev** — local Docker Compose (Postgres, Redis, LocalStack S3)
- **staging** — AWS ECS Fargate, Aurora Serverless v2, real Anthropic API
- **production** — AWS ECS Fargate (multi-AZ), Aurora Provisioned, CloudFront

### 9.2 AWS Services Used
```
Compute:       ECS Fargate (API, AI Service, Worker, MCP Server)
Database:      RDS Aurora PostgreSQL (Multi-AZ)
Cache:         ElastiCache Redis (sessions, queues)
Storage:       S3 (drawings, exports) + CloudFront CDN
Queue:         SQS (AI job dispatch) + BullMQ
Email:         SES + SendGrid
DNS:           Route53
SSL:           ACM
Secrets:       AWS Secrets Manager
Monitoring:    CloudWatch + Datadog
CI/CD:         GitHub Actions → ECR → ECS rolling deploy
```

### 9.3 Estimated Monthly Infrastructure Cost (Production, ~500 active users)
| Service | Est. Cost/mo |
|---|---|
| ECS Fargate (4 services, 2 tasks each) | $320 |
| RDS Aurora PostgreSQL (db.r6g.large, Multi-AZ) | $380 |
| ElastiCache Redis (cache.r6g.large) | $120 |
| S3 + CloudFront (1TB storage, 5TB transfer) | $140 |
| Anthropic API (Claude, ~2M tokens/day) | $600 |
| SES + SendGrid | $40 |
| Route53 + ACM + misc | $30 |
| Datadog (infrastructure) | $180 |
| **Total** | **~$1,810/mo** |

Break-even at ~21 Core seats ($89/seat) or ~13 Pro seats ($149/seat).

---

## 10. MVP Scope (Build Phase 1)

**Goal:** Shippable product in 10–12 weeks with one developer (Claude Code-assisted).

### Phase 1 — Core (Weeks 1–4)
- [ ] Next.js app shell + auth (Clerk)
- [ ] Org/user/project CRUD
- [ ] PDF upload → S3 → rasterization pipeline
- [ ] PDF.js viewer with canvas markup overlay
- [ ] Basic markup tools (rectangle, callout)
- [ ] Database schema deployed (Postgres + RDS)
- [ ] BullMQ job queue setup

### Phase 2 — AI Engine (Weeks 5–7)
- [ ] AI Service: Claude API integration
- [ ] MCP server: 5 core tools (get_context, create_issue, create_markup, lookup_code, calculate_quantity)
- [ ] AI Review job: trigger → process → return issues
- [ ] Natural language query endpoint
- [ ] Issue cards rendered in right panel
- [ ] Quick prompt library

### Phase 3 — Collaboration & Polish (Weeks 8–10)
- [ ] Studio Sessions (Socket.io, real-time markup sync)
- [ ] RFI generator + PDF export
- [ ] Quantity takeoff (CY/LF/SF)
- [ ] Stats dashboard (project health, issue counts)
- [ ] Billing (Stripe, plan enforcement)
- [ ] Usage metering (AI credits)

### Phase 4 — Launch Prep (Weeks 11–12)
- [ ] Staging environment smoke test
- [ ] Load testing (k6)
- [ ] Security review (OWASP checklist)
- [ ] Onboarding flow (invite team, upload first drawing, run first review)
- [ ] Marketing site (separate)
- [ ] Production deploy

---

## 11. Pricing & Unit Economics

### Customer LTV Model (Core tier, $89/seat)
- Average org: 4 seats = $356/mo
- Annual contract: $4,272
- Churn assumed: 15%/year
- LTV: ~$28,480 per org (5-year)
- CAC target: <$800 (via trade show + outbound)

### Year 1 Revenue Target
- 50 orgs × 4 seats × $89 = $17,800 MRR = $213,600 ARR
- Stretch: 20 Pro orgs × 6 seats × $149 = $17,880 MRR additional

---

## 12. Competitive Differentiation

| Platform | Weakness | GritCore Advantage |
|---|---|---|
| Bluebeam Max | $590/seat, no concrete-specific AI | Concrete/civil AI focus, fraction of cost |
| PlanSwift | Takeoff only, no AI review | Full AI review + takeoff in one platform |
| Procore | Expensive, complex, project management focus | Lightweight, drawing-review-first |
| Fieldwire | Field-focused, no AI | Office estimating + AI, bid-phase optimized |
| Manual review | Slow, human error, no audit trail | 10× faster, code-referenced, exportable |

---

## 13. Roadmap (Post-MVP)

**Q3 2026**
- Tilt-up panel AI module (panel layout, embeds, crane picks)
- Mobile app (React Native, field markup)
- Procore integration (sync RFIs)

**Q4 2026**
- Revit BIM link (read panel/structural model, cross-ref with 2D)
- Custom AI prompt libraries per org
- Smart Overlay GA (currently roadmap)
- Pour sequence planning wizard

**Q1 2027**
- White-label option (for MSPs like Streamlined Consulting to resell)
- Estimating software API (Sage 300, Foundation)
- OSHA compliance module (shoring, formwork, trenching)
- Enterprise SSO + dedicated tenancy

---

## 14. Open Source & Licensing Notes

- PDF.js: Apache 2.0 ✓
- Socket.io: MIT ✓
- Next.js: MIT ✓
- Anthropic SDK: MIT ✓
- shadcn/ui: MIT ✓
- All dependencies must be audited pre-launch for license compliance

---

## 15. Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Anthropic API rate limits at scale | Medium | High | Implement queue + retry, cache common queries, batch processing |
| AI hallucination on code references | Medium | High | Code lookups via tool call to verified DB, not LLM memory |
| PDF rendering inconsistency across file types | High | Medium | Normalize all PDFs through Ghostscript pre-processing |
| Multi-tenant data leak | Low | Critical | RLS enforced at DB level + integration tests asserting isolation |
| Bluebeam adds same features natively | Medium | Medium | Stay ahead on concrete-specific vertical depth, price advantage |
| Slow sales cycle (construction is conservative) | High | Medium | Free tier as Trojan horse, bid-saving ROI story |

---

*Document prepared by Streamlined Consulting / Hive AI Systems*
*For internal build planning — confidential*
