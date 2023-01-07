var express = require('express');
var bodyParser = require('body-parser');
var  mongoose = require('mongoose');
const _ = require("lodash");

var app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect(
  "mongodb+srv://valeryiabeizer:pCV32dYi94mAS@cluster0.y2ttp.mongodb.net/todolistDB"
);

const itemsSchema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const tickets = new Item({ name: "Buy tickets" });

const itemsArray = [tickets];

app.get("/", function (req, res) {
  Item.find(function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(itemsArray, function (err) {
        if (err) {
          console.log("Something went wrong!");
        }
      });
      res.redirect("/");
    } else {
      res.render("index", { listTitle: "LIFE", newListItems: foundItems });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newTodo;
  const listName = req.body.list;

  const newItem = new Item({ name: itemName });

  if (listName === "LIFE") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/:newRoute", function (req, res) {
  const newRouteList = _.toUpper(req.params.newRoute);
  List.findOne({ name: newRouteList }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
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

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "LIFE") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log("Something went south!");
      } else {
        console.log("Mission is completed!");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});


app.listen(3000, function() {
    console.log('Server is running');
});