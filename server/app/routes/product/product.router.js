var router = require('express').Router();
var	_ = require('lodash');
var mongoose = require('mongoose');
var Product = mongoose.model('Product')

router.param('id', function (req, res, next, id) {
	Product.findById(id).populate('creator').populate('comments').exec()
		.then(function (model) {
			if (!model) throw HttpError(404);
			else {
				req.model = model;
				next();
			}
		})
		.then(null, next);
});

// Get All Products
router.get('/', function (req, res, next) {
	Product.find({}).populate('creator').exec()
	.then(function (products) {
		res.json(products);
	})
	.then(null, next);
});

// Get a Product
router.get('/:id', function (req, res, next) {
	res.json(req.model);
});

// Update a Product
router.put('/', function (req,res,next){
	Product.findOneAndUpdate({_id: req.body._id}, req.body, {upsert: true, new: true},function(err,product){
		if(err) return next(err)
		res.json(product)
	})
});

//Get user uploads
router.get('/:userid', function(req,res,next){
	console.log("hit 3")
	Product.find({creator:req.params.userid}).exec().then(function(userProducts){
		res.json(userProducts)
	})
	.then(null,next);
})

// Increment Download on a Product
router.put('/download', function (req, res, next) {
	Product.findOneAndUpdate({_id: req.body.modelId}, { $inc: { timesDownloaded: 1 } }).exec()
		.then(function(user){	
				res.json(user);
			}, function(failure){
				console.log(failure);
			});
});

// Add a Comment
router.put('/comment', function (req, res, next) {
	Product.findOneAndUpdate({_id: req.body.modelId}, { $addToSet: {comments: req.body.commentId}}).exec()
		.then( function (updatedModel) {
			res.json(updatedModel);
		});
})

// Add a Product
router.post('/upload', function (req, res, next) {
	Product.create(req.body)
	.then(function (Product) {
		// Populate isn't working probably because product no longer has the mongoose methods attached
		return Product.populate('creator');
	})
	.then(function (populated) {
		res.status(201).json(populated);
	})
	.then(null, next);
});

// Delete a Product
router.delete('/:productId',function (req,res,next){
	console.log("about to delete product", req.params.productId)
	Product.findByIdAndRemove(req.params.productId)
	.exec()
	.then(function (product){
		console.log("product deleted")
		res.json(product)
	}, next)
});


module.exports = router;