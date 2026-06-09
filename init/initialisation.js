const mongoose=require("mongoose");
const data=require("./sample.js");//stores all the data
const Listing=require("../models/listings.js");//stores the model
//basic mdb connection
mongoose.connect("mongodb://127.0.0.1:27017/WanderLust").then(()=>{
console.log("DB connected");
}).catch((error)=>{
    console.log(error);
})
//seeder function
async function initdata(){
 await Listing.deleteMany({});
 await Listing.insertMany (data.data);
 console.log("db done");
}
initdata();
