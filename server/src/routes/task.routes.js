import express from "express";
import { requireAuth } from "../auth.js";
import { query } from "../db.js";

export const taskRouter = express.Router();

taskRouter.use(requireAuth);

taskRouter.get("/", async (req, res) => {
  const tasks = await query(
    `SELECT t.*, m.title AS meeting_title
       FROM tasks t
       JOIN meetings m ON m.id = t.meeting_id
       LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id AND mp.user_id = :userId
      WHERE m.organization_id = :organizationId
        AND (:role = 'admin' OR m.created_by = :userId OR t.owner_id = :userId OR mp.user_id = :userId)
      ORDER BY t.id DESC`,
    {
      userId: req.user.id,
      organizationId: req.user.organization_id,
      role: req.user.role
    }
  );

  res.json({ tasks });
});

taskRouter.patch("/:id", async (req, res) => {
  const allowedStatuses = new Set(["pending", "progress", "done"]);
  const { status } = req.body;

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: "Invalid task status" });
  }

  const tasks = await query(
    `SELECT t.id
       FROM tasks t
       JOIN meetings m ON m.id = t.meeting_id
       LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id AND mp.user_id = :userId
      WHERE t.id = :taskId
        AND m.organization_id = :organizationId
        AND (:role = 'admin' OR m.created_by = :userId OR t.owner_id = :userId OR mp.user_id = :userId)
      LIMIT 1`,
    {
      taskId: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organization_id,
      role: req.user.role
    }
  );

  if (!tasks.length) {
    return res.status(404).json({ error: "Task not found" });
  }

  await query("UPDATE tasks SET status = :status WHERE id = :taskId", {
    status,
    taskId: req.params.id
  });

  res.json({ id: Number(req.params.id), status });
});
