'use strict';

app.controller('ManagerController', function($scope, $rootScope, $timeout){

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

	// Actual collection
	$scope.collection = [];
	

	$scope.$on('collectionToggled', function (event, toggle) {
		$scope.collectionOpen = toggle;
	});

});