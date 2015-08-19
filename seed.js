/*

This seed file is only a placeholder. It should be expanded and altered
to fit the development of your application.

It uses the same file the server uses to establish
the database connection:
--- server/db/index.js

The name of the database used is set in your environment files:
--- server/env/*

This seed file has a safety check to see if you already have users
in the database. If you are developing multiple applications with the
fsg scaffolding, keep in mind that fsg always uses the same database
name in the environment files.

*/

var mongoose = require('mongoose');
var Promise = require('bluebird');
var chalk = require('chalk');
var connectToDb = require('./server/db');
var User = Promise.promisifyAll(mongoose.model('User'));
var Product = Promise.promisifyAll(mongoose.model('Product'));
var _ = require('lodash');
var chance = require('chance')();

/////////////////////////////////////////////////////// Utility Functions //////////////////////////////

function generateCollections (num,seedFunc){
  return _.times(num,seedFunc)
}
''
var numUsers = 100,
    numProducts = 300;

/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////Person Generation///////////////////////////////////////
function randPersonPhoto (){
    return 'http://lorempixel.com/400/200/people/'
}

var seedUser = function(){
    return new User({
        isAdmin: Math.random() < .02,
        firstName: chance.name().split(" ")[0],
        lastName: chance.name().split(" ")[1],
        displayName:String,
        phone: chance.phone(),
        userBlurb: chance.paragraph({sentence:4}),
        email: chance.email(),
        password: "",
        salt: "",
        pictureUrl: randPersonPhoto(),
        purchaseHistroy:[{type: mongoose.Schema.Types.ObjectId, ref:"Product", required:true}]
    });
}



//////these functions generate the users than extrapolates out the objectId///////////////
var seededUsers = generateCollections(numUsers,seedUser);
 
var userObjectId = seededUsers.map(function(obj){
       return obj._id
 })


/////////////////////////////////////// product generation ///////////////////////////////////////////////
// this function generates random tags for the products based off the industry and specfic forms of the tags
function generateTags(){
   var listOfIndustryTags = ['architectural','video games','general design','advertisers','academics']
   var lengthIndTags = listOfIndustryTags.length;
   var listOfSpecificTags = ['bench','chair','table','floating island','car','person','zombie']
   var lengthSpecTags = listOfSpecificTags.length;
   return [listOfIndustryTags[Math.floor(Math.random()*lengthIndTags)], listOfSpecificTags[Math.floor(Math.random()*lengthSpecTags)]]
};

function randProductPhoto () {
   return 'http://http://lorempixel.com/g/400/200/'
};

var seedProduct = function(){
   return new Product({
       title: chance.name(),
       description: chance.paragraph({sentence:4}), // reeturns a rand paragraph with 4 sentences
       snapshotFileUrl: randProductPhoto(), //return the website lorempixel
       highResFileUrl: "example high res file here",
       tags: generateTags(), // runs function above and assigns two types of tags to every instance
       license: chance.natural(), // generates a number between 0 to 9007199254740992
       formatsAvailable: "JSON", //hardcoded for now since we only have JSON object
       price: chance.integer({min:0,max:1000}), // generates 
       freeOption: Math.random() < .5,
       owner: chance.name(),
       timesDownloaded: chance.integer({min:0,max:20}),
       webRenderScale: .028,
       creator:chance.pick(userObjectId)
       // comments: [{type: mongoose.Schema.Types.ObjectId, ref:"UserComments"}]
   })
}


console.log(chance.pick(userObjectId))
var seededProducts = generateCollections(numProducts,seedUser);

// Seeding function - to be run when the DB starts up
function seed () {
    seededUsers.map(function(obj){
        obj.save()   
    });
    seededProducts.map(function(obj){
        obj.save();
    })
}

connectToDb.then(function () {
   seed();
   console.log('seed successful!')
});