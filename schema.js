//this is for the server side validation of data
const Joi=require("joi");
//this if for out form associated with listings
const listingSchema = Joi.object({listings: Joi.object({    
  title: Joi.string()
    .min(5)
    .max(100)
    .required()
    .messages({
      "string.empty": "Title cannot be empty",
    }),
  description: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      "any.required": "Description is required",
    }),

  price: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.base": "Price must be a number",
      "any.required": "Price is required",
    }),

  location: Joi.string().required().messages({
      "any.required": "Location is required",
    }),
  country: Joi.string().required(),

image: Joi.object({
    url: Joi.string().uri().allow("", null)
})
})});
//now validation for form associated with the review schema 
const reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number()
            .min(1)
            .max(5)
            .required()
            .messages({
                "number.min": "Rating must be at least 1",
                "number.max": "Rating cannot exceed 5",
                "any.required": "Rating is required"
            }),
        comment: Joi.string()
            .min(5)
            .required()
            .messages({
                "string.empty": "Comment cannot be empty",
                "any.required": "Comment is required"
            }),
               createdAt: Joi.date() 
    }).required()
});


module.exports={listingSchema,reviewSchema};