'use strict';

app.controller('ManagerController', function($scope, $timeout){

	// Navbar
	$scope.navbarExpand = false;
	
	// Collection Panel
	$scope.collectionOpen = false;
	$scope.collectionToggle = function(){
		if (!$scope.collectionOpen) $scope.collectionOpen = true;
		else {
			$scope.collectionOpen = false;
		}
	}

	//Collapse All
	$scope.collapseTop = function(){
		$scope.collectionOpen = false;
		$timeout(function(){
			$scope.navbarExpand = false;
		}, 200);
	}

	// Actual collection
	$scope.collection = []

});