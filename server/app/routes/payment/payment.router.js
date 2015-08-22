'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');

var stripe = require("stripe")("sk_test_WhzuBvvju6AKl7KyIKtdWiQf");

router.post('/', function(req, res, next) {
    stripe.charges.create({
        amount: req.body.amount,
        currency: "usd",
        source: req.body.token,
        description: ""
    }, function(err, charge) {
        res.send('Charged! Details: ' + charge);
    });
});

module.exports = router; 
