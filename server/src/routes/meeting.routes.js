import express from "express";
import { canAccessMeeting, requireAuth } from "../auth.js";
import { query, transaction } from "../db.js";
import { analyzeMeeting } from "../analyzer.js";

export const meetingRouter = express.Router();

meetingRouter.use(requireAuth);

meetingRouter.get("/", async (req, res) => {
  const meetings = await query(
    `SELECT DISTINCT m.id, m.title, m.summary, m.follow_up, m.created_at,
            COUNT(DISTINCT t.id) AS task_count,
            COUNT(DISTINCT d.id) AS decision_count
       FROM meetings m
       LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id AND mp.user_id = :userId
       LEFT JOIN tasks t ON t.meeting_id = m.id
       LEFT JOIN decisions d ON d.meeting_id = m.id
      WHERE m.organization_id = :organizationId
        AND (:role = 'admin' OR m.created_by = :userId OR mp.user_id = :userId)
      GROUP BY m.id
      ORDER BY m.created_at DESC`,
    {
      userId: req.user.id,
      organizationId: req.user.organization_id,
      role: req.user.role
    }
  );

  res.json({ meetings });
});

meetingRouter.post("/analyze", async (req, res) => {
  const { title, transcript } = req.body;

  if (!title || !transcript) {
    return res.status(400).json({ error: "Title and transcript are required" });
  }

  const analysis = analyzeMeeting(title, transcript);
  res.json({ analysis });
});

meetingRouter.post("/", async (req, res) => {
  const { title, transcript } = req.body;

  if (!title || !transcript) {
    return res.status(400).json({ error: "Title and transcript are required" });
  }

  const analysis = analyzeMeeting(title, transcript);
  try {
    const meetingId = await transaction(async (tx) => {
      const [meeting] = await tx.query(
      `INSERT INTO meetings (organization_id, created_by, title, transcript, summary, follow_up, participant_count)
       VALUES (:organizationId, :createdBy, :title, :transcript, :summary, :followUp, :participantCount)
       RETURNING id`,
        {
          organizationId: req.user.organization_id,
          createdBy: req.user.id,
          title: analysis.title,
          transcript: analysis.transcript,
          summary: analysis.summary,
          followUp: analysis.followUp,
          participantCount: analysis.participantCount
        }
      );

      await tx.query(
        `INSERT INTO meeting_participants (meeting_id, user_id, access_level)
         VALUES (:meetingId, :userId, 'owner')`,
        { meetingId: meeting.id, userId: req.user.id }
      );

      for (const decision of analysis.decisions) {
        await tx.query(
          "INSERT INTO decisions (meeting_id, decision_text) VALUES (:meetingId, :decision)",
          { meetingId: meeting.id, decision }
        );
      }

      for (const risk of analysis.risks) {
        await tx.query(
          "INSERT INTO risks (meeting_id, risk_text, severity) VALUES (:meetingId, :risk, :severity)",
          {
            meetingId: meeting.id,
            risk,
            severity: /bug|fail|delay|risk/i.test(risk) ? "High" : "Medium"
          }
        );
      }

      for (const item of analysis.actionItems) {
        await tx.query(
          `INSERT INTO tasks (meeting_id, title, owner_name, deadline_text, priority, status, source_sentence)
           VALUES (:meetingId, :title, :ownerName, :deadlineText, :priority, 'pending', :source)`,
          {
            meetingId: meeting.id,
            title: item.task,
            ownerName: item.ownerName,
            deadlineText: item.deadlineText,
            priority: item.priority,
            source: item.source
          }
        );
      }

      return meeting.id;
    });

    res.status(201).json({ meetingId, analysis });
  } catch (error) {
    res.status(500).json({ error: "Could not save meeting" });
  }
});

meetingRouter.get("/:id", async (req, res) => {
  const meetingRows = await query(
    `SELECT m.*, mp.user_id AS participant_user_id, t.owner_id AS owner_user_id
       FROM meetings m
       LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id AND mp.user_id = :userId
       LEFT JOIN tasks t ON t.meeting_id = m.id AND t.owner_id = :userId
      WHERE m.id = :id
        AND m.organization_id = :organizationId
      LIMIT 1`,
    {
      id: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organization_id
    }
  );

  const meeting = meetingRows[0];
  if (!canAccessMeeting(req.user, meeting)) {
    return res.status(404).json({ error: "Meeting not found" });
  }

  const [tasks, decisions, risks] = await Promise.all([
    query("SELECT * FROM tasks WHERE meeting_id = :meetingId ORDER BY id", { meetingId: req.params.id }),
    query("SELECT * FROM decisions WHERE meeting_id = :meetingId ORDER BY id", { meetingId: req.params.id }),
    query("SELECT * FROM risks WHERE meeting_id = :meetingId ORDER BY id", { meetingId: req.params.id })
  ]);

  res.json({ meeting, tasks, decisions, risks });
});
