'use strict';
var app = angular.module('FullstackGeneratedApp', ['ui.router', 'fsaPreBuilt']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            var destination = user ? toState.name : 'login';
            $state.go(destination);
        });
    });
});
(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.
    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var data = response.data;
            console.log("logged in");
            Session.create(data.id, data.user);
            console.log(data.user, "logged in");
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin)['catch'](function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin)['catch'](function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

'use strict';

app.controller('ManagerController', function ($scope, $rootScope, $timeout) {

    // Navbar
    // $scope.navbarExpand = false;

    // Collection Panel
    $scope.collectionOpen = false;

    $rootScope.$broadcast("collectionOpen", $scope.navbarExpand);

    //Collapse All
    $scope.collapseTop = function () {
        $scope.collectionOpen = false;
        $timeout(function () {
            $scope.navbarExpand = false;
        }, 200);
    };

    // Actual collection
    $scope.collection = [];

    $scope.$on('collectionToggled', function (event, toggle) {
        $scope.collectionOpen = toggle;
    });
});
app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/login/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {
        console.log("hit controller");
        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go('welcome');
        })['catch'](function () {
            $scope.error = 'Invalid login credentials.';
        });
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('membersOnly', {
        url: '/members-area',
        template: '<img ng-repeat="item in stash" width="300" ng-src="{{ item }}" />',
        controller: function controller($scope, SecretStash) {
            SecretStash.getStash().then(function (stash) {
                $scope.stash = stash;
            });
        },
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.factory('SecretStash', function ($http) {

    var getStash = function getStash() {
        return $http.get('/api/members/secret-stash').then(function (response) {
            return response.data;
        });
    };

    return {
        getStash: getStash
    };
});

'use strict';

app.factory('Model', function ($http) {

    // Currently Rendered Object
    var renderObj = {
        modelFileUrl: 'models/untitled-scene/untitled-scene.json',
        creator: 'Mary Anne'
    };

    // Model Constructor
    function Model(props) {
        angular.extend(this, props);
    };

    Model.url = 'api/product';
    Object.defineProperty(Model.prototype, 'url', {
        get: function get() {
            return Model.url + this._id;
        }
    });

    // Listing Functionality
    Model.prototype.fetch = function () {
        return $http.get(this.url).then(function (res) {
            return new Model(res.data);
        });
    };

    Model.fetchAll = function () {
        // return $htpp.get(Model.url).then(function (data) {
        // 	return res.data.map(function (obj) {
        // 		return new Model(obj);
        // 	});
        // });
        console.log();
        return [{
            _id: 12424,
            title: 'Floating Island',
            snapshotFileUrl: '/images/snapshots/floatingIsland.png',
            modelFileUrl: 'models/untitled-scene/untitled-scene.json',
            creator: 'Mary Anne',
            tags: ['Environment', 'Low-Poly']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12424,
            title: 'Floating Island',
            snapshotFileUrl: '/images/snapshots/floatingIsland.png',
            modelFileUrl: 'models/untitled-scene/untitled-scene.json',
            creator: 'Mary Anne',
            tags: ['Environment', 'Low-Poly']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12424,
            title: 'Floating Island',
            snapshotFileUrl: '/images/snapshots/floatingIsland.png',
            modelFileUrl: 'models/untitled-scene/untitled-scene.json',
            creator: 'Mary Anne',
            tags: ['Environment', 'Low-Poly']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12424,
            title: 'Floating Island',
            snapshotFileUrl: '/images/snapshots/floatingIsland.png',
            modelFileUrl: 'models/untitled-scene/untitled-scene.json',
            creator: 'Mary Anne',
            tags: ['Environment', 'Low-Poly']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12424,
            title: 'Floating Island',
            snapshotFileUrl: '/images/snapshots/floatingIsland.png',
            modelFileUrl: 'models/untitled-scene/untitled-scene.json',
            creator: 'Mary Anne',
            tags: ['Environment', 'Low-Poly']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12424,
            title: 'Floating Island',
            snapshotFileUrl: '/images/snapshots/floatingIsland.png',
            modelFileUrl: 'models/untitled-scene/untitled-scene.json',
            creator: 'Mary Anne',
            tags: ['Environment', 'Low-Poly']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12424,
            title: 'Floating Island',
            snapshotFileUrl: '/images/snapshots/floatingIsland.png',
            modelFileUrl: 'models/untitled-scene/untitled-scene.json',
            creator: 'Mary Anne',
            tags: ['Environment', 'Low-Poly']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12424,
            title: 'Floating Island',
            snapshotFileUrl: '/images/snapshots/floatingIsland.png',
            modelFileUrl: 'models/untitled-scene/untitled-scene.json',
            creator: 'Mary Anne',
            tags: ['Environment', 'Low-Poly']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12424,
            title: 'Floating Island',
            snapshotFileUrl: '/images/snapshots/floatingIsland.png',
            modelFileUrl: 'models/untitled-scene/untitled-scene.json',
            creator: 'Mary Anne',
            tags: ['Environment', 'Low-Poly']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }, {
            _id: 12424,
            title: 'Floating Island',
            snapshotFileUrl: '/images/snapshots/floatingIsland.png',
            modelFileUrl: 'models/untitled-scene/untitled-scene.json',
            creator: 'Mary Anne',
            tags: ['Environment', 'Low-Poly']
        }, {
            _id: 12362,
            title: 'Baymax',
            snapshotFileUrl: '/images/snapshots/baymax.png',
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser',
            tags: ['Character', 'Futuristic']
        }];
    };

    // Renderer Functionality
    Model.changeModelUrl = function (newUrl) {
        renderObj.modelFileUrl = newUrl;
        return renderObj;
    };
    Model.changeModel = function () {
        // Temp attributes for testing
        renderObj = {
            modelFileUrl: 'models/baymax.json',
            creator: 'Milton Glaser'
        };
    };
    Model.getModelUrl = function () {
        return renderObj.modelFileUrl;
    };
    Model.getModel = function () {
        return renderObj;
    };

    return Model;
});
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
        })['catch'](function () {
            $scope.error = 'Invalid login credentials.';
        });
    };

    $scope.submitForm = function () {

        // check to make sure the form is completely valid
        if ($scope.userForm.$valid) {
            alert('our form is amazing');
        }
    };

    $scope.getUsers = function () {
        SignUp.getUsers().then(function (users) {
            console.log(users);
        });
    };
});

'use strict';

app.controller('UploadController', function ($scope) {});
'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('upload', {
        url: '/upload',
        templateUrl: 'js/upload/upload.html',
        controller: 'UploadController'
    });
});
'use strict';

app.controller('UserController', function ($scope) {});
'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('user', {
        url: '/user/:id',
        templateUrl: '/browser/js/user/user.html',
        controller: 'UserController',
        resolve: {
            user: function user(User, $stateParams) {
                var user = new User({ _id: $stateParams.id });
                return user.fetch();
            }
        }
    });
});

'use strict';

app.directive('fieldFocus', function ($parse, $timeout) {
    return {
        restrict: 'A',
        link: function link(scope, element, attrs) {
            var status = $parse(attrs.fieldFocus);
            scope.$watch(status, function (val) {
                console.log('status = ', val);
                if (val === true) {
                    $timeout(function () {
                        element[0].focus();
                    });
                }
            });
        }
    };
});

app.factory('SignUp', function ($http, $state, $location) {
    return {
        signup: function signup(credentials) {
            return $http.post('api/user', credentials).then(function (res) {
                console.log(res.data);
                return res.data;
            });
        },

        getUsers: function getUsers() {
            return $http.get('api/user').then(function (response) {
                return response.data;
            });
        }
    };
});

app.config(function ($stateProvider) {

    $stateProvider.state('welcome', {
        url: '/welcome',
        templateUrl: 'js/welcome/welcome.html',
        controller: 'WelcomeCtrl'
    });
});

app.controller('WelcomeCtrl', function ($scope, $state, $timeout) {
    $timeout(function () {
        $state.go('listing');
    }, 3000);
});

'use strict';

app.directive('collection', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/components/collection/collection.html',
        controller: 'ManagerController'
    };
});
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
        controller: function controller($scope, $timeout) {

            // Collection Panel
            $scope.collectionOpen = false;
            $scope.collectionToggle = function () {
                $scope.collectionOpen = !$scope.collectionOpen;
                $rootScope.$broadcast("collectionToggled", $scope.collectionOpen);
            };
            $scope.collection = [];

            $scope.$on('collectionOpen', function (event, expanded) {
                $scope.navbarExpand = expanded;
            });
            $scope.loggedIn = false;

            $scope.itemsHide = [{ label: 'Sign In', state: 'login', auth: true }, { label: 'Sign Up', state: 'signUp', auth: true }, { label: 'Cart', state: 'listing' }];

            $scope.itemsShow = [{ label: 'Upload a Model', state: 'upload', auth: true }, { label: 'Members Only', state: 'membersOnly', auth: true }, { label: 'Cart', state: 'listing' }];

            $scope.user = null;

            $scope.isLoggedIn = function () {
                var signed = AuthService.isAuthenticated();
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

            $scope.check = function () {
                console.log($scope.user);
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    $scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                $scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});
'use strict';

app.config(function ($urlRouterProvider, $locationProvider) {
    // route to handle Oauth
    // $urlRouterProvider.when('/auth/:provider', function () {
    //   window.location.reload();
    // });
});

app.directive('oauthButton', function () {
    return {
        scope: {
            providerName: '@'
        },
        restrict: 'E',
        templateUrl: 'js/components/oauth-button/oauth-button.html'
    };
});
'use strict';

app.directive('searchbar', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/components/searchbar/searchbar.html'
    };
});

'use strict';

app.controller('ListingController', function ($scope, models, Model) {

    $scope.changeModel = function () {
        console.log($scope.models);
        Model.changeModel();
    };

    $scope.models = models;
});
'use strict';

app.config(function ($stateProvider) {

    $stateProvider.state('listing', {
        url: '/',
        templateUrl: 'js/product/listing/listing.html',
        controller: 'ListingController',
        resolve: {
            models: function models(Model) {
                console.log(Model.fetchAll());
                return Model.fetchAll();
            }
        }
    });
});
'use strict';

app.controller('RenderController', function ($scope, Model) {

    $scope.model = Model.getModel();

    $scope.$watch(function () {
        return Model.getModelUrl();
    }, function (newVal, oldVal) {
        $scope.model = Model.getModel();
    });
});
'use strict';

app.directive('ngWebgl', function () {
    return {
        restrict: 'A',
        scope: {
            model: '=modelFileUrl'
        },
        controller: "RenderController",
        link: function link(scope, element, attr) {

            // Setup selections
            scope.renderFrame = $('#render-frame');
            var renderFrameWidth = scope.renderFrame.width();
            var renderFrameHeight = scope.renderFrame.height();
            var renderObjectScaleModifier = renderFrameWidth / 1024;

            // Setup THREE.js variables with scope
            var camera;
            scope.camera = camera;
            var scene;
            scope.scene = scene;
            var renderer;
            scope.renderer = renderer;
            var previous;
            scope.previous = previous;

            // initialize scene
            init();

            // load default model on scope -- jeep model -- via AssimpJSONLoader
            var loader2 = new THREE.ObjectLoader();
            var loader3 = new THREE.JSONLoader();

            // Watch for changes to scope
            scope.$watch('model.modelFileUrl', function (newValue, oldValue) {
                if (newValue != oldValue) {
                    loadModel(newValue);
                }
            });

            //!! Handle removing object and adding new object
            function loadModel(modUrl) {
                loader2.load(modUrl, function (object) {
                    object.scale.x = object.scale.y = object.scale.z = .028 * renderObjectScaleModifier;
                    object.position.y = .5;
                    object.updateMatrix();
                    if (previous) scene.remove(previous);
                    scene.add(object);

                    previous = object;
                });
            }

            // run load model on current modelUrl
            loadModel(scope.model.modelFileUrl);
            animate();

            // Setup THREE.js cameras, scene, renderer, lighting
            function init() {

                // Camera
                camera = new THREE.PerspectiveCamera(50, renderFrameWidth / renderFrameHeight, 1, 2000);
                camera.position.set(2, 4, 5);

                // Scene
                scene = new THREE.Scene();
                // scene.fog = new THREE.FogExp2(0x000000, 0.0001);

                // Lights
                scene.add(new THREE.AmbientLight(0xcccccc));

                var directionalLight = new THREE.DirectionalLight(0xcccccc);
                directionalLight.position.x = Math.random() - 0.5;
                directionalLight.position.y = Math.random() - 0.5;
                directionalLight.position.z = Math.random() - 0.5;
                directionalLight.position.normalize();
                scene.add(directionalLight);

                //!!!! Renderer
                renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(renderFrameWidth, renderFrameHeight);
                renderer.setClearColor(0xffffff);
                element[0].appendChild(renderer.domElement);

                // Check for Resize Event
                window.addEventListener('resize', onWindowResize, false);

                // console.log(scene);
            }

            // Handle Resize
            function onWindowResize(event) {
                renderer.setSize(scope.renderFrame.width(), renderFrameHeight);
                camera.aspect = scope.renderFrame.width() / renderFrameHeight;
                camera.updateProjectionMatrix();
            }

            // Animate
            var t = 0; // ?
            function animate() {
                render();
                requestAnimationFrame(animate);
            }

            // Handle re-Rendering of scene for spinning
            function render() {
                var timer = Date.now() * 0.00015;
                camera.position.x = Math.cos(timer) * 10;
                camera.position.y = 4;
                camera.position.z = Math.sin(timer) * 8.5;
                camera.lookAt(scene.position);
                renderer.render(scene, camera);
            }
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZzYS1wcmUtYnVpbHQuanMiLCJjb21wb25lbnRzL21hbmFnZXIuY29udHJvbGxlci5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3QvbW9kZWwuZmFjdG9yeS5qcyIsInNpZ24tdXAvc2lnbi11cC5qcyIsInVwbG9hZC91cGxvYWQuY29udHJvbGxlci5qcyIsInVwbG9hZC91cGxvYWQuc3RhdGUuanMiLCJ1c2VyL3VzZXIuY29udHJvbGxlci5qcyIsInVzZXIvdXNlci5zdGF0ZS5qcyIsInV0aWxzL2ZpZWxkRm9jdXMuZGlyZWN0aXZlLmpzIiwidXRpbHMvc2lnbi11cC1mYWN0b3J5LmpzIiwid2VsY29tZS93ZWxjb21lLmpzIiwiY29tcG9uZW50cy9jb2xsZWN0aW9uL2NvbGxlY3Rpb24uZGlyZWN0aXZlLmpzIiwiY29tcG9uZW50cy9uYXZiYXIvbmF2YmFyLmRpcmVjdGl2ZS5qcyIsImNvbXBvbmVudHMvb2F1dGgtYnV0dG9uL29hdXRoLWJ1dHRvbi5kaXJlY3RpdmUuanMiLCJjb21wb25lbnRzL3NlYXJjaGJhci9zZWFyY2hiYXIuZGlyZWN0aXZlLmpzIiwicHJvZHVjdC9saXN0aW5nL2xpc3RpbmcuY29udHJvbGxlci5qcyIsInByb2R1Y3QvbGlzdGluZy9saXN0aW5nLnN0YXRlLmpzIiwicHJvZHVjdC9yZW5kZXIvcmVuZGVyLmNvbnRyb2xsZXIuanMiLCJwcm9kdWN0L3JlbmRlci9yZW5kZXIuZGlyZWN0aXZlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQUEsQ0FBQTtBQUNBLElBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxhQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEscUJBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsc0JBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOzs7QUFHQSxHQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7OztBQUdBLFFBQUEsNEJBQUEsR0FBQSxTQUFBLDRCQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsZUFBQSxLQUFBLENBQUEsSUFBQSxJQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQSxDQUFBO0tBQ0EsQ0FBQTs7OztBQUlBLGNBQUEsQ0FBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBLDRCQUFBLENBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBLG1CQUFBO1NBQ0E7O0FBRUEsWUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLEVBQUE7OztBQUdBLG1CQUFBO1NBQ0E7OztBQUdBLGFBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7OztBQUlBLGdCQUFBLFdBQUEsR0FBQSxJQUFBLEdBQUEsT0FBQSxDQUFBLElBQUEsR0FBQSxPQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ25EQSxDQUFBLFlBQUE7O0FBRUEsZ0JBQUEsQ0FBQTs7O0FBR0EsUUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSx3QkFBQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBO0FBQ0EsZUFBQSxNQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7Ozs7O0FBS0EsT0FBQSxDQUFBLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxvQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7QUFDQSxzQkFBQSxFQUFBLHNCQUFBO0FBQ0Esd0JBQUEsRUFBQSx3QkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsZ0JBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGFBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7U0FDQSxDQUFBO0FBQ0EsZUFBQTtBQUNBLHlCQUFBLEVBQUEsdUJBQUEsUUFBQSxFQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsVUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsWUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLFdBQUEsRUFDQSxVQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsaUJBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGlCQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLElBQUEsRUFBQSxXQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLElBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQTs7OztBQUlBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsZ0JBQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxJQUFBLFVBQUEsS0FBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTthQUNBOzs7OztBQUtBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUNBLENBQUEsWUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsNEJBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsRUFBQSxDQUFBOztBQ3RJQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQSxRQUFBLEVBQUE7Ozs7OztBQU1BLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBOztBQUdBLGNBQUEsQ0FBQSxVQUFBLENBQUEsZ0JBQUEsRUFBQSxNQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBO1NBQ0EsRUFBQSxHQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsY0FBQSxHQUFBLE1BQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzdCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsS0FBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxRQUFBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQTtBQUNBLGtCQUFBLEVBQUEsV0FBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLFNBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsZ0JBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsbUJBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzNCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxtRUFBQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7OztBQUdBLFlBQUEsRUFBQTtBQUNBLHdCQUFBLEVBQUEsSUFBQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFFBQUEsUUFBQSxHQUFBLFNBQUEsUUFBQSxHQUFBO0FBQ0EsZUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLDJCQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxRQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUMvQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOzs7QUFHQSxRQUFBLFNBQUEsR0FBQTtBQUNBLG9CQUFBLEVBQUEsMkNBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQTtLQUNBLENBQUE7OztBQUlBLGFBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxTQUFBLENBQUEsR0FBQSxHQUFBLGFBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxjQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsZUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBOzs7QUFJQSxTQUFBLENBQUEsU0FBQSxDQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxJQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFNBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTs7Ozs7O0FBTUEsZUFBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsZUFBQSxDQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLFFBQUE7QUFDQSwyQkFBQSxFQUFBLDhCQUFBO0FBQ0Esd0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsZUFBQTtBQUNBLGdCQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO1NBQ0EsRUFDQTtBQUNBLGVBQUEsRUFBQSxLQUFBO0FBQ0EsaUJBQUEsRUFBQSxpQkFBQTtBQUNBLDJCQUFBLEVBQUEsc0NBQUE7QUFDQSx3QkFBQSxFQUFBLDJDQUFBO0FBQ0EsbUJBQUEsRUFBQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLFFBQUE7QUFDQSwyQkFBQSxFQUFBLDhCQUFBO0FBQ0Esd0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsZUFBQTtBQUNBLGdCQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO1NBQ0EsRUFDQTtBQUNBLGVBQUEsRUFBQSxLQUFBO0FBQ0EsaUJBQUEsRUFBQSxRQUFBO0FBQ0EsMkJBQUEsRUFBQSw4QkFBQTtBQUNBLHdCQUFBLEVBQUEsb0JBQUE7QUFDQSxtQkFBQSxFQUFBLGVBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLFFBQUE7QUFDQSwyQkFBQSxFQUFBLDhCQUFBO0FBQ0Esd0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsZUFBQTtBQUNBLGdCQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO1NBQ0EsRUFDQTtBQUNBLGVBQUEsRUFBQSxLQUFBO0FBQ0EsaUJBQUEsRUFBQSxpQkFBQTtBQUNBLDJCQUFBLEVBQUEsc0NBQUE7QUFDQSx3QkFBQSxFQUFBLDJDQUFBO0FBQ0EsbUJBQUEsRUFBQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLFFBQUE7QUFDQSwyQkFBQSxFQUFBLDhCQUFBO0FBQ0Esd0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsZUFBQTtBQUNBLGdCQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO1NBQ0EsRUFDQTtBQUNBLGVBQUEsRUFBQSxLQUFBO0FBQ0EsaUJBQUEsRUFBQSxRQUFBO0FBQ0EsMkJBQUEsRUFBQSw4QkFBQTtBQUNBLHdCQUFBLEVBQUEsb0JBQUE7QUFDQSxtQkFBQSxFQUFBLGVBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FFQSxDQUFBOzs7QUFJQSxTQUFBLENBQUEsY0FBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsaUJBQUEsQ0FBQSxZQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsZUFBQSxTQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsU0FBQSxDQUFBLFdBQUEsR0FBQSxZQUFBOztBQUVBLGlCQUFBLEdBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO1NBQ0EsQ0FBQTtLQUNBLENBQUE7QUFDQSxTQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLFNBQUEsQ0FBQSxZQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsU0FBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxTQUFBLENBQUE7S0FDQSxDQUFBOztBQUlBLFdBQUEsS0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbFJBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLHlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOztBQUVBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGNBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFlBQUE7OztBQUdBLFlBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLHFCQUFBLENBQUEsQ0FBQTtTQUNBO0tBRUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQzFDQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEVBRUEsQ0FBQSxDQUFBO0FDSkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxrQkFBQSxFQUFBLGtCQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsZ0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxFQUlBLENBQUEsQ0FBQTtBQ05BLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLDRCQUFBO0FBQ0Esa0JBQUEsRUFBQSxnQkFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLGdCQUFBLEVBQUEsY0FBQSxJQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0Esb0JBQUEsSUFBQSxHQUFBLElBQUEsSUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLFlBQUEsQ0FBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBLEtBQUEsRUFBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNkQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsZ0JBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLEVBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxvQkFBQSxHQUFBLEtBQUEsSUFBQSxFQUFBO0FBQ0EsNEJBQUEsQ0FBQSxZQUFBO0FBQ0EsK0JBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQTtxQkFDQSxDQUFBLENBQUE7aUJBQ0E7YUFDQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDaEJBLEdBQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsY0FBQSxFQUFBLGdCQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTs7QUFFQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ2hCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxVQUFBO0FBQ0EsbUJBQUEsRUFBQSx5QkFBQTtBQUNBLGtCQUFBLEVBQUEsYUFBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsWUFBQSxDQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsRUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO0tBQ0EsRUFBQSxJQUFBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUNmQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLDBDQUFBO0FBQ0Esa0JBQUEsRUFBQSxtQkFBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNSQSxZQUFBLENBQUE7Ozs7Ozs7Ozs7QUFXQSxHQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBLEVBQUE7QUFDQSxtQkFBQSxFQUFBLGtDQUFBO0FBQ0Esa0JBQUEsRUFBQSxvQkFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBOzs7QUFHQSxrQkFBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQTtBQUNBLHNCQUFBLENBQUEsY0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQTtBQUNBLDBCQUFBLENBQUEsVUFBQSxDQUFBLG1CQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTtBQUNBLGtCQUFBLENBQUEsVUFBQSxHQUFBLEVBQUEsQ0FBQTs7QUFFQSxrQkFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLFFBQUEsRUFBQTtBQUNBLHNCQUFBLENBQUEsWUFBQSxHQUFBLFFBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsUUFBQSxHQUFBLEtBQUEsQ0FBQTs7QUFFQSxrQkFBQSxDQUFBLFNBQUEsR0FBQSxDQUNBLEVBQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFFBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsQ0FDQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsU0FBQSxHQUFBLENBQ0EsRUFBQSxLQUFBLEVBQUEsZ0JBQUEsRUFBQSxLQUFBLEVBQUEsUUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxjQUFBLEVBQUEsS0FBQSxFQUFBLGFBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsQ0FDQSxDQUFBOztBQUdBLGtCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxrQkFBQSxDQUFBLFVBQUEsR0FBQSxZQUFBO0FBQ0Esb0JBQUEsTUFBQSxHQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQTs7QUFFQSxzQkFBQSxDQUFBLFFBQUEsR0FBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQUE7QUFDQSx1QkFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSwyQkFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsMEJBQUEsQ0FBQSxRQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxFQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxnQkFBQSxPQUFBLEdBQUEsU0FBQSxPQUFBLEdBQUE7QUFDQSwyQkFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLDBCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtpQkFDQSxDQUFBLENBQUE7YUFDQSxDQUFBOztBQUlBLGdCQUFBLFVBQUEsR0FBQSxTQUFBLFVBQUEsR0FBQTtBQUNBLHNCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsbUJBQUEsRUFBQSxDQUFBOztBQUVBLHNCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxZQUFBLEVBQUEsT0FBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLENBQUEsQ0FBQTtTQUVBOztLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUN2RkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7Ozs7O0NBS0EsQ0FBQSxDQUFBOztBQUlBLEdBQUEsQ0FBQSxTQUFBLENBQUEsYUFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0EsYUFBQSxFQUFBO0FBQ0Esd0JBQUEsRUFBQSxHQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLDhDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ25CQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLHdDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNQQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7QUFDQSxhQUFBLENBQUEsV0FBQSxFQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDWEEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLGlDQUFBO0FBQ0Esa0JBQUEsRUFBQSxtQkFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLGtCQUFBLEVBQUEsZ0JBQUEsS0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxLQUFBLENBQUEsUUFBQSxFQUFBLENBQUE7YUFDQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDaEJBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxNQUFBLENBQUEsWUFBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLFdBQUEsRUFBQSxDQUFBO0tBQ0EsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ1pBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFNBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQTtBQUNBLGlCQUFBLEVBQUEsZUFBQTtTQUNBO0FBQ0Esa0JBQUEsRUFBQSxrQkFBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBOzs7QUFHQSxpQkFBQSxDQUFBLFdBQUEsR0FBQSxDQUFBLENBQUEsZUFBQSxDQUFBLENBQUE7QUFDQSxnQkFBQSxnQkFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7QUFDQSxnQkFBQSxpQkFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxFQUFBLENBQUE7QUFDQSxnQkFBQSx5QkFBQSxHQUFBLGdCQUFBLEdBQUEsSUFBQSxDQUFBOzs7QUFHQSxnQkFBQSxNQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxnQkFBQSxLQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxnQkFBQSxRQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLFFBQUEsR0FBQSxRQUFBLENBQUE7QUFDQSxnQkFBQSxRQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLFFBQUEsR0FBQSxRQUFBLENBQUE7OztBQUdBLGdCQUFBLEVBQUEsQ0FBQTs7O0FBR0EsZ0JBQUEsT0FBQSxHQUFBLElBQUEsS0FBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO0FBQ0EsZ0JBQUEsT0FBQSxHQUFBLElBQUEsS0FBQSxDQUFBLFVBQUEsRUFBQSxDQUFBOzs7QUFHQSxpQkFBQSxDQUFBLE1BQUEsQ0FBQSxvQkFBQSxFQUFBLFVBQUEsUUFBQSxFQUFBLFFBQUEsRUFBQTtBQUNBLG9CQUFBLFFBQUEsSUFBQSxRQUFBLEVBQUE7QUFDQSw2QkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO2lCQUNBO2FBQ0EsQ0FBQSxDQUFBOzs7QUFHQSxxQkFBQSxTQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsMEJBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsR0FBQSx5QkFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLDBCQUFBLENBQUEsWUFBQSxFQUFBLENBQUE7QUFDQSx3QkFBQSxRQUFBLEVBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHlCQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBOztBQUVBLDRCQUFBLEdBQUEsTUFBQSxDQUFBO2lCQUNBLENBQUEsQ0FBQTthQUNBOzs7QUFHQSxxQkFBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxFQUFBLENBQUE7OztBQUdBLHFCQUFBLElBQUEsR0FBQTs7O0FBR0Esc0JBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxpQkFBQSxDQUFBLEVBQUEsRUFBQSxnQkFBQSxHQUFBLGlCQUFBLEVBQUEsQ0FBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7OztBQUdBLHFCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7Ozs7QUFJQSxxQkFBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLEtBQUEsQ0FBQSxZQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsQ0FBQTs7QUFFQSxvQkFBQSxnQkFBQSxHQUFBLElBQUEsS0FBQSxDQUFBLGdCQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxnQ0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLGdDQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0EsZ0NBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxnQ0FBQSxDQUFBLFFBQUEsQ0FBQSxTQUFBLEVBQUEsQ0FBQTtBQUNBLHFCQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQTs7O0FBR0Esd0JBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLHdCQUFBLENBQUEsT0FBQSxDQUFBLGdCQUFBLEVBQUEsaUJBQUEsQ0FBQSxDQUFBO0FBQ0Esd0JBQUEsQ0FBQSxhQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLFdBQUEsQ0FBQSxRQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7OztBQUdBLHNCQUFBLENBQUEsZ0JBQUEsQ0FBQSxRQUFBLEVBQUEsY0FBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBOzs7YUFHQTs7O0FBR0EscUJBQUEsY0FBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLHdCQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsaUJBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxNQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLEVBQUEsR0FBQSxpQkFBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxzQkFBQSxFQUFBLENBQUE7YUFDQTs7O0FBR0EsZ0JBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHFCQUFBLE9BQUEsR0FBQTtBQUNBLHNCQUFBLEVBQUEsQ0FBQTtBQUNBLHFDQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7YUFDQTs7O0FBR0EscUJBQUEsTUFBQSxHQUFBO0FBQ0Esb0JBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLEVBQUEsR0FBQSxPQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0Esd0JBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWyd1aS5yb3V0ZXInLCAnZnNhUHJlQnVpbHQnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgIFx0d2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuXHR9KTtcblxufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgdmFyIGRlc3RpbmF0aW9uID0gdXNlciA/IHRvU3RhdGUubmFtZSA6ICdsb2dpbic7XG4gICAgICAgICAgICAkc3RhdGUuZ28oZGVzdGluYXRpb24pO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJsb2dnZWQgaW5cIilcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnVzZXIsIFwibG9nZ2VkIGluXCIpXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdNYW5hZ2VyQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJHRpbWVvdXQpe1xuXG5cdC8vIE5hdmJhclxuXHQvLyAkc2NvcGUubmF2YmFyRXhwYW5kID0gZmFsc2U7XG5cdFxuXHQvLyBDb2xsZWN0aW9uIFBhbmVsXG5cdCRzY29wZS5jb2xsZWN0aW9uT3BlbiA9IGZhbHNlO1xuXHRcblx0XG5cdCRyb290U2NvcGUuJGJyb2FkY2FzdChcImNvbGxlY3Rpb25PcGVuXCIsICRzY29wZS5uYXZiYXJFeHBhbmQpXG5cblx0Ly9Db2xsYXBzZSBBbGxcblx0JHNjb3BlLmNvbGxhcHNlVG9wID0gZnVuY3Rpb24oKXtcblx0XHQkc2NvcGUuY29sbGVjdGlvbk9wZW4gPSBmYWxzZTtcblx0XHQkdGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0JHNjb3BlLm5hdmJhckV4cGFuZCA9IGZhbHNlO1xuXHRcdH0sIDIwMCk7XG5cdH1cblxuXHQvLyBBY3R1YWwgY29sbGVjdGlvblxuXHQkc2NvcGUuY29sbGVjdGlvbiA9IFtdO1xuXHRcblxuXHQkc2NvcGUuJG9uKCdjb2xsZWN0aW9uVG9nZ2xlZCcsIGZ1bmN0aW9uIChldmVudCwgdG9nZ2xlKSB7XG5cdFx0JHNjb3BlLmNvbGxlY3Rpb25PcGVuID0gdG9nZ2xlO1xuXHR9KTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJoaXQgY29udHJvbGxlclwiKVxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ3dlbGNvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnTW9kZWwnLCBmdW5jdGlvbigkaHR0cCl7XG5cblx0Ly8gQ3VycmVudGx5IFJlbmRlcmVkIE9iamVjdFxuXHR2YXIgcmVuZGVyT2JqID0ge1xuXHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJ1xuXHR9O1xuXG5cblx0Ly8gTW9kZWwgQ29uc3RydWN0b3Jcblx0ZnVuY3Rpb24gTW9kZWwgKHByb3BzKSB7XG5cdFx0YW5ndWxhci5leHRlbmQodGhpcywgcHJvcHMpO1xuXHR9O1xuXG5cdE1vZGVsLnVybCA9ICdhcGkvcHJvZHVjdCdcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KE1vZGVsLnByb3RvdHlwZSwgJ3VybCcsIHtcblx0XHRnZXQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBNb2RlbC51cmwgKyB0aGlzLl9pZDtcblx0XHR9XG5cdH0pO1xuXG5cblx0Ly8gTGlzdGluZyBGdW5jdGlvbmFsaXR5XG5cdE1vZGVsLnByb3RvdHlwZS5mZXRjaCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuICRodHRwLmdldCh0aGlzLnVybCkudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRyZXR1cm4gbmV3IE1vZGVsKHJlcy5kYXRhKTtcblx0XHR9KTtcblx0fVxuXG5cdE1vZGVsLmZldGNoQWxsID0gZnVuY3Rpb24oKXtcblx0XHQvLyByZXR1cm4gJGh0cHAuZ2V0KE1vZGVsLnVybCkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuXHRcdC8vIFx0cmV0dXJuIHJlcy5kYXRhLm1hcChmdW5jdGlvbiAob2JqKSB7XG5cdFx0Ly8gXHRcdHJldHVybiBuZXcgTW9kZWwob2JqKTtcblx0XHQvLyBcdH0pO1xuXHRcdC8vIH0pO1xuXHRcdGNvbnNvbGUubG9nKCk7XG5cdFx0cmV0dXJuIFtcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fV07XG5cblx0fVxuXG5cblx0Ly8gUmVuZGVyZXIgRnVuY3Rpb25hbGl0eVxuXHRNb2RlbC5jaGFuZ2VNb2RlbFVybCA9IGZ1bmN0aW9uIChuZXdVcmwpIHtcblx0XHRyZW5kZXJPYmoubW9kZWxGaWxlVXJsID0gbmV3VXJsO1xuXHRcdHJldHVybiByZW5kZXJPYmo7XG5cdH07XG5cdE1vZGVsLmNoYW5nZU1vZGVsID0gZnVuY3Rpb24gKCkge1xuXHRcdC8vIFRlbXAgYXR0cmlidXRlcyBmb3IgdGVzdGluZ1xuXHRcdHJlbmRlck9iaiA9IHtcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcidcblx0XHR9XG5cdH07XG5cdE1vZGVsLmdldE1vZGVsVXJsID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiByZW5kZXJPYmoubW9kZWxGaWxlVXJsO1xuXHR9O1xuXHRNb2RlbC5nZXRNb2RlbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gcmVuZGVyT2JqO1xuXHR9O1xuXG5cblxuXHRyZXR1cm4gTW9kZWw7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnblVwJywge1xuICAgICAgICB1cmw6ICcvc2lnbnVwJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zaWduLXVwL3NpZ24tdXAuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaWduVXBDdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpZ25VcEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBTaWduVXAsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kU2lnblVwID0gZnVuY3Rpb24gKHNpZ25VcEluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIFNpZ25VcC5zaWdudXAoc2lnblVwSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2xpc3RpbmcnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuICAgIFxuICAgJHNjb3BlLnN1Ym1pdEZvcm0gPSBmdW5jdGlvbigpIHtcblxuXHRcdFx0Ly8gY2hlY2sgdG8gbWFrZSBzdXJlIHRoZSBmb3JtIGlzIGNvbXBsZXRlbHkgdmFsaWRcblx0XHRcdGlmICgkc2NvcGUudXNlckZvcm0uJHZhbGlkKSB7XG5cdFx0XHRcdGFsZXJ0KCdvdXIgZm9ybSBpcyBhbWF6aW5nJyk7XG5cdFx0XHR9XG5cblx0XHR9O1xuICAgIFxuICAgICRzY29wZS5nZXRVc2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIFNpZ25VcC5nZXRVc2VycygpLnRoZW4oZnVuY3Rpb24odXNlcnMpe1xuICAgICAgICAgICAgY29uc29sZS5sb2codXNlcnMpXG4gICAgICAgIH0pXG4gICAgfVxuXG59KTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignVXBsb2FkQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSl7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpe1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgndXBsb2FkJywge1xuXHRcdHVybDogJy91cGxvYWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvdXBsb2FkL3VwbG9hZC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnVXBsb2FkQ29udHJvbGxlcidcblx0fSk7XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdVc2VyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpe1xuXG5cblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgndXNlcicsIHtcblx0XHR1cmw6ICcvdXNlci86aWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2Jyb3dzZXIvanMvdXNlci91c2VyLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdVc2VyQ29udHJvbGxlcicsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0dXNlcjogZnVuY3Rpb24gKFVzZXIsICRzdGF0ZVBhcmFtcykge1xuXHRcdFx0XHR2YXIgdXNlciA9IG5ldyBVc2VyKHtfaWQ6ICRzdGF0ZVBhcmFtcy5pZH0pO1xuXHRcdFx0XHRyZXR1cm4gdXNlci5mZXRjaCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ2ZpZWxkRm9jdXMnLCBmdW5jdGlvbigkcGFyc2UsICR0aW1lb3V0KXtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0EnLFxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xuXHRcdFx0dmFyIHN0YXR1cyA9ICRwYXJzZShhdHRycy5maWVsZEZvY3VzKTtcblx0XHRcdHNjb3BlLiR3YXRjaChzdGF0dXMsIGZ1bmN0aW9uKHZhbCl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdzdGF0dXMgPSAnLCB2YWwpO1xuXHRcdFx0XHRpZiAodmFsID09PSB0cnVlKXtcblx0XHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0ZWxlbWVudFswXS5mb2N1cygpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fVxuXHR9XG59KSIsIlxuYXBwLmZhY3RvcnkoJ1NpZ25VcCcsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlLCAkbG9jYXRpb24pIHtcblx0cmV0dXJue1xuXHRcdHNpZ251cDogZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJ2FwaS91c2VyJywgY3JlZGVudGlhbHMpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuXHRcdFx0Y29uc29sZS5sb2cocmVzLmRhdGEpXG5cdFx0XHRyZXR1cm4gcmVzLmRhdGE7XG5cdFx0fSk7XG5cdFx0fSxcblxuICAgICAgICBnZXRVc2VyczogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJ2FwaS91c2VyJykudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cdH1cbn0pO1xuXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3dlbGNvbWUnLCB7XG4gICAgICAgIHVybDogJy93ZWxjb21lJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy93ZWxjb21lL3dlbGNvbWUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdXZWxjb21lQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdXZWxjb21lQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSwkdGltZW91dCkge1xuXHQkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICRzdGF0ZS5nbygnbGlzdGluZycpO1xuICAgICAgfSwgMzAwMCk7XG5cbn0pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ2NvbGxlY3Rpb24nLCBmdW5jdGlvbigpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21wb25lbnRzL2NvbGxlY3Rpb24vY29sbGVjdGlvbi5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnTWFuYWdlckNvbnRyb2xsZXInXG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuLy8gYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCkge1xuLy8gXHRyZXR1cm4ge1xuLy8gXHRcdHJlc3RyaWN0OiBcIkVcIixcbi8vIFx0XHR0ZW1wbGF0ZVVybDogXCJqcy9jb21wb25lbnRzL25hdmJhci9uYXZiYXIuaHRtbFwiLFxuLy8gXHRcdGNvbnRyb2xsZXI6ICdNYW5hZ2VyQ29udHJvbGxlcidcbi8vIFx0fVxuLy8gfSk7XG5cblxuYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tcG9uZW50cy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCAkdGltZW91dCkge1xuICAgICAgICAgICAgXG4gICAgICAgIFx0Ly8gQ29sbGVjdGlvbiBQYW5lbFxuICAgICAgICBcdCRzY29wZS5jb2xsZWN0aW9uT3BlbiA9IGZhbHNlO1xuICAgICAgICBcdCRzY29wZS5jb2xsZWN0aW9uVG9nZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uT3BlbiA9ICEkc2NvcGUuY29sbGVjdGlvbk9wZW47XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KFwiY29sbGVjdGlvblRvZ2dsZWRcIiwgJHNjb3BlLmNvbGxlY3Rpb25PcGVuKVxuICAgICAgICBcdH1cbiAgICAgICAgICAgICRzY29wZS5jb2xsZWN0aW9uID0gW107XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICRzY29wZS4kb24oJ2NvbGxlY3Rpb25PcGVuJywgZnVuY3Rpb24oZXZlbnQsIGV4cGFuZGVkKXtcbiAgICAgICAgICAgICAgICAkc2NvcGUubmF2YmFyRXhwYW5kID0gZXhwYW5kZWQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgJHNjb3BlLmxvZ2dlZEluID0gZmFsc2U7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICRzY29wZS5pdGVtc0hpZGUgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1NpZ24gSW4nLCBzdGF0ZTogJ2xvZ2luJywgYXV0aDogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdTaWduIFVwJywgc3RhdGU6ICdzaWduVXAnLCBhdXRoOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0NhcnQnLCBzdGF0ZTogJ2xpc3RpbmcnIH1cbiAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICRzY29wZS5pdGVtc1Nob3cgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1VwbG9hZCBhIE1vZGVsJywgc3RhdGU6ICd1cGxvYWQnLCBhdXRoOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ01lbWJlcnMgT25seScsIHN0YXRlOiAnbWVtYmVyc09ubHknLCBhdXRoOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0NhcnQnLCBzdGF0ZTogJ2xpc3RpbmcnIH1cbiAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICRzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgJHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNpZ25lZCA9IEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwic2lnbmVkIGluID1cIiArIHNpZ25lZClcbiAgICAgICAgICAgICAgICAkc2NvcGUubG9nZ2VkSW4gPSBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2dnZWRJbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbGlzdGluZycpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJHNjb3BlLmNoZWNrID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUudXNlcilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICBcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgIC8vIHJvdXRlIHRvIGhhbmRsZSBPYXV0aFxuICAgLy8gJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgIC8vIH0pO1xufSk7XG5cblxuXG5hcHAuZGlyZWN0aXZlKCdvYXV0aEJ1dHRvbicsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge1xuXHRcdFx0cHJvdmlkZXJOYW1lOiAnQCdcblx0XHR9LFxuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21wb25lbnRzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uaHRtbCdcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdzZWFyY2hiYXInLCBmdW5jdGlvbiAoKXtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tcG9uZW50cy9zZWFyY2hiYXIvc2VhcmNoYmFyLmh0bWwnXG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ0xpc3RpbmdDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbW9kZWxzLCBNb2RlbCkge1xuXG4gICAgJHNjb3BlLmNoYW5nZU1vZGVsID0gZnVuY3Rpb24oKXtcbiAgICBcdGNvbnNvbGUubG9nKCRzY29wZS5tb2RlbHMpO1xuICAgIFx0TW9kZWwuY2hhbmdlTW9kZWwoKTtcbiAgICB9XG5cbiAgICAkc2NvcGUubW9kZWxzID0gbW9kZWxzO1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoIGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKXtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGlzdGluZycsIHtcblx0XHR1cmw6ICcvJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvbGlzdGluZy9saXN0aW5nLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdMaXN0aW5nQ29udHJvbGxlcicsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0bW9kZWxzOiBmdW5jdGlvbiAoTW9kZWwpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coTW9kZWwuZmV0Y2hBbGwoKSk7XG5cdFx0XHRcdHJldHVybiBNb2RlbC5mZXRjaEFsbCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1JlbmRlckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBNb2RlbCkge1xuXG5cdCRzY29wZS5tb2RlbCA9IE1vZGVsLmdldE1vZGVsKCk7XG5cdFxuXHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIE1vZGVsLmdldE1vZGVsVXJsKClcblx0fSwgZnVuY3Rpb24gKG5ld1ZhbCwgb2xkVmFsKXtcblx0XHQkc2NvcGUubW9kZWwgPSBNb2RlbC5nZXRNb2RlbCgpOyBcblx0fSk7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnbmdXZWJnbCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIG1vZGVsOiAnPW1vZGVsRmlsZVVybCdcbiAgICAgIH0sXG4gICAgICBjb250cm9sbGVyOiBcIlJlbmRlckNvbnRyb2xsZXJcIixcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cikge1xuXG4gICAgICAgIC8vIFNldHVwIHNlbGVjdGlvbnNcbiAgICAgICAgc2NvcGUucmVuZGVyRnJhbWUgPSAkKCcjcmVuZGVyLWZyYW1lJyk7XG4gICAgICAgIHZhciByZW5kZXJGcmFtZVdpZHRoID0gc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKTtcbiAgICAgICAgdmFyIHJlbmRlckZyYW1lSGVpZ2h0ID0gc2NvcGUucmVuZGVyRnJhbWUuaGVpZ2h0KCk7XG4gICAgICAgIHZhciByZW5kZXJPYmplY3RTY2FsZU1vZGlmaWVyID0gcmVuZGVyRnJhbWVXaWR0aC8xMDI0O1xuXG4gICAgICAgIC8vIFNldHVwIFRIUkVFLmpzIHZhcmlhYmxlcyB3aXRoIHNjb3BlXG4gICAgICAgIHZhciBjYW1lcmE7XG4gICAgICAgICAgICBzY29wZS5jYW1lcmEgPSBjYW1lcmE7XG4gICAgICAgIHZhciBzY2VuZTtcbiAgICAgICAgICAgIHNjb3BlLnNjZW5lID0gc2NlbmU7XG4gICAgICAgIHZhciByZW5kZXJlcjtcbiAgICAgICAgICAgIHNjb3BlLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gICAgICAgIHZhciBwcmV2aW91cztcbiAgICAgICAgICAgIHNjb3BlLnByZXZpb3VzID0gcHJldmlvdXM7XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBzY2VuZVxuICAgICAgICBpbml0KCk7XG5cbiAgICAgICAgLy8gbG9hZCBkZWZhdWx0IG1vZGVsIG9uIHNjb3BlIC0tIGplZXAgbW9kZWwgLS0gdmlhIEFzc2ltcEpTT05Mb2FkZXJcbiAgICAgICAgdmFyIGxvYWRlcjIgPSBuZXcgVEhSRUUuT2JqZWN0TG9hZGVyKCk7XG4gICAgICAgIHZhciBsb2FkZXIzID0gbmV3IFRIUkVFLkpTT05Mb2FkZXIoKTtcblxuICAgICAgICAvLyBXYXRjaCBmb3IgY2hhbmdlcyB0byBzY29wZVxuICAgICAgICBzY29wZS4kd2F0Y2goJ21vZGVsLm1vZGVsRmlsZVVybCcsIGZ1bmN0aW9uIChuZXdWYWx1ZSwgb2xkVmFsdWUpe1xuICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgbG9hZE1vZGVsKG5ld1ZhbHVlKTsgXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyEhIEhhbmRsZSByZW1vdmluZyBvYmplY3QgYW5kIGFkZGluZyBuZXcgb2JqZWN0XG4gICAgICAgIGZ1bmN0aW9uIGxvYWRNb2RlbChtb2RVcmwpIHtcbiAgICAgICAgICAgIGxvYWRlcjIubG9hZChtb2RVcmwsIGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgICAgICAgb2JqZWN0LnNjYWxlLnggPSBvYmplY3Quc2NhbGUueSA9IG9iamVjdC5zY2FsZS56ID0gKC4wMjggKiByZW5kZXJPYmplY3RTY2FsZU1vZGlmaWVyKTtcbiAgICAgICAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnkgPSAuNTtcbiAgICAgICAgICAgICAgb2JqZWN0LnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgICAgICAgICBpZiAocHJldmlvdXMpIHNjZW5lLnJlbW92ZShwcmV2aW91cyk7XG4gICAgICAgICAgICAgIHNjZW5lLmFkZChvYmplY3QpO1xuXG4gICAgICAgICAgICAgIHByZXZpb3VzID0gb2JqZWN0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIC8vIHJ1biBsb2FkIG1vZGVsIG9uIGN1cnJlbnQgbW9kZWxVcmxcbiAgICAgICAgbG9hZE1vZGVsKHNjb3BlLm1vZGVsLm1vZGVsRmlsZVVybCk7XG4gICAgICAgIGFuaW1hdGUoKTtcblxuICAgICAgICAvLyBTZXR1cCBUSFJFRS5qcyBjYW1lcmFzLCBzY2VuZSwgcmVuZGVyZXIsIGxpZ2h0aW5nXG4gICAgICAgIGZ1bmN0aW9uIGluaXQoKXtcblxuICAgICAgICAgIC8vIENhbWVyYVxuICAgICAgICAgIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg1MCwgcmVuZGVyRnJhbWVXaWR0aCAvIHJlbmRlckZyYW1lSGVpZ2h0LCAxLCAyMDAwKTtcbiAgICAgICAgICBjYW1lcmEucG9zaXRpb24uc2V0KDIsNCw1KTtcblxuICAgICAgICAgIC8vIFNjZW5lXG4gICAgICAgICAgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbiAgICAgICAgICAvLyBzY2VuZS5mb2cgPSBuZXcgVEhSRUUuRm9nRXhwMigweDAwMDAwMCwgMC4wMDAxKTtcblxuICAgICAgICAgIC8vIExpZ2h0c1xuICAgICAgICAgIHNjZW5lLmFkZChuZXcgVEhSRUUuQW1iaWVudExpZ2h0KDB4Y2NjY2NjKSk7XG5cbiAgICAgICAgICB2YXIgZGlyZWN0aW9uYWxMaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4Y2NjY2NjKTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnggPSBNYXRoLnJhbmRvbSgpIC0gMC41O1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ueSA9IE1hdGgucmFuZG9tKCkgLSAwLjU7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi56ID0gTWF0aC5yYW5kb20oKSAtIDAuNTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgIHNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0KTtcblxuICAgICAgICAgIC8vISEhISBSZW5kZXJlclxuICAgICAgICAgIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoeyBhbnRpYWxpYXM6IHRydWUgfSk7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U2l6ZShyZW5kZXJGcmFtZVdpZHRoLCByZW5kZXJGcmFtZUhlaWdodCk7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvciggMHhmZmZmZmYgKTtcbiAgICAgICAgICBlbGVtZW50WzBdLmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgZm9yIFJlc2l6ZSBFdmVudFxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSwgZmFsc2UpO1xuXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coc2NlbmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIFJlc2l6ZVxuICAgICAgICBmdW5jdGlvbiBvbldpbmRvd1Jlc2l6ZShldmVudCl7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U2l6ZShzY29wZS5yZW5kZXJGcmFtZS53aWR0aCgpLCByZW5kZXJGcmFtZUhlaWdodCk7XG4gICAgICAgICAgY2FtZXJhLmFzcGVjdCA9IHNjb3BlLnJlbmRlckZyYW1lLndpZHRoKCkgLyByZW5kZXJGcmFtZUhlaWdodDtcbiAgICAgICAgICBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQW5pbWF0ZVxuICAgICAgICB2YXIgdCA9IDA7IC8vID9cbiAgICAgICAgZnVuY3Rpb24gYW5pbWF0ZSgpIHsgICAgICAgICAgXG4gICAgICAgICAgcmVuZGVyKCk7XG4gICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIHJlLVJlbmRlcmluZyBvZiBzY2VuZSBmb3Igc3Bpbm5pbmdcbiAgICAgICAgZnVuY3Rpb24gcmVuZGVyKCl7IFxuICAgICAgICAgIHZhciB0aW1lciA9IERhdGUubm93KCkgKiAwLjAwMDE1O1xuICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnggPSBNYXRoLmNvcyh0aW1lcikgKiAxMDtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi55ID0gNDtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi56ID0gTWF0aC5zaW4odGltZXIpICogOC41O1xuICAgICAgICAgICAgY2FtZXJhLmxvb2tBdChzY2VuZS5wb3NpdGlvbik7XG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=