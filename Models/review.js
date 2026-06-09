const mongooose=require("mongoose");
const reviewSchema=new mongooose.Schema({
    comment:{
        type:String
    },
    price:{
        type:Number,
        min:0,
        max:5
    },
    createdAt:{
        type:Date,
        default:Date.now()
    }

})
module.exports=mongooose.model("Review",reviewSchema);
//this is my review schema and it is also passed as an key:value to my listing schema also. this is the child of out listing schema model