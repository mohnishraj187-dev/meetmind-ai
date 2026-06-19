import bcrypt from "bcryptjs";
import express from "express";
import { OAuth2Client } from "google-auth-library";
import { query } from "../db.js";
import { signToken } from "../auth.js";

export const authRouter = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

authRouter.post("/register", async (req, res) => {
  const { name, email, password, organizationName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  const existing = await query("SELECT id FROM users WHERE email = :email", { email });
  if (existing.length) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const orgName = organizationName || `${name}'s Workspace`;
  const [organization] = await query(
    "INSERT INTO organizations (name) VALUES (:name) RETURNING id",
    { name: orgName }
  );
  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await query(
    `INSERT INTO users (name, email, password_hash, role, organization_id)
     VALUES (:name, :email, :passwordHash, 'admin', :organizationId)
     RETURNING id, name, email, role, organization_id`,
    {
      name,
      email,
      passwordHash,
      organizationId: organization.id
    }
  );

  res.status(201).json({ user, token: signToken(user) });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const users = await query(
    "SELECT id, name, email, password_hash, role, organization_id FROM users WHERE email = :email",
    { email }
  );

  if (!users.length) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = users[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  delete user.password_hash;
  res.json({ user, token: signToken(user) });
});

authRouter.post("/google", async (req, res) => {
  const { credential } = req.body;

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: "Google login is not configured" });
  }

  if (!credential) {
    return res.status(400).json({ error: "Google credential is required" });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload?.email_verified) {
      return res.status(401).json({ error: "Google email is not verified" });
    }

    const existingUsers = await query(
      "SELECT id, name, email, role, organization_id FROM users WHERE email = :email",
      { email: payload.email }
    );

    if (existingUsers.length) {
      const user = existingUsers[0];
      return res.json({ user, token: signToken(user) });
    }

    const name = payload.name || payload.email.split("@")[0];
    const [organization] = await query(
      "INSERT INTO organizations (name) VALUES (:name) RETURNING id",
      { name: `${name}'s Workspace` }
    );
    const passwordHash = await bcrypt.hash(`google:${payload.sub}:${Date.now()}`, 10);

    const [user] = await query(
      `INSERT INTO users (name, email, password_hash, role, organization_id)
       VALUES (:name, :email, :passwordHash, 'admin', :organizationId)
       RETURNING id, name, email, role, organization_id`,
      {
        name,
        email: payload.email,
        passwordHash,
        organizationId: organization.id
      }
    );

    res.status(201).json({ user, token: signToken(user) });
  } catch {
    res.status(401).json({ error: "Google login failed" });
  }
});
