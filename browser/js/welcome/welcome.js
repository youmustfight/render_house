app.config(function ($stateProvider) {

    $stateProvider.state('welcome', {
        url: '/welcome',
        templateUrl: 'js/welcome/welcome.html',
        controller: 'WelcomeCtrl',
        resolve: {
            user: function(AuthService){
                return AuthService.getLoggedInUser();
                }
			}
    });

});

app.controller('WelcomeCtrl', function ($scope, $state,user,AuthService,$timeout) {
 
	$timeout(function() {
         $scope.user = user;
         console.log(user.refresh)
     if($scope.user.refresh === true){
        $state.go('password');
    }
    else{
      $state.go('listing');
      }

    }, 3000);
 
});

