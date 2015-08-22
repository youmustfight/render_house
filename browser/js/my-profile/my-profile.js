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
                     url: '/user',
                     templateUrl: 'js/my-profile/user-profile.html'
         })
         .state('myprofile.editUser',{
                     url: '/edituser',
                     templateUrl: 'js/my-profile/edit-profile.html'
         })
        .state('myprofile.mymodels',{
                     url: '/mymodels',
                     templateUrl: 'js/my-profile/my-models.html'
         })
        .state('myprofile.uploads',{
                     url: '/uploads',
                     templateUrl: 'js/my-profile/uploads.html'
         })

});

app.controller('MyProfileCtrl', function ($scope, Model, SignUp, AuthService, user, $state) {

    $scope.login = {};
    $scope.error = null;
    $scope.user = user;
    $scope.uploads = null;
// update the user
    $scope.update = function (signUpInfo) {

        $scope.error = null;

        SignUp.update(signUpInfo).then(function () {
            $state.go('myprofile.user');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });

    };
 // debug check user   
    $scope.showUser = function(){
       console.log($scope.user, "ll")
    }
 //  get logged in user 
    $scope.isLoggedIn = function () {
        // var signed = AuthService.isAuthenticated();
        // console.log("signed in =" + signed)
        $scope.loggedIn = AuthService.isAuthenticated();
        return AuthService.isAuthenticated();
    };
// set the user though its already set in the resolve
    var setUser = function () {
        AuthService.getLoggedInUser().then(function (user) {
            $scope.user = user;
        });
    };

//set uploads
    var setUploads = function(){
        console.log("hit 1")
        Model.getUploads($scope.user._id).then(function(uploads){
            $scope.uploads = uploads;
             console.log($scope.uploads)
            })
    }
    
    setUploads();
  

});



