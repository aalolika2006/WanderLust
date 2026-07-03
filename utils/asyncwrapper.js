function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(next);
    };
}
module.exports=wrapAsync;
//baar baar try and catch likhne ki zarurat nhi hogi error handle karne k liye, bas sabke pehle yeh likho toh yeh karega express ka error handler jo hai usko trigger karega in case of any kind of erros 
//"wrapAsync is a reusable higher-order function that wraps asynchronous route handlers. It automatically catches rejected promises and forwards the error to Express using next(error), eliminating the need to write try-catch blocks in every async route."