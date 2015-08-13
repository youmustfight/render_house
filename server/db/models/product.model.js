var mongoose = require('mongoose');


var Product = new mongoose.Schema({
	title: {type: String, maxlength: 20, required:true},
	description: {type: String, max: 300},
	snapshotFileUrl: {type:String, required:true},
	highResFileUrl: {type:String, required:true},
	tags: {type:String, required:true},
	license: String,
	formatsAvailable: {type:String, required:true},
	price: Number,
	freeOption: Boolean,
	owner: {type: mongoose.Schema.Types.ObjectId, ref:"User", required:true},
	timesDownloaded: Number,
	comments: [{type: mongoose.Schema.Types.ObjectId, ref:"UserComments"}]
});


mongoose.model("Product",Product);
