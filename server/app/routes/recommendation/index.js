var Product = mongoose.model("Product");
var router = require('express').Router();

// utility functions


function tags(objectId){
	return Product.findById(objectId).select('tags');
}

router.get('/',function(req,res,next){
	// this needs to a return a json array that holds all of the recommended 
	
	
})