import express from "express";
import models from "../models";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generate-token";

const UserController = express.Router();

const AUTH_TOKEN_EXPIRY = "1y";

UserController.post("/user/signin", async (req, res) => {
  const { emailOrUsername, password } = req.body;

  const user = await models.User.findOne().or([
    { email: emailOrUsername },
    { username: emailOrUsername },
  ]);

  if (!user) {
    res.status(404).json({ error: "User not found." });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    res.status(403).json({ error: "Invalid password." });
    return;
  }

  res.json({
    token: generateToken(user, process.env.SECRET, AUTH_TOKEN_EXPIRY),
  });
});

export default UserController;
