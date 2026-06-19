# Devpost Submission Notes

## Project Name

MeetMind AI

## Tagline

An AI meeting assistant that turns conversations into decisions, tasks, owners, deadlines, and follow-ups.

## Inspiration

Meetings often create more work, but the actual follow-up work is usually scattered across notes, chats, and memory. Teams lose productivity when decisions are forgotten, owners are unclear, and tasks are not tracked. MeetMind AI was built to solve that gap.

## What It Does

MeetMind AI analyzes a meeting transcript and creates:

- A short meeting summary
- Decision log
- Risk and blocker list
- Action items
- Owners
- Deadlines
- Priority labels
- Follow-up message
- Task board

## How We Built It

The prototype is built as a lightweight web app using HTML, CSS, and JavaScript. For hackathon demo reliability, the current MVP uses rule-based natural language extraction so it works offline without API keys. The architecture is designed so the analyzer can later be replaced with an LLM API and speech-to-text pipeline.

## Challenges

- Designing an MVP that is simple enough to demo quickly but still shows meaningful AI productivity value
- Extracting owners and deadlines from messy human conversation
- Making the demo work without relying on network access or paid API keys

## Accomplishments

- Built a complete end-to-end demo flow
- Created a polished Devpost-friendly UI
- Added transcript analysis, task creation, and task completion workflow
- Kept the prototype easy to extend into a real AI product

## What We Learned

The biggest productivity win is not just summarizing meetings. The valuable part is connecting summaries to execution: decisions, owners, deadlines, and reminders.

## What's Next

- Add audio upload and Whisper transcription
- Add OpenAI/Gemini/Claude-powered extraction
- Integrate Google Calendar and Slack
- Add team accounts and shared task boards
- Add reminders through email or WhatsApp
