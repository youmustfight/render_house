'use strict';

app.controller('UploadController', function (User, $scope, $http, AuthService, $state){

	$scope.newProduct = null;

	$scope.user = null;
	var User = function() {
		AuthService.getLoggedInUser().then(function (user) {
			$scope.user = user;
		});
	}	
	User();

	$scope.uploadModel = function (uploaded) {

		var randModel = function () {
			var listOfModels = ['models/untitled-scene/untitled-scene.json','models/baymax.json'];
			var listOfModelPics = ['/images/snapshots/untitled-scene.png','/images/snapshots/baymax.png'];
			var numOfModels = listOfModels.length;
			var pick = Math.floor(Math.random()*numOfModels);
			return {
				model: listOfModels[pick],
				pic: listOfModelPics[pick]
			}
		}
		var thisPick = randModel();
		console.log(thisPick);

		uploaded.snapshotFileUrl = thisPick.pic;
		uploaded.modelFileUrl = thisPick.model;
		uploaded.tags = uploaded.tags.split(",");
		uploaded.creator = $scope.user._id;

		// Post Model
		console.log("File to post", uploaded);

		$http.post('/api/product/upload', uploaded)
			.then(function (response){
				console.log("Success: ", response);
				$http.put('/api/user/upload', {userId: $scope.user._id, uploadId: response.data._id});
				$state.go('model.detail', {id: response.data._id});
			}, function (response) {
				console.log("Failed: ", response);
			});
	}

});