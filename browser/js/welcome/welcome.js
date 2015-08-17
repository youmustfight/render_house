app.config(function ($stateProvider) {

    $stateProvider.state('welcome', {
        url: '/welcome',
        templateUrl: 'js/welcome/welcome.html',
        controller: 'WelcomeCtrl'
    });

});

app.controller('WelcomeCtrl', function ($scope, $state,$timeout) {
	$timeout(function() {
      $state.go('listing');
      }, 3000);

});

