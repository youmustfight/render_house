app.config(function ($stateProvider) {

    $stateProvider.state('signUp', {
        url: '/signup',
        templateUrl: 'js/sign-up/sign-up.html',
        controller: 'SignUpCtrl'
    });

});

app.controller('SignUpCtrl', function ($scope, SignUp, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendSignUp = function (signUpInfo) {

        $scope.error = null;

        SignUp.signup(signUpInfo).then(function () {
            $state.go('listing');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });

    };
    
    $scope.getUsers = function(){
        SignUp.getUsers().then(function(users){
            console.log(users)
        })
    }

});

