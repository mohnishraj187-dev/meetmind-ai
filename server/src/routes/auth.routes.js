import bcrypt from "bcryptjs";
import express from "express";
import { query } from "../db.js";
import { signToken } from "../auth.js";

export const authRouter = express.Router();

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
