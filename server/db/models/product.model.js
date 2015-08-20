var mongoose = require('mongoose');


var Product = new mongoose.Schema({
	title: {type: String, maxlength: 20, required:true},
	description: {type: String, max: 300},
	snapshotFileUrl: {type:String},
	modelFileUrl: {type:String},
	tags: [{type:String}],
	license: String,
	formatsAvailable: {type:String},
	price: Number,
	freeOption: Boolean,
	creator: {type: mongoose.Schema.Types.ObjectId, ref:"User", required:true},
	timesDownloaded: {type: Number, default: 0},
	comments: [{type: mongoose.Schema.Types.ObjectId, ref:"UserComments"}],
	webRenderScale: Number,
	dateCreated: {type: Date, default: Date.now}
});


mongoose.model("Product",Product);