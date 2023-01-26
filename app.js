var express = require("express");
var passport = require("passport");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
var passportLocalMongoose = require("passport-local-mongoose");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

var app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    store: new FileStore(),
    secret: "batman",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGODB_URI);

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

const itemsSchema = {
  name: String,
};

const listSchema = {
  userID: String,
  name: String,
  items: [itemsSchema],
};

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
const List = mongoose.model("List", listSchema);
const Item = mongoose.model('Item', itemsSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const tickets = new Item({ name: "Buy tickets" });
const itemsArray = [tickets];

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/home-in", isLoggedIn, function (req, res) {
  res.render("home-in");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("/");
});

app.get("/:newRoute", function (req, res) {
  const newRouteList = _.toUpper(req.params.newRoute);
  const id = req.user._id;

  List.findOne({ name: newRouteList, userID: id }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          userID: req.user._id,
          name: newRouteList,
          items: itemsArray,
        });
        list.save();
        res.redirect("/" + newRouteList);
      } else {
        res.render("index", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/register", function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  User.register(
    new User({ username: username }),
    password,
    function (err, user) {
      if (err) {
        console.log(err);
        return res.render("register");
      }

      passport.authenticate("local")(req, res, function () {
        res.render("home-in");
      });
    }
  );
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home-in",
    failureRedirect: "/login",
  }),
  function (req, res) {}
);

app.post("/", function (req, res) {
  const itemName = req.body.newTodo;
  const listName = req.body.list;
  const id = req.user._id;

  const newItem = new Item({ name: itemName });

  List.findOne({ name: listName, userID: id }, function (err, foundList) {
    foundList.items.push(newItem);
    foundList.save();
    res.redirect("/" + listName);
  });
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  const id = req.user._id;

  List.findOneAndUpdate(
    { name: listName, userID: id },
    { $pull: { items: { _id: checkedItemId } } },
    function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    }
  );
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

app.listen(port, function () {
  console.log("Server is running");
});
