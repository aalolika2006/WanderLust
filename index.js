const express = require("express");//imported express
const mongoose = require("mongoose");//mongoose
//“The path module in Node.js is used to handle and build file paths in a safe and platform-independent way. It helps avoid issues with different operating systems like Windows and Linux using path.join() to correctly create directory paths.”
const path = require("path");
//requiring the model that is going to hold data
const Listings=require("./Models/listings.js");
const Review=require("./Models/review.js");
//require sample data
const data=require("./init/sample.js");
// Initialize app
const app = express();
// Set EJS as view engine
app.set("view engine", "ejs");
const ExpressError = require("./utils/ExpressError");//express error throw
app.set("views", path.join(__dirname, "views"));
//“Serve all files inside the public folder directly to the browser.”
app.use(express.static(path.join(__dirname,"public")));
//if we use this async wrapper thing phir har baar mujhe alag alag karke try catch nhi likhna hoga 
const wrapAsync = require("./utils/asyncwrapper.js");//for triggering express error handling
// Middleware (parses the form data-jo bhi data aa raha hai from the html woh js object meh convert hota hai so that we can access it in req.body )
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//for supporting update and delete request as html pages support only get and post
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
//It adds support for layout system in EJS
const ejsMate = require("ejs-mate");
app.engine("ejs",ejsMate);
//Joi is responsible for client side validation(validating the input before it reaches the db)
const Joi=require("joi");
//requiring both the validations
const { listingSchema, reviewSchema } = require("./schema.js");
//basic mdb connection
mongoose.connect("mongodb://127.0.0.1:27017/WanderLust").then(()=>{
console.log("DB connected");
}).catch((error)=>{
    console.log(error);
})
let port=3000;//this is our port
app.listen(port,(req,res)=>{
   console.log("server started");
})
app.get("/",(req,res)=>{
    res.send("I a root !");
})

//Index route
app.get("/listings",async (req,res)=>{
let alldata=await Listings.find({});
    res.render("index.ejs",{alldata});
})
//New route
app.get("/listings/new",async(req,res)=>{
    res.render("new.ejs");
})
//Show.route
app.get("/listings/:id",async(req,res)=>{
    let {id}=req.params;
    let data=await Listings.findById(id).populate("reviews");
    res.render("show.ejs",{data});
})
//Create (post)route
app.post("/listings", wrapAsync(async (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        // convert Joi error → ExpressError
        //It returns an error object containing an array of all validation issues.
        throw new ExpressError(400, error.details[0].message);
    }
    if (!req.body.listings.image || !req.body.listings.image.url) {
        req.body.listings.image = {
            filename: "listingimage",
            url: "https://picsum.photos/600/400"
        };
    }
   
    let newListing = new Listings(req.body.listings);
    await newListing.save();
    res.redirect("/listings");
}));
//Edit route
app.get("/listings/:id/edit", wrapAsync(async (req, res,next) => {
    let { id } = req.params;
    let listing = await Listings.findById(id);

    res.render("edit.ejs", { listing });
}));
//update route
app.put("/listings/:id", wrapAsync(async (req, res,next) => {
    let { id } = req.params;
     let { error } = listingSchema.validate(req.body);
    if(error)throw new ExpressError(400,error.details[0].message);
    await Listings.findByIdAndUpdate(
        id,req.body.listings
    );
    res.redirect("/listings");
}));

//Route for review
app.post("/listings/:id/reviews",wrapAsync(async(req,res,next)=>{
let { error } = reviewSchema.validate(req.body);
if(error)throw new ExpressError(400,error.details[0].message);
let {id}=req.params;
let listings=await Listings.findById(req.params.id).populate("reviews");
let review=new Review(req.body.review);
listings.reviews.push(review);
await review.save();
await listings.save();
res.redirect(`/listings/${id}`);
}))

//route for delete review
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res, next) => {
    let { id, reviewId } = req.params;
    await Listings.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId }
    });
await Review.findByIdAndDelete(id);
    res.redirect(`/listings/${id}`);
}));
//Delete route
app.delete("/listings/:id",wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listings.findByIdAndDelete(id);
    res.redirect("/listings");
}));
//400-Bad reqt
app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});
//this is my  express error middleware ok
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});


