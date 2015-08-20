var router = require('express').Router();
var	_ = require('lodash');
var mongoose = require('mongoose');
var Admin = mongoose.model('Admin');



router.get('/:id', function (req, res, next) {
		Admin.findById(req.params).then(function(user){
			res.user;
		}, next)
});

router.post('/', function(req,res,next){
		Admin.create(req.body).then(function(user){
			res.status(201).json(user);
		})
		.then(null,next);
});