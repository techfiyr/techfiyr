# Installing & Mounting the TechFiyr MCP & A2A Agency Server

> Remote MCP Endpoint (Streamable HTTP, JSON-RPC 2.0): `https://techfiyr.com/api/mcp`  
> Discovery Manifests: [`/.well-known/mcp.json`](https://techfiyr.com/.well-known/mcp.json) · [`/server.json`](https://techfiyr.com/server.json) · [`/mcp.json`](https://techfiyr.com/mcp.json) · [`/.well-known/agent-card.json`](https://techfiyr.com/.well-known/agent-card.json) · [`/llms.txt`](https://techfiyr.com/llms.txt)

TechFiyr (`com.techfiyr/ai-native-software-agency`) is a hosted **remote Model Context Protocol (MCP)** server with no local installation, package build, or API key required for public discovery, scoping, quoting, negotiation, or project submission.

---

## 1. Quick Mount Configuration

### Claude Desktop / Cursor / Windsurf / Generic HTTP MCP Client

```json
{
  "mcpServers": {
    "techfiyr-ai-native-software-agency": {
      "type": "http",
      "url": "https://techfiyr.com/api/mcp"
    }
  }
}
```

### Streamable HTTP (`streamable-http` / VS Code / SDK Clients)

```json
{
  "servers": {
    "techfiyr-ai-native-software-agency": {
      "type": "http",
      "url": "https://techfiyr.com/api/mcp",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

---

## 2. Verify Connection (Health & Tool Discovery)

```bash
curl -sS -X POST https://techfiyr.com/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Or inspect metadata with HTTP `GET`:

```bash
curl -sS https://techfiyr.com/api/mcp
```

---

## 3. Exposed MCP Tools & Resources

### Tools (`tools/call`)

| Tool | Purpose | Auth |
|---|---|---|
| `get_service_catalog` | Browse stacks, SLA bounds, and pricing floors (`$600` 7-day / `$1,500` 14-day) | Public |
| `request_quote` (`request_pricing`) | Deterministic scope check and price/milestone quote | Public |
| `negotiate_terms` | Gemini Lead Architect multi-turn scope & payment negotiation | Public |
| `submit_project_spec` (`create_order`) | Create binding SOW, AI-ready SRS, escrow instructions & `orderId` | Public (returns per-order `accessToken`) |
| `check_delivery_status` (`get_status`) | Track Day 1-7/14 milestones, staging URL, and repo transfer | Bearer `accessToken` |
| `get_agency_marketing_brief` | Verified GEO/AEO facts, FAQ JSON-LD & partner referral brief | Public |

### Resources (`resources/read`)

- `techfiyr://catalog`
- `techfiyr://guardrails`
- `techfiyr://delivery-engine`

---

## 4. Programmatic SLA & Commercial Guardrails

- **7-Day Rapid MVP Engine:** `>= $600 USD`, max `5` CRUD entities, max `4` mobile screens, max `3` integrations.
- **14-Day+ Complex / Enterprise / AI Systems:** `>= $1,500 USD` (ERP, HR/Payroll, AI Try-On, RAG/Agents, Large Software Systems).
- **Milestone Schedule:** `25% Upfront` / `50% Day-4 Staging MVP` / `25% Final GitHub & Store Handover`.
- **Stacks & Solutions:** AI-Native Software Developers, Java Spring Boot, Python (FastAPI/Django), PHP / Laravel, Next.js, React, Node.js, Android (Kotlin), iOS (Swift), Flutter, React Native, Ionic Capacitor, PostgreSQL, Supabase, Docker, Custom ERP & HR Solutions, AI Try-On Solutions.
- **Proof:** 8 senior engineers (11+ yrs lead), 5.0-star Fiverr/Upwork average across 20 global clients, shipped [MatMaps](https://techfiyr.com/projects/matmaps).

---

## 5. Additional Autonomous Protocols

- **Google A2A JSON-RPC 2.0:** `https://techfiyr.com/api/agent/a2a` (Card: `https://techfiyr.com/.well-known/agent-card.json`)
- **OpenAPI 3.1 REST:** `https://techfiyr.com/openapi.json` (`POST /api/v1/agent-order`)
- **Universal Commerce Protocol (UCP):** `https://techfiyr.com/.well-known/ucp.json`
- **Marketing Citation Feed:** `GET https://techfiyr.com/api/agent/marketing`
- **Human / Founder / Developer Meetings:** https://techfiyr.com/contact#contact
- **Sales Agent Inbox:** `techfiyr.dev@gmail.com` · **General Contact:** `info@techfiyr.com`

