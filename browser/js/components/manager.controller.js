'use strict';

app.controller('ManagerController', function ($scope, $rootScope, AuthService, $timeout, User, $http){

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
	
	$scope.$watch('collectionOpen', function (newValue, oldValue){
		if (newValue == true) {
			populateUserHistory();

		}
    });

    // Populate user models
	var populateUserHistory = function (){
	    var userUrl = '/api/user/' + $scope.user._id;
	    $http.get(userUrl)
	        .then(function (res){
	            console.log(res.data.purchaseHistory);
	            $scope.user.purchaseHistory = res.data.purchaseHistory;
        });
	}
	

	$scope.$on('collectionToggled', function (event, toggle) {
		$scope.collectionOpen = toggle;
	});

});