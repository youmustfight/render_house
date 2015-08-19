'use strict';

app.controller('ManagerController', function($scope, $rootScope, AuthService, $timeout){

	// Navbar
	// $scope.navbarExpand = false;
	
	// Collection Panel
	$scope.collectionOpen = false;
	
	$rootScope.$broadcast("collectionOpen", $scope.navbarExpand)

	//Collapse All
	$scope.collapseTop = function(){
		$scope.collectionOpen = false;
		$timeout(function(){
			$scope.navbarExpand = false;
		}, 200);
	}

	// Set User
	$scope.user = null;

	var User = function() {
		AuthService.getLoggedInUser().then(function (user) {
			$scope.user = user;
		});
	}
	
	User();
	


	$scope.$on('collectionToggled', function (event, toggle) {
		$scope.collectionOpen = toggle;
	});

});