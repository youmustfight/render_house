'use strict';

app.config(function ($stateProvider){
	$stateProvider.state('upload', {
		url: '/upload',
		templateUrl: 'js/upload/upload.html',
		controller: 'UploadController'
	});
});