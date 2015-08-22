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
                return AuthService.getLoggedInUser()
                },
            uploads: function(Model, user){
                 var uploads = []
                user.myModels.forEach(function(obj){
                   Model.getUpload(obj).then(function(model){
                         uploads.push(model);
                     })
                 })
                 console.log(uploads)
                 return uploads
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

app.controller('MyProfileCtrl', function ($scope, Model, uploads, SignUp, AuthService, user,User, $state) {

    $scope.login = {};
    $scope.error = null;
    $scope.user = user;
    $scope.uploads = uploads;
// update the user
    $scope.update = function (signUpInfo) {

        $scope.error = null;

        SignUp.update(signUpInfo).then(function () {
            $state.go('myprofile.user');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });

    };
 // populate uploads with models
  // var setUploads = function(){
    //   console.log($scope.uploads)    
    //   $scope.user.myModels.forEach(function(obj){
    //       // console.log(obj)
    //      Model.getUpload(obj).then(function(model){
    //         //  console.log(model)
    //          $scope.uploads.push(model)
    //         //  debugger;
    //      });
    //   });
    
  // } 
    
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

// setUploads();
// console.log($scope.uploads)
});



