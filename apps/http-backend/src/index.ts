import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import Jwt from "jsonwebtoken";
const app = express();
dotenv.config({ path: "../../packages/db/.env" });
app.use(express.json());
app.use(cors());

import auth from "./middleware";
import {
  CreateUserSchema,
  RoomSchema,
  UserSigninSchema,
} from "@repo/common/types";
import { prisma } from "@repo/db/client";
import { JWT_SECRET } from "@repo/backend-common/config";

app.post("/signup", async (req, res) => {
  const inputs = CreateUserSchema.safeParse(req.body);
  if (!inputs.success) {
    return res.json({ message: "invalid inputs" });
  }
  console.log(process.env.DATABASE_URL);
  const response = await prisma.user.create({
    data: {
      email: inputs.data.email,
      password: inputs.data.password,
      name: inputs.data.name,
    },
  });
  res.json({ message: "signed up" });
});
app.post("/signin", async (req, res) => {
  const inputs = UserSigninSchema.safeParse(req.body);

  if (!inputs.success) {
    return res.json({
      message: "invalid data ",
    });
  }
  const user = await prisma.user.findFirst({
    where: {
      email: inputs.data.email,
      password: inputs.data.password,
    },
  });

  if (!user) {
    return res.status(403).json({ message: " not Authorized" });
  }

  const token = Jwt.sign(
    {
      userId: user.id,
    },
    JWT_SECRET,
  );

  return res.json({ Message: token });
});
app.post("/create-room", auth, async (req, res) => {
  const inputs = RoomSchema.safeParse(req.body);
  if (!inputs.success) {
    return res.json({ message: "invalid inputs" });
  }
  const userid = req.userId;
  if (!userid) {
    res.json({ message: "login again" });
    return;
  }
  try {
    const room = await prisma.room.create({
      data: {
        slug: inputs.data.name,
        adminId: userid,
      },
    });
    res.send(room.id);
  } catch (e) {
    res.status(411).json({ error: "room-name already exist" });
  }
});
app.post("room/:roomId", auth, async (req, res) => {});

app.listen(3002);
