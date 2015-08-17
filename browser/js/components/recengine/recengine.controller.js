'use strict';

app.controller('RecEngineController', function($scope){


    $scope.recsHome = function() {
        console.log('this is recshome')

    };

    $scope.recsLogin = function() {
        console.log('this is listing', AuthService.isAuthenticated())
    }



})