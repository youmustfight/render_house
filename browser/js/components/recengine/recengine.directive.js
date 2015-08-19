'use strict';

app.directive('recengine', function($rootScope, AuthService) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'js/components/recengine/recengine.html',
            link: function(scope, element, attr) {
                if (AuthService.getLoggedInUser() !== null) {
                // $scope.recsLogin()

                console.log('this is q', AuthService.isAuthenticated())

            } else {
                // $scope.recsLogin();
                console.log('this is auth service in dir'); AuthService.isAuthenticated().then(function(response){
                	console.log(response.data)
                })
            }
        }
    }
})

