'use strict';

app.controller('UploadController', function (User, $scope, $http, AuthService){

	$scope.newProduct = null;

	$scope.user = null;
	var User = function() {
		AuthService.getLoggedInUser().then(function (user) {
			$scope.user = user;
		});
	}	
	User();

	$scope.uploadModel = function (uploaded) {
		function randModel () {
			var listOfModels = ['models/untitled-scene/untitled-scene.json','models/baymax.json','models/plane/plane.json'];
			var numOfModels = listOfModels.length;
			return listOfModels[Math.floor(Math.random()*numOfModels)]
		}
		function randPhoto () {
			var listOfModels = ['/images/snapshots/untitled-scene.png','/images/snapshots/baymax.png'];
			var numOfModels = listOfModels.length;
			return listOfModels[Math.floor(Math.random()*numOfModels)]
		}
		uploaded.snapshotFileUrl = randPhoto();
		uploaded.modelFileUrl = randModel();
		uploaded.tags = uploaded.tags.split(",");
		uploaded.creator = $scope.user._id;

		console.log("File to post", uploaded);

		$http.post('/api/product/upload', uploaded)
			.then(function (response){
				console.log("Success: ", response);
				$http.put('/api/user/upload', {userId: $scope.user._id, uploadId: response.data._id})
			}, function (response) {
				console.log("Failed: ", response);
			});
		
		// Add to User Uploads
		// $http.put('/api/user', uploaded)?
	}

});