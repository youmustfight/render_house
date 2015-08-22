'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');

var stripe = require("stripe")("sk_test_WhzuBvvju6AKl7KyIKtdWiQf");

router.post('/payment', function(req, res, next) {
    
    console.log('this from payment req', req.body.token);
    stripe.charges.create({
        amount: req.body.tip,
        currency: "usd",
        source: req.body.token,
        description: req.body.manifest
    }, function(err, charge) {
        res.send('Charged! Details: ' + charge);
    });
});

