'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('user', {
		url: '/user/:id',
		templateUrl: 'js/user/user.html',
		controller: 'UserController',
		resolve: {
			user: function (User, $stateParams, $http) {
				var user = new User({_id: $stateParams.id});
				return user.fetch();
				// Need to populate ids in purchaseHistory & myModels
			}
		}
	});
});