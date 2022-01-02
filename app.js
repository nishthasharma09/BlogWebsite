const express = require("express"); //node
const bodyParser = require("body-parser"); //input
const ejs = require("ejs"); //templating html
const _ = require("lodash"); //
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
	session({
		secret: "We are using a secret",
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");
//mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
	email: String,
	password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const posts = [];

app.get("/", function (req, res) {
	if (req.isAuthenticated()) {
		res.render("home");
	} else {
		res.redirect("/login");
	}
});

app.get("/compose", function (req, res) {
	if (req.isAuthenticated()) {
		res.render("compose");
	} else {
		res.redirect("/login");
	}
});

app.get("/blog", function (req, res) {
	if (req.isAuthenticated()) {
		res.render("blog", { posts: posts });
	} else {
		res.redirect("/login");
	}
});

app.get("/login", function (req, res) {
	res.render("login");
});

app.post("/login", function (req, res) {
	const user = new User({
		username: req.body.username,
		passport: req.body.password,
	});

	req.login(user, function (err) {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/blog");
			});
		}
	});
});

app.get("/signup", function (req, res) {
	res.render("signup");
});

app.post("/signup", function (req, res) {
	User.register(
		{
			username: req.body.username,
		},
		req.body.password,
		function (err, user) {
			if (err) {
				console.log(err);
				res.redirect("/signup");
			} else {
				passport.authenticate("local")(req, res, function () {
					res.redirect("/blog");
				});
			}
		}
	);
});

app.post("/compose", function (req, res) {
	if (req.isAuthenticated()) {
		var post = {
			title: _.capitalize(req.body.title),
			body: req.body.body,
		};
		posts.push(post);
		res.render("blog", { posts: posts });
	} else {
		res.redirect("/login");
	}
});

app.get("/posts/:postNumber", function (req, res) {
	if (req.isAuthenticated()) {
		posts.map((post, index) => {
			if (req.params.postNumber == index) {
				res.render("post", { title: post.title, body: post.body });
			}
		});
	} else {
		res.redirect("/login");
	}
});

app.post("/logout", function (req, res) {
	req.logout();
	res.redirect("/");
});

app.listen(3000, function () {
	console.log("Server started at port 3000.");
});
