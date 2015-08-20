'use strict';


app.directive('recengine', function(AuthService, Model, RecEng) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'js/components/recengine/recengine.html',
        scope: {
        	user: "@"
        },
       	controller: 'RecEngineController'
    }
})
