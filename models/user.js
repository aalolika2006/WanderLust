//for autheticaton purpose-username,email,password
const mongoose=require("mongoose");
const passportLocalMongoose=require("passport-local-mongoose").default;
console.log(passportLocalMongoose);
const UserSchema=new mongoose.Schema({
email:{
    type: String,
    required:true
},
wishlist: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
    },
],
})
UserSchema.plugin(passportLocalMongoose);//it will automatically generate password and username for user
module.exports = mongoose.model("User", UserSchema);
