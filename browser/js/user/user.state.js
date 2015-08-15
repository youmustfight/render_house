'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('user', {
		url: '/user/:id',
		templateUrl: '/browser/js/user/user.html',
		controller: 'UserController',
		resolve: {
			user: function (User, $stateParams) {
				var user = new User({_id: $stateParams.id});
				return user.fetch();
			}
		}
	});
});