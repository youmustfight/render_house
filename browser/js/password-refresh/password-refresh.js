app.config(function ($stateProvider) {

    $stateProvider.state('password', {
        url: '/password-refresh',
        templateUrl: 'js/password-refresh/password-refresh.html',
        controller: 'PasswordCtrl',
        link: "pwCheck",
        resolve: {
            user: function(AuthService){
                return AuthService.getLoggedInUser();
                }
        }
    });

});

app.controller('PasswordCtrl', function ($scope,SignUp,user, AuthService, $state) {
    $scope.user = user;
    $scope.login = {};
    $scope.error = null;
    
     $scope.newPassword = function(user){
         $scope.user.password =user.password;
          $scope.user.refresh = false;
           SignUp.pass($scope.user).then(function(user){
              console.log(user) 
              $state.go('listing');
           });
           // console.log($scope.user)
          
       }


});