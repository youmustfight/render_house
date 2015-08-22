var router = require('express').Router();
var	_ = require('lodash');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Product = mongoose.model('Product')



router.param('id', function (req, res, next, id) {
	console.log('resolving for user')
	User.findById(id).populate('myModels').populate('purchaseHistory').exec()
		.then(function (user) {
			if (!user) throw HttpError(404);
			else {
				req.user = user;
				next();
			}
		})
		.then(null, next);
})

/* GET user JSON object */
router.get('/', function(req, res, next) {
  	User.find()
	.sort([['email', 'ascending']])
	.exec()
	.then(function (users){
		res.json(users)
	}, next)
});

// Handle specific user get
router.get('/:id', function (req, res, next) {
		res.json(req.user);
});

router.post('/', function(req,res,next){
		User.create(req.body).then(function(user){
			res.status(201).json(user);
		})
		.then(null,next);
});

// Add to myModels - utilize in upload post?

router.put('/upload', function (req, res, next) {
	// console.log(req.body);
	User.findOneAndUpdate({_id: req.body.userId}, {$addToSet: {myModels: req.body.uploadId}}).exec()
		.then(function (user){
			res.json(user);
		}, function(failure) {
			console.log(failure);
		});
});


// Add to Purchase History - utilize in download button?
router.put('/download', function (req, res, next){
	// Add to User Purchase History
	User.findOneAndUpdate({_id: req.body.userId}, {$addToSet: {purchaseHistory: req.body.modelId }}).exec()
		.then(function(user){	
			res.json(user);
		}, function(failure){
			console.log(failure);
		})
		.then(next, function(err){
			console.log('error is',err)
		});
});

router.put('/update',function (req,res,next){
	console.log(req.body)
	User.findOneAndUpdate({_id: req.body._id}, req.body)
	.exec()
	.then(function (user){
		console.log(user)
		res.json(user)
	}, next)
})

router.put('/newpassword',function (req,res,next){
    User.findById({_id: req.body._id}).exec()
    .then(function (user){
        console.log(user)
        user.password = req.body.password;
        user.refresh = req.body.refresh;
        user.save().then(function(newpass){
                console.log(newpass)
                res.json(newpass)
        }, next)
    
    })
})


router.delete('/:userId',function (req,res,next){
	console.log("about to delete user", req.params.userId)
	User.findByIdAndRemove(req.params.userId)
	.exec()
	.then(function (user){
		console.log("user deleted")
		res.json(user)
	}, next)
})


module.exports = router;


