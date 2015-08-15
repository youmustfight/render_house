'use strict';

app.controller('RecEngineController', function($scope, RenderService){

	$scope.modelUrl = RenderService.getModelUrl();


})