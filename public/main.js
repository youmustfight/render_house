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

'use strict';

app.controller('ManagerController', function ($scope, $timeout) {

	// Navbar
	$scope.navbarExpand = false;

	// Collection Panel
	$scope.collectionOpen = false;
	$scope.collectionToggle = function () {
		if (!$scope.collectionOpen) $scope.collectionOpen = true;else {
			$scope.collectionOpen = false;
		}
	};

	//Collapse All
	$scope.collapseTop = function () {
		$scope.collectionOpen = false;
		$timeout(function () {
			$scope.navbarExpand = false;
		}, 200);
	};

	// Actual collection
	$scope.collection = [];
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

'use strict';

app.controller('LoginController', function ($scope) {
	$scope.letters = ['G', 'H', 'I'];
});
'use strict';

app.config(function ($stateProvider) {

	$stateProvider.state('login', {
		url: '/login',
		templateUrl: 'js/login/login.html',
		controller: 'LoginController'
	});
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

app.directive('collection', function () {
	return {
		restrict: 'E',
		templateUrl: 'js/components/collection/collection.html',
		controller: 'ManagerController'
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

app.directive('navbar', function () {
	return {
		restrict: "E",
		templateUrl: "js/components/navbar/navbar.html",
		controller: 'ManagerController'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZzYS1wcmUtYnVpbHQuanMiLCJjb21wb25lbnRzL21hbmFnZXIuY29udHJvbGxlci5qcyIsInNpZ24tdXAvc2lnblVwLmpzIiwibG9naW4vbG9naW4uY29udHJvbGxlci5qcyIsImxvZ2luL2xvZ2luLnN0YXRlLmpzIiwidXBsb2FkL3VwbG9hZC5jb250cm9sbGVyLmpzIiwidXBsb2FkL3VwbG9hZC5zdGF0ZS5qcyIsInByb2R1Y3QvbW9kZWwuZmFjdG9yeS5qcyIsInVzZXIvdXNlci5jb250cm9sbGVyLmpzIiwidXNlci91c2VyLnN0YXRlLmpzIiwidXRpbHMvZmllbGRGb2N1cy5kaXJlY3RpdmUuanMiLCJ1dGlscy9zaWduLXVwLWZhY3RvcnkuanMiLCJjb21wb25lbnRzL2NvbGxlY3Rpb24vY29sbGVjdGlvbi5kaXJlY3RpdmUuanMiLCJjb21wb25lbnRzL3NlYXJjaGJhci9zZWFyY2hiYXIuZGlyZWN0aXZlLmpzIiwiY29tcG9uZW50cy9uYXZiYXIvbmF2YmFyLmRpcmVjdGl2ZS5qcyIsInByb2R1Y3QvbGlzdGluZy9saXN0aW5nLmNvbnRyb2xsZXIuanMiLCJwcm9kdWN0L2xpc3RpbmcvbGlzdGluZy5zdGF0ZS5qcyIsInByb2R1Y3QvcmVuZGVyL3JlbmRlci5jb250cm9sbGVyLmpzIiwicHJvZHVjdC9yZW5kZXIvcmVuZGVyLmRpcmVjdGl2ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFBLENBQUE7QUFDQSxJQUFBLEdBQUEsR0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLHVCQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsYUFBQSxDQUFBLENBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsa0JBQUEsRUFBQSxpQkFBQSxFQUFBOztBQUVBLGtCQUFBLENBQUEsU0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOzs7QUFHQSxHQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7OztBQUdBLEtBQUEsNEJBQUEsR0FBQSxTQUFBLDRCQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsU0FBQSxLQUFBLENBQUEsSUFBQSxJQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQSxDQUFBO0VBQ0EsQ0FBQTs7OztBQUlBLFdBQUEsQ0FBQSxHQUFBLENBQUEsbUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUE7O0FBRUEsTUFBQSxDQUFBLDRCQUFBLENBQUEsT0FBQSxDQUFBLEVBQUE7OztBQUdBLFVBQUE7R0FDQTs7QUFFQSxNQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0EsVUFBQTtHQUNBOzs7QUFHQSxPQUFBLENBQUEsY0FBQSxFQUFBLENBQUE7O0FBRUEsYUFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTs7OztBQUlBLE9BQUEsV0FBQSxHQUFBLElBQUEsR0FBQSxPQUFBLENBQUEsSUFBQSxHQUFBLE9BQUEsQ0FBQTtBQUNBLFNBQUEsQ0FBQSxFQUFBLENBQUEsV0FBQSxDQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7RUFFQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUMvQ0EsQ0FBQSxZQUFBOztBQUVBLGFBQUEsQ0FBQTs7O0FBR0EsS0FBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSx3QkFBQSxDQUFBLENBQUE7O0FBRUEsS0FBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLE1BQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBO0FBQ0EsU0FBQSxNQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7RUFDQSxDQUFBLENBQUE7Ozs7O0FBS0EsSUFBQSxDQUFBLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxjQUFBLEVBQUEsb0JBQUE7QUFDQSxhQUFBLEVBQUEsbUJBQUE7QUFDQSxlQUFBLEVBQUEscUJBQUE7QUFDQSxnQkFBQSxFQUFBLHNCQUFBO0FBQ0Esa0JBQUEsRUFBQSx3QkFBQTtBQUNBLGVBQUEsRUFBQSxxQkFBQTtFQUNBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLENBQUEsT0FBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLE1BQUEsVUFBQSxHQUFBO0FBQ0EsTUFBQSxFQUFBLFdBQUEsQ0FBQSxnQkFBQTtBQUNBLE1BQUEsRUFBQSxXQUFBLENBQUEsYUFBQTtBQUNBLE1BQUEsRUFBQSxXQUFBLENBQUEsY0FBQTtBQUNBLE1BQUEsRUFBQSxXQUFBLENBQUEsY0FBQTtHQUNBLENBQUE7QUFDQSxTQUFBO0FBQ0EsZ0JBQUEsRUFBQSx1QkFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsVUFBQSxDQUFBLFVBQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7SUFDQTtHQUNBLENBQUE7RUFDQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FBQSxFQUNBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsVUFBQSxTQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLENBQUEsQ0FBQTtHQUNBLENBQ0EsQ0FBQSxDQUFBO0VBQ0EsQ0FBQSxDQUFBOztBQUVBLElBQUEsQ0FBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLEVBQUEsRUFBQTs7QUFFQSxXQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsT0FBQSxJQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEVBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxhQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQTtHQUNBOzs7O0FBSUEsTUFBQSxDQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsVUFBQSxDQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQTtHQUNBLENBQUE7O0FBRUEsTUFBQSxDQUFBLGVBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQTs7Ozs7Ozs7OztBQVVBLE9BQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxJQUFBLFVBQUEsS0FBQSxJQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0lBQ0E7Ozs7O0FBS0EsVUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0EsV0FBQSxJQUFBLENBQUE7SUFDQSxDQUFBLENBQUE7R0FFQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxVQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQ0EsQ0FBQSxZQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLEVBQUEsT0FBQSxFQUFBLDRCQUFBLEVBQUEsQ0FBQSxDQUFBO0lBQ0EsQ0FBQSxDQUFBO0dBQ0EsQ0FBQTs7QUFFQSxNQUFBLENBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxVQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxXQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQSxhQUFBLENBQUEsQ0FBQTtJQUNBLENBQUEsQ0FBQTtHQUNBLENBQUE7RUFFQSxDQUFBLENBQUE7O0FBRUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBOztBQUVBLE1BQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxPQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsY0FBQSxFQUFBLFlBQUE7QUFDQSxPQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7O0FBRUEsTUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxNQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxNQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLE9BQUEsQ0FBQSxFQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsT0FBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7R0FDQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxPQUFBLEdBQUEsWUFBQTtBQUNBLE9BQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsT0FBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7R0FDQSxDQUFBO0VBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxFQUFBLENBQUE7O0FDcElBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBOzs7QUFHQSxPQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTs7O0FBR0EsT0FBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsZ0JBQUEsR0FBQSxZQUFBO0FBQ0EsTUFBQSxDQUFBLE1BQUEsQ0FBQSxjQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsR0FBQSxJQUFBLENBQUEsS0FDQTtBQUNBLFNBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBO0dBQ0E7RUFDQSxDQUFBOzs7QUFHQSxPQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxRQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxZQUFBO0FBQ0EsU0FBQSxDQUFBLFlBQUEsR0FBQSxLQUFBLENBQUE7R0FDQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0VBQ0EsQ0FBQTs7O0FBR0EsT0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUMzQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxlQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLHlCQUFBO0FBQ0EsWUFBQSxFQUFBLFlBQUE7RUFDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxPQUFBLENBQUEsS0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLE9BQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUE7O0FBRUEsUUFBQSxDQUFBLEtBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLFNBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7R0FDQSxDQUFBLFNBQUEsQ0FBQSxZQUFBO0FBQ0EsU0FBQSxDQUFBLEtBQUEsR0FBQSw0QkFBQSxDQUFBO0dBQ0EsQ0FBQSxDQUFBO0VBRUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxRQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtHQUNBLENBQUEsQ0FBQTtFQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7O0FDakNBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxPQUFBLENBQUEsT0FBQSxHQUFBLENBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ0pBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGVBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsS0FBQSxFQUFBLFFBQUE7QUFDQSxhQUFBLEVBQUEscUJBQUE7QUFDQSxZQUFBLEVBQUEsaUJBQUE7RUFDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNWQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxrQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLEVBRUEsQ0FBQSxDQUFBO0FDSkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLHVCQUFBO0FBQ0EsWUFBQSxFQUFBLGtCQUFBO0VBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOzs7QUFHQSxLQUFBLFNBQUEsR0FBQTtBQUNBLGNBQUEsRUFBQSwyQ0FBQTtBQUNBLFNBQUEsRUFBQSxXQUFBO0VBQ0EsQ0FBQTs7O0FBSUEsVUFBQSxLQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsU0FBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLEVBQUEsS0FBQSxDQUFBLENBQUE7RUFDQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxHQUFBLEdBQUEsYUFBQSxDQUFBO0FBQ0EsT0FBQSxDQUFBLGNBQUEsQ0FBQSxLQUFBLENBQUEsU0FBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxlQUFBO0FBQ0EsVUFBQSxLQUFBLENBQUEsR0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLENBQUE7R0FDQTtFQUNBLENBQUEsQ0FBQTs7O0FBSUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxLQUFBLEdBQUEsWUFBQTtBQUNBLFNBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsVUFBQSxJQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7R0FDQSxDQUFBLENBQUE7RUFDQSxDQUFBOztBQUVBLE1BQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTs7Ozs7O0FBTUEsU0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsU0FBQSxDQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHNDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLGlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxzQ0FBQTtBQUNBLGVBQUEsRUFBQSwyQ0FBQTtBQUNBLFVBQUEsRUFBQSxXQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw4QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEsc0NBQUE7QUFDQSxlQUFBLEVBQUEsMkNBQUE7QUFDQSxVQUFBLEVBQUEsV0FBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHNDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLGlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxzQ0FBQTtBQUNBLGVBQUEsRUFBQSwyQ0FBQTtBQUNBLFVBQUEsRUFBQSxXQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw4QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEsc0NBQUE7QUFDQSxlQUFBLEVBQUEsMkNBQUE7QUFDQSxVQUFBLEVBQUEsV0FBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHNDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLGlCQUFBO0FBQ0Esa0JBQUEsRUFBQSxzQ0FBQTtBQUNBLGVBQUEsRUFBQSwyQ0FBQTtBQUNBLFVBQUEsRUFBQSxXQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw4QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxRQUFBO0FBQ0Esa0JBQUEsRUFBQSw4QkFBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0FBQ0EsT0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLFlBQUEsQ0FBQTtHQUNBLEVBQ0E7QUFDQSxNQUFBLEVBQUEsS0FBQTtBQUNBLFFBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEsc0NBQUE7QUFDQSxlQUFBLEVBQUEsMkNBQUE7QUFDQSxVQUFBLEVBQUEsV0FBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQTtBQUNBLGtCQUFBLEVBQUEsOEJBQUE7QUFDQSxlQUFBLEVBQUEsb0JBQUE7QUFDQSxVQUFBLEVBQUEsZUFBQTtBQUNBLE9BQUEsRUFBQSxDQUFBLFdBQUEsRUFBQSxZQUFBLENBQUE7R0FDQSxFQUNBO0FBQ0EsTUFBQSxFQUFBLEtBQUE7QUFDQSxRQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLHNDQUFBO0FBQ0EsZUFBQSxFQUFBLDJDQUFBO0FBQ0EsVUFBQSxFQUFBLFdBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxDQUFBO0dBQ0EsRUFDQTtBQUNBLE1BQUEsRUFBQSxLQUFBO0FBQ0EsUUFBQSxFQUFBLFFBQUE7QUFDQSxrQkFBQSxFQUFBLDhCQUFBO0FBQ0EsZUFBQSxFQUFBLG9CQUFBO0FBQ0EsVUFBQSxFQUFBLGVBQUE7QUFDQSxPQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsWUFBQSxDQUFBO0dBQ0EsQ0FBQSxDQUFBO0VBRUEsQ0FBQTs7O0FBSUEsTUFBQSxDQUFBLGNBQUEsR0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxZQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsU0FBQSxTQUFBLENBQUE7RUFDQSxDQUFBO0FBQ0EsTUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBOztBQUVBLFdBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsRUFBQSxlQUFBO0dBQ0EsQ0FBQTtFQUNBLENBQUE7QUFDQSxNQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxTQUFBLFNBQUEsQ0FBQSxZQUFBLENBQUE7RUFDQSxDQUFBO0FBQ0EsTUFBQSxDQUFBLFFBQUEsR0FBQSxZQUFBO0FBQ0EsU0FBQSxTQUFBLENBQUE7RUFDQSxDQUFBOztBQUlBLFFBQUEsS0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDbFJBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsRUFJQSxDQUFBLENBQUE7QUNOQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsS0FBQSxFQUFBLFdBQUE7QUFDQSxhQUFBLEVBQUEsNEJBQUE7QUFDQSxZQUFBLEVBQUEsZ0JBQUE7QUFDQSxTQUFBLEVBQUE7QUFDQSxPQUFBLEVBQUEsY0FBQSxJQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsUUFBQSxJQUFBLEdBQUEsSUFBQSxJQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsWUFBQSxDQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSxXQUFBLElBQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQTtJQUNBO0dBQ0E7RUFDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDZEEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFFBQUEsRUFBQTtBQUNBLFFBQUE7QUFDQSxVQUFBLEVBQUEsR0FBQTtBQUNBLE1BQUEsRUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsT0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQTtBQUNBLFFBQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxFQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLEVBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxRQUFBLEdBQUEsS0FBQSxJQUFBLEVBQUE7QUFDQSxhQUFBLENBQUEsWUFBQTtBQUNBLGFBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQTtNQUNBLENBQUEsQ0FBQTtLQUNBO0lBQ0EsQ0FBQSxDQUFBO0dBQ0E7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ2hCQSxHQUFBLENBQUEsT0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsU0FBQSxFQUFBO0FBQ0EsUUFBQTtBQUNBLFFBQUEsRUFBQSxnQkFBQSxXQUFBLEVBQUE7QUFDQSxVQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLFdBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTtJQUNBLENBQUEsQ0FBQTtHQUNBOztBQUVBLFVBQUEsRUFBQSxvQkFBQTtBQUNBLFVBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7SUFDQSxDQUFBLENBQUE7R0FDQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDZkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsWUFBQSxFQUFBLFlBQUE7QUFDQSxRQUFBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsMENBQUE7QUFDQSxZQUFBLEVBQUEsbUJBQUE7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFlBQUE7QUFDQSxRQUFBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsd0NBQUE7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUEEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxFQUFBLFlBQUE7QUFDQSxRQUFBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsa0NBQUE7QUFDQSxZQUFBLEVBQUEsbUJBQUE7RUFDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ1JBLFlBQUEsQ0FBQTs7QUFFQSxHQUFBLENBQUEsVUFBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxPQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxTQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLE9BQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtFQUNBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNYQSxZQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTs7QUFFQSxlQUFBLENBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQTtBQUNBLEtBQUEsRUFBQSxHQUFBO0FBQ0EsYUFBQSxFQUFBLGlDQUFBO0FBQ0EsWUFBQSxFQUFBLG1CQUFBO0FBQ0EsU0FBQSxFQUFBO0FBQ0EsU0FBQSxFQUFBLGdCQUFBLEtBQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLENBQUE7QUFDQSxXQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTtJQUNBO0dBQ0E7RUFDQSxDQUFBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNoQkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsa0JBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUE7O0FBRUEsT0FBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBO0FBQ0EsU0FBQSxLQUFBLENBQUEsV0FBQSxFQUFBLENBQUE7RUFDQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFFBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQSxDQUFBO0VBQ0EsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDWkEsWUFBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxTQUFBLENBQUEsU0FBQSxFQUFBLFlBQUE7QUFDQSxRQUFBO0FBQ0EsVUFBQSxFQUFBLEdBQUE7QUFDQSxPQUFBLEVBQUE7QUFDQSxRQUFBLEVBQUEsZUFBQTtHQUNBO0FBQ0EsWUFBQSxFQUFBLGtCQUFBO0FBQ0EsTUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUE7OztBQUdBLFFBQUEsQ0FBQSxXQUFBLEdBQUEsQ0FBQSxDQUFBLGVBQUEsQ0FBQSxDQUFBO0FBQ0EsT0FBQSxnQkFBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLENBQUE7QUFDQSxPQUFBLGlCQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQTtBQUNBLE9BQUEseUJBQUEsR0FBQSxnQkFBQSxHQUFBLElBQUEsQ0FBQTs7O0FBR0EsT0FBQSxNQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLE9BQUEsS0FBQSxDQUFBO0FBQ0EsUUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxPQUFBLFFBQUEsQ0FBQTtBQUNBLFFBQUEsQ0FBQSxRQUFBLEdBQUEsUUFBQSxDQUFBO0FBQ0EsT0FBQSxRQUFBLENBQUE7QUFDQSxRQUFBLENBQUEsUUFBQSxHQUFBLFFBQUEsQ0FBQTs7O0FBR0EsT0FBQSxFQUFBLENBQUE7OztBQUdBLE9BQUEsT0FBQSxHQUFBLElBQUEsS0FBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO0FBQ0EsT0FBQSxPQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsVUFBQSxFQUFBLENBQUE7OztBQUdBLFFBQUEsQ0FBQSxNQUFBLENBQUEsb0JBQUEsRUFBQSxVQUFBLFFBQUEsRUFBQSxRQUFBLEVBQUE7QUFDQSxRQUFBLFFBQUEsSUFBQSxRQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7S0FDQTtJQUNBLENBQUEsQ0FBQTs7O0FBR0EsWUFBQSxTQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBLEdBQUEseUJBQUEsQ0FBQTtBQUNBLFdBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFdBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtBQUNBLFNBQUEsUUFBQSxFQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBOztBQUVBLGFBQUEsR0FBQSxNQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7SUFDQTs7O0FBR0EsWUFBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLEVBQUEsQ0FBQTs7O0FBR0EsWUFBQSxJQUFBLEdBQUE7OztBQUdBLFVBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxpQkFBQSxDQUFBLEVBQUEsRUFBQSxnQkFBQSxHQUFBLGlCQUFBLEVBQUEsQ0FBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTs7O0FBR0EsU0FBQSxHQUFBLElBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxDQUFBOzs7O0FBSUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLEtBQUEsQ0FBQSxZQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsQ0FBQTs7QUFFQSxRQUFBLGdCQUFBLEdBQUEsSUFBQSxLQUFBLENBQUEsZ0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsUUFBQSxDQUFBLFNBQUEsRUFBQSxDQUFBO0FBQ0EsU0FBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7OztBQUdBLFlBQUEsR0FBQSxJQUFBLEtBQUEsQ0FBQSxhQUFBLENBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxPQUFBLENBQUEsZ0JBQUEsRUFBQSxpQkFBQSxDQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsYUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsV0FBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLFdBQUEsQ0FBQSxRQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxnQkFBQSxDQUFBLFFBQUEsRUFBQSxjQUFBLEVBQUEsS0FBQSxDQUFBLENBQUE7OztJQUdBOzs7QUFHQSxZQUFBLGNBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsaUJBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxLQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsRUFBQSxHQUFBLGlCQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsc0JBQUEsRUFBQSxDQUFBO0lBQ0E7OztBQUdBLE9BQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsT0FBQSxHQUFBO0FBQ0EsVUFBQSxFQUFBLENBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO0lBQ0E7OztBQUdBLFlBQUEsTUFBQSxHQUFBO0FBQ0EsUUFBQSxLQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsRUFBQSxHQUFBLE9BQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO0lBQ0E7R0FDQTtFQUNBLENBQUE7Q0FDQSxDQUFBLENBQUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWyd1aS5yb3V0ZXInLCAnZnNhUHJlQnVpbHQnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSkge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IHVzZXIgPyB0b1N0YXRlLm5hbWUgOiAnbG9naW4nO1xuICAgICAgICAgICAgJHN0YXRlLmdvKGRlc3RpbmF0aW9uKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdNYW5hZ2VyQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgJHRpbWVvdXQpe1xuXG5cdC8vIE5hdmJhclxuXHQkc2NvcGUubmF2YmFyRXhwYW5kID0gZmFsc2U7XG5cdFxuXHQvLyBDb2xsZWN0aW9uIFBhbmVsXG5cdCRzY29wZS5jb2xsZWN0aW9uT3BlbiA9IGZhbHNlO1xuXHQkc2NvcGUuY29sbGVjdGlvblRvZ2dsZSA9IGZ1bmN0aW9uKCl7XG5cdFx0aWYgKCEkc2NvcGUuY29sbGVjdGlvbk9wZW4pICRzY29wZS5jb2xsZWN0aW9uT3BlbiA9IHRydWU7XG5cdFx0ZWxzZSB7XG5cdFx0XHQkc2NvcGUuY29sbGVjdGlvbk9wZW4gPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvL0NvbGxhcHNlIEFsbFxuXHQkc2NvcGUuY29sbGFwc2VUb3AgPSBmdW5jdGlvbigpe1xuXHRcdCRzY29wZS5jb2xsZWN0aW9uT3BlbiA9IGZhbHNlO1xuXHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHQkc2NvcGUubmF2YmFyRXhwYW5kID0gZmFsc2U7XG5cdFx0fSwgMjAwKTtcblx0fVxuXG5cdC8vIEFjdHVhbCBjb2xsZWN0aW9uXG5cdCRzY29wZS5jb2xsZWN0aW9uID0gW11cblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWduVXAnLCB7XG4gICAgICAgIHVybDogJy9zaWdudXAnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3NpZ24tdXAvc2lnbi11cC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1NpZ25VcEN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignU2lnblVwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIFNpZ25VcCwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRTaWduVXAgPSBmdW5jdGlvbiAoc2lnblVwSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgU2lnblVwLnNpZ251cChzaWduVXBJbmZvKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG4gICAgXG4gICAgJHNjb3BlLmdldFVzZXJzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgU2lnblVwLmdldFVzZXJzKCkudGhlbihmdW5jdGlvbih1c2Vycyl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh1c2VycylcbiAgICAgICAgfSlcbiAgICB9XG5cbn0pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUpe1xuXHQkc2NvcGUubGV0dGVycyA9IFsnRycsJ0gnLCdJJ107XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpe1xuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcblx0XHR1cmw6ICcvbG9naW4nLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0xvZ2luQ29udHJvbGxlcidcblx0fSk7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1VwbG9hZENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUpe1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKXtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3VwbG9hZCcsIHtcblx0XHR1cmw6ICcvdXBsb2FkJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3VwbG9hZC91cGxvYWQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VwbG9hZENvbnRyb2xsZXInXG5cdH0pO1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnTW9kZWwnLCBmdW5jdGlvbigkaHR0cCl7XG5cblx0Ly8gQ3VycmVudGx5IFJlbmRlcmVkIE9iamVjdFxuXHR2YXIgcmVuZGVyT2JqID0ge1xuXHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJ1xuXHR9O1xuXG5cblx0Ly8gTW9kZWwgQ29uc3RydWN0b3Jcblx0ZnVuY3Rpb24gTW9kZWwgKHByb3BzKSB7XG5cdFx0YW5ndWxhci5leHRlbmQodGhpcywgcHJvcHMpO1xuXHR9O1xuXG5cdE1vZGVsLnVybCA9ICdhcGkvcHJvZHVjdCdcblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KE1vZGVsLnByb3RvdHlwZSwgJ3VybCcsIHtcblx0XHRnZXQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBNb2RlbC51cmwgKyB0aGlzLl9pZDtcblx0XHR9XG5cdH0pO1xuXG5cblx0Ly8gTGlzdGluZyBGdW5jdGlvbmFsaXR5XG5cdE1vZGVsLnByb3RvdHlwZS5mZXRjaCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuICRodHRwLmdldCh0aGlzLnVybCkudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRyZXR1cm4gbmV3IE1vZGVsKHJlcy5kYXRhKTtcblx0XHR9KTtcblx0fVxuXG5cdE1vZGVsLmZldGNoQWxsID0gZnVuY3Rpb24oKXtcblx0XHQvLyByZXR1cm4gJGh0cHAuZ2V0KE1vZGVsLnVybCkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuXHRcdC8vIFx0cmV0dXJuIHJlcy5kYXRhLm1hcChmdW5jdGlvbiAob2JqKSB7XG5cdFx0Ly8gXHRcdHJldHVybiBuZXcgTW9kZWwob2JqKTtcblx0XHQvLyBcdH0pO1xuXHRcdC8vIH0pO1xuXHRcdGNvbnNvbGUubG9nKCk7XG5cdFx0cmV0dXJuIFtcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTI0MjQsXG5cdFx0XHR0aXRsZTogJ0Zsb2F0aW5nIElzbGFuZCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9mbG9hdGluZ0lzbGFuZC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL3VudGl0bGVkLXNjZW5lL3VudGl0bGVkLXNjZW5lLmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01hcnkgQW5uZScsXG5cdFx0XHR0YWdzOiBbJ0Vudmlyb25tZW50JywnTG93LVBvbHknXVxuXHRcdH0sIFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fSxcblx0XHR7XG5cdFx0XHRfaWQ6IDEyNDI0LFxuXHRcdFx0dGl0bGU6ICdGbG9hdGluZyBJc2xhbmQnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvZmxvYXRpbmdJc2xhbmQucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy91bnRpdGxlZC1zY2VuZS91bnRpdGxlZC1zY2VuZS5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNYXJ5IEFubmUnLFxuXHRcdFx0dGFnczogWydFbnZpcm9ubWVudCcsJ0xvdy1Qb2x5J11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LCBcblx0XHR7XG5cdFx0XHRfaWQ6IDEyMzYyLFxuXHRcdFx0dGl0bGU6ICdCYXltYXgnLFxuXHRcdFx0c25hcHNob3RGaWxlVXJsOiAnL2ltYWdlcy9zbmFwc2hvdHMvYmF5bWF4LnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvYmF5bWF4Lmpzb24nLFxuXHRcdFx0Y3JlYXRvcjogJ01pbHRvbiBHbGFzZXInLFxuXHRcdFx0dGFnczogWydDaGFyYWN0ZXInLCdGdXR1cmlzdGljJ11cblx0XHR9LFxuXHRcdHtcblx0XHRcdF9pZDogMTIzNjIsXG5cdFx0XHR0aXRsZTogJ0JheW1heCcsXG5cdFx0XHRzbmFwc2hvdEZpbGVVcmw6ICcvaW1hZ2VzL3NuYXBzaG90cy9iYXltYXgucG5nJyxcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcicsXG5cdFx0XHR0YWdzOiBbJ0NoYXJhY3RlcicsJ0Z1dHVyaXN0aWMnXVxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjQyNCxcblx0XHRcdHRpdGxlOiAnRmxvYXRpbmcgSXNsYW5kJyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2Zsb2F0aW5nSXNsYW5kLnBuZycsXG5cdFx0XHRtb2RlbEZpbGVVcmw6ICdtb2RlbHMvdW50aXRsZWQtc2NlbmUvdW50aXRsZWQtc2NlbmUuanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWFyeSBBbm5lJyxcblx0XHRcdHRhZ3M6IFsnRW52aXJvbm1lbnQnLCdMb3ctUG9seSddXG5cdFx0fSwgXG5cdFx0e1xuXHRcdFx0X2lkOiAxMjM2Mixcblx0XHRcdHRpdGxlOiAnQmF5bWF4Jyxcblx0XHRcdHNuYXBzaG90RmlsZVVybDogJy9pbWFnZXMvc25hcHNob3RzL2JheW1heC5wbmcnLFxuXHRcdFx0bW9kZWxGaWxlVXJsOiAnbW9kZWxzL2JheW1heC5qc29uJyxcblx0XHRcdGNyZWF0b3I6ICdNaWx0b24gR2xhc2VyJyxcblx0XHRcdHRhZ3M6IFsnQ2hhcmFjdGVyJywnRnV0dXJpc3RpYyddXG5cdFx0fV07XG5cblx0fVxuXG5cblx0Ly8gUmVuZGVyZXIgRnVuY3Rpb25hbGl0eVxuXHRNb2RlbC5jaGFuZ2VNb2RlbFVybCA9IGZ1bmN0aW9uIChuZXdVcmwpIHtcblx0XHRyZW5kZXJPYmoubW9kZWxGaWxlVXJsID0gbmV3VXJsO1xuXHRcdHJldHVybiByZW5kZXJPYmo7XG5cdH07XG5cdE1vZGVsLmNoYW5nZU1vZGVsID0gZnVuY3Rpb24gKCkge1xuXHRcdC8vIFRlbXAgYXR0cmlidXRlcyBmb3IgdGVzdGluZ1xuXHRcdHJlbmRlck9iaiA9IHtcblx0XHRcdG1vZGVsRmlsZVVybDogJ21vZGVscy9iYXltYXguanNvbicsXG5cdFx0XHRjcmVhdG9yOiAnTWlsdG9uIEdsYXNlcidcblx0XHR9XG5cdH07XG5cdE1vZGVsLmdldE1vZGVsVXJsID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiByZW5kZXJPYmoubW9kZWxGaWxlVXJsO1xuXHR9O1xuXHRNb2RlbC5nZXRNb2RlbCA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gcmVuZGVyT2JqO1xuXHR9O1xuXG5cblxuXHRyZXR1cm4gTW9kZWw7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1VzZXJDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSl7XG5cblxuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2VyJywge1xuXHRcdHVybDogJy91c2VyLzppZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvYnJvd3Nlci9qcy91c2VyL3VzZXIuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1VzZXJDb250cm9sbGVyJyxcblx0XHRyZXNvbHZlOiB7XG5cdFx0XHR1c2VyOiBmdW5jdGlvbiAoVXNlciwgJHN0YXRlUGFyYW1zKSB7XG5cdFx0XHRcdHZhciB1c2VyID0gbmV3IFVzZXIoe19pZDogJHN0YXRlUGFyYW1zLmlkfSk7XG5cdFx0XHRcdHJldHVybiB1c2VyLmZldGNoKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnZmllbGRGb2N1cycsIGZ1bmN0aW9uKCRwYXJzZSwgJHRpbWVvdXQpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnQScsXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XG5cdFx0XHR2YXIgc3RhdHVzID0gJHBhcnNlKGF0dHJzLmZpZWxkRm9jdXMpO1xuXHRcdFx0c2NvcGUuJHdhdGNoKHN0YXR1cywgZnVuY3Rpb24odmFsKXtcblx0XHRcdFx0Y29uc29sZS5sb2coJ3N0YXR1cyA9ICcsIHZhbCk7XG5cdFx0XHRcdGlmICh2YWwgPT09IHRydWUpe1xuXHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRlbGVtZW50WzBdLmZvY3VzKCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pIiwiXG5hcHAuZmFjdG9yeSgnU2lnblVwJywgZnVuY3Rpb24gKCRodHRwLCAkc3RhdGUsICRsb2NhdGlvbikge1xuXHRyZXR1cm57XG5cdFx0c2lnbnVwOiBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcblx0XHRyZXR1cm4gJGh0dHAucG9zdCgnYXBpL3VzZXInLCBjcmVkZW50aWFscykudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRyZXR1cm4gcmVzLmRhdGE7XG5cdFx0fSk7XG5cdFx0fSxcblxuICAgICAgICBnZXRVc2VyczogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJ2FwaS91c2VyJykudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cdH1cbn0pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ2NvbGxlY3Rpb24nLCBmdW5jdGlvbigpe1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21wb25lbnRzL2NvbGxlY3Rpb24vY29sbGVjdGlvbi5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnTWFuYWdlckNvbnRyb2xsZXInXG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnc2VhcmNoYmFyJywgZnVuY3Rpb24gKCl7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbXBvbmVudHMvc2VhcmNoYmFyL3NlYXJjaGJhci5odG1sJ1xuXHR9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogXCJFXCIsXG5cdFx0dGVtcGxhdGVVcmw6IFwianMvY29tcG9uZW50cy9uYXZiYXIvbmF2YmFyLmh0bWxcIixcblx0XHRjb250cm9sbGVyOiAnTWFuYWdlckNvbnRyb2xsZXInXG5cdH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ0xpc3RpbmdDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgbW9kZWxzLCBNb2RlbCkge1xuXG4gICAgJHNjb3BlLmNoYW5nZU1vZGVsID0gZnVuY3Rpb24oKXtcbiAgICBcdGNvbnNvbGUubG9nKCRzY29wZS5tb2RlbHMpO1xuICAgIFx0TW9kZWwuY2hhbmdlTW9kZWwoKTtcbiAgICB9XG5cbiAgICAkc2NvcGUubW9kZWxzID0gbW9kZWxzO1xuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoIGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKXtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGlzdGluZycsIHtcblx0XHR1cmw6ICcvJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvbGlzdGluZy9saXN0aW5nLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdMaXN0aW5nQ29udHJvbGxlcicsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0bW9kZWxzOiBmdW5jdGlvbiAoTW9kZWwpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coTW9kZWwuZmV0Y2hBbGwoKSk7XG5cdFx0XHRcdHJldHVybiBNb2RlbC5mZXRjaEFsbCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmNvbnRyb2xsZXIoJ1JlbmRlckNvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBNb2RlbCkge1xuXG5cdCRzY29wZS5tb2RlbCA9IE1vZGVsLmdldE1vZGVsKCk7XG5cdFxuXHQkc2NvcGUuJHdhdGNoKGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIE1vZGVsLmdldE1vZGVsVXJsKClcblx0fSwgZnVuY3Rpb24gKG5ld1ZhbCwgb2xkVmFsKXtcblx0XHQkc2NvcGUubW9kZWwgPSBNb2RlbC5nZXRNb2RlbCgpOyBcblx0fSk7XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnbmdXZWJnbCcsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIG1vZGVsOiAnPW1vZGVsRmlsZVVybCdcbiAgICAgIH0sXG4gICAgICBjb250cm9sbGVyOiBcIlJlbmRlckNvbnRyb2xsZXJcIixcbiAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbWVudCwgYXR0cikge1xuXG4gICAgICAgIC8vIFNldHVwIHNlbGVjdGlvbnNcbiAgICAgICAgc2NvcGUucmVuZGVyRnJhbWUgPSAkKCcjcmVuZGVyLWZyYW1lJyk7XG4gICAgICAgIHZhciByZW5kZXJGcmFtZVdpZHRoID0gc2NvcGUucmVuZGVyRnJhbWUud2lkdGgoKTtcbiAgICAgICAgdmFyIHJlbmRlckZyYW1lSGVpZ2h0ID0gc2NvcGUucmVuZGVyRnJhbWUuaGVpZ2h0KCk7XG4gICAgICAgIHZhciByZW5kZXJPYmplY3RTY2FsZU1vZGlmaWVyID0gcmVuZGVyRnJhbWVXaWR0aC8xMDI0O1xuXG4gICAgICAgIC8vIFNldHVwIFRIUkVFLmpzIHZhcmlhYmxlcyB3aXRoIHNjb3BlXG4gICAgICAgIHZhciBjYW1lcmE7XG4gICAgICAgICAgICBzY29wZS5jYW1lcmEgPSBjYW1lcmE7XG4gICAgICAgIHZhciBzY2VuZTtcbiAgICAgICAgICAgIHNjb3BlLnNjZW5lID0gc2NlbmU7XG4gICAgICAgIHZhciByZW5kZXJlcjtcbiAgICAgICAgICAgIHNjb3BlLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gICAgICAgIHZhciBwcmV2aW91cztcbiAgICAgICAgICAgIHNjb3BlLnByZXZpb3VzID0gcHJldmlvdXM7XG5cbiAgICAgICAgLy8gaW5pdGlhbGl6ZSBzY2VuZVxuICAgICAgICBpbml0KCk7XG5cbiAgICAgICAgLy8gbG9hZCBkZWZhdWx0IG1vZGVsIG9uIHNjb3BlIC0tIGplZXAgbW9kZWwgLS0gdmlhIEFzc2ltcEpTT05Mb2FkZXJcbiAgICAgICAgdmFyIGxvYWRlcjIgPSBuZXcgVEhSRUUuT2JqZWN0TG9hZGVyKCk7XG4gICAgICAgIHZhciBsb2FkZXIzID0gbmV3IFRIUkVFLkpTT05Mb2FkZXIoKTtcblxuICAgICAgICAvLyBXYXRjaCBmb3IgY2hhbmdlcyB0byBzY29wZVxuICAgICAgICBzY29wZS4kd2F0Y2goJ21vZGVsLm1vZGVsRmlsZVVybCcsIGZ1bmN0aW9uIChuZXdWYWx1ZSwgb2xkVmFsdWUpe1xuICAgICAgICAgIGlmIChuZXdWYWx1ZSAhPSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgbG9hZE1vZGVsKG5ld1ZhbHVlKTsgXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyEhIEhhbmRsZSByZW1vdmluZyBvYmplY3QgYW5kIGFkZGluZyBuZXcgb2JqZWN0XG4gICAgICAgIGZ1bmN0aW9uIGxvYWRNb2RlbChtb2RVcmwpIHtcbiAgICAgICAgICAgIGxvYWRlcjIubG9hZChtb2RVcmwsIGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgICAgICAgICAgb2JqZWN0LnNjYWxlLnggPSBvYmplY3Quc2NhbGUueSA9IG9iamVjdC5zY2FsZS56ID0gKC4wMjggKiByZW5kZXJPYmplY3RTY2FsZU1vZGlmaWVyKTtcbiAgICAgICAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnkgPSAuNTtcbiAgICAgICAgICAgICAgb2JqZWN0LnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgICAgICAgICBpZiAocHJldmlvdXMpIHNjZW5lLnJlbW92ZShwcmV2aW91cyk7XG4gICAgICAgICAgICAgIHNjZW5lLmFkZChvYmplY3QpO1xuXG4gICAgICAgICAgICAgIHByZXZpb3VzID0gb2JqZWN0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgIC8vIHJ1biBsb2FkIG1vZGVsIG9uIGN1cnJlbnQgbW9kZWxVcmxcbiAgICAgICAgbG9hZE1vZGVsKHNjb3BlLm1vZGVsLm1vZGVsRmlsZVVybCk7XG4gICAgICAgIGFuaW1hdGUoKTtcblxuICAgICAgICAvLyBTZXR1cCBUSFJFRS5qcyBjYW1lcmFzLCBzY2VuZSwgcmVuZGVyZXIsIGxpZ2h0aW5nXG4gICAgICAgIGZ1bmN0aW9uIGluaXQoKXtcblxuICAgICAgICAgIC8vIENhbWVyYVxuICAgICAgICAgIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg1MCwgcmVuZGVyRnJhbWVXaWR0aCAvIHJlbmRlckZyYW1lSGVpZ2h0LCAxLCAyMDAwKTtcbiAgICAgICAgICBjYW1lcmEucG9zaXRpb24uc2V0KDIsNCw1KTtcblxuICAgICAgICAgIC8vIFNjZW5lXG4gICAgICAgICAgc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcbiAgICAgICAgICAvLyBzY2VuZS5mb2cgPSBuZXcgVEhSRUUuRm9nRXhwMigweDAwMDAwMCwgMC4wMDAxKTtcblxuICAgICAgICAgIC8vIExpZ2h0c1xuICAgICAgICAgIHNjZW5lLmFkZChuZXcgVEhSRUUuQW1iaWVudExpZ2h0KDB4Y2NjY2NjKSk7XG5cbiAgICAgICAgICB2YXIgZGlyZWN0aW9uYWxMaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4Y2NjY2NjKTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLnggPSBNYXRoLnJhbmRvbSgpIC0gMC41O1xuICAgICAgICAgIGRpcmVjdGlvbmFsTGlnaHQucG9zaXRpb24ueSA9IE1hdGgucmFuZG9tKCkgLSAwLjU7XG4gICAgICAgICAgZGlyZWN0aW9uYWxMaWdodC5wb3NpdGlvbi56ID0gTWF0aC5yYW5kb20oKSAtIDAuNTtcbiAgICAgICAgICBkaXJlY3Rpb25hbExpZ2h0LnBvc2l0aW9uLm5vcm1hbGl6ZSgpO1xuICAgICAgICAgIHNjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0KTtcblxuICAgICAgICAgIC8vISEhISBSZW5kZXJlclxuICAgICAgICAgIHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoeyBhbnRpYWxpYXM6IHRydWUgfSk7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U2l6ZShyZW5kZXJGcmFtZVdpZHRoLCByZW5kZXJGcmFtZUhlaWdodCk7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvciggMHhmZmZmZmYgKTtcbiAgICAgICAgICBlbGVtZW50WzBdLmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgICAgICAgLy8gQ2hlY2sgZm9yIFJlc2l6ZSBFdmVudFxuICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBvbldpbmRvd1Jlc2l6ZSwgZmFsc2UpO1xuXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coc2NlbmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIFJlc2l6ZVxuICAgICAgICBmdW5jdGlvbiBvbldpbmRvd1Jlc2l6ZShldmVudCl7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U2l6ZShzY29wZS5yZW5kZXJGcmFtZS53aWR0aCgpLCByZW5kZXJGcmFtZUhlaWdodCk7XG4gICAgICAgICAgY2FtZXJhLmFzcGVjdCA9IHNjb3BlLnJlbmRlckZyYW1lLndpZHRoKCkgLyByZW5kZXJGcmFtZUhlaWdodDtcbiAgICAgICAgICBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQW5pbWF0ZVxuICAgICAgICB2YXIgdCA9IDA7IC8vID9cbiAgICAgICAgZnVuY3Rpb24gYW5pbWF0ZSgpIHsgICAgICAgICAgXG4gICAgICAgICAgcmVuZGVyKCk7XG4gICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIHJlLVJlbmRlcmluZyBvZiBzY2VuZSBmb3Igc3Bpbm5pbmdcbiAgICAgICAgZnVuY3Rpb24gcmVuZGVyKCl7IFxuICAgICAgICAgIHZhciB0aW1lciA9IERhdGUubm93KCkgKiAwLjAwMDE1O1xuICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnggPSBNYXRoLmNvcyh0aW1lcikgKiAxMDtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi55ID0gNDtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi56ID0gTWF0aC5zaW4odGltZXIpICogOC41O1xuICAgICAgICAgICAgY2FtZXJhLmxvb2tBdChzY2VuZS5wb3NpdGlvbik7XG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=