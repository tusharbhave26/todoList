require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express()
const PORT = process.env.PORT || 3000

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"))

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect(process.env.MONGO_URI,  
   {useUnifiedTopology:true, 
   useNewUrlParser: true});
    console.log("Connected")
};

const itemSchema = new mongoose.Schema({
    name: String
});

const Item = new mongoose.model("Item", itemSchema);

const item1 = new Item({
    name:"Welcome to the todo list"
})

const item2 = new Item({
    name:"Hit + button to add a new item"
})

const item3 = new Item({
    name:"<-- Hit this to delete the item"
})

const defaultItem = [item1, item2,item3];

const listSchema = {
    name: String,
    items: [itemSchema]
}

const Lists = new mongoose.model("List", listSchema)


app.get("/", function(req,res){

    Item.find({}).then(function(founditem){
        if(founditem.length === 0){
            Item.insertMany(defaultItem).then(function(){
                console.log("Inserted successfully in the collections")
            }).catch(function(err){
                console.log(err)
            });
            res.redirect("/");
        }
        else{
            res.render("list", {listTitle: "Today", newlistitem: founditem})
        }

    }).catch(function(err){
        console.log(err)
    });

        // res.render("list", {listTitle: "Today", newlistitem: items})
})

app.get("/:customRoute", function(req,res){
   const customRouteName = _.capitalize(req.params.customRoute)

Lists.findOne({name:customRouteName}).then(function(foundlist){
    if (!foundlist){

    // Create the new List
        const list = new Lists({
        name: customRouteName,
        items: defaultItem
       })
    
       list.save();
       res.redirect("/" + customRouteName)
    }
    else{
        // Show an existing list

        res.render("list", {listTitle: foundlist.name, newlistitem: foundlist.items})
        res.redirect("/" + customRouteName)
    }
}).catch(function(err){
    console.log(err)
});   

})

app.get("/about", function(req,res){
    res.render("about.ejs");
})

// app.post("/work", function(req,res){
//     var item = req.body.newitem
//     workItems.push(item)
//     res.redirect("/work")
// })

app.post("/", function(req,res){

    const itemName = req.body.newitem
    const listName = req.body.list
    const item = new Item({
        name: itemName
    });

    if (listName === "Today"){
        item.save();
        res.redirect("/")
    } 
    else{
        Lists.findOne({name: listName}).then(function(foundlist){
            foundlist.items.push(item)
            foundlist.save();
            res.redirect("/" + listName)
        })
    }
});

app.post("/delete", function(req,res){
    const checkeditemID = req.body.checkeditem
    const listName = req.body.listName

    if (listName === "Today"){
        Item.findByIdAndRemove(checkeditemID).then(function(){
            console.log("Removed successfully checked item")
        }).catch(function(err){
            console.log(err)
        })
        res.redirect("/")
    }
    else{
        Lists.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkeditemID}}}).then(
            function(){
                console.log("removed successfully")
            }).catch(function(err){
                console.log(err)
            })
            res.redirect("/"+listName)
    }
});

app.listen(PORT, function(){
    console.log("server is running on port ${PORT}")
});