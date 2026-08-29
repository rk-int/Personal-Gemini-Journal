# Personal-Gemini-Journal — Authenticated Gemini Journal & Reflection Studio

Personal-Gemini-Journal is an enterprise-grade, privacy-first personal reflection and journaling platform built with **Firebase Authentication**, **Cloud Firestore**, and **Gemini 3.6 Flash**. It allows users to authenticate with Google Sign-In, engage in multi-turn cognitive reflections with Gemini, automatically extract key insights, and persist all data within strictly isolated Firestore vaults.

- **Google Cloud Project ID**: `exalted-legacy-507016-a2`
- **Application / Service Name**: `personal-gemini-journal`
- **Target Deployment**: Google Cloud Run + Secret Manager + Cloud Firestore

---

## 1. Architectural Overview & The 5 Threat Zones

Personal-Gemini-Journal is engineered around the **5 Threat Zones** to ensure zero data leakage across multi-tenant user bases and resilient AI execution:

| Threat Zone | Description & Potential Vulnerability | Implemented Defense Mechanism |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Untrusted user prompts, malformed JSON bodies, payload injection. | Strict schema sanitization, express payload limits (`limit: 10mb`), and strict type parameterization. |
| **2. Planning & Reasoning** | Indirect prompt injection, system instruction bypass. | Hardened system instructions separating system directives from user content; structured JSON mode parsing. |
| **3. Tool Execution** | Model latency, 429 rate exhaustion, 503 service unavailability. | **Resilient Model Fallback Ladder**: `gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`. |
| **4. Memory & State** | Cross-tenant data leaks, unauthorized database reads/writes. | **Owner-bound Firestore Security Rules**: strictly checks `request.auth.uid == userId` for all document paths. |
| **5. Inter-System Comm** | Exposing `GEMINI_API_KEY` or service account credentials in client code. | Full-stack server proxy (`/api/chat`, `/api/summarize`) and Google Secret Manager environment injection. |

---

## 2. Cloud Firestore Security Rules

Personal-Gemini-Journal enforces **Zero Insecure Defaults** (`never allow read, write: if true;`). All user documents are isolated to the authenticated user's UID:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Isolated User Profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Isolated Journal & Reflection Entries
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Isolated Interactions and Sessions
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 3. Deployment & Google Cloud Run Setup Guide (Project: exalted-legacy-507016-a2)

Follow these steps to deploy Personal-Gemini-Journal to **Google Cloud Run** in project `exalted-legacy-507016-a2` using **Secret Manager** and **Cloud Firestore**:

### Step 1: Configure gcloud & Enable Google Cloud APIs
Ensure you have the Google Cloud SDK (`gcloud`) installed and set your active project:

```bash
# Set your active GCP project ID and region
export PROJECT_ID="exalted-legacy-507016-a2"
export REGION="asia-southeast1" # or us-central1
gcloud config set project $PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com \
  --project=$PROJECT_ID
```

### Step 2: Secret Management Setup (Zero Hardcoding)
Store your Gemini API key in **Google Cloud Secret Manager**:

```bash
# Create and populate the secret in your project
gcloud secrets create GEMINI_API_KEY \
  --replication-policy="automatic" \
  --project=$PROJECT_ID

echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY \
  --data-file=- \
  --project=$PROJECT_ID

# Obtain your project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

### Step 3: Provision Firestore Database & Deploy Security Rules
Provision Cloud Firestore (if not already done) and deploy the security rules:

```bash
# Create Firestore database in Native mode (if not already created)
gcloud firestore databases create --location=$REGION --project=$PROJECT_ID

# Deploy security rules using Firebase CLI
firebase use $PROJECT_ID
firebase deploy --only firestore:rules
```

### Step 4: Deploy Container to Google Cloud Run
Build and deploy the application to Cloud Run with Secret Manager environment injection:

```bash
gcloud run deploy personal-gemini-journal \
  --source . \
  --project=$PROJECT_ID \
  --region=$REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### Step 5: Required Campaign Verification Labeling
Attach the required metadata label for automated challenge verification:

```bash
gcloud run services update personal-gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION \
  --project=$PROJECT_ID
```

---

## 4. Comprehensive Functional Test Walkthroughs

The following test cases cover every user-visible process and interactive path:

### Test Case 1: Landing Page & Authentication Flow
1. **Initial State**: Navigate to the application URL. Verify the landing page displays high-contrast typography, security architecture highlights, and the "Sign in with Google" call to action.
2. **Google OAuth Sign-In**: Click "Sign in with Google". Complete the Google OAuth authentication popup. Verify redirection directly into the private dashboard.
3. **Guest Demo Fallback**: Alternatively, click "Guest Demo Mode" to test in sandboxed iframe environments where external popups may be blocked.
4. **Header Profile**: Verify that your avatar, display name, and email appear in the navigation bar.

### Test Case 2: Multi-Turn Cognitive Reflection with Gemini 3.6 Flash
1. **Create Reflection**: Click "+ New Reflection" in the navbar or sidebar.
2. **Configure Context**:
   - Change the title to "Quarterly Strategy Dilemma".
   - Select a mood chip (e.g. *Inspired* ✨ or *Contemplative* 💭).
   - Select an AI partner mode (e.g. *Socratic Inquiry* or *Thought Partner*).
3. **Send Message**: Type "I am considering launching a new initiative but worry about spreading my team too thin. What should I prioritize?" and click Send (or press `⌘ + Enter`).
4. **Verify Generation & Fallback**:
   - Verify that the pulsing generation indicator appears.
   - Verify that Gemini 3.6 Flash responds with insightful, formatted markdown.
   - Verify that the model badge (`gemini-3.6-flash`) appears on the message.
5. **Multi-Turn Continuity**: Type a follow-up response ("The second point is the most pressing. How do we test that assumption quickly?"). Verify that Gemini maintains conversational context across turns.

### Test Case 3: Automated Synthesis & Takeaway Generation
1. **Synthesize Insights**: Click the **"Synthesize AI Insights"** button in the editor header.
2. **Verify Output**:
   - Verify the summary card expands with an overarching reflection synthesis.
   - Verify key revelations are bulleted.
   - Verify actionable micro-steps with checkmark indicators are displayed.
   - Verify relevant categorization tags (e.g. `#Strategy`, `#Prioritization`) are generated.

### Test Case 4: Cloud Firestore Persistence & User Isolation
1. **Persistence Verification**: Refresh the browser page or log out and log back in.
2. **History List**: Verify that the newly created reflection appears in the left sidebar under "Past Reflections" with its title, mood emoji, timestamp, and summary snippet.
3. **Multi-Tenant Isolation**: Sign in with a different Google account. Verify that the previous user's reflections are completely inaccessible and invisible, guaranteed by Firestore rules.

### Test Case 5: Message Utilities & Export
1. **Copy Text**: Click "Copy" on any message bubble. Verify the icon turns into a green checkmark and text is copied to your clipboard.
2. **Text-to-Speech**: Click "Listen" on a Gemini message. Verify audio narration begins via Web Speech Synthesis. Click "Stop Reading" to cancel.
3. **Markdown Export**: Click "Export .md" in the top bar. Verify a properly formatted `.md` file containing metadata, summary, takeaways, and dialogue transcript is downloaded.
4. **Deletion**: Click the trash icon next to an entry in the sidebar. Click once more to confirm permanent deletion. Verify the document is removed from Firestore.
