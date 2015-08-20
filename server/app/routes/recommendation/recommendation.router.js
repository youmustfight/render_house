var router = require('express').Router();
var _ = require('lodash');
var mongoose = require('mongoose');
var Product = mongoose.model('Product');
var User = mongoose.model('User');



router.get('/', function(req, res, next) {
    var id = req.body.id;
    User.find({
            _id: id
        })
        .then(function(data) {
            res.json(data);
            console.log('this is req router', req.body)
        })
        .then(null, next);
});



module.exports = router;
