'use strict';

app.directive('userItem', function ($state) {
	return {
		restrict: 'E',
		templateUrl: '/browser/app/user/item/user.item.html',
		scope: {
			user: '=model',
			glyphicon: '@',
			iconClick: '&'
		},
		controller: 'UserItemCtrl'
	}
});