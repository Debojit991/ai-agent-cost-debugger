# Secrets Management & Credential Security Guide

This document outlines the security architecture and procedures for managing secret credentials, API keys, and deployment tokens across local development, CI/CD pipelines, and production staging environments.

---

## 1. Security Architecture & Policies

### Zero-Leak Repository Principle
- **No Hardcoded Secrets**: Secrets, API keys, private tokens, or database passwords must **never** be committed to Git.
- **`.gitignore` Compliance**: Local `.env` files are strictly excluded from version control via `.gitignore`.
- **Pre-commit Audit**: Automated git hooks inspect changes to prevent accidental secret leakage.

---

## 2. GitHub Actions Environment Secrets Setup

Secrets are injected dynamically into GitHub Actions workflows using **GitHub Environment Secrets** (`staging` / `production`).

### Required GitHub Repository Secrets

| Secret Name | Description | Environment | Usage Site |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio API key for LLM agent steps | `staging` / `production` | Backend runtime & automated integration tests |
| `RENDER_DEPLOY_HOOK_URL` | Render deploy hook URL for automated backend deployment | `staging` | GitHub Actions (`main.yml`) |
| `VERCEL_TOKEN` | Vercel CLI Access Token for frontend deployment | `staging` | GitHub Actions (`main.yml`) |
| `VERCEL_ORG_ID` | Vercel Organization ID | `staging` | GitHub Actions (`main.yml`) |
| `VERCEL_PROJECT_ID` | Vercel Project ID | `staging` | GitHub Actions (`main.yml`) |

---

## 3. Configuring Secrets in GitHub Console

1. Navigate to your repository on GitHub: `https://github.com/<org>/ai-agent-cost-debugger`.
2. Go to **Settings** > **Secrets and variables** > **Actions**.
3. Under **Environment secrets**, select or create the `staging` environment.
4. Click **Add Environment Secret** and enter the Key-Value pair for each required secret.

---

## 4. Local Development Setup

In local development, secrets are managed via `backend/.env`.

### `backend/.env.example` Template
```ini
# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Google Gemini API Credentials
GEMINI_API_KEY=your_gemini_api_key_here
```

To initialize local environment:
```bash
cd backend
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY
```

---

## 5. Credential Rotation Runbook

If an API key or deployment token is compromised:

1. **Revoke Immediately**:
   - For Gemini API keys: Go to [Google AI Studio Console](https://aistudio.google.com/app/apikey) and delete the compromised key.
   - For Vercel tokens: Go to Vercel Account Settings > Tokens and revoke access.
2. **Issue Replacement Credential**:
   - Generate a new API key or deployment token.
3. **Update GitHub Secrets**:
   - Update `GEMINI_API_KEY` in GitHub Environment Secrets.
4. **Redeploy Staging**:
   - Trigger a fresh workflow run via GitHub Actions to deploy with rotated credentials.
