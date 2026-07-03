const mongoose = require("mongoose");
const data = require("./sample.js");
const Listing = require("../models/listings.js");

mongoose.connect("mongodb://127.0.0.1:27017/WanderLust").then(() => {
    console.log("DB connected");
}).catch((error) => {
    console.log(error);
})

async function initdata() {
    await Listing.deleteMany({});
    
    data.data = data.data.map((obj) => ({
        ...obj,
        owner: "652d0081ae547c5d37e56b5f"
    }));
//data.data ek array of listing objects tha. Maine map() use kiya taaki har object ka naya version create kar saku. ...obj se maine us object ki saari existing properties copy ki aur owner field add kar di. Isse har listing ko same owner ID assign ho gayi, aur baaki data unchanged raha."
    console.log(data.data[0]);
    await Listing.insertMany(data.data);
    console.log("db done");
}

initdata();