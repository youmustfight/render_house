'use strict';

app.config(function($urlRouterProvider, $locationProvider) {
   // route to handle Oauth
   // $urlRouterProvider.when('/auth/:provider', function () {
    //   window.location.reload();
   // });
});



app.directive('oauthButton', function () {
	return {
		scope: {
			providerName: '@'
		},
		restrict: 'E',
		templateUrl: 'js/components/oauth-button/oauth-button.html'
	}
});