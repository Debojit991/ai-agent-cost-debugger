# 🎥 Video Presentation Script: AI Agent Cost Debugger

**Target Length:** 3 minutes 30 seconds  
**Speaker:** Lead AI Systems & DevOps Engineer  

---

## 🎬 Video Overview & Timestamps

```text
+-------------------+---------------------------------------------------------+
| Timestamp         | Segment                                                 |
+-------------------+---------------------------------------------------------+
| 0:00 - 0:45       | The Hook & Real-Time Observability Dashboard Demo       |
| 0:45 - 1:45       | Token Optimization Math & The Resiliency Fallback Flex   |
| 1:45 - 2:30       | Flaky Pipeline Simulation & ASCII Trace Diagnostics     |
| 2:30 - 3:15       | CI/CD Pipeline & The 5-Minute Rollback Plan             |
| 3:15 - 3:30       | Production Readiness Sign-Off                           |
+-------------------+---------------------------------------------------------+
```

---

## ⏱️ Detailed Script & Visual Directions

### Segment 1: The Hook & UI Demo (0:00 - 0:45)

**[VISUAL CUE]:**  
*Screen shows full-screen browser view of the Real-Time Observability Dashboard at `http://localhost:3000`. Highlight the sleek Datadog/Vercel zinc dark UI, metric stat cards, and neon cyan accents.*

**[SPOKEN WORDS]:**  
"Hi everyone! As AI engineering shifts from prototype to production, multi-step LLM workflows suffer from three major silent killers: astronomical token costs, zero latency predictability, and unhandled schema failures. 

To solve this, I built **AI Agent Cost Debugger**—a production-grade TypeScript observability and resiliency platform. 

Let's look at the live dashboard. Right now, running an unoptimized 4-step pipeline—Planner, Researcher, Summarizer, and Formatter—naively passes a 25,000-word uncompressed context to every single step. That burns **100,000 input tokens** and costs **$0.30** per single invocation! 

Watch what happens when I click **'Run Optimized'**..."

*(Action: Click the 'Run Optimized' button on screen. Point out the loading pulse animation and the Recharts graph updating).*

"With one click, our token burn drops by **60%**, and execution cost plummets by **69.75%** down to fractions of a cent—all while keeping end-to-end response quality identical!"

---

### Segment 2: Optimization Math & The Resiliency Fallback Flex (0:45 - 1:45)

**[VISUAL CUE]:**  
*Split screen: Left side shows `backend/src/optimization/router.ts` and `token_pruner.ts` in VS Code. Right side shows terminal logs demonstrating Pino trace logs.*

**[SPOKEN WORDS]:**  
"Behind this cost drop are two core engineering mechanics: **Dynamic Model Routing** and **Adaptive Context Pruning**.

First, in `router.ts`, we don't naively use expensive reasoning models for simple tasks. We route complex planning and research to `gemini-3.5-flash`, but route lightweight summarization and formatting to `gemini-2.0-flash` at **$0.000075** per 1k tokens.

Second, in `token_pruner.ts`, we prune raw document context down to a strict 5,000-token threshold before passing it downstream to sub-agents. 

Now, here is a critical DevOps flex: we integrated the official `@google/generative-ai` SDK to fetch live response metadata. But in production, free-tier APIs can hit 429 rate limits or deprecation errors. Look at our terminal log right here..."

*(Action: Highlight the Pino `WARN: [GeminiClient]` log line in VS Code terminal).*

"Instead of crashing the entire user workflow when an API endpoint returns a rate limit or deprecation code, our client catches the error, logs the bound `traceId`, and gracefully falls back to calibrated token tracking. Zero unhandled crashes in production!"

---

### Segment 3: Debugging Resiliency & Trace Diagnostics (1:45 - 2:30)

**[VISUAL CUE]:**  
*Switch screen to terminal. Type `npm run debug:trace` and hit Enter. Show the formatted ASCII execution tree printing live.*

**[SPOKEN WORDS]:**  
"Next, let's talk about intermittent production failures—like network timeouts, missing JSON keys, or silent empty outputs. 

In `flaky_pipeline.ts`, we built an intermittent fault simulator paired with **Zod structural schema validation** and an **exponential backoff retry loop**.

Let's run our CLI diagnostic tool using `npm run debug:trace`..."

*(Action: Scroll through the printed ASCII execution tree).*

"Look at this visual execution tree! In Step 3, the Summarizer step failed on Attempt 1 because Zod detected a missing required field—`keyInsights`. Instead of failing silently, our pipeline caught the validation error, backed off for 300 milliseconds, retried Attempt 2, self-corrected, and returned a green `PASSED` badge! Every single step, retry, and latency is bound to a UUID `traceId`."

---

### Segment 4: DevOps & CI/CD Pipeline (2:30 - 3:15)

**[VISUAL CUE]:**  
*Show VS Code opening `.github/workflows/main.yml`, `SECRETS_MANAGEMENT.md`, and `ROLLBACK_PLAN.md`.*

**[SPOKEN WORDS]:**  
"Finally, a great AI system requires enterprise DevOps rigor. 

In `.github/workflows/main.yml`, we established a GitHub Actions CI/CD pipeline running on Node 22 that executes parallel strict typechecking using `tsc --noEmit` across both frontend and backend before approving staging deployments to Vercel and Render.

In `SECRETS_MANAGEMENT.md`, we documented zero-leak credential isolation using GitHub Environment Secrets for `GEMINI_API_KEY`.

And if a critical outage ever occurs in production, our `ROLLBACK_PLAN.md` provides a minute-by-minute operational runbook—guaranteeing instant Vercel/Render rollbacks and healthcheck verification within 5 minutes."

---

### Segment 5: Production Readiness Sign-Off (3:15 - 3:30)

**[VISUAL CUE]:**  
*Switch back to the sleek Real-Time Observability Dashboard. Hover cursor over the 'Run Flaky' and 'Run Optimized' buttons.*

**[SPOKEN WORDS]:**  
"From math-backed token pruning and dynamic routing to Zod schema self-correction and automated CI/CD rollbacks, **AI Agent Cost Debugger** proves that AI Engineering and DevOps go hand in hand.

Thank you so much for your time, and I look forward to your questions!"

*(Action: End recording).*
