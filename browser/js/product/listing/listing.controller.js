'use strict';

app.controller('ListingController', function ($scope, models, Model) {

    $scope.changeModel = function(){
    	console.log($scope.models);
    	Model.changeModel();
    }

    $scope.models = models;

});