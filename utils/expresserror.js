class ExpressError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.message=message;
    }
}
module.exports = ExpressError;
//this is the actual flow of error handling
/*throw new ExpressError(400, "Price cannot be negative")
        ↓
   wrapAsync.catch(next)
        ↓
   next(err) called
        ↓
   Express skips normal routes
        ↓
   app.use((err, req, res, next)) triggers
        ↓
   error.ejs renders with your message */