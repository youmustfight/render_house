'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('search', {
		url: '/search?query',
		templateUrl: 'js/search/search.html',
		controller: 'SearchController',
		resolve: {
			query: function ($stateParams) {
				var dirtySearch = $stateParams.query;
				// Handle deliniators such as ','
				console.log(dirtySearch);
				return dirtySearch;
			},
			models: function (Model) {
				return Model.fetchAll();
			}
		}
	});
});


app.controller('SearchController', function ($scope, query, models){
	$scope.query = query;
	$scope.models  = models;
});