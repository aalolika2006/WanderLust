const mongoose=require("mongoose");
const listingSchema=new mongoose.Schema({
    title:{
    type: String,
    required:true
    },
    description:String,
 image: {
    filename: {
        type: String,
        default: "listingimage"
    },
    url: {
        type: String,
        default: "https://picsum.photos/600/400"
    }
},
    price:{
        type: Number,
        min:0,
    },
    location:String,
    country:String,
    reviews:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Review"
    }],
owner:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
}
})
const Review=require("./review")
// Cascade delete reviews->Parent delete hua to usse related child records bhi automatically delete ho jayein.
//here we r using the post mongoosemiddleware- if listing is deleted post that deletion
//here listing parameter is the data of the deleted document  
listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
      //Jitne bhi reviews ki ID is array mein hai, sab delete kar do.
        await Review.deleteMany({
            _id: { $in: listing.reviews }
        });
    }
});
const Listings= mongoose.model("Listing",listingSchema);
module.exports=Listings;