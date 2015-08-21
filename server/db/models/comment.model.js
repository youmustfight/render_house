var mongoose = require("mongoose");

var Comment = new mongoose.Schema({
	user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
	model: {type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true},
	comment: String,
	rating: Number
});

mongoose.model("Comment", Comment);