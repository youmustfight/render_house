var router = require('express').Router();
var	_ = require('lodash');
var mongoose = require('mongoose');
var Product = mongoose.model('Product')



router.get('/', function (req, res, next) {
	Product.find({}).populate('owner').exec()
	.then(function (products) {
		res.json(products);
	})
	.then(null, next);
});

router.post('/', function (req, res, next) {
	Product.create(req.body)
	.then(function (Product) {
		return Product.populateAsync('owner');
	})
	.then(function (populated) {
		res.status(201).json(populated);
	})
	.then(null, next);
});

router.put('/',function (req,res,next){
	
	Product.findOneAndUpdate({_id: req.body._id}, req.body, {upsert: true, new: true},function(err,product){
		if(err) return next(err)
		res.json(product)
	})
})

module.exports = router;