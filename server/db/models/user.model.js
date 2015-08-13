'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');
// var Product = require('/product.model.js');
// var Cart = require('/cart.model.js');


var schema = new mongoose.Schema({
    isAdmin: {type: Boolean, default: false},
	firstName: String,
	lastName: String,
	displayName:String,
	phone: String,
	userBlurb: String,
    email: {
        type: String
    },
    password: {
        type: String
    },
    salt: {
        type: String
    },
    twitter: {
        id: String,
        username: String,
        token: String,
        tokenSecret: String
    },
    facebook: {
        id: String
    },
    google: {
        id: String
    },
    pictureUrl: String,
    purchaseHistroy:[{type: mongoose.Schema.Types.ObjectId, ref:"Product", required:true}]
});

// generateSalt, encryptPassword and the pre 'save' and 'correctPassword' operations
// are all used for local authentication security.
var generateSalt = function () {
    return crypto.randomBytes(16).toString('base64');
};

var encryptPassword = function (plainText, salt) {
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
};

schema.pre('save', function (next) {

    if (this.isModified('password')) {
        this.salt = this.constructor.generateSalt();
        this.password = this.constructor.encryptPassword(this.password, this.salt);
    }

    next();

});

// schema.methods.getProduct = function () {
// 	return Product.find({owner: this._id}).exec();
// };

// schema.methods.getCart= function () {
// 	return Cart.find({user: this._id}).exec();
// };

schema.statics.generateSalt = generateSalt;
schema.statics.encryptPassword = encryptPassword;

schema.method('correctPassword', function (candidatePassword) {
    return encryptPassword(candidatePassword, this.salt) === this.password;
});

mongoose.model('User', schema);