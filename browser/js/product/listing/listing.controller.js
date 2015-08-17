'use strict';

app.controller('ListingController', function($scope, models, Model, AuthService) {

    $scope.changeModel = function() {
        console.log($scope.models);
        Model.changeModel();
    }

    $scope.models = models;

});
