import express, { Request, Response } from "express";
import { auth, requiresAuth } from "express-openid-connect";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const config = {
	authRequired: false,
	auth0Logout: true,
	secret: "4441fd668fbfeb99b2cf4c9d139ee44baac85892bd4a6fef60fd07dd6fd42b50",
	baseURL: "http://localhost:3000",
	clientID: "YMV4lDxee9EUiha24yCvEZueKjTX2x5O",
	issuerBaseURL: "https://dev-xn6wkwyc1sx2inoe.us.auth0.com",
};

const app = express();

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(
	auth({
		...config,
	})
);

app.get("/", async (req: Request, res: Response) => {
	console.log(req.oidc.user);
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

app.listen(port);

console.log(`Server running on port ${port}.`);
