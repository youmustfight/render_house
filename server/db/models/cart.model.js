// Bring in all third part libraries

var mongoose = require('mongoose');

var Cart = new mongoose.Schema({
	user: {type:mongoose.Schema.Types.ObjectId, ref:'User', required:true},
	products:[{type:mongoose.Schema.Types.ObjectId, ref:'Product'}],
	date: {type: Date, required: true, default: Date.now}
});

mongoose.model("Cart",Cart)
