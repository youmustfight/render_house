'use strict';

app.controller('RenderController', function ($scope, RenderService) {

	$scope.modelUrl = RenderService.getModelUrl();
	
	$scope.$watch(function(){return RenderService.getModelUrl()}, function (newVal, oldVal){
	    if(newVal != oldVal) $scope.modelUrl = RenderService.getModelUrl();
	});

});