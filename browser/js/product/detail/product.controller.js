'use strict';

app.controller('ModelController', function ($scope, AuthService, Model, model, models, $http, $state) {
	// Setup Variables
	$scope.model = model;
	$scope.models = models;

	$scope.user = null;
	var User = function() {
		AuthService.getLoggedInUser().then(function (user) {
			$scope.user = user;
		});
	}	
	User();

	//Download Functionality
	$scope.download = function (){
		var modelPurchased = false;
		var pHistory = $scope.user.purchaseHistory;
		for (var i=0; i < pHistory.length; i++){
			if (pHistory[0] == $scope.model._id) modelPurchased = true;
		}
		if (!modelPurchased) {
			$http.put('/api/user/download', {userId: $scope.user._id, modelId: $scope.model._id})
				.then(function (successResponse){ console.log(successResponse);
				}, function (failedResponse){ console.log(failedResponse); });
		}
		$http.put('/api/product/download', {modelId: $scope.model._id})
			.then(function (successResponse){ $scope.model.timesDownloaded++;
				}, function (failedResponse){ console.log(failedResponse); });
	}

	// Payments Functionality

	// Comments Functionality

	// Edit Functionality
	$scope.update = function (){
		$http.put('/api/product', model)
			.then(function (success){
				console.log(success);
				$state.go('model.detail',{id: success.data._id});
			})
	}
	// Delete Functionality
	$scope.delete = function (){
		$http.delete('/api/product', model);
		$state.go('listing');
	}

});