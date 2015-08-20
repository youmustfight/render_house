var mongoose = require('mongoose');

var Admin = new mongoose.Schema({
    _id: String,
    isAdmin: {type: Boolean, default: false},    
    email: {
        type: String
    }
});


mongoose.model('Admin', Admin);