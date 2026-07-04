if(process.env.NODE_ENV!="production"){
require("dotenv").config();
}
// GENERATE DESCRIPTION REQUIREMENTS 
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//used this for maps
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const express = require("express");//imported express->Express is the web framework I used to build routes and middleware for my application
const mongoose = require("mongoose");//mongoose->Mongoose acts as an ODM and lets me define schemas and interact with MongoDB.
//“The path module in Node.js is used to handle and build file paths in a safe and platform-independent way. It helps avoid issues with different operating systems like Windows and Linux using path.join() to correctly create directory paths.”
const path = require("path");
//requiring the model that is going to hold data
const Listings=require("./models/listings.js");//model require(listing)
const Review=require("./models/review.js");//model require(review)
const data=require("./init/sample.js");//require sample data
const User = require("./models/user.js");//require the user model
const app = express();//create server
const {storage}=require("./cloudConfig.js");
// Multer is a middleware in Node.js + Express that is used to handle file uploads,(images) especially when users upload images, PDFs, videos, etc.
const multer=require("multer");
//also it will automatically create the uploads folder 
const upload = multer({ storage });
// Set EJS as view engi
app.set("view engine", "ejs");
const ExpressError = require("./utils/ExpressError");//express error throw
//require passport
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const dburl=process.env.CONNECTION;
const {MongoStore}=require("connect-mongo");
const store=Mongotore.create({
    mongoUrl:dburl,
    crypto:{
        secret: "mysupersecretcode"
    },
    touchAfter: 24*3600
})
//this allows the user to not do multiple times login in the same website
app.use(session({
    store:store,
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: false
}));
store.on("error",(err)=>{
console.log("error in mongo session store",err);
})
app.use(passport.initialize());//Passport ko activate karta hai.
app.use(passport.session());//Session se login state maintain karta hai.
//to check if user is logged in
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});
passport.use(new LocalStrategy(User.authenticate()));//Username/password verify karta hai.
passport.serializeUser(User.serializeUser());//User ID ko session me store karta hai.serializeUser() stores the user's ID in the session after login
passport.deserializeUser(User.deserializeUser());//Session wali ID se user object nikalta hai.deserializeUser() retrieves the complete user information from the database using that ID on subsequent requests.
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
const cookieParser = require("cookie-parser");
app.use(cookieParser("mySecretKey"));//this is used for signed cookies
//Joi is responsible for client side validation(validating the input before it reaches the db)
const Joi=require("joi");
//requiring both the validations->imagine it as a set of rules for our input data
const { listingSchema, reviewSchema } = require("./schema.js");
//basic mdb connection
// const mongo="mongodb://127.0.0.1:27017/WanderLust";

async function main(){
    await mongoose.connect(dburl);
}
main().then(()=>{
console.log("DB connected");
}).catch((error)=>{
    console.log(error);
})
//privacy route
app.get("/privacy",(req,res)=>{
    res.render("layouts/privacy.ejs");
})
//terms route
app.get("/terms",(req,res)=>{
    res.render("layouts/terms.ejs");
})

//authentication middleware(to verify user is logged in )
function isLoggedIn(req,res,next){
    if(!req.isAuthenticated()){
        return res.redirect("/login");
    }
    next();
}
//authorization middleware(edit/delete)
async function isOwner(req, res, next) {
    let { id } = req.params;
    let listing = await Listings.findById(id);
    if (!listing.owner.equals(req.user._id)) {
        return res.status(403).send("You are not the owner!");
    }
    next();
}
let port=3000;//this is our port
app.listen(port,(req,res)=>{
   console.log("server started");
})
app.get("/",(req,res)=>{
    res.render("/listings");
})
//signup route(get request)
app.get("/signup",(req,res)=>{
    res.render("users.ejs");
})
//login route(get request)
app.get("/login", (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect("/listings");
    }
    //it renders login.ejs and passes any query parameter like error=1 so the view can display an appropriate login failure message."
    res.render("login.ejs", {
        error: req.query.error
    });
});
//signup route(post request)
app.post("/signup",async(req,res,next)=>{
    try{
let{username,email,password}=req.body;
const newuser=new User({email,username})
let registered=await User.register(newuser,password);//register used becoz-I am using passport-local-mongoose. The register() method automatically hashes the password using bcrypt, stores the hash and salt securely, and then saves the user. If I used save(), I would need to manually hash the password before storing it.
console.log(registered);
//this req.login will ensure us that automatically login takes place just after sign up 
req.login(registered,(err)=>{
    if(err)return next(err);
    return res.render("welcome.ejs",{
            username: registered.username
        });
})
    }
    catch(err){
    res.render("users.ejs", {
        error: err.message
    });
}
})
//login
app.post(
    "/login",
    passport.authenticate("local", {
        failureRedirect: "/login?error=1"
    }),
    (req, res) => {
        res.render("welcome.ejs", {
            username: req.user.username
        });
    }
);
//The actual password is never stored. Passport-local-mongoose hashes the password and stores fields like hash and salt in the database. During login, the entered password is hashed again and compared with the stored hash.
//Index route
app.get("/listings",isLoggedIn,async (req,res)=>{
let alldata=await Listings.find({});
    res.render("index.ejs",{alldata});
})
//New route
app.get("/listings/new",isLoggedIn,async(req,res)=>{
    res.render("new.ejs");
})
//Show.route
app.get("/listings/:id", isLoggedIn, async(req, res) => {
    let {id} = req.params;
    let data = await Listings.findById(id).populate({
            path: "reviews",
            populate: { path: "author" }  //  nested populate
        }).populate("owner");
    const user = await User.findById(req.user._id);
    const isWishlisted = user.wishlist.includes(data._id);
    res.render("show.ejs", {
        data,
        isWishlisted,
    });
})
//wishlist route
// Add/Remove Wishlist (Toggle)
app.post("/listings/:id/wishlist", isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    // Check if listing already exists in wishlist
    const exists = user.wishlist.includes(id);
    if (exists) {
        // Remove from wishlist
        user.wishlist.pull(id);
    } else {
        // Add to wishlist
        user.wishlist.push(id);
    }
    await user.save();
    res.redirect(`/listings/${id}`);
});
//wishlist 
app.get("/wishlist", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.render("wishlist.ejs", {
        listings: user.wishlist,
    });
});
//remove wishlist route 
app.post("/wishlist/:id/remove", isLoggedIn, async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndUpdate(req.user._id, {
        $pull: {
            wishlist: id
        }
    });
    res.redirect("/wishlist");
});
//gemini description routes 
app.post("/generate-description", isLoggedIn, async (req, res) => {
    try {
        const { title, location } = req.body;
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });
        const prompt = `Write an attractive Airbnb listing description in 80-100 words.
Title: ${title}
Location: ${location}function isLoggedIn(req,res,next){
    if(!req.isAuthenticated()){
        return res.redirect("/login");
    }
    next();
}
Only return the description.`;
        const result = await model.generateContent(prompt);
        const description = result.response.text();
        res.json({ description });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Failed to generate description",
        });
    }
});
//Create (post)route
app.post("/listings",
isLoggedIn,
upload.single("listings[image]"),
wrapAsync(async (req, res) => {

    let { error } = listingSchema.validate(req.body);
    if (error) {
        throw new ExpressError(400, error.details[0].message);
    }

    let newListing = new Listings(req.body.listings);

    // IMAGE SAFE HANDLING
    if (req.file) {
        newListing.image = {
            filename: req.file.filename,
            url: req.file.path
        };
    } else {
        newListing.image = {
            filename: "listingimage",
            url: "https://picsum.photos/600/400"
        };
    }


    newListing.owner = req.user._id;

    await newListing.save();

    res.redirect("/listings");
}));
//Edit route
app.get("/listings/:id/edit", isOwner,wrapAsync(async (req, res,next) => {
    let { id } = req.params;
    let listing = await Listings.findById(id);

    res.render("edit.ejs", { listing });
}));
//update route
app.put("/listings/:id",upload.single("listing[image]"),isLoggedIn,isOwner,wrapAsync(async (req, res,next) => {
    let { id } = req.params;
     let { error } = listingSchema.validate(req.body);
    if(error)throw new ExpressError(400,error.details[0].message);
  let listing=  await Listings.findByIdAndUpdate(
        id,req.body.listing
    );
    if(typeof req.file!="undefined"){
    listing.image = {
        url: req.file.path,
        filename: req.file.filename,
    };
    await listing.save();
}
    res.redirect("/listings");
}));

//Route for review
app.post("/listings/:id/reviews",isLoggedIn,wrapAsync(async(req,res,next)=>{
let { error } = reviewSchema.validate(req.body);
if(error)throw new ExpressError(400,error.details[0].message);
let {id}=req.params;
let listings=await Listings.findById(req.params.id).populate("reviews");
let review=new Review(req.body.review);
review.author = req.user._id;
listings.reviews.push(review);
await review.save();
await listings.save();
res.redirect(`/listings/${id}`);
}))
//route for delete review
app.delete("/listings/:id/reviews/:reviewId", isLoggedIn,wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;
    await Listings.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId }
    });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}));
//Delete route
app.delete("/listings/:id",wrapAsync(isOwner),wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listings.findByIdAndDelete(id);
    res.redirect("/listings");
}));
//example of cookies-additional information that is stored in the browser(. Login/Logout system)
app.get("/getcookies",(req,res)=>{
    //sendint the cookie
    res.cookie("greet", "hello", { signed: true });
    res.send("transferred u some cookies");
})
//signed cookies(tamper proof cookie)
app.get("/usecookies",(req,res)=>{
    res.send(req.signedCookies.greet);
})
//logout route->Logout in Passport.js is handled using req.logout(), which removes the user session and clears req.user.
    app.get("/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        res.redirect("/listings");
    });
});
//400-Bad reqt
app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});
//this is my  express error middleware ok
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!!" } = err;
    res.status(statusCode).render("error.ejs", { message });
});
