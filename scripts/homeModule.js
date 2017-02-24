(function () {

    "use strict";

    var homeModule = angular.module("homeModule", ["serviceModule"]);

    homeModule.controller("HomeController", function ($scope, $menuFocus, $wachedVideos) {
        //calling menuFocus service to change the focus on the main menu
        var menuFocus = function () {
            $menuFocus.startMenuFocus("menuHome", "menuLogin", "menuPlaylist");
        }
        menuFocus();

        //adding last watch videos to the scope (to be used in the footer html)
        $scope.wachedVideos = $wachedVideos.returnWachedVideos();
    });
})();