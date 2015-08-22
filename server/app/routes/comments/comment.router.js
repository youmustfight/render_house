var router = require('express').Router();
var	_ = require('lodash');
var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');
var Product = mongoose.model('Product');

router.post('/', function (req, res, next) {

	Comment.create(req.body)
	.then(function (Comment) {
		// ARG can't populate
		return Comment.populate('user');
	})
	.then(function (populatedComment) {
		res.status(201).json(populatedComment);
	})
	.then(null, next);

});

module.exports = router;