import * as dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import { auth, requiresAuth } from "express-openid-connect";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// const PubNub = require("pubnub");

const {
  AUTH0_CLIENT_ID,
  AUTH0_SECRET,
  AUTH0_ISSUER_BASE_URL,
  // PUBNUB_PUBLISH_KEY,
  // PUBNUB_SUBSCRIBE_KEY,
} = process.env;

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: AUTH0_SECRET,
  baseURL: "http://localhost:3000",
  clientID: AUTH0_CLIENT_ID,
  issuerBaseURL: AUTH0_ISSUER_BASE_URL,
};

const app = express();

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// const pubnub = new PubNub({
//   publishKey: PUBNUB_PUBLISH_KEY,
//   subscribeKey: PUBNUB_SUBSCRIBE_KEY,
//   userId: crypto.randomUUID(),
// });

// add listener to pubnub

// const listener = {
//   status: (statusEvent: any) => {
//     if (statusEvent.category === "PNConnectedCategory") {
//       console.log("connected");
//     }
//   },
//   message: (msgEvent: any) => {
//     console.log("msg: ", msgEvent);
//   },
//   presence: (presenceEvent: any) => {},
// };
// pubnub.addListener(listener);

app.get("/", async (req: Request, res: Response) => {
  const posts = await prisma.post.findMany();
  res.render("index", { user: req.oidc.user, posts });
});
app.get("/signup", (req: Request, res: Response) =>
  res.redirect(
    `${config.issuerBaseURL}/authorize?prompt=login&screen_hint=signup`
  )
);

app.route("/name").get((req: Request, res: Response) => {
  const { state } = req.query;
  res.render("name", { state });
});

app
  .route("/post/create")
  .all(requiresAuth())
  .get((req: Request, res: Response) => res.render("createPost"))
  .post(async (req: Request, res: Response) => {
    const { title, content } = req.body;
    const { user } = req.oidc;
    if (!user) return res.redirect("/");
    await prisma.post.create({
      data: {
        title,
        content,
        userId: user.sub,
      },
    });
    res.redirect("/");
  });

app.get("/profile", requiresAuth(), (req: Request, res: Response) =>
  res.json(req.oidc.user)
);

app
  .route("/chat")
  .all(requiresAuth())
  .get((req: Request, res: Response) => {
    // pubnub.subscribe({
    //   channels: ["chatroom-1"],
    // });
    res.render("chat", { user: req.oidc.user });
  });

app.listen(port);

console.log(`Server running on port ${port}.`);
