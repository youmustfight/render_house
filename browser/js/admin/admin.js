app.config(function ($stateProvider) {

    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'js/admin/admin.html',
        controller: 'AdminCtrl',
        resolve: {
            admin: function(AuthService){
                return AuthService.getLoggedInUser();
                },
            allUsers: function(SignUp){
                return SignUp.getUsers();
                },
            allModels: function(Model){
                return Model.fetchAll();
                }
        }
    })

});

app.controller('AdminCtrl', function ($scope, SignUp, Model, allModels, allUsers, AuthService, admin, $state) {


    $scope.allModels = allModels;
    $scope.allUsers = allUsers;
    $scope.login = {};
    $scope.error = null;

    $scope.update = function (signUpInfo) {

        $scope.error = null;

        SignUp.update(signUpInfo).then(function () {
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });

    };

    
    $scope.showUser = function(){
       console.log($scope.user, "ll")
    }
    
     $scope.admin = admin;

            $scope.isLoggedIn = function () {
                // var signed = AuthService.isAuthenticated();
                // console.log("signed in =" + signed)
                $scope.loggedIn = AuthService.isAuthenticated();
                return AuthService.isAuthenticated();
            };

            var setUser = function () {
                AuthService.getLoggedInUser().then(function (user) {
                    $scope.admin = user;
                });
            };
       $scope.makeAdmin = function(user){
           user.isAdmin = !user.isAdmin;
           SignUp.update(user).then(function(user){
              console.log(user.isAdmin) 
           });
       }
       
       $scope.passwordRefresh = function(user){
           console.log(user.refresh)
           user.refresh = !user.refresh;
           SignUp.pass(user).then(function(user){
              console.log(user.refresh) 
             
           });
       }
       $scope.deleteModel = function(modelid){
           Model.deleteModel(modelid).then(function(){
               $("."+modelid).remove();
              
           })
       }
       
       $scope.deleteUser = function(userid){
               SignUp.deleteUser(userid).then(function () {
                         $("."+userid).remove();
               // $state.go('admin')
        })
       }

});



