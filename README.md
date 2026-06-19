# MeetMind AI

MeetMind AI is a Devpost-ready hackathon prototype for the Productivity AI track. It turns meeting transcripts into summaries, decisions, risks, action items, owners, deadlines, follow-up messages, and a task board.

## Problem

Teams waste time after meetings because decisions are forgotten, action items are unclear, and follow-ups happen manually. MeetMind AI makes meetings actionable by converting conversation into a structured execution plan.

## MVP Features

- Paste a meeting transcript
- Generate a meeting summary
- Extract decisions
- Detect risks and blockers
- Extract action items with owners, deadlines, and priority
- Convert action items into a task board
- Mark tasks as completed
- Store tasks locally in the browser
- Works offline for demo reliability
- Stitch-inspired SaaS dashboard UI with Dashboard, Analyzer, Tasks, and Meeting Detail views

## How To Run The Static Demo

Open `index.html` in a browser.

No installation is required for the offline demo version.

## Backend Setup

The backend uses Node.js, Express, JWT auth, and PostgreSQL.

1. Install dependencies:

```bash
npm install
```

2. Create a PostgreSQL database named `meetmind_ai`, then run:

```bash
psql -U postgres -d meetmind_ai -f server/schema.sql
```

3. Copy `.env.example` to `.env` and fill in your PostgreSQL credentials.

4. Start the backend:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Backend API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/meetings/analyze`
- `POST /api/meetings`
- `GET /api/meetings`
- `GET /api/meetings/:id`
- `GET /api/tasks`
- `PATCH /api/tasks/:id`

## Google Login

Create a Google OAuth Web Client ID and add it to both local `.env` and Render:

```text
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

For Render, add your deployed URL to the OAuth client's authorized JavaScript origins.

## Demo Script

1. Open the app.
2. From the sidebar, open `Analyzer`.
3. Click `Load Sample`.
4. Click `Analyze Meeting`.
5. Show the generated summary, decisions, risks, and action items.
6. Click `Create Tasks`.
7. Show the task board and move one task from pending to in progress or completed.
8. Open `Meeting Detail` to show the decision log and follow-up draft.

## Suggested Devpost Description

MeetMind AI is a context-aware meeting productivity assistant that turns unstructured meeting discussions into clear execution plans. It extracts summaries, decisions, risks, action items, owners, deadlines, and follow-up messages, then converts tasks into a board for accountability.

## Tech Used

- HTML
- CSS
- JavaScript
- Browser localStorage
- Rule-based NLP prototype for offline demo reliability

## Future Scope

- Whisper speech-to-text for uploaded meeting audio
- OpenAI, Gemini, or Claude API for stronger natural language analysis
- Google Calendar integration
- Slack, WhatsApp, and email reminders
- Jira, Trello, or Notion task sync
- Speaker diarization
- Multi-language meeting support

## Devpost Pitch

MeetMind AI helps teams stop losing productivity after meetings. Instead of manually writing notes and chasing follow-ups, users paste a transcript and instantly receive a structured meeting brief with decisions, risks, action items, owners, and deadlines. The app then turns those action items into a lightweight task board so execution can start immediately.
