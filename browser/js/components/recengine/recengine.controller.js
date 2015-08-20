'use strict';

app.controller('RecEngineController', function($scope, AuthService, RecEng) {

    $scope.recsHome = function() {
        console.log('this is recshome')

    };

    $scope.recsLogin = function() {
        console.log('this is listing', AuthService.isAuthenticated())
    }

    $scope.user;

    var User = function() {
        AuthService.getLoggedInUser().then(function(data) {
            $scope.user = data._id;
        });

    }

    User();

})
