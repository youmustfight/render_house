'use strict'

var router = require('express').Router();
var	_ = require('lodash');
var mongoose = require('mongoose');
var Cart = mongoose.model('Cart');
var Product = mongoose.model('Product');
var User = mongoose.model('User');

router.get('/', function(req,res,next){

	var modelParams = {}
	if(req.query._id) modelParams._id = req.query._id
	
	Cart.find(modelParams).exec().then(function(orders){
		res.send(orders)
	})


});


router.post('/', function (req, res, next) {
	Cart.create(req.body)
	.then(function (cart) {
		return cart.populateAsync('user');
	})
	.then(function (populated) {
		res.status(201).json(populated);
	})
	.then(null, next);
});

//update something about an order
router.put('/',function(req,res,next){
	Cart.findOneAndUpdate({_id: req.body._id},req.body,{new: true})
	.exec()
	.then(function(order){
		res.json(order)
	},function(err){console.log(err, 'failed to update order')})
	.then(function(order){
		res.send(order)
	})
})



module.exports = router;