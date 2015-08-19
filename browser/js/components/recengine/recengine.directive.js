'use strict';

app.directive('recengine', function(AuthService, Model) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'js/components/recengine/recengine.html',
        scope: {
        	user: "@"
        },
        link: function(scope, element, attr) {
            if (AuthService.isAuthenticated()) {
              Model.fetchAll();

                AuthService.getLoggedInUser().then(function(data) {
                   
                });


            } else {

                AuthService.getLoggedInUser().then(function(data) {
                    console.log('this is data', data)
                })
                 //console.log('this is scope', $scope.user);


            }
        }
    }
})
