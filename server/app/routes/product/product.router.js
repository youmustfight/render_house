var router = require('express').Router();
var	_ = require('lodash');
var mongoose = require('mongoose');
var Product = mongoose.model('Product')

router.param('id', function (req, res, next, id) {
	Product.findById(id).populate('creator').exec()
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

// Add a Product
router.post('/upload', function (req, res, next) {
	Product.create(req.body)
	.then(function (Product) {
		return Product.populate('creator');
	})
	.then(function (populated) {
		res.status(201).json(populated);
	})
	.then(null, next);
});

// Increment Download on a Product
router.put('/download', function (req, res, next) {
	Product.findOneAndUpdate({_id: req.body.modelId}, { $inc: { timesDownloaded: 1 } }).exec()
		.then(function(user){	
				res.json(user);
			}, function(failure){
				console.log(failure);
			});
});

// Update a Product
router.put('/', function (req,res,next){
	Product.findOneAndUpdate({_id: req.body._id}, req.body, {upsert: true, new: true},function(err,product){
		if(err) return next(err)
		res.json(product)
	})
});


// Delete a Product
router.delete('/', function (req, res, next) {
	Product.findById(req.body._id, function (err, doc) {
		doc.remove();
	});
})



module.exports = router;