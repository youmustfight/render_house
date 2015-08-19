var router = require('express').Router();
var	_ = require('lodash');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Product = mongoose.model('Product')


/* GET user JSON object */
router.get('/', function(req, res, next) {
	console.log("hit")
  	User.find()
	.sort([['email', 'ascending']])
	.exec()
	.then(function (users){
		res.json(users)
	},next)
});

router.post('/', function(req,res,next){
		User.create(req.body).then(function(user){
			res.status(201).json(user);
		})
		.then(null,next);
});

router.put('/', function (req, res, next){
		User.findOneAndUpdate({_id: req.body.user._id}, {$addToSet: {purchaseHistory: req.body.item }}).exec().then(function(user){	
					res.send(user);
			}, function(failure){
			}).then(next, function(err){
				console.log('error is',err)
			})
			
});

router.put('/update',function (req,res,next){
	console.log(req.body)
	User.findOneAndUpdate({_id: req.body._id}, req.body)
	.exec()
	.then(function (user){
		console.log(user)
		res.json(user)
	},next)
})


router.delete('/:userId',function (req,res,next){
	console.log("about to delete user", req.params.userId)
	User.findByIdAndRemove(req.params.userId)
	.exec()
	.then(function (user){
		console.log("user deleted")
		res.json(user)
	},next)
})


module.exports = router;
