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
            console.log("logged in");
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
        console.log("hit controller");
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

app.factory('Product', function ($http) {
    return {
        addProduct: function addProduct(credentials) {
            return $http.post('api/products', credentials).then(function (res) {
                return res.data;
            });
        },

        getProducts: function getProducts() {
            return $http.get('api/products').then(function (response) {
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

app.controller('ProductListCtrl', function ($scope, $state, Product) {

    $scope.login = {};
    $scope.error = null;

    $scope.addProduct = function (productInfo) {

        $scope.error = null;

        Product.addProduct(productInfo).then(function () {
            $state.go('products');
        })['catch'](function () {
            $scope.error = 'Invalid login credentials.';
        });
    };

    $scope.getProducts = function () {
        Product.getUsers().then(function (users) {
            console.log(users);
        });
    };
});
'use strict';

app.config(function ($stateProvider) {
    $stateProvider.state('products', {
        url: '/products',
        templateUrl: '/browser/app/product/list/product.list.html',
        controller: 'ProductListCtrl',
        resolve: {
            // stories: function (Product) {
            // 	return Product.fetchAll();
            // },
            // users: function (User) {
            // 	return User.fetchAll();
            // }
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
app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
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

app.directive('oauthButton', function () {
    return {
        scope: {
            providerName: '@'
        },
        restrict: 'E',
        templateUrl: 'js/common/directives/oauth-button/oauth-button.html'
    };
});
'use strict';

app.directive('searchbar', function () {
    return {
        restrict: 'E',
        templateUrl: '../browser/components/searchbar/searchbar.html'
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiZG9jcy9kb2NzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJwcm9kdWN0cy9wcm9kdWN0LmZhY3RvcnkuanMiLCJyZW5kZXIvcmVuZGVyLmNvbnRyb2xsZXIuanMiLCJyZW5kZXIvcmVuZGVyLmRpcmVjdGl2ZS5qcyIsInJlbmRlci9yZW5kZXIuZmFjdG9yeS5qcyIsInNpZ24tdXAvc2lnbi11cC5qcyIsImNvbW1vbi9mYWN0b3JpZXMvRnVsbHN0YWNrUGljcy5qcyIsImNvbW1vbi9mYWN0b3JpZXMvUmFuZG9tR3JlZXRpbmdzLmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9zaWduLXVwLWZhY3RvcnkuanMiLCJjb21tb24vcmVuZGVyL3JlbmRlci5jb250cm9sbGVyLmpzIiwiY29tbW9uL3JlbmRlci9yZW5kZXIuZGlyZWN0aXZlLmpzIiwiY29tbW9uL3JlbmRlci9yZW5kZXIuZmFjdG9yeS5qcyIsInByb2R1Y3RzL3Byb2R1Y3RsaXN0L3Byb2R1Y3QubGlzdC5jb250cm9sbGVyLmpzIiwicHJvZHVjdHMvcHJvZHVjdGxpc3QvcHJvZHVjdC5saXN0LnN0YXRlLmpzIiwicHJvZHVjdHMvc2luZ2xlcHJvZHVjdC9wcm9kdWN0LmRldGFpbC5jb250cm9sbGVyLmpzIiwicHJvZHVjdHMvc2luZ2xlcHJvZHVjdC9wcm9kdWN0LmRldGFpbC5zdGF0ZS5qcyIsInVzZXIvZGV0YWlsL3VzZXIuZGV0YWlsLnN0YXRlLmpzIiwidXNlci9pdGVtL3VzZXIuaXRlbS5jb250cm9sbGVyLmpzIiwidXNlci9pdGVtL3VzZXIuaXRlbS5kaXJlY3RpdmUuanMiLCJ1c2VyL2xpc3QvdXNlci5saXN0LmNvbnRyb2xsZXIuanMiLCJ1c2VyL2xpc3QvdXNlci5saXN0LnN0YXRlLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZmllbGQtZm9jdXMvZmllbGRGb2N1cy5kaXJlY3RpdmUuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL29hdXRoLWJ1dHRvbi9vYXV0aC1idXR0b24uZGlyZWN0aXZlLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc2VhcmNoYmFyL3NlYXJjaGJhci5kaXJlY3RpdmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBQSxDQUFBO0FBQ0EsSUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsV0FBQSxFQUFBLGFBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQTs7QUFFQSxxQkFBQSxDQUFBLFNBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTs7QUFFQSxzQkFBQSxDQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLEVBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxFQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7OztBQUdBLEdBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsUUFBQSw0QkFBQSxHQUFBLFNBQUEsNEJBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLEtBQUEsQ0FBQSxJQUFBLElBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBLENBQUE7S0FDQSxDQUFBOzs7O0FBSUEsY0FBQSxDQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQTs7QUFFQSxZQUFBLENBQUEsNEJBQUEsQ0FBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7QUFFQSxZQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7O0FBR0EsYUFBQSxDQUFBLGNBQUEsRUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7O0FBSUEsZ0JBQUEsV0FBQSxHQUFBLElBQUEsR0FBQSxPQUFBLENBQUEsSUFBQSxHQUFBLE9BQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsRUFBQSxDQUFBLFdBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOzs7Ozs7Ozs7QUNuREEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7O0FBR0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLGlCQUFBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBOzs7QUFHQSxVQUFBLENBQUEsTUFBQSxHQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNoQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxPQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNMQSxDQUFBLFlBQUE7O0FBRUEsZ0JBQUEsQ0FBQTs7O0FBR0EsUUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSx3QkFBQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBO0FBQ0EsZUFBQSxNQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7Ozs7O0FBS0EsT0FBQSxDQUFBLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxvQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7QUFDQSxzQkFBQSxFQUFBLHNCQUFBO0FBQ0Esd0JBQUEsRUFBQSx3QkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsZ0JBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGFBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7U0FDQSxDQUFBO0FBQ0EsZUFBQTtBQUNBLHlCQUFBLEVBQUEsdUJBQUEsUUFBQSxFQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsVUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsWUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLFdBQUEsRUFDQSxVQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsaUJBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBOztBQUVBLGlCQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBOzs7O0FBSUEsWUFBQSxDQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUE7Ozs7Ozs7Ozs7QUFVQSxnQkFBQSxJQUFBLENBQUEsZUFBQSxFQUFBLElBQUEsVUFBQSxLQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO2FBQ0E7Ozs7O0FBS0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUVBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQ0EsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSw0QkFBQSxFQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7QUFDQSwwQkFBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUEsYUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBO0tBRUEsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQTs7QUFFQSxZQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGNBQUEsRUFBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsRUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxnQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxFQUFBLENBQUE7OztBQ3BJQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLG1CQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLGNBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNoQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsUUFBQTtBQUNBLG1CQUFBLEVBQUEscUJBQUE7QUFDQSxrQkFBQSxFQUFBLFdBQUE7S0FDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsS0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsNEJBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUMzQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsZUFBQTtBQUNBLGdCQUFBLEVBQUEsbUVBQUE7QUFDQSxrQkFBQSxFQUFBLG9CQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHNCQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOzs7QUFHQSxZQUFBLEVBQUE7QUFDQSx3QkFBQSxFQUFBLElBQUE7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTs7QUFFQSxRQUFBLFFBQUEsR0FBQSxTQUFBLFFBQUEsR0FBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSwyQkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsbUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsV0FBQTtBQUNBLGdCQUFBLEVBQUEsUUFBQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUMvQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUEsV0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxjQUFBLEVBQUEsV0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBOztBQUVBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGNBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLHVCQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNqQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLFFBQUEsR0FBQSxhQUFBLENBQUEsV0FBQSxFQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBO0FBQUEsZUFBQSxhQUFBLENBQUEsV0FBQSxFQUFBLENBQUE7S0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFlBQUEsTUFBQSxJQUFBLE1BQUEsRUFBQSxNQUFBLENBQUEsUUFBQSxHQUFBLGFBQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ1ZBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFNBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQTtBQUNBLG9CQUFBLEVBQUEsV0FBQTtTQUNBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUE7OztBQUdBLGlCQUFBLENBQUEsV0FBQSxHQUFBLENBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQTtBQUNBLGdCQUFBLGdCQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQTtBQUNBLGdCQUFBLGlCQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQTs7O0FBR0EsZ0JBQUEsTUFBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsZ0JBQUEsS0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsZ0JBQUEsUUFBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBO0FBQ0EsZ0JBQUEsUUFBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBOzs7QUFHQSxnQkFBQSxFQUFBLENBQUE7Ozs7QUFJQSxnQkFBQSxPQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsWUFBQSxFQUFBLENBQUE7QUFDQSxnQkFBQSxPQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsVUFBQSxFQUFBLENBQUE7OztBQUdBLGlCQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsRUFBQSxVQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUE7Ozs7QUFJQSxvQkFBQSxRQUFBLElBQUEsUUFBQSxFQUFBO0FBQ0EsNkJBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtpQkFDQTthQUNBLENBQUEsQ0FBQTs7O0FBR0EscUJBQUEsU0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLDBCQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSwwQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtBQUNBLHdCQUFBLFFBQUEsRUFBQSxLQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EseUJBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7O0FBRUEsNEJBQUEsR0FBQSxNQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0E7OztBQUdBLHFCQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsRUFBQSxDQUFBOzs7QUFHQSxxQkFBQSxJQUFBLEdBQUE7OztBQUdBLHNCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsaUJBQUEsQ0FBQSxFQUFBLEVBQUEsZ0JBQUEsR0FBQSxpQkFBQSxFQUFBLENBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQSxDQUFBOzs7QUFHQSxxQkFBQSxHQUFBLElBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBOzs7O0FBSUEscUJBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxLQUFBLENBQUEsWUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsb0JBQUEsZ0JBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxnQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsZ0NBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxnQ0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLGdDQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0EsZ0NBQUEsQ0FBQSxRQUFBLENBQUEsU0FBQSxFQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7OztBQUdBLHdCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsYUFBQSxDQUFBLEVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSx3QkFBQSxDQUFBLE9BQUEsQ0FBQSxnQkFBQSxFQUFBLGlCQUFBLENBQUEsQ0FBQTtBQUNBLHdCQUFBLENBQUEsYUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxXQUFBLENBQUEsUUFBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBOzs7QUFHQSxzQkFBQSxDQUFBLGdCQUFBLENBQUEsUUFBQSxFQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTs7O2FBR0E7OztBQUdBLHFCQUFBLGNBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSx3QkFBQSxDQUFBLE9BQUEsQ0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsRUFBQSxFQUFBLGlCQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsTUFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLEdBQUEsaUJBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsc0JBQUEsRUFBQSxDQUFBO2FBQ0E7OztBQUdBLGdCQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxxQkFBQSxPQUFBLEdBQUE7QUFDQSxzQkFBQSxFQUFBLENBQUE7QUFDQSxxQ0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO2FBQ0E7OztBQUdBLHFCQUFBLE1BQUEsR0FBQTtBQUNBLG9CQUFBLEtBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxFQUFBLEdBQUEsT0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHdCQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDdEhBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsT0FBQSxDQUFBLGVBQUEsRUFBQSxZQUFBOztBQUVBLFFBQUEsU0FBQSxHQUFBO0FBQ0EsV0FBQSxFQUFBLDJDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0Esc0JBQUEsRUFBQSx3QkFBQSxNQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLEdBQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxtQkFBQSxTQUFBLENBQUEsR0FBQSxDQUFBO1NBQ0E7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0EsbUJBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ2xCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSx3QkFBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQTs7QUFFQSxjQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxjQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsNEJBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUVBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTs7QUNqQ0EsR0FBQSxDQUFBLE9BQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUEsQ0FDQSx1REFBQSxFQUNBLHFIQUFBLEVBQ0EsaURBQUEsRUFDQSxpREFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLEVBQ0EsdURBQUEsRUFDQSx1REFBQSxFQUNBLHVEQUFBLENBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUM3QkEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7O0FBRUEsUUFBQSxrQkFBQSxHQUFBLFNBQUEsa0JBQUEsQ0FBQSxHQUFBLEVBQUE7QUFDQSxlQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsUUFBQSxTQUFBLEdBQUEsQ0FDQSxlQUFBLEVBQ0EsdUJBQUEsRUFDQSxzQkFBQSxFQUNBLHVCQUFBLEVBQ0EseURBQUEsRUFDQSwwQ0FBQSxFQUNBLGNBQUEsRUFDQSx1QkFBQSxFQUNBLElBQUEsRUFDQSxpQ0FBQSxDQUNBLENBQUE7O0FBRUEsV0FBQTtBQUNBLGlCQUFBLEVBQUEsU0FBQTtBQUNBLHlCQUFBLEVBQUEsNkJBQUE7QUFDQSxtQkFBQSxrQkFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQ3pCQSxHQUFBLENBQUEsT0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGNBQUEsRUFBQSxnQkFBQSxXQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsRUFBQSxXQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsZ0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsdUJBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNoQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLFFBQUEsR0FBQSxhQUFBLENBQUEsV0FBQSxFQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBO0FBQUEsZUFBQSxhQUFBLENBQUEsV0FBQSxFQUFBLENBQUE7S0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFlBQUEsTUFBQSxJQUFBLE1BQUEsRUFBQSxNQUFBLENBQUEsUUFBQSxHQUFBLGFBQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ1ZBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFNBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQTtBQUNBLG9CQUFBLEVBQUEsV0FBQTtTQUNBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUE7OztBQUdBLGlCQUFBLENBQUEsV0FBQSxHQUFBLENBQUEsQ0FBQSxlQUFBLENBQUEsQ0FBQTtBQUNBLGdCQUFBLGdCQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQTtBQUNBLGdCQUFBLGlCQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQTs7O0FBR0EsZ0JBQUEsTUFBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsZ0JBQUEsS0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsZ0JBQUEsUUFBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBO0FBQ0EsZ0JBQUEsUUFBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBOzs7QUFHQSxnQkFBQSxFQUFBLENBQUE7Ozs7QUFJQSxnQkFBQSxPQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsWUFBQSxFQUFBLENBQUE7QUFDQSxnQkFBQSxPQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsVUFBQSxFQUFBLENBQUE7OztBQUdBLGlCQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsRUFBQSxVQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUE7Ozs7QUFJQSxvQkFBQSxRQUFBLElBQUEsUUFBQSxFQUFBO0FBQ0EsNkJBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtpQkFDQTthQUNBLENBQUEsQ0FBQTs7O0FBR0EscUJBQUEsU0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLDBCQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSwwQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtBQUNBLHdCQUFBLFFBQUEsRUFBQSxLQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EseUJBQUEsQ0FBQSxHQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7O0FBRUEsNEJBQUEsR0FBQSxNQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0E7OztBQUdBLHFCQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsRUFBQSxDQUFBOzs7QUFHQSxxQkFBQSxJQUFBLEdBQUE7OztBQUdBLHNCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsaUJBQUEsQ0FBQSxFQUFBLEVBQUEsZ0JBQUEsR0FBQSxpQkFBQSxFQUFBLENBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQSxDQUFBOzs7QUFHQSxxQkFBQSxHQUFBLElBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBOzs7O0FBSUEscUJBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxLQUFBLENBQUEsWUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsb0JBQUEsZ0JBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxnQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsZ0NBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxnQ0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLGdDQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0EsZ0NBQUEsQ0FBQSxRQUFBLENBQUEsU0FBQSxFQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7OztBQUdBLHdCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsYUFBQSxDQUFBLEVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSx3QkFBQSxDQUFBLE9BQUEsQ0FBQSxnQkFBQSxFQUFBLGlCQUFBLENBQUEsQ0FBQTtBQUNBLHdCQUFBLENBQUEsYUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxXQUFBLENBQUEsUUFBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBOzs7QUFHQSxzQkFBQSxDQUFBLGdCQUFBLENBQUEsUUFBQSxFQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTs7O2FBR0E7OztBQUdBLHFCQUFBLGNBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSx3QkFBQSxDQUFBLE9BQUEsQ0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsRUFBQSxFQUFBLGlCQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsTUFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLEdBQUEsaUJBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsc0JBQUEsRUFBQSxDQUFBO2FBQ0E7OztBQUdBLGdCQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxxQkFBQSxPQUFBLEdBQUE7QUFDQSxzQkFBQSxFQUFBLENBQUE7QUFDQSxxQ0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO2FBQ0E7OztBQUdBLHFCQUFBLE1BQUEsR0FBQTtBQUNBLG9CQUFBLEtBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxFQUFBLEdBQUEsT0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHdCQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDdEhBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsT0FBQSxDQUFBLGVBQUEsRUFBQSxZQUFBOztBQUVBLFFBQUEsU0FBQSxHQUFBO0FBQ0EsV0FBQSxFQUFBLDJDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBO0FBQ0Esc0JBQUEsRUFBQSx3QkFBQSxNQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLEdBQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxtQkFBQSxTQUFBLENBQUEsR0FBQSxDQUFBO1NBQ0E7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0EsbUJBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ2xCQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxPQUFBLEVBQUE7O0FBRUEsVUFBQSxDQUFBLEtBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsV0FBQSxFQUFBOztBQUVBLGNBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGVBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBRUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxlQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBSUEsQ0FBQSxDQUFBO0FDM0JBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsVUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLDZDQUFBO0FBQ0Esa0JBQUEsRUFBQSxpQkFBQTtBQUNBLGVBQUEsRUFBQTs7Ozs7OztTQU9BO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDaEJBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsRUFFQSxDQUFBLENBQUE7QUNKQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxjQUFBO0FBQ0EsbUJBQUEsRUFBQSxpREFBQTtBQUNBLGtCQUFBLEVBQUEsbUJBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxpQkFBQSxFQUFBLGVBQUEsT0FBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLG9CQUFBLEtBQUEsR0FBQSxJQUFBLE9BQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxZQUFBLENBQUEsRUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLE9BQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQTthQUNBO0FBQ0EsaUJBQUEsRUFBQSxlQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLElBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNqQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsWUFBQTtBQUNBLG1CQUFBLEVBQUEsMkNBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0EsZ0JBQUEsRUFBQSxjQUFBLElBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSxvQkFBQSxJQUFBLEdBQUEsSUFBQSxJQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsWUFBQSxDQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxJQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7YUFDQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDZEEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxFQUVBLENBQUEsQ0FBQTtBQ0pBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFVBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLHVDQUFBO0FBQ0EsYUFBQSxFQUFBO0FBQ0EsZ0JBQUEsRUFBQSxRQUFBO0FBQ0EscUJBQUEsRUFBQSxHQUFBO0FBQ0EscUJBQUEsRUFBQSxHQUFBO1NBQ0E7QUFDQSxrQkFBQSxFQUFBLGNBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDYkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsRUFFQSxDQUFBLENBQUE7QUNKQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxRQUFBO0FBQ0EsbUJBQUEsRUFBQSx1Q0FBQTtBQUNBLGtCQUFBLEVBQUEsY0FBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1JBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxnQkFBQSxNQUFBLEdBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsRUFBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG9CQUFBLEdBQUEsS0FBQSxJQUFBLEVBQUE7QUFDQSw0QkFBQSxDQUFBLFlBQUE7QUFDQSwrQkFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBO3FCQUNBLENBQUEsQ0FBQTtpQkFDQTthQUNBLENBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ2pCQSxHQUFBLENBQUEsU0FBQSxDQUFBLGVBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEseURBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzRDQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLHlDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUN4REEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxlQUFBLEVBQUE7O0FBRUEsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEseURBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLFFBQUEsR0FBQSxlQUFBLENBQUEsaUJBQUEsRUFBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDVkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsYUFBQSxFQUFBLFlBQUE7QUFDQSxXQUFBO0FBQ0EsYUFBQSxFQUFBO0FBQ0Esd0JBQUEsRUFBQSxHQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLHFEQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1ZBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsU0FBQSxDQUFBLFdBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEsZ0RBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsndWkucm91dGVyJywgJ2ZzYVByZUJ1aWx0J10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoLzpwcm92aWRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICBcdHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcblx0fSk7XG5cbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSkge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IHVzZXIgPyB0b1N0YXRlLm5hbWUgOiAnbG9naW4nO1xuICAgICAgICAgICAgJHN0YXRlLmdvKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgIC8vIFJlZ2lzdGVyIG91ciAqYWJvdXQqIHN0YXRlLlxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhYm91dCcsIHtcbiAgICAgICAgdXJsOiAnL2Fib3V0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Fib3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWJvdXQvYWJvdXQuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdBYm91dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBGdWxsc3RhY2tQaWNzKSB7XG5cbiAgICAvLyBJbWFnZXMgb2YgYmVhdXRpZnVsIEZ1bGxzdGFjayBwZW9wbGUuXG4gICAgJHNjb3BlLmltYWdlcyA9IF8uc2h1ZmZsZShGdWxsc3RhY2tQaWNzKTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2RvY3MvZG9jcy5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJsb2dnZWQgaW5cIilcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCIvKiBnbG9iYWwgYXBwICovXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG4ndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFJlbmRlclNlcnZpY2UpIHtcblxuICAgICRzY29wZS5jaGFuZ2VNb2RlbFVybCA9IGZ1bmN0aW9uKG5ld1VybCl7XG4gICAgXHRSZW5kZXJTZXJ2aWNlLmNoYW5nZU1vZGVsVXJsKG5ld1VybCk7XG4gICAgfVxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuICAgICAgICBjb25zb2xlLmxvZyhcImhpdCBjb250cm9sbGVyXCIpXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcbiAgICAgICAgICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTtcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdQcm9kdWN0JywgZnVuY3Rpb24gKCRodHRwKXtcblx0XHRyZXR1cm57XG5cdFx0YWRkUHJvZHVjdDogZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJ2FwaS9wcm9kdWN0cycsIGNyZWRlbnRpYWxzKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcblx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHR9KTtcblx0XHR9LFxuXG4gICAgICAgIGdldFByb2R1Y3RzOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnYXBpL3Byb2R1Y3RzJykudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cdH1cblxufSkiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdSZW5kZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUmVuZGVyU2VydmljZSkge1xuXG5cdCRzY29wZS5tb2RlbFVybCA9IFJlbmRlclNlcnZpY2UuZ2V0TW9kZWxVcmwoKTtcblx0XG5cdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKXtyZXR1cm4gUmVuZGVyU2VydmljZS5nZXRNb2RlbFVybCgpfSwgZnVuY3Rpb24gKG5ld1ZhbCwgb2xkVmFsKXtcblx0ICAgIGlmKG5ld1ZhbCAhPSBvbGRWYWwpICRzY29wZS5tb2RlbFVybCA9IFJlbmRlclNlcnZpY2UuZ2V0TW9kZWxVcmwoKTtcblx0fSk7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnbmdXZWJnbCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIG1vZGVsVXJsOiAnPW1vZGVsVXJsJ1xuICAgICAgfSxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cikge1xuXG4gICAgICAgIC8vIFNldHVwIHNlbGVjdGlvbnNcbiAgICAgICAgc2NvcGUucmVuZGVyRnJhbWUgPSAkKCcjcmVuZGVyLWZyYW1lJyk7XG4gICAgICAgIHZhciByZW5kZXJGcmFtZVdpZHRoID0gc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKTtcbiAgICAgICAgdmFyIHJlbmRlckZyYW1lSGVpZ2h0ID0gc2NvcGUucmVuZGVyRnJhbWUuaGVpZ2h0KCk7XG5cbiAgICAgICAgLy8gU2V0dXAgVEhSRUUuanMgdmFyaWFibGVzIHdpdGggc2NvcGVcbiAgICAgICAgdmFyIGNhbWVyYTtcbiAgICAgICAgICAgIHNjb3BlLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgdmFyIHNjZW5lO1xuICAgICAgICAgICAgc2NvcGUuc2NlbmUgPSBzY2VuZTtcbiAgICAgICAgdmFyIHJlbmRlcmVyO1xuICAgICAgICAgICAgc2NvcGUucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICAgICAgdmFyIHByZXZpb3VzO1xuICAgICAgICAgICAgc2NvcGUucHJldmlvdXMgPSBwcmV2aW91cztcblxuICAgICAgICAvLyBpbml0aWFsaXplIHNjZW5lXG4gICAgICAgIGluaXQoKTtcblxuICAgICAgICAvLyBsb2FkIGRlZmF1bHQgbW9kZWwgb24gc2NvcGUgLS0gamVlcCBtb2RlbCAtLSB2aWEgQXNzaW1wSlNPTkxvYWRlclxuICAgICAgICAvLyB2YXIgbG9hZGVyMSA9IG5ldyBUSFJFRS5Bc3NpbXBKU09OTG9hZGVyKCk7XG4gICAgICAgIHZhciBsb2FkZXIyID0gbmV3IFRIUkVFLk9iamVjdExvYWRlcigpO1xuICAgICAgICB2YXIgbG9hZGVyMyA9IG5ldyBUSFJFRS5KU09OTG9hZGVyKCk7XG5cbiAgICAgICAgLy8gV2F0Y2ggZm9yIGNoYW5nZXMgdG8gc2NvcGVcbiAgICAgICAgc2NvcGUuJHdhdGNoKCdtb2RlbFVybCcsIGZ1bmN0aW9uIChuZXdWYWx1ZSwgb2xkVmFsdWUpe1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKG5ld1ZhbHVlKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhzY29wZS5yZW5kZXJGcmFtZVswXSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coZWxlbWVudCk7XG4gICAgICAgICAgaWYgKG5ld1ZhbHVlICE9IG9sZFZhbHVlKSB7XG4gICAgICAgICAgICBsb2FkTW9kZWwobmV3VmFsdWUpOyBcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vISEgSGFuZGxlIHJlbW92aW5nIG9iamVjdCBhbmQgYWRkaW5nIG5ldyBvYmplY3RcbiAgICAgICAgZnVuY3Rpb24gbG9hZE1vZGVsKG1vZFVybCkge1xuICAgICAgICAgICAgbG9hZGVyMi5sb2FkKG1vZFVybCwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgICBvYmplY3Quc2NhbGUueCA9IG9iamVjdC5zY2FsZS55ID0gb2JqZWN0LnNjYWxlLnogPSAuMDIyO1xuICAgICAgICAgICAgICBvYmplY3QucG9zaXRpb24ueSA9IC41O1xuICAgICAgICAgICAgICBvYmplY3QudXBkYXRlTWF0cml4KCk7XG4gICAgICAgICAgICAgIGlmIChwcmV2aW91cykgc2NlbmUucmVtb3ZlKHByZXZpb3VzKTtcbiAgICAgICAgICAgICAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgICAgICAgICAgICAgcHJldmlvdXMgPSBvYmplY3Q7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgLy8gcnVuIGxvYWQgbW9kZWwgb24gY3VycmVudCBtb2RlbFVybFxuICAgICAgICBsb2FkTW9kZWwoc2NvcGUubW9kZWxVcmwpO1xuICAgICAgICBhbmltYXRlKCk7XG5cbiAgICAgICAgLy8gU2V0dXAgVEhSRUUuanMgY2FtZXJhcywgc2NlbmUsIHJlbmRlcmVyLCBsaWdodGluZ1xuICAgICAgICBmdW5jdGlvbiBpbml0KCl7XG5cbiAgICAgICAgICAvLyBDYW1lcmFcbiAgICAgICAgICBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNTAsIHJlbmRlckZyYW1lV2lkdGggLyByZW5kZXJGcmFtZUhlaWdodCwgMSwgMjAwMCk7XG4gICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnNldCgyLDQsNSk7XG5cbiAgICAgICAgICAvLyBTY2VuZVxuICAgICAgICAgIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgICAgICAgLy8gc2NlbmUuZm9nID0gbmV3IFRIUkVFLkZvZ0V4cDIoMHgwMDAwMDAsIDAuMDAwMSk7XG5cbiAgICAgICAgICAvLyBMaWdodHNcbiAgICAgICAgICBzY2VuZS5hZGQobmV3IFRIUkVFLkFtYmllbnRMaWdodCgweGNjY2NjYykpO1xuXG4gICAgICAgICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGNjY2NjYyk7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi54ID0gTWF0aC5yYW5kb20oKSAtIDAuNTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnkgPSBNYXRoLnJhbmRvbSgpIC0gMC41O1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ueiA9IE1hdGgucmFuZG9tKCkgLSAwLjU7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5ub3JtYWxpemUoKTtcbiAgICAgICAgICBzY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodCk7XG5cbiAgICAgICAgICAvLyEhISEgUmVuZGVyZXJcbiAgICAgICAgICByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgYW50aWFsaWFzOiB0cnVlIH0pO1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUocmVuZGVyRnJhbWVXaWR0aCwgcmVuZGVyRnJhbWVIZWlnaHQpO1xuICAgICAgICAgIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoIDB4ZmZmZmZmICk7XG4gICAgICAgICAgZWxlbWVudFswXS5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgICAgICAgIC8vIENoZWNrIGZvciBSZXNpemUgRXZlbnRcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlKTtcblxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHNjZW5lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBSZXNpemVcbiAgICAgICAgZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoZXZlbnQpe1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKSwgcmVuZGVyRnJhbWVIZWlnaHQpO1xuICAgICAgICAgIGNhbWVyYS5hc3BlY3QgPSBzY29wZS5yZW5kZXJGcmFtZS53aWR0aCgpIC8gcmVuZGVyRnJhbWVIZWlnaHQ7XG4gICAgICAgICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFuaW1hdGVcbiAgICAgICAgdmFyIHQgPSAwOyAvLyA/XG4gICAgICAgIGZ1bmN0aW9uIGFuaW1hdGUoKSB7ICAgICAgICAgIFxuICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSByZS1SZW5kZXJpbmcgb2Ygc2NlbmUgZm9yIHNwaW5uaW5nXG4gICAgICAgIGZ1bmN0aW9uIHJlbmRlcigpeyBcbiAgICAgICAgICB2YXIgdGltZXIgPSBEYXRlLm5vdygpICogMC4wMDAxNTtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi54ID0gTWF0aC5jb3ModGltZXIpICogMTA7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueSA9IDQ7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueiA9IE1hdGguc2luKHRpbWVyKSAqIDguNTtcbiAgICAgICAgICAgIGNhbWVyYS5sb29rQXQoc2NlbmUucG9zaXRpb24pO1xuICAgICAgICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnUmVuZGVyU2VydmljZScsIGZ1bmN0aW9uKCl7XG5cblx0dmFyIHJlbmRlck9iaiA9IHtcblx0XHR1cmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbidcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0Y2hhbmdlTW9kZWxVcmw6IGZ1bmN0aW9uKG5ld1VybCl7XG5cdFx0XHRyZW5kZXJPYmoudXJsID0gbmV3VXJsO1xuXHRcdFx0cmV0dXJuIHJlbmRlck9iai51cmw7XG5cdFx0fSxcblx0XHRnZXRNb2RlbFVybDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiByZW5kZXJPYmoudXJsO1xuXHRcdH1cblx0fVxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ25VcCcsIHtcbiAgICAgICAgdXJsOiAnL3NpZ251cCcsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc2lnbi11cC9zaWduVXAuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaWduVXBDdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ1NpZ25VcEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBTaWduVXAsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kU2lnblVwID0gZnVuY3Rpb24gKHNpZ25VcEluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIFNpZ25VcC5zaWdudXAoc2lnblVwSW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuICAgIFxuICAgICRzY29wZS5nZXRVc2VycyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIFNpZ25VcC5nZXRVc2VycygpLnRoZW4oZnVuY3Rpb24odXNlcnMpe1xuICAgICAgICAgICAgY29uc29sZS5sb2codXNlcnMpXG4gICAgICAgIH0pXG4gICAgfVxuXG59KTtcblxuIiwiYXBwLmZhY3RvcnkoJ0Z1bGxzdGFja1BpY3MnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CN2dCWHVsQ0FBQVhRY0UuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vZmJjZG4tc3Bob3Rvcy1jLWEuYWthbWFpaGQubmV0L2hwaG90b3MtYWsteGFwMS90MzEuMC04LzEwODYyNDUxXzEwMjA1NjIyOTkwMzU5MjQxXzgwMjcxNjg4NDMzMTI4NDExMzdfby5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItTEtVc2hJZ0FFeTlTSy5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3OS1YN29DTUFBa3c3eS5qcGcnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItVWo5Q09JSUFJRkFoMC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I2eUl5RmlDRUFBcWwxMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFLVQ3NWxXQUFBbXFxSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFdlpBZy1WQUFBazkzMi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFZ05NZU9YSUFJZkRoSy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NFUXlJRE5XZ0FBdTYwQi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NDRjNUNVFXOEFFMmxHSi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBZVZ3NVNXb0FBQUxzai5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBYUpJUDdVa0FBbElHcy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NBUU93OWxXRUFBWTlGbC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0ItT1FiVnJDTUFBTndJTS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I5Yl9lcndDWUFBd1JjSi5wbmc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I1UFRkdm5DY0FFQWw0eC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I0cXdDMGlDWUFBbFBHaC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0IyYjMzdlJJVUFBOW8xRC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0J3cEl3cjFJVUFBdk8yXy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0JzU3NlQU5DWUFFT2hMdy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NKNHZMZnVVd0FBZGE0TC5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJN3d6akVWRUFBT1BwUy5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJZEh2VDJVc0FBbm5IVi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NHQ2lQX1lXWUFBbzc1Vi5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0NJUzRKUElXSUFJMzdxdS5qcGc6bGFyZ2UnXG4gICAgXTtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLidcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsIlxuYXBwLmZhY3RvcnkoJ1NpZ25VcCcsIGZ1bmN0aW9uICgkaHR0cCwgJHN0YXRlLCAkbG9jYXRpb24pIHtcblx0cmV0dXJue1xuXHRcdHNpZ251cDogZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJ2FwaS91c2VyJywgY3JlZGVudGlhbHMpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuXHRcdFx0Y29uc29sZS5sb2cocmVzLmRhdGEpXG5cdFx0XHRyZXR1cm4gcmVzLmRhdGE7XG5cdFx0fSk7XG5cdFx0fSxcblxuICAgICAgICBnZXRVc2VyczogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJ2FwaS91c2VyJykudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cdH1cbn0pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdSZW5kZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUmVuZGVyU2VydmljZSkge1xuXG5cdCRzY29wZS5tb2RlbFVybCA9IFJlbmRlclNlcnZpY2UuZ2V0TW9kZWxVcmwoKTtcblx0XG5cdCRzY29wZS4kd2F0Y2goZnVuY3Rpb24oKXtyZXR1cm4gUmVuZGVyU2VydmljZS5nZXRNb2RlbFVybCgpfSwgZnVuY3Rpb24gKG5ld1ZhbCwgb2xkVmFsKXtcblx0ICAgIGlmKG5ld1ZhbCAhPSBvbGRWYWwpICRzY29wZS5tb2RlbFVybCA9IFJlbmRlclNlcnZpY2UuZ2V0TW9kZWxVcmwoKTtcblx0fSk7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnbmdXZWJnbCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIG1vZGVsVXJsOiAnPW1vZGVsVXJsJ1xuICAgICAgfSxcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cikge1xuXG4gICAgICAgIC8vIFNldHVwIHNlbGVjdGlvbnNcbiAgICAgICAgc2NvcGUucmVuZGVyRnJhbWUgPSAkKCcjcmVuZGVyLWZyYW1lJyk7XG4gICAgICAgIHZhciByZW5kZXJGcmFtZVdpZHRoID0gc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKTtcbiAgICAgICAgdmFyIHJlbmRlckZyYW1lSGVpZ2h0ID0gc2NvcGUucmVuZGVyRnJhbWUuaGVpZ2h0KCk7XG5cbiAgICAgICAgLy8gU2V0dXAgVEhSRUUuanMgdmFyaWFibGVzIHdpdGggc2NvcGVcbiAgICAgICAgdmFyIGNhbWVyYTtcbiAgICAgICAgICAgIHNjb3BlLmNhbWVyYSA9IGNhbWVyYTtcbiAgICAgICAgdmFyIHNjZW5lO1xuICAgICAgICAgICAgc2NvcGUuc2NlbmUgPSBzY2VuZTtcbiAgICAgICAgdmFyIHJlbmRlcmVyO1xuICAgICAgICAgICAgc2NvcGUucmVuZGVyZXIgPSByZW5kZXJlcjtcbiAgICAgICAgdmFyIHByZXZpb3VzO1xuICAgICAgICAgICAgc2NvcGUucHJldmlvdXMgPSBwcmV2aW91cztcblxuICAgICAgICAvLyBpbml0aWFsaXplIHNjZW5lXG4gICAgICAgIGluaXQoKTtcblxuICAgICAgICAvLyBsb2FkIGRlZmF1bHQgbW9kZWwgb24gc2NvcGUgLS0gamVlcCBtb2RlbCAtLSB2aWEgQXNzaW1wSlNPTkxvYWRlclxuICAgICAgICAvLyB2YXIgbG9hZGVyMSA9IG5ldyBUSFJFRS5Bc3NpbXBKU09OTG9hZGVyKCk7XG4gICAgICAgIHZhciBsb2FkZXIyID0gbmV3IFRIUkVFLk9iamVjdExvYWRlcigpO1xuICAgICAgICB2YXIgbG9hZGVyMyA9IG5ldyBUSFJFRS5KU09OTG9hZGVyKCk7XG5cbiAgICAgICAgLy8gV2F0Y2ggZm9yIGNoYW5nZXMgdG8gc2NvcGVcbiAgICAgICAgc2NvcGUuJHdhdGNoKCdtb2RlbFVybCcsIGZ1bmN0aW9uIChuZXdWYWx1ZSwgb2xkVmFsdWUpe1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKG5ld1ZhbHVlKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhzY29wZS5yZW5kZXJGcmFtZVswXSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coZWxlbWVudCk7XG4gICAgICAgICAgaWYgKG5ld1ZhbHVlICE9IG9sZFZhbHVlKSB7XG4gICAgICAgICAgICBsb2FkTW9kZWwobmV3VmFsdWUpOyBcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vISEgSGFuZGxlIHJlbW92aW5nIG9iamVjdCBhbmQgYWRkaW5nIG5ldyBvYmplY3RcbiAgICAgICAgZnVuY3Rpb24gbG9hZE1vZGVsKG1vZFVybCkge1xuICAgICAgICAgICAgbG9hZGVyMi5sb2FkKG1vZFVybCwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgICBvYmplY3Quc2NhbGUueCA9IG9iamVjdC5zY2FsZS55ID0gb2JqZWN0LnNjYWxlLnogPSAuMDIyO1xuICAgICAgICAgICAgICBvYmplY3QucG9zaXRpb24ueSA9IC41O1xuICAgICAgICAgICAgICBvYmplY3QudXBkYXRlTWF0cml4KCk7XG4gICAgICAgICAgICAgIGlmIChwcmV2aW91cykgc2NlbmUucmVtb3ZlKHByZXZpb3VzKTtcbiAgICAgICAgICAgICAgc2NlbmUuYWRkKG9iamVjdCk7XG5cbiAgICAgICAgICAgICAgcHJldmlvdXMgPSBvYmplY3Q7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgLy8gcnVuIGxvYWQgbW9kZWwgb24gY3VycmVudCBtb2RlbFVybFxuICAgICAgICBsb2FkTW9kZWwoc2NvcGUubW9kZWxVcmwpO1xuICAgICAgICBhbmltYXRlKCk7XG5cbiAgICAgICAgLy8gU2V0dXAgVEhSRUUuanMgY2FtZXJhcywgc2NlbmUsIHJlbmRlcmVyLCBsaWdodGluZ1xuICAgICAgICBmdW5jdGlvbiBpbml0KCl7XG5cbiAgICAgICAgICAvLyBDYW1lcmFcbiAgICAgICAgICBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNTAsIHJlbmRlckZyYW1lV2lkdGggLyByZW5kZXJGcmFtZUhlaWdodCwgMSwgMjAwMCk7XG4gICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnNldCgyLDQsNSk7XG5cbiAgICAgICAgICAvLyBTY2VuZVxuICAgICAgICAgIHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XG4gICAgICAgICAgLy8gc2NlbmUuZm9nID0gbmV3IFRIUkVFLkZvZ0V4cDIoMHgwMDAwMDAsIDAuMDAwMSk7XG5cbiAgICAgICAgICAvLyBMaWdodHNcbiAgICAgICAgICBzY2VuZS5hZGQobmV3IFRIUkVFLkFtYmllbnRMaWdodCgweGNjY2NjYykpO1xuXG4gICAgICAgICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGNjY2NjYyk7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi54ID0gTWF0aC5yYW5kb20oKSAtIDAuNTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnkgPSBNYXRoLnJhbmRvbSgpIC0gMC41O1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ueiA9IE1hdGgucmFuZG9tKCkgLSAwLjU7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi5ub3JtYWxpemUoKTtcbiAgICAgICAgICBzY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodCk7XG5cbiAgICAgICAgICAvLyEhISEgUmVuZGVyZXJcbiAgICAgICAgICByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHsgYW50aWFsaWFzOiB0cnVlIH0pO1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUocmVuZGVyRnJhbWVXaWR0aCwgcmVuZGVyRnJhbWVIZWlnaHQpO1xuICAgICAgICAgIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoIDB4ZmZmZmZmICk7XG4gICAgICAgICAgZWxlbWVudFswXS5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgICAgICAgIC8vIENoZWNrIGZvciBSZXNpemUgRXZlbnRcbiAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25XaW5kb3dSZXNpemUsIGZhbHNlKTtcblxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHNjZW5lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBSZXNpemVcbiAgICAgICAgZnVuY3Rpb24gb25XaW5kb3dSZXNpemUoZXZlbnQpe1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKSwgcmVuZGVyRnJhbWVIZWlnaHQpO1xuICAgICAgICAgIGNhbWVyYS5hc3BlY3QgPSBzY29wZS5yZW5kZXJGcmFtZS53aWR0aCgpIC8gcmVuZGVyRnJhbWVIZWlnaHQ7XG4gICAgICAgICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFuaW1hdGVcbiAgICAgICAgdmFyIHQgPSAwOyAvLyA/XG4gICAgICAgIGZ1bmN0aW9uIGFuaW1hdGUoKSB7ICAgICAgICAgIFxuICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSByZS1SZW5kZXJpbmcgb2Ygc2NlbmUgZm9yIHNwaW5uaW5nXG4gICAgICAgIGZ1bmN0aW9uIHJlbmRlcigpeyBcbiAgICAgICAgICB2YXIgdGltZXIgPSBEYXRlLm5vdygpICogMC4wMDAxNTtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi54ID0gTWF0aC5jb3ModGltZXIpICogMTA7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueSA9IDQ7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueiA9IE1hdGguc2luKHRpbWVyKSAqIDguNTtcbiAgICAgICAgICAgIGNhbWVyYS5sb29rQXQoc2NlbmUucG9zaXRpb24pO1xuICAgICAgICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnUmVuZGVyU2VydmljZScsIGZ1bmN0aW9uKCl7XG5cblx0dmFyIHJlbmRlck9iaiA9IHtcblx0XHR1cmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbidcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0Y2hhbmdlTW9kZWxVcmw6IGZ1bmN0aW9uKG5ld1VybCl7XG5cdFx0XHRyZW5kZXJPYmoudXJsID0gbmV3VXJsO1xuXHRcdFx0cmV0dXJuIHJlbmRlck9iai51cmw7XG5cdFx0fSxcblx0XHRnZXRNb2RlbFVybDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiByZW5kZXJPYmoudXJsO1xuXHRcdH1cblx0fVxuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdQcm9kdWN0TGlzdEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCRzdGF0ZSwgUHJvZHVjdCkge1xuXHRcbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLmFkZFByb2R1Y3QgPSBmdW5jdGlvbiAocHJvZHVjdEluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIFByb2R1Y3QuYWRkUHJvZHVjdChwcm9kdWN0SW5mbykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ3Byb2R1Y3RzJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcbiAgICBcbiAgICAkc2NvcGUuZ2V0UHJvZHVjdHMgPSBmdW5jdGlvbigpe1xuICAgICAgICBQcm9kdWN0LmdldFVzZXJzKCkudGhlbihmdW5jdGlvbih1c2Vycyl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh1c2VycylcbiAgICAgICAgfSlcbiAgICB9XG5cdFxuXHRcblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdHMnLCB7XG5cdFx0dXJsOiAnL3Byb2R1Y3RzJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9icm93c2VyL2FwcC9wcm9kdWN0L2xpc3QvcHJvZHVjdC5saXN0Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdQcm9kdWN0TGlzdEN0cmwnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdC8vIHN0b3JpZXM6IGZ1bmN0aW9uIChQcm9kdWN0KSB7XG5cdFx0XHQvLyBcdHJldHVybiBQcm9kdWN0LmZldGNoQWxsKCk7XG5cdFx0XHQvLyB9LFxuXHRcdFx0Ly8gdXNlcnM6IGZ1bmN0aW9uIChVc2VyKSB7XG5cdFx0XHQvLyBcdHJldHVybiBVc2VyLmZldGNoQWxsKCk7XG5cdFx0XHQvLyB9XG5cdFx0fVxuXHR9KTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1Byb2R1Y3REZXRhaWxDdHJsJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXHRcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Byb2R1Y3QnLCB7XG5cdFx0dXJsOiAnL3Byb2R1Y3QvOmlkJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9icm93c2VyL2FwcC9wcm9kdWN0L2RldGFpbC9wcm9kdWN0LmRldGFpbC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnUHJvZHVjdERldGFpbEN0cmwnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdHN0b3J5OiBmdW5jdGlvbiAoUHJvZHVjdCwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHZhciBzdG9yeSA9IG5ldyBQcm9kdWN0KHtfaWQ6ICRzdGF0ZVBhcmFtcy5pZH0pO1xuXHRcdFx0XHRyZXR1cm4gcHJvZHVjdC5mZXRjaCgpO1xuXHRcdFx0fSxcblx0XHRcdHVzZXJzOiBmdW5jdGlvbiAoVXNlcikge1xuXHRcdFx0XHRyZXR1cm4gVXNlci5mZXRjaEFsbCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2VyJywge1xuXHRcdHVybDogJy91c2Vycy86aWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL2Jyb3dzZXIvYXBwL3VzZXIvZGV0YWlsL3VzZXIuZGV0YWlsLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdVc2VyRGV0YWlsQ3RybCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0dXNlcjogZnVuY3Rpb24gKFVzZXIsICRzdGF0ZVBhcmFtcykge1xuXHRcdFx0XHR2YXIgdXNlciA9IG5ldyBVc2VyKHtfaWQ6ICRzdGF0ZVBhcmFtcy5pZH0pO1xuXHRcdFx0XHRyZXR1cm4gdXNlci5mZXRjaCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdVc2VySXRlbUN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUpIHtcblx0XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ3VzZXJJdGVtJywgZnVuY3Rpb24gKCRzdGF0ZSkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICcvYnJvd3Nlci9hcHAvdXNlci9pdGVtL3VzZXIuaXRlbS5odG1sJyxcblx0XHRzY29wZToge1xuXHRcdFx0dXNlcjogJz1tb2RlbCcsXG5cdFx0XHRnbHlwaGljb246ICdAJyxcblx0XHRcdGljb25DbGljazogJyYnXG5cdFx0fSxcblx0XHRjb250cm9sbGVyOiAnVXNlckl0ZW1DdHJsJ1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdVc2VyTGlzdEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCB1c2VycywgVXNlcikge1xuXHRcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VzZXJzJywge1xuXHRcdHVybDogJy91c2VycycsXG5cdFx0dGVtcGxhdGVVcmw6ICcvYnJvd3Nlci9hcHAvdXNlci9saXN0L3VzZXIubGlzdC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnVXNlckxpc3RDdHJsJ1xuXHR9KTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnZm9jdXNNZScsIGZ1bmN0aW9uKCRwYXJzZSwgJHRpbWVvdXQpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XG5cdFx0XHR2YXIgc3RhdHVzID0gJHBhcnNlKGF0dHJzLmZvY3VzTWUpO1xuXHRcdFx0c2NvcGUuJHdhdGNoKHN0YXR1cywgZnVuY3Rpb24odmFsKXtcblx0XHRcdFx0Y29uc29sZS5sb2coJ3N0YXR1cyA9ICcsIHZhbCk7XG5cdFx0XHRcdGlmICh2YWwgPT09IHRydWUpe1xuXHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRlbGVtZW50WzBdLmZvY3VzKCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pOyIsIi8vIGFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4vLyAgICAgcmV0dXJuIHtcbi8vICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbi8vICAgICAgICAgc2NvcGU6IHt9LFxuLy8gICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4vLyAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4vLyAgICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcbi8vICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcbi8vICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQWJvdXQnLCBzdGF0ZTogJ2Fib3V0JyB9LFxuLy8gICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdEb2N1bWVudGF0aW9uJywgc3RhdGU6ICdkb2NzJyB9LFxuLy8gICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XG4vLyAgICAgICAgICAgICBdO1xuXG4vLyAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuLy8gICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbi8vICAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4vLyAgICAgICAgICAgICB9O1xuXG4vLyAgICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4vLyAgICAgICAgICAgICAgICAgfSk7XG4vLyAgICAgICAgICAgICB9O1xuXG4vLyAgICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbi8vICAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuLy8gICAgICAgICAgICAgICAgIH0pO1xuLy8gICAgICAgICAgICAgfTtcblxuLy8gICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4vLyAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4vLyAgICAgICAgICAgICB9O1xuXG4vLyAgICAgICAgICAgICBzZXRVc2VyKCk7XG5cbi8vICAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4vLyAgICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbi8vICAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuLy8gICAgICAgICB9XG5cbi8vICAgICB9O1xuXG4vLyB9KTtcblxuJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6IFwiRVwiLFxuXHRcdHRlbXBsYXRlVXJsOiBcImpzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbFwiXG5cdH1cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnb2F1dGhCdXR0b24nLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB7XG5cdFx0c2NvcGU6IHtcblx0XHRcdHByb3ZpZGVyTmFtZTogJ0AnXG5cdFx0fSxcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvb2F1dGgtYnV0dG9uL29hdXRoLWJ1dHRvbi5odG1sJ1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ3NlYXJjaGJhcicsIGZ1bmN0aW9uICgpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICcuLi9icm93c2VyL2NvbXBvbmVudHMvc2VhcmNoYmFyL3NlYXJjaGJhci5odG1sJ1xuXHR9XG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=