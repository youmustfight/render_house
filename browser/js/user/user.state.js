'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('user', {
		url: '/user/:displayName',
		templateUrl: 'js/user/user.html',
		controller: 'UserController',
		resolve: {
			user: function (User, $stateParams) {
				//Get User
				// var user = new User({displayName: $stateParams.displayName}).fetch();
				var user = {
					fullName: 'Milton Glaser',
					displayName: 'Milt'
				}

				// Attach returned user to scope
				return user;
			}
		}
	});
});