const sampleTranscript = `Maya: Thanks everyone. Today we need to check if the product launch is still ready for 25 June.
Riya: The investor deck is almost done. I will finalize the investor deck by Monday.
Arjun: The payment gateway bug is still open. I will fix the payment gateway bug by Wednesday.
Meera: Marketing campaign assets are ready, but final ad copy approval is pending.
Maya: We decided to keep the launch date as 25 June.
Kabir: Pricing model Option B looks better for early users.
Maya: Good, we decided to approve pricing model Option B.
Meera: The social media campaign will start next Monday.
Arjun: Main risk is payment testing. If it slips, launch checkout may fail.
Maya: Meera, please approve the final ad copy by tomorrow.
Riya: I will also prepare the partner update email by Friday.`;

const starterAnalysis = {
  id: "starter",
  title: "Product Launch Readiness Review",
  date: "Today",
  duration: "32 minutes",
  participants: 5,
  summary: "Product Launch Readiness Review produced four action items, two decisions, and three risk signals. The assistant converted conversation into owners, deadlines, and follow-up steps for execution.",
  decisions: [
    "Maya: We decided to keep the launch date as 25 June.",
    "Maya: Good, we decided to approve pricing model Option B."
  ],
  risks: [
    "Arjun: The payment gateway bug is still open.",
    "Meera: Marketing campaign assets are ready, but final ad copy approval is pending.",
    "Arjun: Main risk is payment testing. If it slips, launch checkout may fail."
  ],
  actionItems: [
    {
      task: "Finalize the investor deck",
      owner: "Riya",
      deadline: "Monday",
      priority: "Medium",
      source: "Riya: The investor deck is almost done. I will finalize the investor deck by Monday."
    },
    {
      task: "Fix the payment gateway bug",
      owner: "Arjun",
      deadline: "Wednesday",
      priority: "High",
      source: "Arjun: The payment gateway bug is still open. I will fix the payment gateway bug by Wednesday."
    },
    {
      task: "Approve the final ad copy",
      owner: "Meera",
      deadline: "Tomorrow",
      priority: "Medium",
      source: "Maya: Meera, please approve the final ad copy by tomorrow."
    }
  ],
  followUp: "Follow-up for Product Launch Readiness Review: Launch remains 25 June and pricing model Option B is approved. Next actions: Riya finalizes the investor deck, Arjun fixes the payment gateway bug, and Meera approves ad copy. Watch item: payment testing can affect checkout reliability."
};

const app = document.querySelector("#app");
const navButtons = document.querySelectorAll("[data-view]");
const newMeetingBtn = document.querySelector("#newMeetingBtn");

const state = {
  view: localStorage.getItem("meetmindView") || "dashboard",
  latestAnalysis: JSON.parse(localStorage.getItem("meetmindLatestAnalysis") || "null") || starterAnalysis,
  meetings: JSON.parse(localStorage.getItem("meetmindMeetings") || "null") || [starterAnalysis],
  tasks: JSON.parse(localStorage.getItem("meetmindTasks") || "null") || seedTasksFromAnalysis(starterAnalysis)
};

newMeetingBtn.addEventListener("click", () => {
  setView("analyzer");
  requestAnimationFrame(() => {
    const textarea = document.querySelector("#transcript");
    if (textarea) textarea.focus();
  });
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

function setView(view) {
  state.view = view;
  localStorage.setItem("meetmindView", view);
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  render();
}

function render() {
  const views = {
    dashboard: renderDashboard,
    analyzer: renderAnalyzer,
    tasks: renderTasks,
    meeting: renderMeetingDetail
  };

  app.innerHTML = views[state.view]();
  attachViewEvents();
}

function attachViewEvents() {
  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.go));
  });

  const loadSampleBtn = document.querySelector("#loadSampleBtn");
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener("click", () => {
      document.querySelector("#meetingTitle").value = "Product Launch Readiness Review";
      document.querySelector("#transcript").value = sampleTranscript;
      updateWordCount();
      toast("Sample transcript loaded");
    });
  }

  const clearBtn = document.querySelector("#clearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.querySelector("#transcript").value = "";
      updateWordCount();
    });
  }

  const transcript = document.querySelector("#transcript");
  if (transcript) {
    transcript.addEventListener("input", updateWordCount);
    updateWordCount();
  }

  const form = document.querySelector("#analyzerForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = document.querySelector("#meetingTitle").value.trim() || "Untitled Meeting";
      const transcriptValue = document.querySelector("#transcript").value.trim();

      if (!transcriptValue) {
        toast("Paste a transcript or load the sample first");
        document.querySelector("#transcript").focus();
        return;
      }

      const analysis = analyzeMeeting(title, transcriptValue);
      state.latestAnalysis = analysis;
      state.meetings = [analysis, ...state.meetings.filter((meeting) => meeting.id !== "starter")].slice(0, 8);
      saveState();
      render();
      toast("Meeting analyzed");
    });
  }

  const createTasksBtn = document.querySelector("#createTasksBtn");
  if (createTasksBtn) {
    createTasksBtn.addEventListener("click", () => {
      const freshTasks = state.latestAnalysis.actionItems.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        status: "pending",
        meetingTitle: state.latestAnalysis.title
      }));

      state.tasks = [...freshTasks, ...state.tasks];
      saveState();
      setView("tasks");
      toast("Tasks created from meeting");
    });
  }

  document.querySelectorAll("[data-status]").forEach((button) => {
    button.addEventListener("click", () => {
      const task = state.tasks.find((item) => item.id === button.dataset.task);
      if (!task) return;
      task.status = button.dataset.status;
      saveState();
      render();
    });
  });

  const copyFollowUp = document.querySelector("#copyFollowUp");
  if (copyFollowUp) {
    copyFollowUp.addEventListener("click", async () => {
      const followText = document.querySelector("#followUpText")?.value || state.latestAnalysis.followUp;
      try {
        await navigator.clipboard.writeText(followText);
        toast("Follow-up copied");
      } catch {
        toast("Copy blocked by browser");
      }
    });
  }
}

function renderDashboard() {
  const pending = state.tasks.filter((task) => task.status !== "done").length;
  const done = state.tasks.filter((task) => task.status === "done").length;
  const decisions = state.meetings.reduce((sum, meeting) => sum + meeting.decisions.length, 0);

  return `
    <section class="view active">
      <div class="hero-card">
        <p class="kicker">Productivity AI Track</p>
        <h2>Welcome back, Mohnish</h2>
        <p>MeetMind has synthesized your latest meeting into summaries, decisions, risks, owners, deadlines, and follow-ups. This screen is ready for Devpost screenshots and demo videos.</p>
        <div class="hero-actions">
          <button class="button secondary" data-go="analyzer" type="button">Analyze Meeting</button>
          <button class="button ghost" data-go="tasks" type="button">Review Tasks</button>
        </div>
      </div>

      <div class="stats-grid">
        ${statCard("Meetings Analyzed", state.meetings.length, "M", "+ demo", "primary")}
        ${statCard("Tasks Created", state.tasks.length, "T", "+ live", "tertiary")}
        ${statCard("Pending Tasks", pending, "P", pending ? "Alert" : "Clear", "danger")}
        ${statCard("Decisions Captured", decisions, "D", `+${decisions}`, "secondary")}
      </div>

      <div class="dashboard-grid">
        <section class="panel">
          <div class="panel-header">
            <h3>Recent Meetings</h3>
            <button class="button soft" data-go="meeting" type="button">Open Detail</button>
          </div>
          <div class="meeting-list">
            ${state.meetings.map(renderMeetingRow).join("")}
          </div>
        </section>

        <aside class="insight-card">
          <div class="insight-mark">AI</div>
          <p class="kicker">MeetMind AI Insight</p>
          <h3>${pending} tasks need attention</h3>
          <p>Highest risk item: payment gateway testing. For the demo, show how the assistant captures the risk and converts follow-up into trackable work.</p>
          <div class="hero-actions">
            <button class="button primary" data-go="tasks" type="button">Review Tasks</button>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderAnalyzer() {
  return `
    <section class="view active">
      <div class="analyzer-layout">
        <form class="input-pane" id="analyzerForm">
          <div class="page-heading">
            <div>
              <p class="kicker">Meeting Analyzer</p>
              <h2>New Analysis</h2>
              <p class="muted">Paste a transcript or meeting notes below to extract intelligence.</p>
            </div>
            <button class="button soft" id="clearBtn" type="button">Clear</button>
          </div>

          <div class="field-stack">
            <label for="meetingTitle">Meeting title</label>
            <input id="meetingTitle" type="text" value="${escapeHtml(state.latestAnalysis.title)}" />

            <label for="transcript">Transcript</label>
            <textarea id="transcript" placeholder="Maya: We decided to keep the launch date as 25 June..."></textarea>
          </div>

          <div class="toolbar">
            <span class="muted" id="wordCount">0 words</span>
            <div class="hero-actions">
              <button class="button soft" id="loadSampleBtn" type="button">Load Sample</button>
              <button class="button primary" type="submit">Analyze Meeting</button>
            </div>
          </div>
        </form>

        <aside class="result-pane">
          <div class="panel-header">
            <h3>Analysis Results</h3>
            <button class="button secondary" id="createTasksBtn" type="button">Create Tasks</button>
          </div>
          ${renderAnalysis(state.latestAnalysis)}
        </aside>
      </div>
    </section>
  `;
}

function renderAnalysis(analysis) {
  return `
    <div class="analysis">
      <section class="timeline-block">
        <h4>Executive Summary</h4>
        <div class="mini-card">
          <p>${escapeHtml(analysis.summary)}</p>
        </div>
      </section>

      <section class="timeline-block primary">
        <h4>Key Decisions</h4>
        ${analysis.decisions.map((item) => `<div class="mini-card">${escapeHtml(item)}</div>`).join("")}
      </section>

      <section class="timeline-block danger">
        <h4>Risk Assessment</h4>
        ${analysis.risks.map((item) => `<div class="mini-card">${escapeHtml(item)}</div>`).join("")}
      </section>

      <section class="timeline-block tertiary">
        <h4>Action Items</h4>
        ${analysis.actionItems.map(renderActionRow).join("")}
      </section>
    </div>
  `;
}

function renderTasks() {
  const pending = state.tasks.filter((task) => task.status === "pending");
  const progress = state.tasks.filter((task) => task.status === "progress");
  const done = state.tasks.filter((task) => task.status === "done");

  return `
    <section class="view active">
      <div class="page-heading">
        <div>
          <p class="kicker">Workspace Tasks</p>
          <h2>Manage extracted action items</h2>
          <p class="muted">Move tasks from pending to in progress and completed during your Devpost demo.</p>
        </div>
        <button class="button primary" data-go="analyzer" type="button">New Analysis</button>
      </div>

      <div class="filters">
        <span class="filter-pill">Priority: All</span>
        <span class="filter-pill">Owner: Everyone</span>
        <span class="filter-pill">Date: This Week</span>
      </div>

      <div class="board">
        ${renderColumn("Pending", pending, "pending")}
        ${renderColumn("In Progress", progress, "progress")}
        ${renderColumn("Completed", done, "done")}
      </div>
    </section>
  `;
}

function renderMeetingDetail() {
  const analysis = state.latestAnalysis;
  return `
    <section class="view active detail">
      <div class="detail-header">
        <div class="detail-title">
          <span class="chip">Project Sync</span>
          <h2>${escapeHtml(analysis.title)}</h2>
          <div class="detail-meta">
            <span>${escapeHtml(analysis.date || "Today")}</span>
            <span>${escapeHtml(analysis.duration || "32 minutes")}</span>
            <span>${analysis.participants || 5} participants</span>
          </div>
        </div>
        <div class="hero-actions">
          <button class="button soft" type="button">Export PDF</button>
          <button class="button primary" id="copyFollowUp" type="button">Copy Follow-up</button>
        </div>
      </div>

      <div class="detail-grid">
        <section class="detail-card ai wide">
          <p class="kicker">AI Intelligence Summary</p>
          <h3>Cautiously optimistic, with execution risks</h3>
          <p>${escapeHtml(analysis.summary)}</p>
        </section>

        <section class="detail-card">
          <h3>Decision Log</h3>
          <ul class="detail-list">
            ${analysis.decisions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>

        <section class="detail-card">
          <h3>Action Items</h3>
          <ul class="detail-list">
            ${analysis.actionItems.map((item) => `<li><strong>${escapeHtml(item.owner)}</strong>: ${escapeHtml(item.task)} <span class="muted">(${escapeHtml(item.deadline)})</span></li>`).join("")}
          </ul>
        </section>

        <section class="detail-card wide">
          <h3>Risks and Blockers</h3>
          <ul class="detail-list">
            ${analysis.risks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </section>

        <section class="follow-card">
          <h3>AI Follow-up Draft</h3>
          <textarea id="followUpText">${escapeHtml(analysis.followUp)}</textarea>
        </section>
      </div>
    </section>
  `;
}

function statCard(label, value, icon, chip, tone) {
  return `
    <article class="stat-card">
      <div class="stat-top">
        <span class="stat-icon ${tone}">${icon}</span>
        <span class="chip">${chip}</span>
      </div>
      <p>${label}</p>
      <strong>${value}</strong>
    </article>
  `;
}

function renderMeetingRow(meeting) {
  return `
    <article class="meeting-row">
      <div class="meeting-icon">M</div>
      <div>
        <strong>${escapeHtml(meeting.title)}</strong>
        <p>${escapeHtml(meeting.date || "Today")} - ${meeting.actionItems.length} tasks - ${meeting.decisions.length} decisions</p>
      </div>
      <span class="status ready">Analyzed</span>
    </article>
  `;
}

function renderActionRow(item) {
  return `
    <div class="action-row">
      <div>
        <strong>${escapeHtml(item.task)}</strong>
        <p>${escapeHtml(item.source)}</p>
        <div class="action-tags">
          <span class="priority">${escapeHtml(item.owner)}</span>
          <span class="priority">${escapeHtml(item.deadline)}</span>
          <span class="priority ${item.priority.toLowerCase()}">${escapeHtml(item.priority)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderColumn(title, tasks, status) {
  return `
    <section class="column">
      <div class="column-head">
        <h3>${title}</h3>
        <span class="count">${tasks.length}</span>
      </div>
      <div class="task-list">
        ${tasks.length ? tasks.map((task) => renderTaskCard(task, status)).join("") : `<p class="muted">No ${title.toLowerCase()} tasks.</p>`}
      </div>
    </section>
  `;
}

function renderTaskCard(task) {
  const isDone = task.status === "done";
  return `
    <article class="task-card ${isDone ? "done" : ""}">
      <span class="priority ${task.priority.toLowerCase()}">${escapeHtml(task.priority)}</span>
      <strong>${escapeHtml(task.task)}</strong>
      <p>${escapeHtml(task.source || task.meetingTitle)}</p>
      <div class="task-meta">
        <span class="priority">${escapeHtml(task.owner)}</span>
        <span class="priority">${escapeHtml(task.deadline)}</span>
        <span class="priority">Source: ${escapeHtml(task.meetingTitle || "Meeting")}</span>
      </div>
      <div class="task-actions">
        ${task.status !== "pending" ? `<button class="mini-button" data-task="${task.id}" data-status="pending" type="button">Pending</button>` : ""}
        ${task.status !== "progress" ? `<button class="mini-button" data-task="${task.id}" data-status="progress" type="button">In Progress</button>` : ""}
        ${task.status !== "done" ? `<button class="mini-button" data-task="${task.id}" data-status="done" type="button">Complete</button>` : ""}
      </div>
    </article>
  `;
}

function analyzeMeeting(title, transcript) {
  const sentences = transcript
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const decisions = unique(
    sentences.filter((sentence) => /decided|approved|agreed|confirmed|go with|keep the|final decision/i.test(sentence))
  );

  const risks = unique(
    sentences.filter((sentence) => /risk|blocker|blocked|pending|delay|fail|issue|bug|slip|concern/i.test(sentence))
  );

  const actionItems = unique(sentences.filter(isActionSentence))
    .filter((sentence) => !/decided|approved|agreed/i.test(sentence))
    .slice(0, 8)
    .map(parseActionItem);

  const topics = extractTopics(transcript);
  const summary = buildSummary(title, actionItems, decisions, risks, topics);
  const followUp = buildFollowUp(title, actionItems, decisions, risks);

  return {
    id: crypto.randomUUID(),
    title,
    date: "Today",
    duration: `${Math.max(12, Math.round(sentences.length * 2.5))} minutes`,
    participants: countParticipants(transcript),
    summary,
    decisions: decisions.length ? decisions : ["No explicit decision detected. Ask the team to confirm decisions before closing the meeting."],
    risks: risks.length ? risks : ["No major risk detected from this transcript."],
    actionItems: actionItems.length ? actionItems : [{
      task: "Review meeting notes and add missing action owners",
      owner: "Team",
      deadline: "Next working day",
      priority: "Medium",
      source: "Generated fallback task"
    }],
    followUp
  };
}

function parseActionItem(sentence) {
  const speakerMatch = sentence.match(/^([A-Z][a-z]+):/);
  const cleanSentence = sentence.replace(/^[A-Z][a-z]+:\s*/, "");
  const owner = extractOwner(cleanSentence, speakerMatch?.[1]);
  const deadline = extractDeadline(cleanSentence);
  const priority = /risk|bug|fail|launch|urgent|critical|must|gateway|payment/i.test(cleanSentence) ? "High" : "Medium";
  const task = cleanSentence
    .replace(/^please\s+/i, "")
    .replace(/^I will\s+/i, "")
    .replace(/^[A-Z][a-z]+,\s*please\s+/i, "")
    .replace(/\s+by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|next monday|next tuesday|next wednesday|next thursday|next friday).*$/i, "")
    .replace(/\.$/, "");

  return {
    task: capitalize(task || cleanSentence),
    owner,
    deadline,
    priority,
    source: sentence
  };
}

function isActionSentence(sentence) {
  const lower = sentence.toLowerCase();
  return lower.includes("please")
    || lower.includes("i will")
    || /^[A-Z][a-z]+:\s+[A-Z][a-z]+\s+will\b/.test(sentence)
    || lower.includes("needs to")
    || lower.includes("must")
    || /\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|next monday|next tuesday|next wednesday|next thursday|next friday)\b/i.test(sentence);
}

function extractOwner(sentence, speaker) {
  const directOwner = sentence.match(/^([A-Z][a-z]+),\s*please/i);
  if (directOwner) return directOwner[1];

  const willOwner = sentence.match(/^([A-Z][a-z]+)\s+will/i);
  if (willOwner) return willOwner[1];

  if (/^I will/i.test(sentence) && speaker) return speaker;

  return speaker || "Unassigned";
}

function extractDeadline(sentence) {
  const match = sentence.match(/\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|next monday|next tuesday|next wednesday|next thursday|next friday)\b/i);
  if (match) return capitalize(match[1]);
  return "No deadline";
}

function extractTopics(transcript) {
  const topicWords = transcript
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 5 && !["thanks", "everyone", "meeting", "please", "decided", "approved", "almost"].includes(word));

  const counts = topicWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word]) => word);
}

function buildSummary(title, actionItems, decisions, risks, topics) {
  const topicText = topics.length ? ` Main discussion areas were ${topics.join(", ")}.` : "";
  return `${title} produced ${actionItems.length} action item${actionItems.length === 1 ? "" : "s"}, ${decisions.length} decision${decisions.length === 1 ? "" : "s"}, and ${risks.length} risk signal${risks.length === 1 ? "" : "s"}.${topicText} The assistant converted conversation into owners, deadlines, and follow-up steps for execution.`;
}

function buildFollowUp(title, actionItems, decisions, risks) {
  const taskLines = actionItems.map((item) => `${item.owner}: ${item.task} (${item.deadline})`).join("; ");
  const decisionLine = decisions.slice(0, 2).join(" ");
  const riskLine = risks.slice(0, 1).join(" ");
  return `Follow-up for ${title}: ${decisionLine || "No final decision was explicitly captured."} Next actions: ${taskLines || "Review and assign owners."}. Watch item: ${riskLine || "No major blocker detected."}`;
}

function countParticipants(transcript) {
  const names = new Set();
  transcript.split(/\n+/).forEach((line) => {
    const match = line.match(/^([A-Z][a-z]+):/);
    if (match) names.add(match[1]);
  });
  return Math.max(names.size, 1);
}

function seedTasksFromAnalysis(analysis) {
  return analysis.actionItems.map((item, index) => ({
    ...item,
    id: `starter-task-${index}`,
    status: index === 1 ? "progress" : "pending",
    meetingTitle: analysis.title
  }));
}

function updateWordCount() {
  const textarea = document.querySelector("#transcript");
  const counter = document.querySelector("#wordCount");
  if (!textarea || !counter) return;
  const words = textarea.value.trim().split(/\s+/).filter(Boolean).length;
  counter.textContent = `${words} word${words === 1 ? "" : "s"}`;
}

function saveState() {
  localStorage.setItem("meetmindLatestAnalysis", JSON.stringify(state.latestAnalysis));
  localStorage.setItem("meetmindMeetings", JSON.stringify(state.meetings));
  localStorage.setItem("meetmindTasks", JSON.stringify(state.tasks));
}

function unique(items) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let toastTimer;

function toast(message) {
  let toastElement = document.querySelector(".toast");
  if (!toastElement) {
    toastElement = document.createElement("div");
    toastElement.className = "toast";
    document.body.appendChild(toastElement);
  }

  toastElement.textContent = message;
  toastElement.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastElement.classList.remove("show"), 2200);
}

saveState();
setView(state.view);
