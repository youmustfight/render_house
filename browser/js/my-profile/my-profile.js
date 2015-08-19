app.config(function ($stateProvider) {

    $stateProvider.state('myprofile', {
        url: '/myprofile',
        scope: {         
        },
        templateUrl: 'js/my-profile/my-profile.html',
        controller: 'MyProfileCtrl',
        link: 'pwCheck',
        resolve: {
            user: function(AuthService){
                return AuthService.getLoggedInUser();
                }
			}
        
         }).state('myprofile.user',{
                     url: '/myprofile/user',
                     templateUrl: 'js/my-profile/user-profile.html'
         })
         .state('myprofile.editUser',{
                     url: '/myprofile/edituser',
                     templateUrl: 'js/my-profile/edit-profile.html'
         })
        .state('myprofile.mymodels',{
                     url: '/myprofile/mymodels',
                     templateUrl: 'js/my-profile/my-models.html'
         })
        .state('myprofile.uploads',{
                     url: '/myprofile/uploads',
                     templateUrl: 'js/my-profile/uploads.html'
         })

});

app.controller('MyProfileCtrl', function ($scope, SignUp, AuthService, user, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.update = function (signUpInfo) {

        $scope.error = null;

        SignUp.update(signUpInfo).then(function () {
            $state.go('myprofile.user');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });

    };
    
    $scope.showUser = function(){
       console.log($scope.user, "ll")
    }
    
     $scope.user = user;

            $scope.isLoggedIn = function () {
                // var signed = AuthService.isAuthenticated();
                // console.log("signed in =" + signed)
                $scope.loggedIn = AuthService.isAuthenticated();
                return AuthService.isAuthenticated();
            };

            var setUser = function () {
                AuthService.getLoggedInUser().then(function (user) {
                    $scope.user = user;
                });
            };

});



