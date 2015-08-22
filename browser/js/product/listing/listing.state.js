'use strict';

app.config( function ($stateProvider) {

	$stateProvider.state('listing', {
		url: '/',
		templateUrl: 'js/product/listing/listing.html',
		controller: 'ListingController',
		resolve: {
			models: function (Model, $http) {
				return $http.get('/api/product/')
						.then(function (res) {
							var mappedResponse = res.data.map(function (obj){
								return new Model(obj);
							});
							// console.log(mappedResponse[0]);
							// Model.changeModel(mappedResponse[0])
							return mappedResponse;
						});
			}
		}
	});

});