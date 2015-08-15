'use strict';

app.controller('RenderController', function ($scope, Model) {

	$scope.model = Model.getModel();
	
	$scope.$watch(function(){
		return Model.getModelUrl()
	}, function (newVal, oldVal){
		$scope.model = Model.getModel(); 
	});

});