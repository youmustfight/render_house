'use strict';

app.config( function ($stateProvider) {

	$stateProvider.state('listing', {
		url: '/',
		templateUrl: 'js/product/listing/listing.html',
		controller: 'ListingController',
		resolve: {
			models: function (Model, $http) {
				return Model.fetchAll();
			}
		}
	});

});