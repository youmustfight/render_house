'use strict';

app.config( function($stateProvider){

	$stateProvider.state('listing', {
		url: '/',
		templateUrl: 'js/product/listing/listing.html',
		controller: 'ListingController',
		resolve: {
			models: function (Model) {
				// Set Island object as home render
				Model.changeModel({
					_id: 12424,
					title: 'Floating Island',
					snapshotFileUrl: '/images/snapshots/untitled-scene.png',
					modelFileUrl: 'models/untitled-scene/untitled-scene.json',
					creator: 'Mary Anne',
					tags: ['Environment','Low-Poly']
				});

				// console.log(Model.fetchAll());
				return Model.fetchAll();
			}
		}
	});

});