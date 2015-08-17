'use strict';

app.controller('ListingController', function($scope, models, Model) {

    $scope.changeModel = function() {
        console.log($scope.models);
        Model.changeModel();
    }

    $scope.models = models;

    $scope.recsHome = function() {
        console.log('this is recshome')

    };

    $scope.recsLogin = function() {
        console.log('this is recslogin')
    }

});
