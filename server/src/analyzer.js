export function analyzeMeeting(title, transcript) {
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

  return {
    title,
    transcript,
    summary: buildSummary(title, actionItems, decisions, risks, topics),
    decisions: decisions.length ? decisions : ["No explicit decision detected. Ask the team to confirm decisions before closing the meeting."],
    risks: risks.length ? risks : ["No major risk detected from this transcript."],
    actionItems: actionItems.length ? actionItems : [{
      task: "Review meeting notes and add missing action owners",
      ownerName: "Team",
      deadlineText: "Next working day",
      priority: "Medium",
      source: "Generated fallback task"
    }],
    followUp: buildFollowUp(title, actionItems, decisions, risks),
    participantCount: countParticipants(transcript)
  };
}

function parseActionItem(sentence) {
  const speakerMatch = sentence.match(/^([A-Z][a-z]+):/);
  const cleanSentence = sentence.replace(/^[A-Z][a-z]+:\s*/, "");
  const ownerName = extractOwner(cleanSentence, speakerMatch?.[1]);
  const deadlineText = extractDeadline(cleanSentence);
  const priority = /risk|bug|fail|launch|urgent|critical|must|gateway|payment/i.test(cleanSentence) ? "High" : "Medium";
  const task = cleanSentence
    .replace(/^please\s+/i, "")
    .replace(/^I will\s+/i, "")
    .replace(/^[A-Z][a-z]+,\s*please\s+/i, "")
    .replace(/\s+by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week|next monday|next tuesday|next wednesday|next thursday|next friday).*$/i, "")
    .replace(/\.$/, "");

  return {
    task: capitalize(task || cleanSentence),
    ownerName,
    deadlineText,
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
  const taskLines = actionItems.map((item) => `${item.ownerName}: ${item.task} (${item.deadlineText})`).join("; ");
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

function unique(items) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
