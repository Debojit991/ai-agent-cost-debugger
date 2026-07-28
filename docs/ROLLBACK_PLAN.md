# 5-Minute Production Rollback Runbook

This document defines the operational, minute-by-minute Incident Response Runbook for executing a 5-minute rollback during a critical production outage or API degradation.

---

## Escalation Trigger Criteria

Execute this rollback procedure immediately if any of the following SLA breaches occur post-deployment:
- HTTP 500 error rate exceeds **2%** over a 2-minute window.
- p95 end-to-end API latency exceeds **8,000 ms**.
- Consecutive schema validation failures exceed **10%** of total requests.

---

## Minute-by-Minute Operational Timeline

```text
+-----------------------+-------------------------------------------------------+
| Timeline              | Action Required                                       |
+-----------------------+-------------------------------------------------------+
| Minute 1: 00:00-01:00 | Incident Detection & Automated Alert Triage           |
| Minute 2: 01:00-02:00 | Trigger Automated Rollback / Git Revert               |
| Minute 3: 02:00-03:00 | Deployment Synchronization & Cache Flush              |
| Minute 4: 03:00-04:00 | Synthetic Health Check & Telemetry Verification       |
| Minute 5: 04:00-05:00 | Incident Closure & Post-Mortem Logging                |
+-----------------------+-------------------------------------------------------+
```

---

### Minute 1: Incident Detection & Automated Alert Triage (00:00 - 01:00)

1. **Alert Receipt**: SRE on-call receives automated PagerDuty / Slack alert (e.g., `HIGH-ERROR-RATE: /api/pipeline/optimized 5xx Spike`).
2. **Triage Active Trace Logs**:
   - Inspect active Pino logs or trace endpoint:
     ```bash
     curl -s http://localhost:3001/api/health
     npm run debug:trace
     ```
3. **Declare Severity 1 Outage**: If the bug is unhandled in current release, declare SEV-1 and initiate rollback.

---

### Minute 2-3: Immediate Rollback Execution (01:00 - 03:00)

#### Option A: One-Click Vercel & Render Rollback (Recommended)
1. **Frontend (Vercel)**:
   - Navigate to Vercel Deployments tab.
   - Locate previous stable deployment tag.
   - Click `...` > **Instant Rollback**.
2. **Backend (Render)**:
   - Navigate to Render Dashboard > Backend Service > Deployments.
   - Select previous successful build and click **Rollback to this deploy**.

#### Option B: Git Revert Push via CLI
```bash
# 1. Fetch latest main branch
git checkout main
git pull origin main

# 2. Revert breaking commit
git revert HEAD --no-edit

# 3. Push revert to trigger CI/CD pipeline
git push origin main
```

---

### Minute 4: Synthetic Health Check & Telemetry Verification (03:00 - 04:00)

1. **Invoke Health Check Endpoint**:
   ```bash
   curl -i https://backend-staging.render.com/health
   # Expected Response: HTTP 200 OK {"status":"ok"}
   ```
2. **Execute Baseline Pipeline Verification**:
   ```bash
   curl -X POST https://backend-staging.render.com/api/pipeline/baseline \
     -H "Content-Type: application/json" \
     -d '{"query": "Post-rollback healthcheck verification"}'
   ```
3. Verify metrics in Observability Dashboard:
   - Cost calculation verified (`$0.3000`).
   - Zero unhandled exceptions in Pino trace logs.

---

### Minute 5: Incident Closure & Post-Mortem Logging (04:00 - 05:00)

1. **Update Stakeholders**: Post incident resolution update to `#ops-incidents` Slack channel.
2. **Lock Deployments**: Pause feature release pipeline until root cause is identified.
3. **Schedule Post-Mortem**: Document root cause, trace ID timelines, and corrective actions in `docs/postmortems/`.
