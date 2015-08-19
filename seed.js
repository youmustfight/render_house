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

totalProducts = 500;



function generateTags(){
   var listOfIndustryTags = ['architectural','video games','general design','advertisers','academics']
   var lengthIndTags = listOfIndustryTags.length;
   var listOfSpecificTags = ['bench','chair','table','floating island','car','person','zombie']
   var lengthSpecTags = listOfSpecificTags.length;
   return [listOfIndustryTags[Math.floor(Math.random()*lengthIndTags)], listOfSpecificTags[Math.floor(Math.random()*lengthSpecTags)]]
}

function randPhoto () {
   return 'http://http://lorempixel.com/g/400/200/'
}

function randModel () {
  var listOfModels = ['models/untitled-scene/untitled-scene.json','models/baymax.json','models/plane/plane.json'];
  var numOfModels = listOfModels.length;
  return listOfModels[Math.floor(Math.random()*numOfModels)]
}


var seedProduct= function(){
   return new Product({
       title: chance.name(),
       description: chance.paragraph({sentence:4}), // reeturns a rand paragraph with 4 sentences
       snapshotFileUrl: randPhoto(), //return the website lorempixel
       modelFileUrl: randModel(),
       tags: generateTags(), // runs function above and assigns two types of tags to every instance
       license: chance.natural(), // generates a number between 0 to 9007199254740992
       formatsAvailable: "JSON", //hardcoded for now since we only have JSON object
       price: chance.integer({max:1000}), // generates 
       freeOption: Math.random() < .5,
       creator: chance.name(),
       timesDownloaded: chance.integer({max:20}),
       webRenderScale: .028
       // comments: [{type: mongoose.Schema.Types.ObjectId, ref:"UserComments"}]
   })
}

function generateAll () {
   return products = _.times(totalProducts, seedProduct);
}

function seed () {
   var products = generateAll();
   return Promise.map(products, function (prods) {
       return prods.save();
   });
}


connectToDb.then(function () {
   seed()
   .then(function(data){
       console.log('successful seed');
   })
   .catch(function(err){
       console.log(err)
   });
});