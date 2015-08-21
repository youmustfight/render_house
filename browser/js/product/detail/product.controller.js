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
				.then(function (successResponse){ 
					console.log(successResponse);
					pHistory.push($scope.model);
				}, function (failedResponse){ console.log(failedResponse); });
		}
		$http.put('/api/product/download', {modelId: $scope.model._id})
			.then(function (successResponse){ $scope.model.timesDownloaded++;
				}, function (failedResponse){ console.log(failedResponse); });
	}

	// Payments Functionality

	// Comments Functionality
	$scope.myNewComment = {
		user: null,
		model: $scope.model._id,
		comment: null,
		rating: null
	};
	$scope.leaveComment = function (rating){
		//Set up new comment
		$scope.myNewComment.user = $scope.user._id;
		$scope.myNewComment.rating = rating;
		// POST Comment
		$http.post('/api/comment', $scope.myNewComment)
		.then(function (success) {
			// If successful, add comment ID to model comments array
			console.log('Comment', success.data);
			$http.put('/api/product/comment', {modelId: $scope.model._id, commentId: success.data._id})
			.then(function (model) {
				// If successfully added comment to a model, add it to the view
				$scope.model.comments.push(success.data);
				$scope.myNewComment.user = $scope.myNewComment.comment = $scope.myNewComment.rating = null;  
			});
		}, function (failed) {
			console.log(failed);
		})
	}

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