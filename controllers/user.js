import express from "express";
import models from "../models";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generate-token";
import { checkAuthorizationToken } from "../utils/apollo-server";
import config from "../config/config";
const { User, Message } = models;

const UserController = express.Router();

const AUTH_TOKEN_EXPIRY = "1y";

UserController.post("/user/signin", async (req, res) => {
  const { emailOrUsername, password } = req.body;

  const user = await User.findOne().or([
    { email: emailOrUsername },
    { username: emailOrUsername },
  ]);

  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    res.status(403).json({ message: "Invalid password." });
    return;
  }

  res.json({
    token: generateToken(user, config.secret, AUTH_TOKEN_EXPIRY),
  });
});

UserController.post("/user/signup", async (req, res) => {
  const { fullName, email, username, password, bio } = req.body;

  // Check if user with given email or username already exists
  const user = await User.findOne().or([{ email }, { username }]);

  if (user) {
    const field = user.email === email ? "email" : "username";
    res
      .status(409)
      .json({ message: `User with given ${field} already exists.` });
    return;
  }

  // Empty field validation
  if (!fullName || !email || !username || !password) {
    res.status(400).json({ message: "All fields are required except bio." });
    return;
  }

  // FullName validation
  if (fullName.length > 40) {
    res.status(400).json({ message: "Full name no more than 40 characters." });
    return;
  }
  if (fullName.length < 4) {
    res.status(400).json({ message: "Full name min 4 characters." });
    return;
  }

  // Email validation
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!emailRegex.test(String(email).toLowerCase())) {
    res.status(400).json({ message: "Enter a valid email address." });
    return;
  }

  // Username validation
  const usernameRegex = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;
  if (!usernameRegex.test(username)) {
    res.status(400).json({
      message:
        "Usernames can only use letters, numbers, underscores and periods.",
    });
    return;
  }
  if (username.length > 20) {
    res.status(400).json({ message: "Username no more than 50 characters." });
    return;
  }
  if (username.length < 3) {
    res.status(400).json({ message: "Username min 3 characters." });
    return;
  }

  const frontEndPages = [
    "forgot-password",
    "reset-password",
    "explore",
    "people",
    "notifications",
    "post",
  ];

  if (frontEndPages.includes(username)) {
    res
      .status(409)
      .json({ message: "This username isn't available. Please try another." });
    return;
  }

  // Password validation
  if (password.length < 6) {
    res.status(400).json({ message: "Password min 6 characters." });
    return;
  }

  const newUser = await new User({
    fullName,
    email,
    username,
    password,
    bio,
  }).save();

  res.json({
    token: generateToken(newUser, config.secert, AUTH_TOKEN_EXPIRY),
  });
});

UserController.post("/user/getAuthUser", async (req, res) => {
  const authUser = await checkAuthorizationToken(req.headers["authorization"]);
  if (!authUser) {
    return res
      .status(401)
      .json({ message: `need a vlid token.` });;
  }

  // If user is authenticated, update it's isOnline field to true
  const user = await User.findOneAndUpdate(
    { email: authUser.email },
    { isOnline: true }
  )
    .populate({ path: "posts", options: { sort: { createdAt: "desc" } } })
    .populate("likes")
    .populate("followers")
    .populate("following")
    .populate({
      path: "notifications",
      populate: [
        { path: "author" },
        { path: "follow" },
        { path: "like", populate: { path: "post" } },
        { path: "comment", populate: { path: "post" } },
      ],
      match: { seen: false },
    });

  user.newNotifications = user.notifications;

  // Find unseen messages
  const lastUnseenMessages = await Message.aggregate([
    {
      $match: {
        receiver: mongoose.Types.ObjectId(authUser.id),
        seen: false,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: "$sender",
        doc: {
          $first: "$$ROOT",
        },
      },
    },
    { $replaceRoot: { newRoot: "$doc" } },
    {
      $lookup: {
        from: "users",
        localField: "sender",
        foreignField: "_id",
        as: "sender",
      },
    },
  ]);

  // Transform data
  const newConversations = [];
  lastUnseenMessages.map((u) => {
    const user = {
      id: u.sender[0]._id,
      username: u.sender[0].username,
      fullName: u.sender[0].fullName,
      image: u.sender[0].image,
      lastMessage: u.message,
      lastMessageCreatedAt: u.createdAt,
    };

    newConversations.push(user);
  });

  // Sort users by last created messages date
  const sortedConversations = newConversations.sort((a, b) =>
    b.lastMessageCreatedAt.toString().localeCompare(a.lastMessageCreatedAt)
  );

  // Attach new conversations to auth User
  user.newConversations = sortedConversations;

  return res
    .status(200)
    .json(user);
});

export default UserController;
