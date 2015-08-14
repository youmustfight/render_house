'use strict';
var app = angular.module('FullstackGeneratedApp', ['ui.router', 'fsaPreBuilt']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
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
// 'use strict';

// var app = angular.module('renderhouse', ['ui.router']);

// app.config(function ($urlRouterProvider, $locationProvider){
// 	$locationProvider.html5Mode(true);
// 	$urlRouterProvider.otherwise('/');
// });
app.config(function ($stateProvider) {

    // Register our *about* state.
    $stateProvider.state('about', {
        url: '/about',
        controller: 'AboutController',
        templateUrl: 'js/about/about.html'
    });
});

app.controller('AboutController', function ($scope, FullstackPics) {

    // Images of beautiful Fullstack people.
    $scope.images = _.shuffle(FullstackPics);
});
app.config(function ($stateProvider) {
    $stateProvider.state('docs', {
        url: '/docs',
        templateUrl: 'js/docs/docs.html'
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
            Session.create(data.id, data.user);
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

/* global app */
app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html'
    });
});

'use strict';

app.controller('HomeController', function ($scope, RenderService) {

    $scope.changeModelUrl = function (newUrl) {
        RenderService.changeModelUrl(newUrl);
    };
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

        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go('home');
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

app.factory('Product', function ($http) {});
'use strict';

app.controller('RenderController', function ($scope, RenderService) {

    $scope.modelUrl = RenderService.getModelUrl();

    $scope.$watch(function () {
        return RenderService.getModelUrl();
    }, function (newVal, oldVal) {
        if (newVal != oldVal) $scope.modelUrl = RenderService.getModelUrl();
    });
});
'use strict';

app.directive('ngWebgl', function () {
    return {
        restrict: 'E',
        scope: {
            modelUrl: '=modelUrl'
        },
        link: function link(scope, element, attr) {

            // Setup selections
            scope.renderFrame = $('#render-frame');
            var renderFrameWidth = scope.renderFrame.width();
            var renderFrameHeight = scope.renderFrame.height();

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
            // var loader1 = new THREE.AssimpJSONLoader();
            var loader2 = new THREE.ObjectLoader();
            var loader3 = new THREE.JSONLoader();

            // Watch for changes to scope
            scope.$watch('modelUrl', function (newValue, oldValue) {
                // console.log(newValue);
                // console.log(scope.renderFrame[0]);
                // console.log(element);
                if (newValue != oldValue) {
                    loadModel(newValue);
                }
            });

            //!! Handle removing object and adding new object
            function loadModel(modUrl) {
                loader2.load(modUrl, function (object) {
                    object.scale.x = object.scale.y = object.scale.z = .022;
                    object.position.y = .5;
                    object.updateMatrix();
                    if (previous) scene.remove(previous);
                    scene.add(object);

                    previous = object;
                });
            }

            // run load model on current modelUrl
            loadModel(scope.modelUrl);
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
'use strict';

app.factory('RenderService', function () {

    var renderObj = {
        url: 'models/untitled-scene/untitled-scene.json'
    };

    return {
        changeModelUrl: function changeModelUrl(newUrl) {
            renderObj.url = newUrl;
            return renderObj.url;
        },
        getModelUrl: function getModelUrl() {
            return renderObj.url;
        }
    };
});
app.config(function ($stateProvider) {

    $stateProvider.state('signUp', {
        url: '/signup',
        templateUrl: 'js/sign-up/signUp.html',
        controller: 'SignUpCtrl'
    });
});

app.controller('SignUpCtrl', function ($scope, SignUp, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendSignUp = function (signUpInfo) {

        $scope.error = null;

        SignUp.signup(signUpInfo).then(function () {
            $state.go('home');
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

app.factory('FullstackPics', function () {
    return ['https://pbs.twimg.com/media/B7gBXulCAAAXQcE.jpg:large', 'https://fbcdn-sphotos-c-a.akamaihd.net/hphotos-ak-xap1/t31.0-8/10862451_10205622990359241_8027168843312841137_o.jpg', 'https://pbs.twimg.com/media/B-LKUshIgAEy9SK.jpg', 'https://pbs.twimg.com/media/B79-X7oCMAAkw7y.jpg', 'https://pbs.twimg.com/media/B-Uj9COIIAIFAh0.jpg:large', 'https://pbs.twimg.com/media/B6yIyFiCEAAql12.jpg:large', 'https://pbs.twimg.com/media/CE-T75lWAAAmqqJ.jpg:large', 'https://pbs.twimg.com/media/CEvZAg-VAAAk932.jpg:large', 'https://pbs.twimg.com/media/CEgNMeOXIAIfDhK.jpg:large', 'https://pbs.twimg.com/media/CEQyIDNWgAAu60B.jpg:large', 'https://pbs.twimg.com/media/CCF3T5QW8AE2lGJ.jpg:large', 'https://pbs.twimg.com/media/CAeVw5SWoAAALsj.jpg:large', 'https://pbs.twimg.com/media/CAaJIP7UkAAlIGs.jpg:large', 'https://pbs.twimg.com/media/CAQOw9lWEAAY9Fl.jpg:large', 'https://pbs.twimg.com/media/B-OQbVrCMAANwIM.jpg:large', 'https://pbs.twimg.com/media/B9b_erwCYAAwRcJ.png:large', 'https://pbs.twimg.com/media/B5PTdvnCcAEAl4x.jpg:large', 'https://pbs.twimg.com/media/B4qwC0iCYAAlPGh.jpg:large', 'https://pbs.twimg.com/media/B2b33vRIUAA9o1D.jpg:large', 'https://pbs.twimg.com/media/BwpIwr1IUAAvO2_.jpg:large', 'https://pbs.twimg.com/media/BsSseANCYAEOhLw.jpg:large', 'https://pbs.twimg.com/media/CJ4vLfuUwAAda4L.jpg:large', 'https://pbs.twimg.com/media/CI7wzjEVEAAOPpS.jpg:large', 'https://pbs.twimg.com/media/CIdHvT2UsAAnnHV.jpg:large', 'https://pbs.twimg.com/media/CGCiP_YWYAAo75V.jpg:large', 'https://pbs.twimg.com/media/CIS4JPIWIAI37qu.jpg:large'];
});

app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.', 'こんにちは、ユーザー様。', 'Welcome. To. WEBSITE.', ':D', 'Yes, I think we\'ve met before.'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});

app.factory('SignUp', function ($http, $state, $location) {
    return {
        signup: function signup(credentials) {
            return $http.post('api/user', credentials).then(function (res) {
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

'use strict';

app.controller('RenderController', function ($scope, RenderService) {

    $scope.modelUrl = RenderService.getModelUrl();

    $scope.$watch(function () {
        return RenderService.getModelUrl();
    }, function (newVal, oldVal) {
        if (newVal != oldVal) $scope.modelUrl = RenderService.getModelUrl();
    });
});
'use strict';

app.directive('ngWebgl', function () {
    return {
        restrict: 'E',
        scope: {
            modelUrl: '=modelUrl'
        },
        link: function link(scope, element, attr) {

            // Setup selections
            scope.renderFrame = $('#render-frame');
            var renderFrameWidth = scope.renderFrame.width();
            var renderFrameHeight = scope.renderFrame.height();

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
            // var loader1 = new THREE.AssimpJSONLoader();
            var loader2 = new THREE.ObjectLoader();
            var loader3 = new THREE.JSONLoader();

            // Watch for changes to scope
            scope.$watch('modelUrl', function (newValue, oldValue) {
                // console.log(newValue);
                // console.log(scope.renderFrame[0]);
                // console.log(element);
                if (newValue != oldValue) {
                    loadModel(newValue);
                }
            });

            //!! Handle removing object and adding new object
            function loadModel(modUrl) {
                loader2.load(modUrl, function (object) {
                    object.scale.x = object.scale.y = object.scale.z = .022;
                    object.position.y = .5;
                    object.updateMatrix();
                    if (previous) scene.remove(previous);
                    scene.add(object);

                    previous = object;
                });
            }

            // run load model on current modelUrl
            loadModel(scope.modelUrl);
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
'use strict';

app.factory('RenderService', function () {

    var renderObj = {
        url: 'models/untitled-scene/untitled-scene.json'
    };

    return {
        changeModelUrl: function changeModelUrl(newUrl) {
            renderObj.url = newUrl;
            return renderObj.url;
        },
        getModelUrl: function getModelUrl() {
            return renderObj.url;
        }
    };
});
'use strict';

app.controller('ProductListCtrl', function ($scope) {});
'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('products', {
        url: '/products',
        templateUrl: '/browser/app/product/list/product.list.html',
        controller: 'ProductListCtrl',
        resolve: {
            stories: function stories(Product) {
                return Product.fetchAll();
            },
            users: function users(User) {
                return User.fetchAll();
            }
        }
    });
});
'use strict';

app.controller('ProductDetailCtrl', function ($scope) {});
'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('product', {
        url: '/product/:id',
        templateUrl: '/browser/app/product/detail/product.detail.html',
        controller: 'ProductDetailCtrl',
        resolve: {
            story: function story(Product, $stateParams) {
                var story = new Product({ _id: $stateParams.id });
                return product.fetch();
            },
            users: function users(User) {
                return User.fetchAll();
            }
        }
    });
});
'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('user', {
        url: '/users/:id',
        templateUrl: '/browser/app/user/detail/user.detail.html',
        controller: 'UserDetailCtrl',
        resolve: {
            user: function user(User, $stateParams) {
                var user = new User({ _id: $stateParams.id });
                return user.fetch();
            }
        }
    });
});
'use strict';

app.controller('UserItemCtrl', function ($scope, $state) {});
'use strict';

app.directive('userItem', function ($state) {
    return {
        restrict: 'E',
        templateUrl: '/browser/app/user/item/user.item.html',
        scope: {
            user: '=model',
            glyphicon: '@',
            iconClick: '&'
        },
        controller: 'UserItemCtrl'
    };
});
'use strict';

app.controller('UserListCtrl', function ($scope, users, User) {});
'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('users', {
        url: '/users',
        templateUrl: '/browser/app/user/list/user.list.html',
        controller: 'UserListCtrl'
    });
});
app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
});
'use strict';

app.directive('focusMe', function ($parse, $timeout) {
    return {
        restrict: 'A',
        link: function link(scope, element, attrs) {
            var status = $parse(attrs.focusMe);
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
// app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

//     return {
//         restrict: 'E',
//         scope: {},
//         templateUrl: 'js/common/directives/navbar/navbar.html',
//         link: function (scope) {

//             scope.items = [
//                 { label: 'Home', state: 'home' },
//                 { label: 'About', state: 'about' },
//                 { label: 'Documentation', state: 'docs' },
//                 { label: 'Members Only', state: 'membersOnly', auth: true }
//             ];

//             scope.user = null;

//             scope.isLoggedIn = function () {
//                 return AuthService.isAuthenticated();
//             };

//             scope.logout = function () {
//                 AuthService.logout().then(function () {
//                    $state.go('home');
//                 });
//             };

//             var setUser = function () {
//                 AuthService.getLoggedInUser().then(function (user) {
//                     scope.user = user;
//                 });
//             };

//             var removeUser = function () {
//                 scope.user = null;
//             };

//             setUser();

//             $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
//             $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
//             $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);

//         }

//     };

// });

'use strict';

app.directive('navbar', function () {
    return {
        restrict: "E",
        templateUrl: "js/common/directives/navbar/navbar.html"
    };
});

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
'use strict';

app.directive('searchbar', function () {
    return {
        restrict: 'E',
        templateUrl: '../browser/components/searchbar/searchbar.html'
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiZG9jcy9kb2NzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJwcm9kdWN0cy9wcm9kdWN0LmZhY3RvcnkuanMiLCJyZW5kZXIvcmVuZGVyLmNvbnRyb2xsZXIuanMiLCJyZW5kZXIvcmVuZGVyLmRpcmVjdGl2ZS5qcyIsInJlbmRlci9yZW5kZXIuZmFjdG9yeS5qcyIsInNpZ24tdXAvc2lnblVwLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9GdWxsc3RhY2tQaWNzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZmFjdG9yaWVzL3NpZ24tdXAtZmFjdG9yeS5qcyIsImNvbW1vbi9yZW5kZXIvcmVuZGVyLmNvbnRyb2xsZXIuanMiLCJjb21tb24vcmVuZGVyL3JlbmRlci5kaXJlY3RpdmUuanMiLCJjb21tb24vcmVuZGVyL3JlbmRlci5mYWN0b3J5LmpzIiwicHJvZHVjdHMvcHJvZHVjdGxpc3QvcHJvZHVjdC5saXN0LmNvbnRyb2xsZXIuanMiLCJwcm9kdWN0cy9wcm9kdWN0bGlzdC9wcm9kdWN0Lmxpc3Quc3RhdGUuanMiLCJwcm9kdWN0cy9zaW5nbGVwcm9kdWN0L3Byb2R1Y3QuZGV0YWlsLmNvbnRyb2xsZXIuanMiLCJwcm9kdWN0cy9zaW5nbGVwcm9kdWN0L3Byb2R1Y3QuZGV0YWlsLnN0YXRlLmpzIiwidXNlci9kZXRhaWwvdXNlci5kZXRhaWwuc3RhdGUuanMiLCJ1c2VyL2l0ZW0vdXNlci5pdGVtLmNvbnRyb2xsZXIuanMiLCJ1c2VyL2l0ZW0vdXNlci5pdGVtLmRpcmVjdGl2ZS5qcyIsInVzZXIvbGlzdC91c2VyLmxpc3QuY29udHJvbGxlci5qcyIsInVzZXIvbGlzdC91c2VyLmxpc3Quc3RhdGUuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2ZpZWxkLWZvY3VzL2ZpZWxkRm9jdXMuZGlyZWN0aXZlLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc2VhcmNoYmFyL3NlYXJjaGJhci5kaXJlY3RpdmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBQSxDQUFBO0FBQ0EsSUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsV0FBQSxFQUFBLGFBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQTs7QUFFQSxxQkFBQSxDQUFBLFNBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTs7QUFFQSxzQkFBQSxDQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7O0FBR0EsR0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOzs7QUFHQSxRQUFBLDRCQUFBLEdBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLElBQUEsSUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsQ0FBQTtLQUNBLENBQUE7Ozs7QUFJQSxjQUFBLENBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBOztBQUVBLFlBQUEsQ0FBQSw0QkFBQSxDQUFBLE9BQUEsQ0FBQSxFQUFBOzs7QUFHQSxtQkFBQTtTQUNBOztBQUVBLFlBQUEsV0FBQSxDQUFBLGVBQUEsRUFBQSxFQUFBOzs7QUFHQSxtQkFBQTtTQUNBOzs7QUFHQSxhQUFBLENBQUEsY0FBQSxFQUFBLENBQUE7O0FB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QUNBLENBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxFQUFBLEVBQUE7O0FBRUEsaUJBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBOzs7O0FBSUEsWUFBQSxDQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUE7Ozs7Ozs7Ozs7QUFVQSxnQkFBQSxJQUFBLENBQUEsZUFBQSxFQUFBLElBQUEsVUFBQSxLQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO2FBQ0E7Ozs7O0FBS0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUVBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQ0EsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSw0QkFBQSxFQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7QUFDQSwwQkFBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUEsYUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBO0tBRUEsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQTs7QUFFQSxZQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGNBQUEsRUFBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsRUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxnQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxFQUFBLENBQUE7OztBQ25JQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLG1CQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLGNBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNoQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsUUFBQTtBQUNBLG1CQUFBLEVBQUEscUJBQUE7QUFDQSxrQkFBQSxFQUFBLFdBQUE7S0FDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsS0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7O0FBRUEsY0FBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsbUJBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQzNCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxlQUFBO0FBQ0EsZ0JBQUEsRUFBQSxtRUFBQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7OztBQUdBLFlBQUEsRUFBQTtBQUNBLHdCQUFBLEVBQUEsSUFBQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFFBQUEsUUFBQSxHQUFBLFNBQUEsUUFBQSxHQUFBO0FBQ0EsZUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLDJCQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxtQkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxRQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQy9CQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsRUFPQSxDQUFBLENBQUE7QUNUQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLGFBQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsTUFBQSxDQUFBLFlBQUE7QUFBQSxlQUFBLGFBQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtLQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsWUFBQSxNQUFBLElBQUEsTUFBQSxFQUFBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsYUFBQSxDQUFBLFdBQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDVkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsU0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBO0FBQ0Esb0JBQUEsRUFBQSxXQUFBO1NBQ0E7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQTs7O0FBR0EsaUJBQUEsQ0FBQSxXQUFBLEdBQUEsQ0FBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBO0FBQ0EsZ0JBQUEsZ0JBQUEsR0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBO0FBQ0EsZ0JBQUEsaUJBQUEsR0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsRUFBQSxDQUFBOzs7QUFHQSxnQkFBQSxNQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxnQkFBQSxLQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxnQkFBQSxRQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLFFBQUEsR0FBQSxRQUFBLENBQUE7QUFDQSxnQkFBQSxRQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLFFBQUEsR0FBQSxRQUFBLENBQUE7OztBQUdBLGdCQUFBLEVBQUEsQ0FBQTs7OztBQUlBLGdCQUFBLE9BQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtBQUNBLGdCQUFBLE9BQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxVQUFBLEVBQUEsQ0FBQTs7O0FBR0EsaUJBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxFQUFBLFVBQUEsUUFBQSxFQUFBLFFBQUEsRUFBQTs7OztBQUlBLG9CQUFBLFFBQUEsSUFBQSxRQUFBLEVBQUE7QUFDQSw2QkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO2lCQUNBO2FBQ0EsQ0FBQSxDQUFBOzs7QUFHQSxxQkFBQSxTQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsMEJBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLDBCQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSwwQkFBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO0FBQ0Esd0JBQUEsUUFBQSxFQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSx5QkFBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTs7QUFFQSw0QkFBQSxHQUFBLE1BQUEsQ0FBQTtpQkFDQSxDQUFBLENBQUE7YUFDQTs7O0FBR0EscUJBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxFQUFBLENBQUE7OztBQUdBLHFCQUFBLElBQUEsR0FBQTs7O0FBR0Esc0JBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxpQkFBQSxDQUFBLEVBQUEsRUFBQSxnQkFBQSxHQUFBLGlCQUFBLEVBQUEsQ0FBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7OztBQUdBLHFCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7Ozs7QUFJQSxxQkFBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLEtBQUEsQ0FBQSxZQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsQ0FBQTs7QUFFQSxvQkFBQSxnQkFBQSxHQUFBLElBQUEsS0FBQSxDQUFBLGdCQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxnQ0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLGdDQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0EsZ0NBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxnQ0FBQSxDQUFBLFFBQUEsQ0FBQSxTQUFBLEVBQUEsQ0FBQTtBQUNBLHFCQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQTs7O0FBR0Esd0JBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLHdCQUFBLENBQUEsT0FBQSxDQUFBLGdCQUFBLEVBQUEsaUJBQUEsQ0FBQSxDQUFBO0FBQ0Esd0JBQUEsQ0FBQSxhQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLFdBQUEsQ0FBQSxRQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7OztBQUdBLHNCQUFBLENBQUEsZ0JBQUEsQ0FBQSxRQUFBLEVBQUEsY0FBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBOzs7YUFHQTs7O0FBR0EscUJBQUEsY0FBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLHdCQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsaUJBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxNQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLEVBQUEsR0FBQSxpQkFBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxzQkFBQSxFQUFBLENBQUE7YUFDQTs7O0FBR0EsZ0JBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHFCQUFBLE9BQUEsR0FBQTtBQUNBLHNCQUFBLEVBQUEsQ0FBQTtBQUNBLHFDQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7YUFDQTs7O0FBR0EscUJBQUEsTUFBQSxHQUFBO0FBQ0Esb0JBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLEVBQUEsR0FBQSxPQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0Esd0JBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUN0SEEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFlBQUE7O0FBRUEsUUFBQSxTQUFBLEdBQUE7QUFDQSxXQUFBLEVBQUEsMkNBQUE7S0FDQSxDQUFBOztBQUVBLFdBQUE7QUFDQSxzQkFBQSxFQUFBLHdCQUFBLE1BQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsR0FBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLG1CQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUE7U0FDQTtBQUNBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxtQkFBQSxTQUFBLENBQUEsR0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbEJBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7O0FBRUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLHdCQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOztBQUVBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGNBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQ2pDQSxHQUFBLENBQUEsT0FBQSxDQUFBLGVBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQSxDQUNBLHVEQUFBLEVBQ0EscUhBQUEsRUFDQSxpREFBQSxFQUNBLGlEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsQ0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQzdCQSxHQUFBLENBQUEsT0FBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTs7QUFFQSxRQUFBLGtCQUFBLEdBQUEsU0FBQSxrQkFBQSxDQUFBLEdBQUEsRUFBQTtBQUNBLGVBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxRQUFBLFNBQUEsR0FBQSxDQUNBLGVBQUEsRUFDQSx1QkFBQSxFQUNBLHNCQUFBLEVBQ0EsdUJBQUEsRUFDQSx5REFBQSxFQUNBLDBDQUFBLEVBQ0EsY0FBQSxFQUNBLHVCQUFBLEVBQ0EsSUFBQSxFQUNBLGlDQUFBLENBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0EsaUJBQUEsRUFBQSxTQUFBO0FBQ0EseUJBQUEsRUFBQSw2QkFBQTtBQUNBLG1CQUFBLGtCQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FDekJBLEdBQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsY0FBQSxFQUFBLGdCQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTs7QUFFQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSx1QkFBQSxRQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ2ZBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGtCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsYUFBQSxDQUFBLFdBQUEsRUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxNQUFBLENBQUEsWUFBQTtBQUFBLGVBQUEsYUFBQSxDQUFBLFdBQUEsRUFBQSxDQUFBO0tBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxZQUFBLE1BQUEsSUFBQSxNQUFBLEVBQUEsTUFBQSxDQUFBLFFBQUEsR0FBQSxhQUFBLENBQUEsV0FBQSxFQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNWQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxTQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUE7QUFDQSxvQkFBQSxFQUFBLFdBQUE7U0FDQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBOzs7QUFHQSxpQkFBQSxDQUFBLFdBQUEsR0FBQSxDQUFBLENBQUEsZUFBQSxDQUFBLENBQUE7QUFDQSxnQkFBQSxnQkFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7QUFDQSxnQkFBQSxpQkFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxFQUFBLENBQUE7OztBQUdBLGdCQUFBLE1BQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLGdCQUFBLEtBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLGdCQUFBLFFBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsUUFBQSxHQUFBLFFBQUEsQ0FBQTtBQUNBLGdCQUFBLFFBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsUUFBQSxHQUFBLFFBQUEsQ0FBQTs7O0FBR0EsZ0JBQUEsRUFBQSxDQUFBOzs7O0FBSUEsZ0JBQUEsT0FBQSxHQUFBLElBQUEsS0FBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO0FBQ0EsZ0JBQUEsT0FBQSxHQUFBLElBQUEsS0FBQSxDQUFBLFVBQUEsRUFBQSxDQUFBOzs7QUFHQSxpQkFBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLEVBQUEsVUFBQSxRQUFBLEVBQUEsUUFBQSxFQUFBOzs7O0FBSUEsb0JBQUEsUUFBQSxJQUFBLFFBQUEsRUFBQTtBQUNBLDZCQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7aUJBQ0E7YUFDQSxDQUFBLENBQUE7OztBQUdBLHFCQUFBLFNBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSwwQkFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLEdBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLEdBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLDBCQUFBLENBQUEsWUFBQSxFQUFBLENBQUE7QUFDQSx3QkFBQSxRQUFBLEVBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHlCQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBOztBQUVBLDRCQUFBLEdBQUEsTUFBQSxDQUFBO2lCQUNBLENBQUEsQ0FBQTthQUNBOzs7QUFHQSxxQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLEVBQUEsQ0FBQTs7O0FBR0EscUJBQUEsSUFBQSxHQUFBOzs7QUFHQSxzQkFBQSxHQUFBLElBQUEsS0FBQSxDQUFBLGlCQUFBLENBQUEsRUFBQSxFQUFBLGdCQUFBLEdBQUEsaUJBQUEsRUFBQSxDQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTs7O0FBR0EscUJBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQTs7OztBQUlBLHFCQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsS0FBQSxDQUFBLFlBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxDQUFBOztBQUVBLG9CQUFBLGdCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsZ0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLGdDQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0EsZ0NBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxnQ0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLGdDQUFBLENBQUEsUUFBQSxDQUFBLFNBQUEsRUFBQSxDQUFBO0FBQ0EscUJBQUEsQ0FBQSxHQUFBLENBQUEsZ0JBQUEsQ0FBQSxDQUFBOzs7QUFHQSx3QkFBQSxHQUFBLElBQUEsS0FBQSxDQUFBLGFBQUEsQ0FBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0Esd0JBQUEsQ0FBQSxPQUFBLENBQUEsZ0JBQUEsRUFBQSxpQkFBQSxDQUFBLENBQUE7QUFDQSx3QkFBQSxDQUFBLGFBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsV0FBQSxDQUFBLFFBQUEsQ0FBQSxVQUFBLENBQUEsQ0FB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LG1CQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0EsaUJBQUEsRUFBQSxlQUFBLE9BQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxvQkFBQSxLQUFBLEdBQUEsSUFBQSxPQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsWUFBQSxDQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxPQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7YUFDQTtBQUNBLGlCQUFBLEVBQUEsZUFBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxJQUFBLENBQUEsUUFBQSxFQUFBLENBQUE7YUFDQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDakJBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFlBQUE7QUFDQSxtQkFBQSxFQUFBLDJDQUFBO0FBQ0Esa0JBQUEsRUFBQSxnQkFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLGdCQUFBLEVBQUEsY0FBQSxJQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0Esb0JBQUEsSUFBQSxHQUFBLElBQUEsSUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLFlBQUEsQ0FBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsSUFBQSxDQUFBLEtBQUEsRUFBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ2RBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsRUFFQSxDQUFBLENBQUE7QUNKQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSx1Q0FBQTtBQUNBLGFBQUEsRUFBQTtBQUNBLGdCQUFBLEVBQUEsUUFBQTtBQUNBLHFCQUFBLEVBQUEsR0FBQTtBQUNBLHFCQUFBLEVBQUEsR0FBQTtTQUNBO0FBQ0Esa0JBQUEsRUFBQSxjQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ2JBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsSUFBQSxFQUFBLEVBRUEsQ0FBQSxDQUFBO0FDSkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsUUFBQTtBQUNBLG1CQUFBLEVBQUEsdUNBQUE7QUFDQSxrQkFBQSxFQUFBLGNBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNSQSxHQUFBLENBQUEsU0FBQSxDQUFBLGVBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEseURBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDTEEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLGdCQUFBLE1BQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxFQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0Esb0JBQUEsR0FBQSxLQUFBLElBQUEsRUFBQTtBQUNBLDRCQUFBLENBQUEsWUFBQTtBQUNBLCtCQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7cUJBQ0EsQ0FBQSxDQUFBO2lCQUNBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2dDQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLHlDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUN4REEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxlQUFBLEVBQUE7O0FBRUEsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEseURBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLFFBQUEsR0FBQSxlQUFBLENBQUEsaUJBQUEsRUFBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDVkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSxnREFBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWyd1aS5yb3V0ZXInLCAnZnNhUHJlQnVpbHQnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSkge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IHVzZXIgPyB0b1N0YXRlLm5hbWUgOiAnbG9naW4nO1xuICAgICAgICAgICAgJHN0YXRlLmdvKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgIC8vIFJlZ2lzdGVyIG91ciAqYWJvdXQqIHN0YXRlLlxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhYm91dCcsIHtcbiAgICAgICAgdXJsOiAnL2Fib3V0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Fib3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWJvdXQvYWJvdXQuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdBYm91dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBGdWxsc3RhY2tQaWNzKSB7XG5cbiAgICAvLyBJbWFnZXMgb2YgYmVhdXRpZnVsIEZ1bGxzdGFjayBwZW9wbGUuXG4gICAgJHNjb3BlLmltYWdlcyA9IF8uc2h1ZmZsZShGdWxsc3RhY2tQaWNzKTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2RvY3MvZG9jcy5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsIi8qIGdsb2JhbCBhcHAgKi9cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJ1xuICAgIH0pO1xufSk7XG5cbid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ0hvbWVDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUmVuZGVyU2VydmljZSkge1xuXG4gICAgJHNjb3BlLmNoYW5nZU1vZGVsVXJsID0gZnVuY3Rpb24obmV3VXJsKXtcbiAgICBcdFJlbmRlclNlcnZpY2UuY2hhbmdlTW9kZWxVcmwobmV3VXJsKTtcbiAgICB9XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1Byb2R1Y3QnLCBmdW5jdGlvbiAoJGh0dHApe1xuXG5cblxuXG5cblxufSkiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdSZW5kZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUmVuZGVyU2VydmljZSkge1xuXG5cdCRzY29wZS5tb2RlbFVybCA9IFJlbmRlclNlcnZpY2UuZ2V0TW9kZWxVcmwoKTtcblx0XG5cdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKXtyZXR1cm4gUmVuZGVyU2VydmljZS5nZXRNb2RlbFVybCgpfSwgZnVuY3Rpb24gKG5ld1ZhbCwgb2xkVmFsKXtcblx0ICAgIGlmKG5ld1ZhbCAhPSBvbGRWYWwpICRzY29wZS5tb2RlbFVybCA9IFJlbmRlclNlcnZpY2UuZ2V0TW9kZWxVcmwoKTtcblx0fSk7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnbmdXZWJnbCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIG1vZGVsVXJsOiAnPW1vZGVsVXJsJ1xuICAgICAgfSxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cikge1xuXG4gICAgICAgIC8vIFNldHVwIHNlbGVjdGlvbnNcbiAgICAgICAgc2NvcGUucmVuZGVyRnJhbWUgPSAkKCcjcmVuZGVyLWZyYW1lJyk7XG4gICAgICAgIHZhciByZW5kZXJGcmFtZVdpZHRoID0gc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKTtcbiAgICAgICAgdmFyIHJlbmRlckZyYW1lSGVpZ2h0ID0gc2NvcGUucmVuZGVyRnJhbWUuaGVpZ2h0KCk7XG5cbiAgICAgICAgLy8gU2V0dXAgVEhSRUUuanMgdmFyaWFibGVzIHdpdGggc2NvcGVcbiAgICAgICAgdmFyIGNhbWVyYTtcbiAgICAgICAgICAgIHNjb3BlLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgdmFyIHNjZW5lO1xuICAgICAgICAgICAgc2NvcGUuc2NlbmUgPSBzY2VuZTtcbiAgICAgICAgdmFyIHJlbmRlcmVyO1xuICAgICAgICAgICAgc2NvcGUucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICAgICAgdmFyIHByZXZpb3VzO1xuICAgICAgICAgICAgc2NvcGUucHJldmlvdXMgPSBwcmV2aW91cztcblxuICAgICAgICAvLyBpbml0aWFsaXplIHNjZW5lXG4gICAgICAgIGluaXQoKTtcblxuICAgICAgICAvLyBsb2FkIGRlZmF1bHQgbW9kZWwgb24gc2NvcGUgLS0gamVlcCBtb2RlbCAtLSB2aWEgQXNzaW1wSlNPTkxvYWRlclxuICAgICAgICAvLyB2YXIgbG9hZGVyMSA9IG5ldyBUSFJFRS5Bc3NpbXBKU09OTG9hZGVyKCk7XG4gICAgICAgIHZhciBsb2FkZXIyID0gbmV3IFRIUkVFLk9iamVjdExvYWRlcigpO1xuICAgICAgICB2YXIgbG9hZGVyMyA9IG5ldyBUSFJFRS5KU09OTG9hZGVyKCk7XG5cbiAgICAgICAgLy8gV2F0Y2ggZm9yIGNoYW5nZXMgdG8gc2NvcGVcbiAgICAgICAgc2NvcGUuJHdhdGNoKCdtb2RlbFVybCcsIGZ1bmN0aW9uIChuZXdWYWx1ZSwgb2xkVmFsdWUpe1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKG5ld1ZhbHVlKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhzY29wZS5yZW5kZXJGcmFtZVswXSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coZWxlbWVudCk7XG4gICAgICAgICAgaWYgKG5ld1ZhbHVlICE9IG9sZFZhbHVlKSB7XG4gICAgICAgICAgICBsb2FkTW9kZWwobmV3VmFsdWUpOyBcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vISEgSGFuZGxlIHJlbW92aW5nIG9iamVjdCBhbmQgYWRkaW5nIG5ldyBvYmplY3RcbiAgICAgICAgZnVuY3Rpb24gbG9hZE1vZGVsKG1vZFVybCkge1xuICAgICAgICAgICAgbG9hZGVyMi5sb2FkKG1vZFVybCwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgICBvYmplY3Quc2NhbGUueCA9IG9iamVjdC5zY2FsZS55ID0gb2JqZWN0LnNjYWxlLnogPSAuMDIyO1xuICAgICAgICAgICAgICBvYmplY3QucG9zaXRpb24ueSA9IC41O1xuICAgICAgICAgICAgICBvYmplY3QudXBkYXRlTWF0cml4KCk7XG4gICAgICAgICAgICAgIGlmIChwcmV2aW91cykgc2NlbmUucmVtb3ZlKHByZXZpb3VzKTtcbiAgICAgICAgICAgICAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgICAgICAgICAgICAgcHJldmlvdXMgPSBvYmplY3Q7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgLy8gcnVuIGxvYWQgbW9kZWwgb24gY3VycmVudCBtb2RlbFVybFxuICAgICAgICBsb2FkTW9kZWwoc2NvcGUubW9kZWxVcmwpO1xuICAgICAgICBhbmltYXRlKCk7XG5cbiAgICAgICAgLy8gU2V0dXAgVEhSRUUuanMgY2FtZXJhcywgc2NlbmUsIHJlbmRlcmVyLCBsaWdodGluZ1xuICAgICAgICBmdW5jdGlvbiBpbml0KCl7XG5cbiAgICAgICAgICAvLyBDYW1lcmFcbiAgICAgICAgICBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNTAsIHJlbmRlckZyYW1lV2lkdGggLyByZW5kZXJGcmFtZUhlaWdodCwgMSwgMjAwMCk7XG4gICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnNldCgyLDQsNSk7XG5cbiAgICAgICAgICAvLyBTY2VuZVxuICAgICAgICAgIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgICAgICAgLy8gc2NlbmUuZm9nID0gbmV3IFRIUkVFLkZvZ0V4cDIoMHgwMDAwMDAsIDAuMDAwMSk7XG5cbiAgICAgICAgICAvLyBMaWdodHNcbiAgICAgICAgICBzY2VuZS5hZGQobmV3IFRIUkVFLkFtYmllbnRMaWdodCgweGNjY2NjYykpO1xuXG4gICAgICAgICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGNjY2NjYyk7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi54ID0gTWF0aC5yYW5kb20oKSAtIDAuNTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnkgPSBNYXRoLnJhbmRvbSgpIC0gMC41O1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ueiA9IE1hdGgucmFuZG9tKCkgLSAwLjU7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5ub3JtYWxpemUoKTtcbiAgICAgICAgICBzY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodCk7XG5cbiAgICAgICAgICAvLyEhISEgUmVuZGVyZXJcbiAgICAgICAgICByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgYW50aWFsaWFzOiB0cnVlIH0pO1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUocmVuZGVyRnJhbWVXaWR0aCwgcmVuZGVyRnJhbWVIZWlnaHQpO1xuICAgICAgICAgIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoIDB4ZmZmZmZmICk7XG4gICAgICAgICAgZWxlbWVudFswXS5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgICAgICAgIC8vIENoZWNrIGZvciBSZXNpemUgRXZlbnRcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlKTtcblxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHNjZW5lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBSZXNpemVcbiAgICAgICAgZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoZXZlbnQpe1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKSwgcmVuZGVyRnJhbWVIZWlnaHQpO1xuICAgICAgICAgIGNhbWVyYS5hc3BlY3QgPSBzY29wZS5yZW5kZXJGcmFtZS53aWR0aCgpIC8gcmVuZGVyRnJhbWVIZWlnaHQ7XG4gICAgICAgICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFuaW1hdGVcbiAgICAgICAgdmFyIHQgPSAwOyAvLyA/XG4gICAgICAgIGZ1bmN0aW9uIGFuaW1hdGUoKSB7ICAgICAgICAgIFxuICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSByZS1SZW5kZXJpbmcgb2Ygc2NlbmUgZm9yIHNwaW5uaW5nXG4gICAgICAgIGZ1bmN0aW9uIHJlbmRlcigpeyBcbiAgICAgICAgICB2YXIgdGltZXIgPSBEYXRlLm5vdygpICogMC4wMDAxNTtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi54ID0gTWF0aC5jb3ModGltZXIpICogMTA7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueSA9IDQ7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueiA9IE1hdGguc2luKHRpbWVyKSAqIDguNTtcbiAgICAgICAgICAgIGNhbWVyYS5sb29rQXQoc2NlbmUucG9zaXRpb24pO1xuICAgICAgICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnUmVuZGVyU2VydmljZScsIGZ1bmN0aW9uKCl7XG5cblx0dmFyIHJlbmRlck9iaiA9IHtcblx0XHR1cmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbidcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0Y2hhbmdlTW9kZWxVcmw6IGZ1bmN0aW9uKG5ld1VybCl7XG5cdFx0XHRyZW5kZXJPYmoudXJsID0gbmV3VXJsO1xuXHRcdFx0cmV0dXJuIHJlbmRlck9iai51cmw7XG5cdFx0fSxcblx0XHRnZXRNb2RlbFVybDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiByZW5kZXJPYmoudXJsO1xuXHRcdH1cblx0fVxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ25VcCcsIHtcbiAgICAgICAgdXJsOiAnL3NpZ251cCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc2lnbi11cC9zaWduVXAuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaWduVXBDdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpZ25VcEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBTaWduVXAsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kU2lnblVwID0gZnVuY3Rpb24gKHNpZ25VcEluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIFNpZ25VcC5zaWdudXAoc2lnblVwSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuICAgIFxuICAgICRzY29wZS5nZXRVc2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIFNpZ25VcC5nZXRVc2VycygpLnRoZW4oZnVuY3Rpb24odXNlcnMpe1xuICAgICAgICAgICAgY29uc29sZS5sb2codXNlcnMpXG4gICAgICAgIH0pXG4gICAgfVxuXG59KTtcblxuIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLidcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsIlxuYXBwLmZhY3RvcnkoJ1NpZ25VcCcsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlLCAkbG9jYXRpb24pIHtcblx0cmV0dXJue1xuXHRcdHNpZ251cDogZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJ2FwaS91c2VyJywgY3JlZGVudGlhbHMpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuXHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdH0pO1xuXHRcdH0sXG5cbiAgICAgICAgZ2V0VXNlcnM6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCdhcGkvdXNlcicpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXHR9XG59KTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignUmVuZGVyQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFJlbmRlclNlcnZpY2UpIHtcblxuXHQkc2NvcGUubW9kZWxVcmwgPSBSZW5kZXJTZXJ2aWNlLmdldE1vZGVsVXJsKCk7XG5cdFxuXHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCl7cmV0dXJuIFJlbmRlclNlcnZpY2UuZ2V0TW9kZWxVcmwoKX0sIGZ1bmN0aW9uIChuZXdWYWwsIG9sZFZhbCl7XG5cdCAgICBpZihuZXdWYWwgIT0gb2xkVmFsKSAkc2NvcGUubW9kZWxVcmwgPSBSZW5kZXJTZXJ2aWNlLmdldE1vZGVsVXJsKCk7XG5cdH0pO1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ25nV2ViZ2wnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICBzY29wZToge1xuICAgICAgICBtb2RlbFVybDogJz1tb2RlbFVybCdcbiAgICAgIH0sXG4gICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQsIGF0dHIpIHtcblxuICAgICAgICAvLyBTZXR1cCBzZWxlY3Rpb25zXG4gICAgICAgIHNjb3BlLnJlbmRlckZyYW1lID0gJCgnI3JlbmRlci1mcmFtZScpO1xuICAgICAgICB2YXIgcmVuZGVyRnJhbWVXaWR0aCA9IHNjb3BlLnJlbmRlckZyYW1lLndpZHRoKCk7XG4gICAgICAgIHZhciByZW5kZXJGcmFtZUhlaWdodCA9IHNjb3BlLnJlbmRlckZyYW1lLmhlaWdodCgpO1xuXG4gICAgICAgIC8vIFNldHVwIFRIUkVFLmpzIHZhcmlhYmxlcyB3aXRoIHNjb3BlXG4gICAgICAgIHZhciBjYW1lcmE7XG4gICAgICAgICAgICBzY29wZS5jYW1lcmEgPSBjYW1lcmE7XG4gICAgICAgIHZhciBzY2VuZTtcbiAgICAgICAgICAgIHNjb3BlLnNjZW5lID0gc2NlbmU7XG4gICAgICAgIHZhciByZW5kZXJlcjtcbiAgICAgICAgICAgIHNjb3BlLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gICAgICAgIHZhciBwcmV2aW91cztcbiAgICAgICAgICAgIHNjb3BlLnByZXZpb3VzID0gcHJldmlvdXM7XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBzY2VuZVxuICAgICAgICBpbml0KCk7XG5cbiAgICAgICAgLy8gbG9hZCBkZWZhdWx0IG1vZGVsIG9uIHNjb3BlIC0tIGplZXAgbW9kZWwgLS0gdmlhIEFzc2ltcEpTT05Mb2FkZXJcbiAgICAgICAgLy8gdmFyIGxvYWRlcjEgPSBuZXcgVEhSRUUuQXNzaW1wSlNPTkxvYWRlcigpO1xuICAgICAgICB2YXIgbG9hZGVyMiA9IG5ldyBUSFJFRS5PYmplY3RMb2FkZXIoKTtcbiAgICAgICAgdmFyIGxvYWRlcjMgPSBuZXcgVEhSRUUuSlNPTkxvYWRlcigpO1xuXG4gICAgICAgIC8vIFdhdGNoIGZvciBjaGFuZ2VzIHRvIHNjb3BlXG4gICAgICAgIHNjb3BlLiR3YXRjaCgnbW9kZWxVcmwnLCBmdW5jdGlvbiAobmV3VmFsdWUsIG9sZFZhbHVlKXtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhuZXdWYWx1ZSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coc2NvcGUucmVuZGVyRnJhbWVbMF0pO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGVsZW1lbnQpO1xuICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgbG9hZE1vZGVsKG5ld1ZhbHVlKTsgXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyEhIEhhbmRsZSByZW1vdmluZyBvYmplY3QgYW5kIGFkZGluZyBuZXcgb2JqZWN0XG4gICAgICAgIGZ1bmN0aW9uIGxvYWRNb2RlbChtb2RVcmwpIHtcbiAgICAgICAgICAgIGxvYWRlcjIubG9hZChtb2RVcmwsIGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgICAgICAgb2JqZWN0LnNjYWxlLnggPSBvYmplY3Quc2NhbGUueSA9IG9iamVjdC5zY2FsZS56ID0gLjAyMjtcbiAgICAgICAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnkgPSAuNTtcbiAgICAgICAgICAgICAgb2JqZWN0LnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgICAgICAgICBpZiAocHJldmlvdXMpIHNjZW5lLnJlbW92ZShwcmV2aW91cyk7XG4gICAgICAgICAgICAgIHNjZW5lLmFkZChvYmplY3QpO1xuXG4gICAgICAgICAgICAgIHByZXZpb3VzID0gb2JqZWN0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIC8vIHJ1biBsb2FkIG1vZGVsIG9uIGN1cnJlbnQgbW9kZWxVcmxcbiAgICAgICAgbG9hZE1vZGVsKHNjb3BlLm1vZGVsVXJsKTtcbiAgICAgICAgYW5pbWF0ZSgpO1xuXG4gICAgICAgIC8vIFNldHVwIFRIUkVFLmpzIGNhbWVyYXMsIHNjZW5lLCByZW5kZXJlciwgbGlnaHRpbmdcbiAgICAgICAgZnVuY3Rpb24gaW5pdCgpe1xuXG4gICAgICAgICAgLy8gQ2FtZXJhXG4gICAgICAgICAgY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDUwLCByZW5kZXJGcmFtZVdpZHRoIC8gcmVuZGVyRnJhbWVIZWlnaHQsIDEsIDIwMDApO1xuICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi5zZXQoMiw0LDUpO1xuXG4gICAgICAgICAgLy8gU2NlbmVcbiAgICAgICAgICBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICAgICAgICAgIC8vIHNjZW5lLmZvZyA9IG5ldyBUSFJFRS5Gb2dFeHAyKDB4MDAwMDAwLCAwLjAwMDEpO1xuXG4gICAgICAgICAgLy8gTGlnaHRzXG4gICAgICAgICAgc2NlbmUuYWRkKG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoMHhjY2NjY2MpKTtcblxuICAgICAgICAgIHZhciBkaXJlY3Rpb25hbExpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhjY2NjY2MpO1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ueCA9IE1hdGgucmFuZG9tKCkgLSAwLjU7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi55ID0gTWF0aC5yYW5kb20oKSAtIDAuNTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnogPSBNYXRoLnJhbmRvbSgpIC0gMC41O1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ubm9ybWFsaXplKCk7XG4gICAgICAgICAgc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQpO1xuXG4gICAgICAgICAgLy8hISEhIFJlbmRlcmVyXG4gICAgICAgICAgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7IGFudGlhbGlhczogdHJ1ZSB9KTtcbiAgICAgICAgICByZW5kZXJlci5zZXRTaXplKHJlbmRlckZyYW1lV2lkdGgsIHJlbmRlckZyYW1lSGVpZ2h0KTtcbiAgICAgICAgICByZW5kZXJlci5zZXRDbGVhckNvbG9yKCAweGZmZmZmZiApO1xuICAgICAgICAgIGVsZW1lbnRbMF0uYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgICAgICAgICAvLyBDaGVjayBmb3IgUmVzaXplIEV2ZW50XG4gICAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uV2luZG93UmVzaXplLCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhzY2VuZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgUmVzaXplXG4gICAgICAgIGZ1bmN0aW9uIG9uV2luZG93UmVzaXplKGV2ZW50KXtcbiAgICAgICAgICByZW5kZXJlci5zZXRTaXplKHNjb3BlLnJlbmRlckZyYW1lLndpZHRoKCksIHJlbmRlckZyYW1lSGVpZ2h0KTtcbiAgICAgICAgICBjYW1lcmEuYXNwZWN0ID0gc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKSAvIHJlbmRlckZyYW1lSGVpZ2h0O1xuICAgICAgICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBbmltYXRlXG4gICAgICAgIHZhciB0ID0gMDsgLy8gP1xuICAgICAgICBmdW5jdGlvbiBhbmltYXRlKCkgeyAgICAgICAgICBcbiAgICAgICAgICByZW5kZXIoKTtcbiAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBIYW5kbGUgcmUtUmVuZGVyaW5nIG9mIHNjZW5lIGZvciBzcGlubmluZ1xuICAgICAgICBmdW5jdGlvbiByZW5kZXIoKXsgXG4gICAgICAgICAgdmFyIHRpbWVyID0gRGF0ZS5ub3coKSAqIDAuMDAwMTU7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueCA9IE1hdGguY29zKHRpbWVyKSAqIDEwO1xuICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnkgPSA0O1xuICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnogPSBNYXRoLnNpbih0aW1lcikgKiA4LjU7XG4gICAgICAgICAgICBjYW1lcmEubG9va0F0KHNjZW5lLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIHJlbmRlcmVyLnJlbmRlcihzY2VuZSwgY2FtZXJhKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1JlbmRlclNlcnZpY2UnLCBmdW5jdGlvbigpe1xuXG5cdHZhciByZW5kZXJPYmogPSB7XG5cdFx0dXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nXG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGNoYW5nZU1vZGVsVXJsOiBmdW5jdGlvbihuZXdVcmwpe1xuXHRcdFx0cmVuZGVyT2JqLnVybCA9IG5ld1VybDtcblx0XHRcdHJldHVybiByZW5kZXJPYmoudXJsO1xuXHRcdH0sXG5cdFx0Z2V0TW9kZWxVcmw6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gcmVuZGVyT2JqLnVybDtcblx0XHR9XG5cdH1cblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignUHJvZHVjdExpc3RDdHJsJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcblx0XG5cdFxuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0cycsIHtcblx0XHR1cmw6ICcvcHJvZHVjdHMnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2Jyb3dzZXIvYXBwL3Byb2R1Y3QvbGlzdC9wcm9kdWN0Lmxpc3QuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1Byb2R1Y3RMaXN0Q3RybCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0c3RvcmllczogZnVuY3Rpb24gKFByb2R1Y3QpIHtcblx0XHRcdFx0cmV0dXJuIFByb2R1Y3QuZmV0Y2hBbGwoKTtcblx0XHRcdH0sXG5cdFx0XHR1c2VyczogZnVuY3Rpb24gKFVzZXIpIHtcblx0XHRcdFx0cmV0dXJuIFVzZXIuZmV0Y2hBbGwoKTtcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcignUHJvZHVjdERldGFpbEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdFxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdCcsIHtcblx0XHR1cmw6ICcvcHJvZHVjdC86aWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2Jyb3dzZXIvYXBwL3Byb2R1Y3QvZGV0YWlsL3Byb2R1Y3QuZGV0YWlsLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdQcm9kdWN0RGV0YWlsQ3RybCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0c3Rvcnk6IGZ1bmN0aW9uIChQcm9kdWN0LCAkc3RhdGVQYXJhbXMpIHtcblx0XHRcdFx0dmFyIHN0b3J5ID0gbmV3IFByb2R1Y3Qoe19pZDogJHN0YXRlUGFyYW1zLmlkfSk7XG5cdFx0XHRcdHJldHVybiBwcm9kdWN0LmZldGNoKCk7XG5cdFx0XHR9LFxuXHRcdFx0dXNlcnM6IGZ1bmN0aW9uIChVc2VyKSB7XG5cdFx0XHRcdHJldHVybiBVc2VyLmZldGNoQWxsKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VzZXInLCB7XG5cdFx0dXJsOiAnL3VzZXJzLzppZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvYnJvd3Nlci9hcHAvdXNlci9kZXRhaWwvdXNlci5kZXRhaWwuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VzZXJEZXRhaWxDdHJsJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR1c2VyOiBmdW5jdGlvbiAoVXNlciwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHZhciB1c2VyID0gbmV3IFVzZXIoe19pZDogJHN0YXRlUGFyYW1zLmlkfSk7XG5cdFx0XHRcdHJldHVybiB1c2VyLmZldGNoKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1VzZXJJdGVtQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZSkge1xuXHRcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgndXNlckl0ZW0nLCBmdW5jdGlvbiAoJHN0YXRlKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9icm93c2VyL2FwcC91c2VyL2l0ZW0vdXNlci5pdGVtLmh0bWwnLFxuXHRcdHNjb3BlOiB7XG5cdFx0XHR1c2VyOiAnPW1vZGVsJyxcblx0XHRcdGdseXBoaWNvbjogJ0AnLFxuXHRcdFx0aWNvbkNsaWNrOiAnJidcblx0XHR9LFxuXHRcdGNvbnRyb2xsZXI6ICdVc2VySXRlbUN0cmwnXG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1VzZXJMaXN0Q3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIHVzZXJzLCBVc2VyKSB7XG5cdFxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgndXNlcnMnLCB7XG5cdFx0dXJsOiAnL3VzZXJzJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9icm93c2VyL2FwcC91c2VyL2xpc3QvdXNlci5saXN0Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdVc2VyTGlzdEN0cmwnXG5cdH0pO1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnZm9jdXNNZScsIGZ1bmN0aW9uKCRwYXJzZSwgJHRpbWVvdXQpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XG5cdFx0XHR2YXIgc3RhdHVzID0gJHBhcnNlKGF0dHJzLmZvY3VzTWUpO1xuXHRcdFx0c2NvcGUuJHdhdGNoKHN0YXR1cywgZnVuY3Rpb24odmFsKXtcblx0XHRcdFx0Y29uc29sZS5sb2coJ3N0YXR1cyA9ICcsIHZhbCk7XG5cdFx0XHRcdGlmICh2YWwgPT09IHRydWUpe1xuXHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRlbGVtZW50WzBdLmZvY3VzKCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pIiwiLy8gYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlKSB7XG5cbi8vICAgICByZXR1cm4ge1xuLy8gICAgICAgICByZXN0cmljdDogJ0UnLFxuLy8gICAgICAgICBzY29wZToge30sXG4vLyAgICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbi8vICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbi8vICAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuLy8gICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuLy8gICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdBYm91dCcsIHN0YXRlOiAnYWJvdXQnIH0sXG4vLyAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ0RvY3VtZW50YXRpb24nLCBzdGF0ZTogJ2RvY3MnIH0sXG4vLyAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ01lbWJlcnMgT25seScsIHN0YXRlOiAnbWVtYmVyc09ubHknLCBhdXRoOiB0cnVlIH1cbi8vICAgICAgICAgICAgIF07XG5cbi8vICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4vLyAgICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuLy8gICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbi8vICAgICAgICAgICAgIH07XG5cbi8vICAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbi8vICAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcbi8vICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbi8vICAgICAgICAgICAgICAgICB9KTtcbi8vICAgICAgICAgICAgIH07XG5cbi8vICAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuLy8gICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4vLyAgICAgICAgICAgICAgICAgfSk7XG4vLyAgICAgICAgICAgICB9O1xuXG4vLyAgICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbi8vICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbi8vICAgICAgICAgICAgIH07XG5cbi8vICAgICAgICAgICAgIHNldFVzZXIoKTtcblxuLy8gICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbi8vICAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuLy8gICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4vLyAgICAgICAgIH1cblxuLy8gICAgIH07XG5cbi8vIH0pO1xuXG4ndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogXCJFXCIsXG5cdFx0dGVtcGxhdGVVcmw6IFwianMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sXCJcblx0fVxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdzZWFyY2hiYXInLCBmdW5jdGlvbiAoKXtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnLi4vYnJvd3Nlci9jb21wb25lbnRzL3NlYXJjaGJhci9zZWFyY2hiYXIuaHRtbCdcblx0fVxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9