'use strict';

app.controller('ModelDetailController', function ($scope, Model, model, models) {
	$scope.model = model;
	$scope.models = models;
});