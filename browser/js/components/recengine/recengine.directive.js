'use strict';

app.directive('recengine', function($rootScope, AUTH_EVENTS) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'js/components/recengine/recengine.html',
        link: function(scope, element, attr) {

            $rootScope.on(AUTH_EVENTS.loginSuccess, function() {
                $scope.recsLogin();
                console.log('got here dir')
            })
            $rootScope.on(AUTH_EVENTS.notAuthenticated, function() {
                alert('got here dir')
                $scope.recsHome()
            })


        }
    }

})
