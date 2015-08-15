'use strict';

app.directive('navbar', function () {
	return {
		restrict: "E",
		templateUrl: "js/components/navbar/navbar.html",
		controller: 'ManagerController'
	}
});