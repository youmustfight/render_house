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
                console.log($scope.user);
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
                console.log($scope.loggedIn, "yeah");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZzYS1wcmUtYnVpbHQuanMiLCJjb21wb25lbnRzL21hbmFnZXIuY29udHJvbGxlci5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3QvbW9kZWwuZmFjdG9yeS5qcyIsInNpZ24tdXAvc2lnbi11cC5qcyIsInVwbG9hZC91cGxvYWQuY29udHJvbGxlci5qcyIsInVwbG9hZC91cGxvYWQuc3RhdGUuanMiLCJ1c2VyL3VzZXIuY29udHJvbGxlci5qcyIsInVzZXIvdXNlci5zdGF0ZS5qcyIsInV0aWxzL2ZpZWxkRm9jdXMuZGlyZWN0aXZlLmpzIiwidXRpbHMvc2lnbi11cC1mYWN0b3J5LmpzIiwid2VsY29tZS93ZWxjb21lLmpzIiwiY29tcG9uZW50cy9jb2xsZWN0aW9uL2NvbGxlY3Rpb24uZGlyZWN0aXZlLmpzIiwiY29tcG9uZW50cy9uYXZiYXIvbmF2YmFyLmRpcmVjdGl2ZS5qcyIsImNvbXBvbmVudHMvb2F1dGgtYnV0dG9uL29hdXRoLWJ1dHRvbi5kaXJlY3RpdmUuanMiLCJjb21wb25lbnRzL3NlYXJjaGJhci9zZWFyY2hiYXIuZGlyZWN0aXZlLmpzIiwicHJvZHVjdC9saXN0aW5nL2xpc3RpbmcuY29udHJvbGxlci5qcyIsInByb2R1Y3QvbGlzdGluZy9saXN0aW5nLnN0YXRlLmpzIiwicHJvZHVjdC9yZW5kZXIvcmVuZGVyLmNvbnRyb2xsZXIuanMiLCJwcm9kdWN0L3JlbmRlci9yZW5kZXIuZGlyZWN0aXZlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQUEsQ0FBQTtBQUNBLElBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxhQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxrQkFBQSxFQUFBLGlCQUFBLEVBQUE7O0FBRUEscUJBQUEsQ0FBQSxTQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsc0JBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOzs7QUFHQSxHQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7OztBQUdBLFFBQUEsNEJBQUEsR0FBQSxTQUFBLDRCQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsZUFBQSxLQUFBLENBQUEsSUFBQSxJQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQSxDQUFBO0tBQ0EsQ0FBQTs7OztBQUlBLGNBQUEsQ0FBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUE7O0FBRUEsWUFBQSxDQUFBLDRCQUFBLENBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBLG1CQUFBO1NBQ0E7O0FBRUEsWUFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLEVBQUE7OztBQUdBLG1CQUFBO1NBQ0E7OztBQUdBLGFBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7OztBQUlBLGdCQUFBLFdBQUEsR0FBQSxJQUFBLEdBQUEsT0FBQSxDQUFBLElBQUEsR0FBQSxPQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ25EQSxDQUFBLFlBQUE7O0FBRUEsZ0JBQUEsQ0FBQTs7O0FBR0EsUUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSx3QkFBQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBO0FBQ0EsZUFBQSxNQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7Ozs7O0FBS0EsT0FBQSxDQUFBLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxvQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7QUFDQSxzQkFBQSxFQUFBLHNCQUFBO0FBQ0Esd0JBQUEsRUFBQSx3QkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsZ0JBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGFBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7U0FDQSxDQUFBO0FBQ0EsZUFBQTtBQUNBLHlCQUFBLEVBQUEsdUJBQUEsUUFBQSxFQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsVUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsWUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLFdBQUEsRUFDQSxVQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsaUJBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGlCQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLElBQUEsRUFBQSxXQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLElBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQTs7OztBQUlBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsZ0JBQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxJQUFBLFVBQUEsS0FBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTthQUNBOzs7OztBQUtBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUNBLENBQUEsWUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsNEJBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsRUFBQSxDQUFBOztBQ3RJQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQSxRQUFBLEVBQUE7Ozs7OztBQU1BLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBOztBQUdBLGNBQUEsQ0FBQSxVQUFBLENBQUEsZ0JBQUEsRUFBQSxNQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBO1NBQ0EsRUFBQSxHQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsY0FBQSxHQUFBLE1BQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzdCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsS0FBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxRQUFBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQTtBQUNBLGtCQUFBLEVBQUEsV0FBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLFNBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsZ0JBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsbUJBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzNCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxtRUFBQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7OztBQUdBLFlBQUEsRUFBQTtBQUNBLHdCQUFBLEVBQUEsSUFBQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFFBQUEsUUFBQSxHQUFBLFNBQUEsUUFBQSxHQUFBO0FBQ0EsZUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLDJCQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxRQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUMvQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOzs7QUFHQSxRQUFBLFNBQUEsR0FBQTtBQUNBLG9CQUFBLEVBQUEsMkNBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQTtLQUNBLENBQUE7OztBQUlBLGFBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxTQUFBLENBQUEsR0FBQSxHQUFBLGFBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxjQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsZUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBOzs7QUFJQSxTQUFBLENBQUEsU0FBQSxDQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxJQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFNBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTs7Ozs7O0FBTUEsZUFBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsZUFBQSxDQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLFFBQUE7QUFDQSwyQkFBQSxFQUFBLDhCQUFBO0FBQ0Esd0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsZUFBQTtBQUNBLGdCQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO1NBQ0EsRUFDQTtBQUNBLGVBQUEsRUFBQSxLQUFBO0FBQ0EsaUJBQUEsRUFBQSxpQkFBQTtBQUNBLDJCQUFBLEVBQUEsc0NBQUE7QUFDQSx3QkFBQSxFQUFBLDJDQUFBO0FBQ0EsbUJBQUEsRUFBQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLFFBQUE7QUFDQSwyQkFBQSxFQUFBLDhCQUFBO0FBQ0Esd0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsZUFBQTtBQUNBLGdCQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO1NBQ0EsRUFDQTtBQUNBLGVBQUEsRUFBQSxLQUFBO0FBQ0EsaUJBQUEsRUFBQSxRQUFBO0FBQ0EsMkJBQUEsRUFBQSw4QkFBQTtBQUNBLHdCQUFBLEVBQUEsb0JBQUE7QUFDQSxtQkFBQSxFQUFBLGVBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLFFBQUE7QUFDQSwyQkFBQSxFQUFBLDhCQUFBO0FBQ0Esd0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsZUFBQTtBQUNBLGdCQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO1NBQ0EsRUFDQTtBQUNBLGVBQUEsRUFBQSxLQUFBO0FBQ0EsaUJBQUEsRUFBQSxpQkFBQTtBQUNBLDJCQUFBLEVBQUEsc0NBQUE7QUFDQSx3QkFBQSxFQUFBLDJDQUFBO0FBQ0EsbUJBQUEsRUFBQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLFFBQUE7QUFDQSwyQkFBQSxFQUFBLDhCQUFBO0FBQ0Esd0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEVBQUEsZUFBQTtBQUNBLGdCQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO1NBQ0EsRUFDQTtBQUNBLGVBQUEsRUFBQSxLQUFBO0FBQ0EsaUJBQUEsRUFBQSxRQUFBO0FBQ0EsMkJBQUEsRUFBQSw4QkFBQTtBQUNBLHdCQUFBLEVBQUEsb0JBQUE7QUFDQSxtQkFBQSxFQUFBLGVBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxFQUNBO0FBQ0EsZUFBQSxFQUFBLEtBQUE7QUFDQSxpQkFBQSxFQUFBLGlCQUFBO0FBQ0EsMkJBQUEsRUFBQSxzQ0FBQTtBQUNBLHdCQUFBLEVBQUEsMkNBQUE7QUFDQSxtQkFBQSxFQUFBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtTQUNBLEVBQ0E7QUFDQSxlQUFBLEVBQUEsS0FBQTtBQUNBLGlCQUFBLEVBQUEsUUFBQTtBQUNBLDJCQUFBLEVBQUEsOEJBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FFQSxDQUFBOzs7QUFJQSxTQUFBLENBQUEsY0FBQSxHQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsaUJBQUEsQ0FBQSxZQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsZUFBQSxTQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsU0FBQSxDQUFBLFdBQUEsR0FBQSxZQUFBOztBQUVBLGlCQUFBLEdBQUE7QUFDQSx3QkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxlQUFBO1NBQ0EsQ0FBQTtLQUNBLENBQUE7QUFDQSxTQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLFNBQUEsQ0FBQSxZQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsU0FBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxTQUFBLENBQUE7S0FDQSxDQUFBOztBQUlBLFdBQUEsS0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbFJBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLHlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOztBQUVBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGNBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQ2pDQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEVBRUEsQ0FBQSxDQUFBO0FDSkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxrQkFBQSxFQUFBLGtCQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsZ0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxFQUlBLENBQUEsQ0FBQTtBQ05BLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLDRCQUFBO0FBQ0Esa0JBQUEsRUFBQSxnQkFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLGdCQUFBLEVBQUEsY0FBQSxJQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0Esb0JBQUEsSUFBQSxHQUFBLElBQUEsSUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLFlBQUEsQ0FBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBLEtBQUEsRUFBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNkQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsZ0JBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLEVBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxvQkFBQSxHQUFBLEtBQUEsSUFBQSxFQUFBO0FBQ0EsNEJBQUEsQ0FBQSxZQUFBO0FBQ0EsK0JBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQTtxQkFDQSxDQUFBLENBQUE7aUJBQ0E7YUFDQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDaEJBLEdBQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsY0FBQSxFQUFBLGdCQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTs7QUFFQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ2hCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxVQUFBO0FBQ0EsbUJBQUEsRUFBQSx5QkFBQTtBQUNBLGtCQUFBLEVBQUEsYUFBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsWUFBQSxDQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsRUFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO0tBQ0EsRUFBQSxJQUFBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUNmQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLDBDQUFBO0FBQ0Esa0JBQUEsRUFBQSxtQkFBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNSQSxZQUFBLENBQUE7Ozs7Ozs7Ozs7QUFXQSxHQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBLEVBQUE7QUFDQSxtQkFBQSxFQUFBLGtDQUFBO0FBQ0Esa0JBQUEsRUFBQSxvQkFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBOzs7QUFHQSxrQkFBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLGdCQUFBLEdBQUEsWUFBQTtBQUNBLHNCQUFBLENBQUEsY0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQTtBQUNBLDBCQUFBLENBQUEsVUFBQSxDQUFBLG1CQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTtBQUNBLGtCQUFBLENBQUEsVUFBQSxHQUFBLEVBQUEsQ0FBQTs7QUFFQSxrQkFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLFFBQUEsRUFBQTtBQUNBLHNCQUFBLENBQUEsWUFBQSxHQUFBLFFBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsUUFBQSxHQUFBLEtBQUEsQ0FBQTs7QUFFQSxrQkFBQSxDQUFBLFNBQUEsR0FBQSxDQUNBLEVBQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFFBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsQ0FDQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsU0FBQSxHQUFBLENBQ0EsRUFBQSxLQUFBLEVBQUEsZ0JBQUEsRUFBQSxLQUFBLEVBQUEsUUFBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUEsRUFDQSxFQUFBLEtBQUEsRUFBQSxjQUFBLEVBQUEsS0FBQSxFQUFBLGFBQUEsRUFBQSxJQUFBLEVBQUEsSUFBQSxFQUFBLEVBQ0EsRUFBQSxLQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsQ0FDQSxDQUFBOztBQUdBLGtCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxrQkFBQSxDQUFBLFVBQUEsR0FBQSxZQUFBO0FBQ0Esb0JBQUEsTUFBQSxHQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQTs7QUFFQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLFFBQUEsR0FBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQUE7QUFDQSx1QkFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSwyQkFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsMEJBQUEsQ0FBQSxRQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxFQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsZ0JBQUEsT0FBQSxHQUFBLFNBQUEsT0FBQSxHQUFBO0FBQ0EsMkJBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSwwQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxnQkFBQSxVQUFBLEdBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxzQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLG1CQUFBLEVBQUEsQ0FBQTs7QUFFQSxzQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsWUFBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxDQUFBLENBQUE7U0FFQTs7S0FFQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDdEZBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsa0JBQUEsRUFBQSxpQkFBQSxFQUFBOzs7OztDQUtBLENBQUEsQ0FBQTs7QUFJQSxHQUFBLENBQUEsU0FBQSxDQUFBLGFBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGFBQUEsRUFBQTtBQUNBLHdCQUFBLEVBQUEsR0FBQTtTQUNBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSw4Q0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNuQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSx3Q0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDUEEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0EsYUFBQSxDQUFBLFdBQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ1hBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSxpQ0FBQTtBQUNBLGtCQUFBLEVBQUEsbUJBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLEtBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ2hCQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsTUFBQSxDQUFBLFlBQUE7QUFDQSxlQUFBLEtBQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtLQUNBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNaQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxTQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUE7QUFDQSxpQkFBQSxFQUFBLGVBQUE7U0FDQTtBQUNBLGtCQUFBLEVBQUEsa0JBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQTs7O0FBR0EsaUJBQUEsQ0FBQSxXQUFBLEdBQUEsQ0FBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBO0FBQ0EsZ0JBQUEsZ0JBQUEsR0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBO0FBQ0EsZ0JBQUEsaUJBQUEsR0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsRUFBQSxDQUFBO0FBQ0EsZ0JBQUEseUJBQUEsR0FBQSxnQkFBQSxHQUFBLElBQUEsQ0FBQTs7O0FBR0EsZ0JBQUEsTUFBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsZ0JBQUEsS0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsZ0JBQUEsUUFBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBO0FBQ0EsZ0JBQUEsUUFBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBOzs7QUFHQSxnQkFBQSxFQUFBLENBQUE7OztBQUdBLGdCQUFBLE9BQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtBQUNBLGdCQUFBLE9BQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxVQUFBLEVBQUEsQ0FBQTs7O0FBR0EsaUJBQUEsQ0FBQSxNQUFBLENBQUEsb0JBQUEsRUFBQSxVQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxvQkFBQSxRQUFBLElBQUEsUUFBQSxFQUFBO0FBQ0EsNkJBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtpQkFDQTthQUNBLENBQUEsQ0FBQTs7O0FBR0EscUJBQUEsU0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLDBCQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEseUJBQUEsQ0FBQTtBQUNBLDBCQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSwwQkFBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO0FBQ0Esd0JBQUEsUUFBQSxFQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSx5QkFBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTs7QUFFQSw0QkFBQSxHQUFBLE1BQUEsQ0FBQTtpQkFDQSxDQUFBLENBQUE7YUFDQTs7O0FBR0EscUJBQUEsQ0FBQSxLQUFBLENBQUEsS0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsRUFBQSxDQUFBOzs7QUFHQSxxQkFBQSxJQUFBLEdBQUE7OztBQUdBLHNCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsaUJBQUEsQ0FBQSxFQUFBLEVBQUEsZ0JBQUEsR0FBQSxpQkFBQSxFQUFBLENBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQSxDQUFBOzs7QUFHQSxxQkFBQSxHQUFBLElBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBOzs7O0FBSUEscUJBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxLQUFBLENBQUEsWUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsb0JBQUEsZ0JBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxnQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsZ0NBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxnQ0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLGdDQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0EsZ0NBQUEsQ0FBQSxRQUFBLENBQUEsU0FBQSxFQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7OztBQUdBLHdCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsYUFBQSxDQUFBLEVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSx3QkFBQSxDQUFBLE9BQUEsQ0FBQSxnQkFBQSxFQUFBLGlCQUFBLENBQUEsQ0FBQTtBQUNBLHdCQUFBLENBQUEsYUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxXQUFBLENBQUEsUUFBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBOzs7QUFHQSxzQkFBQSxDQUFBLGdCQUFBLENBQUEsUUFBQSxFQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTs7O2FBR0E7OztBQUdBLHFCQUFBLGNBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSx3QkFBQSxDQUFBLE9BQUEsQ0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsRUFBQSxFQUFBLGlCQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsTUFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLEdBQUEsaUJBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsc0JBQUEsRUFBQSxDQUFBO2FBQ0E7OztBQUdBLGdCQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxxQkFBQSxPQUFBLEdBQUE7QUFDQSxzQkFBQSxFQUFBLENBQUE7QUFDQSxxQ0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO2FBQ0E7OztBQUdBLHFCQUFBLE1BQUEsR0FBQTtBQUNBLG9CQUFBLEtBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxFQUFBLEdBQUEsT0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHdCQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsndWkucm91dGVyJywgJ2ZzYVByZUJ1aWx0J10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICBcdHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcblx0fSk7XG5cbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSkge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IHVzZXIgPyB0b1N0YXRlLm5hbWUgOiAnbG9naW4nO1xuICAgICAgICAgICAgJHN0YXRlLmdvKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibG9nZ2VkIGluXCIpXG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS51c2VyLCBcImxvZ2dlZCBpblwiKVxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignTWFuYWdlckNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICR0aW1lb3V0KXtcblxuXHQvLyBOYXZiYXJcblx0Ly8gJHNjb3BlLm5hdmJhckV4cGFuZCA9IGZhbHNlO1xuXHRcblx0Ly8gQ29sbGVjdGlvbiBQYW5lbFxuXHQkc2NvcGUuY29sbGVjdGlvbk9wZW4gPSBmYWxzZTtcblx0XG5cdFxuXHQkcm9vdFNjb3BlLiRicm9hZGNhc3QoXCJjb2xsZWN0aW9uT3BlblwiLCAkc2NvcGUubmF2YmFyRXhwYW5kKVxuXG5cdC8vQ29sbGFwc2UgQWxsXG5cdCRzY29wZS5jb2xsYXBzZVRvcCA9IGZ1bmN0aW9uKCl7XG5cdFx0JHNjb3BlLmNvbGxlY3Rpb25PcGVuID0gZmFsc2U7XG5cdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdCRzY29wZS5uYXZiYXJFeHBhbmQgPSBmYWxzZTtcblx0XHR9LCAyMDApO1xuXHR9XG5cblx0Ly8gQWN0dWFsIGNvbGxlY3Rpb25cblx0JHNjb3BlLmNvbGxlY3Rpb24gPSBbXTtcblx0XG5cblx0JHNjb3BlLiRvbignY29sbGVjdGlvblRvZ2dsZWQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvZ2dsZSkge1xuXHRcdCRzY29wZS5jb2xsZWN0aW9uT3BlbiA9IHRvZ2dsZTtcblx0fSk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaGl0IGNvbnRyb2xsZXJcIilcbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCd3ZWxjb21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ01vZGVsJywgZnVuY3Rpb24oJGh0dHApe1xuXG5cdC8vIEN1cnJlbnRseSBSZW5kZXJlZCBPYmplY3Rcblx0dmFyIHJlbmRlck9iaiA9IHtcblx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0Y3JlYXRvcjogJ01hcnkgQW5uZSdcblx0fTtcblxuXG5cdC8vIE1vZGVsIENvbnN0cnVjdG9yXG5cdGZ1bmN0aW9uIE1vZGVsIChwcm9wcykge1xuXHRcdGFuZ3VsYXIuZXh0ZW5kKHRoaXMsIHByb3BzKTtcblx0fTtcblxuXHRNb2RlbC51cmwgPSAnYXBpL3Byb2R1Y3QnXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNb2RlbC5wcm90b3R5cGUsICd1cmwnLCB7XG5cdFx0Z2V0OiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gTW9kZWwudXJsICsgdGhpcy5faWQ7XG5cdFx0fVxuXHR9KTtcblxuXG5cdC8vIExpc3RpbmcgRnVuY3Rpb25hbGl0eVxuXHRNb2RlbC5wcm90b3R5cGUuZmV0Y2ggPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiAkaHR0cC5nZXQodGhpcy51cmwpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuXHRcdFx0cmV0dXJuIG5ldyBNb2RlbChyZXMuZGF0YSk7XG5cdFx0fSk7XG5cdH1cblxuXHRNb2RlbC5mZXRjaEFsbCA9IGZ1bmN0aW9uKCl7XG5cdFx0Ly8gcmV0dXJuICRodHBwLmdldChNb2RlbC51cmwpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcblx0XHQvLyBcdHJldHVybiByZXMuZGF0YS5tYXAoZnVuY3Rpb24gKG9iaikge1xuXHRcdC8vIFx0XHRyZXR1cm4gbmV3IE1vZGVsKG9iaik7XG5cdFx0Ly8gXHR9KTtcblx0XHQvLyB9KTtcblx0XHRjb25zb2xlLmxvZygpO1xuXHRcdHJldHVybiBbXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH1dO1xuXG5cdH1cblxuXG5cdC8vIFJlbmRlcmVyIEZ1bmN0aW9uYWxpdHlcblx0TW9kZWwuY2hhbmdlTW9kZWxVcmwgPSBmdW5jdGlvbiAobmV3VXJsKSB7XG5cdFx0cmVuZGVyT2JqLm1vZGVsRmlsZVVybCA9IG5ld1VybDtcblx0XHRyZXR1cm4gcmVuZGVyT2JqO1xuXHR9O1xuXHRNb2RlbC5jaGFuZ2VNb2RlbCA9IGZ1bmN0aW9uICgpIHtcblx0XHQvLyBUZW1wIGF0dHJpYnV0ZXMgZm9yIHRlc3Rpbmdcblx0XHRyZW5kZXJPYmogPSB7XG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInXG5cdFx0fVxuXHR9O1xuXHRNb2RlbC5nZXRNb2RlbFVybCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gcmVuZGVyT2JqLm1vZGVsRmlsZVVybDtcblx0fTtcblx0TW9kZWwuZ2V0TW9kZWwgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHJlbmRlck9iajtcblx0fTtcblxuXG5cblx0cmV0dXJuIE1vZGVsO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ25VcCcsIHtcbiAgICAgICAgdXJsOiAnL3NpZ251cCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc2lnbi11cC9zaWduLXVwLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnU2lnblVwQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdTaWduVXBDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgU2lnblVwLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZFNpZ25VcCA9IGZ1bmN0aW9uIChzaWduVXBJbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBTaWduVXAuc2lnbnVwKHNpZ25VcEluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdsaXN0aW5nJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcbiAgICBcbiAgICAkc2NvcGUuZ2V0VXNlcnMgPSBmdW5jdGlvbigpe1xuICAgICAgICBTaWduVXAuZ2V0VXNlcnMoKS50aGVuKGZ1bmN0aW9uKHVzZXJzKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHVzZXJzKVxuICAgICAgICB9KVxuICAgIH1cblxufSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1VwbG9hZENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUpe1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKXtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VwbG9hZCcsIHtcblx0XHR1cmw6ICcvdXBsb2FkJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3VwbG9hZC91cGxvYWQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VwbG9hZENvbnRyb2xsZXInXG5cdH0pO1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignVXNlckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlKXtcblxuXG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VzZXInLCB7XG5cdFx0dXJsOiAnL3VzZXIvOmlkJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9icm93c2VyL2pzL3VzZXIvdXNlci5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnVXNlckNvbnRyb2xsZXInLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdHVzZXI6IGZ1bmN0aW9uIChVc2VyLCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0dmFyIHVzZXIgPSBuZXcgVXNlcih7X2lkOiAkc3RhdGVQYXJhbXMuaWR9KTtcblx0XHRcdFx0cmV0dXJuIHVzZXIuZmV0Y2goKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdmaWVsZEZvY3VzJywgZnVuY3Rpb24oJHBhcnNlLCAkdGltZW91dCl7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdBJyxcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcblx0XHRcdHZhciBzdGF0dXMgPSAkcGFyc2UoYXR0cnMuZmllbGRGb2N1cyk7XG5cdFx0XHRzY29wZS4kd2F0Y2goc3RhdHVzLCBmdW5jdGlvbih2YWwpe1xuXHRcdFx0XHRjb25zb2xlLmxvZygnc3RhdHVzID0gJywgdmFsKTtcblx0XHRcdFx0aWYgKHZhbCA9PT0gdHJ1ZSl7XG5cdFx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcdGVsZW1lbnRbMF0uZm9jdXMoKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH1cblx0fVxufSkiLCJcbmFwcC5mYWN0b3J5KCdTaWduVXAnLCBmdW5jdGlvbiAoJGh0dHAsICRzdGF0ZSwgJGxvY2F0aW9uKSB7XG5cdHJldHVybntcblx0XHRzaWdudXA6IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCdhcGkvdXNlcicsIGNyZWRlbnRpYWxzKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcblx0XHRcdGNvbnNvbGUubG9nKHJlcy5kYXRhKVxuXHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdH0pO1xuXHRcdH0sXG5cbiAgICAgICAgZ2V0VXNlcnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCdhcGkvdXNlcicpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXHR9XG59KTtcblxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd3ZWxjb21lJywge1xuICAgICAgICB1cmw6ICcvd2VsY29tZScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvd2VsY29tZS93ZWxjb21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnV2VsY29tZUN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignV2VsY29tZUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsJHRpbWVvdXQpIHtcblx0JHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkc3RhdGUuZ28oJ2xpc3RpbmcnKTtcbiAgICAgIH0sIDMwMDApO1xuXG59KTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdjb2xsZWN0aW9uJywgZnVuY3Rpb24oKXtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tcG9uZW50cy9jb2xsZWN0aW9uL2NvbGxlY3Rpb24uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ01hbmFnZXJDb250cm9sbGVyJ1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbi8vIGFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgpIHtcbi8vIFx0cmV0dXJuIHtcbi8vIFx0XHRyZXN0cmljdDogXCJFXCIsXG4vLyBcdFx0dGVtcGxhdGVVcmw6IFwianMvY29tcG9uZW50cy9uYXZiYXIvbmF2YmFyLmh0bWxcIixcbi8vIFx0XHRjb250cm9sbGVyOiAnTWFuYWdlckNvbnRyb2xsZXInXG4vLyBcdH1cbi8vIH0pO1xuXG5cbmFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbXBvbmVudHMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgJHRpbWVvdXQpIHtcbiAgICAgICAgICAgIFxuICAgICAgICBcdC8vIENvbGxlY3Rpb24gUGFuZWxcbiAgICAgICAgXHQkc2NvcGUuY29sbGVjdGlvbk9wZW4gPSBmYWxzZTtcbiAgICAgICAgXHQkc2NvcGUuY29sbGVjdGlvblRvZ2dsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuY29sbGVjdGlvbk9wZW4gPSAhJHNjb3BlLmNvbGxlY3Rpb25PcGVuO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChcImNvbGxlY3Rpb25Ub2dnbGVkXCIsICRzY29wZS5jb2xsZWN0aW9uT3BlbilcbiAgICAgICAgXHR9XG4gICAgICAgICAgICAkc2NvcGUuY29sbGVjdGlvbiA9IFtdO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkc2NvcGUuJG9uKCdjb2xsZWN0aW9uT3BlbicsIGZ1bmN0aW9uKGV2ZW50LCBleHBhbmRlZCl7XG4gICAgICAgICAgICAgICAgJHNjb3BlLm5hdmJhckV4cGFuZCA9IGV4cGFuZGVkO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICRzY29wZS5sb2dnZWRJbiA9IGZhbHNlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkc2NvcGUuaXRlbXNIaWRlID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdTaWduIEluJywgc3RhdGU6ICdsb2dpbicsIGF1dGg6IHRydWUgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnU2lnbiBVcCcsIHN0YXRlOiAnc2lnblVwJywgYXV0aDogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdDYXJ0Jywgc3RhdGU6ICdsaXN0aW5nJyB9LFxuICAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgJHNjb3BlLml0ZW1zU2hvdyA9IFtcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnVXBsb2FkIGEgTW9kZWwnLCBzdGF0ZTogJ3VwbG9hZCcsIGF1dGg6IHRydWUgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2FydCcsIHN0YXRlOiAnbGlzdGluZycgfSxcbiAgICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICRzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgJHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNpZ25lZCA9IEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwic2lnbmVkIGluID1cIiArIHNpZ25lZClcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUudXNlcilcbiAgICAgICAgICAgICAgICAkc2NvcGUubG9nZ2VkSW4gPSBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAkc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2dnZWRJbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbGlzdGluZycpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgJHNjb3BlLmNoZWNrID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUubG9nZ2VkSW4sXCJ5ZWFoXCIpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgIC8vIHJvdXRlIHRvIGhhbmRsZSBPYXV0aFxuICAgLy8gJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgIC8vIH0pO1xufSk7XG5cblxuXG5hcHAuZGlyZWN0aXZlKCdvYXV0aEJ1dHRvbicsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHtcblx0XHRzY29wZToge1xuXHRcdFx0cHJvdmlkZXJOYW1lOiAnQCdcblx0XHR9LFxuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21wb25lbnRzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uaHRtbCdcblx0fVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdzZWFyY2hiYXInLCBmdW5jdGlvbiAoKXtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tcG9uZW50cy9zZWFyY2hiYXIvc2VhcmNoYmFyLmh0bWwnXG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ0xpc3RpbmdDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbW9kZWxzLCBNb2RlbCkge1xuXG4gICAgJHNjb3BlLmNoYW5nZU1vZGVsID0gZnVuY3Rpb24oKXtcbiAgICBcdGNvbnNvbGUubG9nKCRzY29wZS5tb2RlbHMpO1xuICAgIFx0TW9kZWwuY2hhbmdlTW9kZWwoKTtcbiAgICB9XG5cbiAgICAkc2NvcGUubW9kZWxzID0gbW9kZWxzO1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoIGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKXtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGlzdGluZycsIHtcblx0XHR1cmw6ICcvJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvbGlzdGluZy9saXN0aW5nLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdMaXN0aW5nQ29udHJvbGxlcicsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0bW9kZWxzOiBmdW5jdGlvbiAoTW9kZWwpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coTW9kZWwuZmV0Y2hBbGwoKSk7XG5cdFx0XHRcdHJldHVybiBNb2RlbC5mZXRjaEFsbCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1JlbmRlckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBNb2RlbCkge1xuXG5cdCRzY29wZS5tb2RlbCA9IE1vZGVsLmdldE1vZGVsKCk7XG5cdFxuXHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIE1vZGVsLmdldE1vZGVsVXJsKClcblx0fSwgZnVuY3Rpb24gKG5ld1ZhbCwgb2xkVmFsKXtcblx0XHQkc2NvcGUubW9kZWwgPSBNb2RlbC5nZXRNb2RlbCgpOyBcblx0fSk7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnbmdXZWJnbCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIG1vZGVsOiAnPW1vZGVsRmlsZVVybCdcbiAgICAgIH0sXG4gICAgICBjb250cm9sbGVyOiBcIlJlbmRlckNvbnRyb2xsZXJcIixcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cikge1xuXG4gICAgICAgIC8vIFNldHVwIHNlbGVjdGlvbnNcbiAgICAgICAgc2NvcGUucmVuZGVyRnJhbWUgPSAkKCcjcmVuZGVyLWZyYW1lJyk7XG4gICAgICAgIHZhciByZW5kZXJGcmFtZVdpZHRoID0gc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKTtcbiAgICAgICAgdmFyIHJlbmRlckZyYW1lSGVpZ2h0ID0gc2NvcGUucmVuZGVyRnJhbWUuaGVpZ2h0KCk7XG4gICAgICAgIHZhciByZW5kZXJPYmplY3RTY2FsZU1vZGlmaWVyID0gcmVuZGVyRnJhbWVXaWR0aC8xMDI0O1xuXG4gICAgICAgIC8vIFNldHVwIFRIUkVFLmpzIHZhcmlhYmxlcyB3aXRoIHNjb3BlXG4gICAgICAgIHZhciBjYW1lcmE7XG4gICAgICAgICAgICBzY29wZS5jYW1lcmEgPSBjYW1lcmE7XG4gICAgICAgIHZhciBzY2VuZTtcbiAgICAgICAgICAgIHNjb3BlLnNjZW5lID0gc2NlbmU7XG4gICAgICAgIHZhciByZW5kZXJlcjtcbiAgICAgICAgICAgIHNjb3BlLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gICAgICAgIHZhciBwcmV2aW91cztcbiAgICAgICAgICAgIHNjb3BlLnByZXZpb3VzID0gcHJldmlvdXM7XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBzY2VuZVxuICAgICAgICBpbml0KCk7XG5cbiAgICAgICAgLy8gbG9hZCBkZWZhdWx0IG1vZGVsIG9uIHNjb3BlIC0tIGplZXAgbW9kZWwgLS0gdmlhIEFzc2ltcEpTT05Mb2FkZXJcbiAgICAgICAgdmFyIGxvYWRlcjIgPSBuZXcgVEhSRUUuT2JqZWN0TG9hZGVyKCk7XG4gICAgICAgIHZhciBsb2FkZXIzID0gbmV3IFRIUkVFLkpTT05Mb2FkZXIoKTtcblxuICAgICAgICAvLyBXYXRjaCBmb3IgY2hhbmdlcyB0byBzY29wZVxuICAgICAgICBzY29wZS4kd2F0Y2goJ21vZGVsLm1vZGVsRmlsZVVybCcsIGZ1bmN0aW9uIChuZXdWYWx1ZSwgb2xkVmFsdWUpe1xuICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgbG9hZE1vZGVsKG5ld1ZhbHVlKTsgXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyEhIEhhbmRsZSByZW1vdmluZyBvYmplY3QgYW5kIGFkZGluZyBuZXcgb2JqZWN0XG4gICAgICAgIGZ1bmN0aW9uIGxvYWRNb2RlbChtb2RVcmwpIHtcbiAgICAgICAgICAgIGxvYWRlcjIubG9hZChtb2RVcmwsIGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgICAgICAgb2JqZWN0LnNjYWxlLnggPSBvYmplY3Quc2NhbGUueSA9IG9iamVjdC5zY2FsZS56ID0gKC4wMjggKiByZW5kZXJPYmplY3RTY2FsZU1vZGlmaWVyKTtcbiAgICAgICAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnkgPSAuNTtcbiAgICAgICAgICAgICAgb2JqZWN0LnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgICAgICAgICBpZiAocHJldmlvdXMpIHNjZW5lLnJlbW92ZShwcmV2aW91cyk7XG4gICAgICAgICAgICAgIHNjZW5lLmFkZChvYmplY3QpO1xuXG4gICAgICAgICAgICAgIHByZXZpb3VzID0gb2JqZWN0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIC8vIHJ1biBsb2FkIG1vZGVsIG9uIGN1cnJlbnQgbW9kZWxVcmxcbiAgICAgICAgbG9hZE1vZGVsKHNjb3BlLm1vZGVsLm1vZGVsRmlsZVVybCk7XG4gICAgICAgIGFuaW1hdGUoKTtcblxuICAgICAgICAvLyBTZXR1cCBUSFJFRS5qcyBjYW1lcmFzLCBzY2VuZSwgcmVuZGVyZXIsIGxpZ2h0aW5nXG4gICAgICAgIGZ1bmN0aW9uIGluaXQoKXtcblxuICAgICAgICAgIC8vIENhbWVyYVxuICAgICAgICAgIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg1MCwgcmVuZGVyRnJhbWVXaWR0aCAvIHJlbmRlckZyYW1lSGVpZ2h0LCAxLCAyMDAwKTtcbiAgICAgICAgICBjYW1lcmEucG9zaXRpb24uc2V0KDIsNCw1KTtcblxuICAgICAgICAgIC8vIFNjZW5lXG4gICAgICAgICAgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbiAgICAgICAgICAvLyBzY2VuZS5mb2cgPSBuZXcgVEhSRUUuRm9nRXhwMigweDAwMDAwMCwgMC4wMDAxKTtcblxuICAgICAgICAgIC8vIExpZ2h0c1xuICAgICAgICAgIHNjZW5lLmFkZChuZXcgVEhSRUUuQW1iaWVudExpZ2h0KDB4Y2NjY2NjKSk7XG5cbiAgICAgICAgICB2YXIgZGlyZWN0aW9uYWxMaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4Y2NjY2NjKTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnggPSBNYXRoLnJhbmRvbSgpIC0gMC41O1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ueSA9IE1hdGgucmFuZG9tKCkgLSAwLjU7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi56ID0gTWF0aC5yYW5kb20oKSAtIDAuNTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgIHNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0KTtcblxuICAgICAgICAgIC8vISEhISBSZW5kZXJlclxuICAgICAgICAgIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoeyBhbnRpYWxpYXM6IHRydWUgfSk7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U2l6ZShyZW5kZXJGcmFtZVdpZHRoLCByZW5kZXJGcmFtZUhlaWdodCk7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvciggMHhmZmZmZmYgKTtcbiAgICAgICAgICBlbGVtZW50WzBdLmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgZm9yIFJlc2l6ZSBFdmVudFxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSwgZmFsc2UpO1xuXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coc2NlbmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIFJlc2l6ZVxuICAgICAgICBmdW5jdGlvbiBvbldpbmRvd1Jlc2l6ZShldmVudCl7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U2l6ZShzY29wZS5yZW5kZXJGcmFtZS53aWR0aCgpLCByZW5kZXJGcmFtZUhlaWdodCk7XG4gICAgICAgICAgY2FtZXJhLmFzcGVjdCA9IHNjb3BlLnJlbmRlckZyYW1lLndpZHRoKCkgLyByZW5kZXJGcmFtZUhlaWdodDtcbiAgICAgICAgICBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQW5pbWF0ZVxuICAgICAgICB2YXIgdCA9IDA7IC8vID9cbiAgICAgICAgZnVuY3Rpb24gYW5pbWF0ZSgpIHsgICAgICAgICAgXG4gICAgICAgICAgcmVuZGVyKCk7XG4gICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIHJlLVJlbmRlcmluZyBvZiBzY2VuZSBmb3Igc3Bpbm5pbmdcbiAgICAgICAgZnVuY3Rpb24gcmVuZGVyKCl7IFxuICAgICAgICAgIHZhciB0aW1lciA9IERhdGUubm93KCkgKiAwLjAwMDE1O1xuICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnggPSBNYXRoLmNvcyh0aW1lcikgKiAxMDtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi55ID0gNDtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi56ID0gTWF0aC5zaW4odGltZXIpICogOC41O1xuICAgICAgICAgICAgY2FtZXJhLmxvb2tBdChzY2VuZS5wb3NpdGlvbik7XG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=