'use strict';
var router = require('express').Router();
module.exports = router;

router.use('/members', require('./members'));
router.use('/cart', require('./cart/cart.router'))
router.use('/product', require('./product/product.router'))
router.use('/user', require('./user/user.router'));
router.use('/recs', require('./recommendation/recommendation.router'));
// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});
