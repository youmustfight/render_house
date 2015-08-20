'use strict';

app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, $http) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/components/navbar/navbar.html',
        controller: function ($scope, $timeout) {

            $scope.collapseTop = function(){
                $scope.collectionOpen = false;
                $timeout(function(){
                    $scope.navbarExpand = false;
                }, 200);
            }

        	// Collection Panel
        	$scope.collectionOpen = false;
        	$scope.collectionToggle = function () {
                $scope.collectionOpen = !$scope.collectionOpen;
                $rootScope.$broadcast("collectionToggled", $scope.collectionOpen);
        	}
            
            $scope.$on('collectionOpen', function(event, expanded){
                $scope.navbarExpand = expanded;
            })
            $scope.loggedIn = false;
            
            // Navigation
            $scope.itemsHide = [
                { label: 'Sign In', state: 'login', auth: true },
                { label: 'Sign Up', state: 'signUp', auth: true }
                 ]
                 
            $scope.itemsShow = [
                { label: 'Upload a Model', state: 'upload', auth: true }
                // { label: 'Members Only', state: 'membersOnly', auth: true }
                 ]

            $scope.user = null;

            $scope.isLoggedIn = function () {
                // var signed = AuthService.isAuthenticated();
                // console.log("signed in =" + signed)
                $scope.loggedIn = AuthService.isAuthenticated();
                return AuthService.isAuthenticated();
            };

            $scope.logout = function () {
                AuthService.logout().then(function () {
                   $scope.loggedIn = false;
                   $state.go('listing');
                });
            };
            
            $scope.check = function(){
                console.log($scope.user)
            }

            var setUser = function () {
                AuthService.getLoggedInUser().then(function (user) {
                    $scope.user = user;
                    var userUrl = '/api/user/' + $scope.user._id;
                    $http.get(userUrl)
                        .then(function (res){
                            // console.log('res data', res.data.purchaseHistory)
                            $scope.user.purchaseHistory = res.data.purchaseHistory;
                    });
                });
            };
            
            var removeUser = function () {
                $scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);

        }

    };

});