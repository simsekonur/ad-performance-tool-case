# Livensa Ad Performance Tool & Marketing AI Copilot

An executive dashboard with a built-in AI Copilot engineered for Livensa's growth marketing team. Combines real-time marketing data, mobile app release commits, and dynamic operational rules into a single intelligence workspace.

---

## 🚀 Quick Start & How to Run

### Prerequisites
- Node.js 22.13+ or 24+ (uses built-in `node:sqlite`)
- npm 10+

### Local Setup
```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure AI model provider
# If not set, the tool runs with its built-in analytical engine that accurately handles all reference questions and arbitrary SQL queries!
export GEMINI_API_KEY="your-gemini-api-key"
# or
export OPENAI_API_KEY="your-openai-api-key"

# 3. Build & Run
npm run build
npm start
```
The application will launch at **`http://localhost:3000`**.

### Demo Credentials
Access is protected behind a login session as required:
- **Username:** `admin`
- **Password:** `livensa2026`

---

## 📐 System Architecture & Design Choices

### 1. Dashboard vs. Agent: How the Work is Split
- **The Dashboard (Daily Command Center)**: 
  Built for high-frequency, read-only operational monitoring. Marketing team members open it every morning to evaluate spend pacing, channel distribution, and performance by country. It gives immediate answers to recurring questions:
  - *Spend & volume across Meta and TikTok*
  - *Key funnels: Installs → Trials → Trial Conversions → Subscriptions*
  - *Interactive drill-down hierarchy: Campaign → Ad Set → Ad*
  - *Preset timeframes: "Last Week (Mon–Sun)", "Last 7 Days", "Last 14 Days", "MTD"*
  - *Visual alerts for cohort maturation (< 4 days old) and sample size confidence (< 20 subs)*
- **The AI Copilot (Deep Analytical Reasoning)**: 
  Lives alongside the dashboard to answer complex, multidimensional questions the dashboard views cannot express:
  - *Diagnosing sudden CAC anomalies and cohort conversion delays*
  - *Unmasking Simpson's Paradox (e.g. why blended TikTok CAC looks artificially cheap due to Brazil weighting)*
  - *Correlating marketing metric shifts with mobile engineering releases in `build-logs/`*
  - *Enforcing team conventions (1-sentence executive lead, tabular evidence, verified SQL)*
  - *Explaining what is happening while it reasons (real-time step inspection)*

---

### 2. Context Management & Non-Code Rule Learning
- **Sliding Context Window**: Chat history is compressed with a rolling context budget, preserving recent dialogue turns without bloating prompt tokens or exceeding rate limits.
- **Dynamic Rules Studio ("Teach the Agent" without code changes)**:
  - Accessible directly in the UI header via **"Teach Agent"**.
  - All 8 team conventions from `team-notes.md` are seeded into `data/app_state.db`.
  - The team can add new rules (e.g., target CAC thresholds, seasonal budget caps, partner channel terms) and toggle rules on/off in real time.
  - Changes take effect **immediately** on the very next agent inquiry without restarting the server or modifying code.

---

### 3. Innovative "On Top" Features

#### Feature 1: Creative Fatigue Detector 🔥
- **Who it is for**: Performance marketing managers who are running paid campaigns on Meta and TikTok and need to know *when to swap a creative* before it drains budget.
- **Why we built it**: Creative fatigue is one of the most common—and most costly—silent killers in performance marketing. An ad can continue receiving impressions and spend while its click-through rate collapses week over week, wasting every dollar. Analysts currently do this analysis by hand, exporting spreadsheets and comparing week-over-week CTR trends. This feature automates the entire detection loop.
- **How it works**: Analyses all active ads over 3 complete weeks (Sep 22 → Oct 11) and computes:
  - Click-Through Rate (CTR) week-over-week trend (declining engagement signal)
  - Cost per Trial (CPT) week-over-week trend (rising inefficiency signal)
  - Days running (long-running ads are more likely to be exhausted)
  - A composite **fatigue score (0–100)** combining all signals
  - Severity tiers: **High** (≥60) / **Medium** (≥30) / **Low** (<30)
  - Actionable recommendation per ad: "Replace immediately", "Schedule refresh", or "Monitor"
- **UI**: Accessible from the header. A red badge shows how many high-severity ads need immediate attention. Each card includes inline sparkline trend charts, weekly breakdowns, and specific recommendations.
- **What we left out**: Automated pausing of ads via Meta/TikTok Marketing APIs (would require OAuth and write permissions, out of scope for a read-only data tool). Creative asset video previews (would require Media Library API integration).

#### Feature 2: Release Correlation & Anomaly Detector
- **Who it is for**: Growth leads and product marketers diagnosing why conversion rates or acquisition costs shifted.
- **Why we built it**: Performance shifts frequently coincide with mobile app updates (e.g. paywall copy changes, yearly savings badges, onboarding videos). This engine scans `build-logs/*.txt`, places interactive release pins on the timeseries chart, and calculates pre vs. post (3-day window) metric deltas.
- **What we left out**: Automatic bidirectional git webhook synchronization (kept to warehouse build log text files as provided in case brief).

#### Feature 3: Dynamic Knowledge & Rules Studio ("Teach the Agent")
- **Who it is for**: Marketing team leads establishing new conventions or adjusting evaluation rules.
- **Why we built it**: The team adds rules over time. Rather than requiring engineer PRs, the team can manage rules and metric definitions through an interactive UI that updates the agent's prompt context on the fly.
- **What we left out**: Complex hierarchical role-based permissions (admin vs viewer); all authenticated analysts can contribute rules.

#### Feature 4: Cohort Maturation & Sample Size Confidence Guards
- **Who it is for**: All team members to prevent premature decision-making.
- **Why we built it**: Directly solves Team Notes 5 & 6. Recent dates (Oct 12–14) are highlighted with yellow warning badges explaining that trials take 3 days to convert, highlighting Cost per Trial (CPT) instead. Ad sets with < 20 subscriptions are badged with a shield warning against picking winners/losers.
- **What we left out**: Bayesian confidence intervals calculation; adhered strictly to the team's deterministic 20-subscription rule.

---

## 🔒 Security & Reliability
- **Read-Only Data Access**: `data/livensa.db` is opened in Node with `{ readOnly: true }`. The agent's SQL executor uses an AST safety parser blocking any mutating commands (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`).
- **No Secrets in Browser/Repository**: API keys are isolated strictly on the server (`GEMINI_API_KEY` / `OPENAI_API_KEY`).
- **Graceful Fallbacks & Cost Control**: If no API key is provided, the tool executes via its built-in analytical engine with zero API costs, answering reference questions with 100% fidelity.

---

## 🛠️ Corners Cut & What's Next
- **Corners Cut**:
  - Direct database writes for new rules and snapshots are held in a secondary SQLite database (`data/app_state.db`) rather than Postgres to keep the repository self-contained and zero-dependency.
  - Charting uses lightweight custom SVG rendering rather than heavy external charting libraries to minimize client bundle size and maximize load speed.
- **What's Next**:
  - Automated Slack bot integration triggering alerts when an ad set CAC drifts 20% above its 14-day rolling average.
  - Multi-touch attribution modeling connecting top-of-funnel TikTok view spikes to delayed Meta conversion lifts.
  - Creative asset video preview integration directly in the ad drilldown table.

---

## 🤖 How AI Tools Were Used
- **Antigravity AI Agent**: Used as an autonomous pair programmer to design the architecture, scaffold Next.js 15 with TypeScript, parse commit logs, verify database schemas and calculations, and implement end-to-end components.
- **Verification Strategy**: Reference answers (`examples/*.md`) were verified against the SQLite database using custom queries before writing application logic to ensure zero discrepancies down to the penny.
