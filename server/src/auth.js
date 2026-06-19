import jwt from "jsonwebtoken";
import { query } from "./db.js";

const jwtSecret = process.env.JWT_SECRET || "dev-only-secret";

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      organizationId: user.organization_id,
      role: user.role
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const users = await query(
      "SELECT id, name, email, role, organization_id FROM users WHERE id = :id",
      { id: payload.sub }
    );

    if (!users.length) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = users[0];
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function canAccessMeeting(user, meeting) {
  if (!meeting) return false;
  if (user.role === "admin" && user.organization_id === meeting.organization_id) return true;
  if (meeting.created_by === user.id) return true;
  return Boolean(meeting.participant_user_id || meeting.owner_user_id);
}
