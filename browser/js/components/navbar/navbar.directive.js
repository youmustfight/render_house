'use strict';

// app.directive('navbar', function () {
// 	return {
// 		restrict: "E",
// 		templateUrl: "js/components/navbar/navbar.html",
// 		controller: 'ManagerController'
// 	}
// });


app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/components/navbar/navbar.html',
        controller: function ($scope, $timeout) {
            
        	// Collection Panel
        	$scope.collectionOpen = false;
        	$scope.collectionToggle = function () {
                $scope.collectionOpen = !$scope.collectionOpen;
                $rootScope.$broadcast("collectionToggled", $scope.collectionOpen)
        	}
            $scope.collection = [];
            
            $scope.$on('collectionOpen', function(event, expanded){
                $scope.navbarExpand = expanded;
            })
            $scope.loggedIn = false;
            
            $scope.itemsHide = [
                { label: 'Sign In', state: 'login', auth: true },
                { label: 'Sign Up', state: 'signUp', auth: true },
                { label: 'Cart', state: 'listing' }
                 ]
                 
            $scope.itemsShow = [
                { label: 'Upload a Model', state: 'upload', auth: true },
                { label: 'Members Only', state: 'membersOnly', auth: true },
                { label: 'Cart', state: 'listing' }
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