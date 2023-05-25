require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const moongoose = require("mongoose");
const { default: mongoose } = require("mongoose");
const _ = require("lodash");


const app = express();
const PORT = process.env.PORT || 3000;


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

  const itemsSchema = new moongoose.Schema({
    item: {
      type: String,
      required: true,
    }
  });

  const listSchema = new mongoose.Schema({
    name: String,
    listItems: [itemsSchema]
  });

  const Item = mongoose.model('Item', itemsSchema);

  const List = mongoose.model("List", listSchema);

  const item1 = new Item({
    item:"Welcome to your todolist!"
  });

  const item2 = new Item({
    item:"Hit the + button to add a new item."
  });

  const item3 = new Item({
    item:"<-- Hit this to delete an item."
  });

  const defaultItems = [item1, item2, item3];

  app.get("/", function(req, res) {
    Item.find({}).then(function(items){
      if (items.length === 0) {
        Item.insertMany(defaultItems).then(function(){
          console.log("Succesfully added.");
        }).catch(function(err){
          console.log(err);
        });
        res.redirect("/");
      }else{
      res.render("list", {listTitle: "Today", newListItems: items});
      }
    });  
  });

  app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const  item = new Item({
      item: itemName
    });
    
    if (listName === "Today") {
      item.save();
      res.redirect("/");
    } else {
      List.findOne({name: listName}).then(foundList => {
       foundList.listItems.push(item);
       foundList.save();
      });
      res.redirect("/" + listName);
    }
  });

  app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today"){
      Item.findByIdAndDelete(checkedItemId).exec(); 
      res.redirect("/");
    } else {
      List.findOneAndUpdate({name:listName}, {$pull: {listItems: {_id:checkedItemId}}}).exec();
      res.redirect("/" + listName);
    }
  });

  app.get("/:customList", function(req, res){
    const customList = _.capitalize(req.params.customList);
    List.findOne({name: customList}).then(item => {
      if(!item){
        const list = new List({
            name: customList,
            listItems: defaultItems
          });

          list.save();
          res.redirect("/" + customList);

        } else {
          res.render("list", {listTitle: item.name, newListItems: item.listItems});
        }
      });
  });

  app.get("/about", function(req, res){
    res.render("about");
  });

  app.listen(PORT, function() {
    console.log(`Server started on port ${3000}`);
    });
}
