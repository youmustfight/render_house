'use strict';

app.config(function ($stateProvider) {
	$stateProvider.state('users', {
		url: '/users',
		templateUrl: '/browser/app/user/list/user.list.html',
		controller: 'UserListCtrl'
	});
});