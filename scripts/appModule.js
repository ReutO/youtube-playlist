(function () {

    "use strict";

    var appModule = angular.module("appModule", ["ngRoute", "homeModule", "loginModule", "registerModule", "playlistModule", "watchVideoModule", "editVideoModule", "addVideoModule"]);

    appModule.config(function ($routeProvider) {
        $routeProvider.when("/home", {
            templateUrl: "/html/home.html",
            controller: "HomeController"
        })
        .when("/login", {
            templateUrl: "/html/login.html",
            controller: "LoginController"
        })
        .when("/register", {
            templateUrl: "/html/register.html",
            controller: "RegisterController"
        })
        .when("/playlist", {
            templateUrl: "/html/playlist.html",
            controller: "PlaylistController"
        })
        .when("/watchVideo/:key?", {
            templateUrl: "/html/watchVideo.html",
            controller: "WatchVideoController"
        })
        .when("/editVideo/:key?", {
            templateUrl: "/html/editVideo.html",
            controller: "EditVideoController"
        })
        .when("/addVideo", {
            templateUrl: "/html/addVideo.html",
            controller: "AddVideoController"
        })
        .otherwise({
            redirectTo: "/home"
        });

    });

})();