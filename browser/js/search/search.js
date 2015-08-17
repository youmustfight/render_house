'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('search', {
		url: '/search?queryString',
		templateUrl: 'js/search/search.html',
		controller: 'SearchController',
		resolve: {
			queryString: function ($stateParams) {
				var dirtySearch = $stateParams.queryString;
				return dirtySearch;
			}
		}
	});
});


app.controller('SearchController', function ($scope, queryString){
	$scope.queryString = queryString;
});