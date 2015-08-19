var router = require('express').Router();
var	_ = require('lodash');
var mongoose = require('mongoose');
var Product = mongoose.model('Product');



router.get('/', function (req, res, next) {
	console.log('this is req router', req.body)
	Product.find({}).populate('owner').exec()
	.then(function (products) {
		res.json(products);
	})
	.then(null, next);
});



module.exports = router;