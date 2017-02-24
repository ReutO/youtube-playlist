(function () {

    "use strict";

    var watchVideoModule = angular.module("watchVideoModule", ["serviceModule"]);

    watchVideoModule.controller("WatchVideoController", function ($sce, $scope, $http, $menuFocus, $routeParams, $wachedVideos) {

        $scope.wachedVideos = $wachedVideos.returnWachedVideos();

        //calling menuFocus service
        var menuFocus = function () {
            $menuFocus.startMenuFocus("menuPlaylist", "menuLogin", "menuHome");
        }
        menuFocus();
        //Due to angular's $sce security limitations, we need to use "trustSrc" to allow replacing iFrame's src link.
        $scope.trustSrc = function (src) {
            return $sce.trustAsResourceUrl(src);
        };
        // cheacking if user registered
        //if registered, function takes the video key from the url.
        // if there is no key, function ask to select a video from playlist.
        // when there is a key, function adds to the scope
        $http.get("/isGuest")
            .then(function (response) {
                var res = response.data;
                if (res.code == 110 || res.code == 120) {  // case there's a problem reading / writing json file
                    $scope.user = { firstName: "Guest" }; //making sure the page will not display
                    $scope.modal = {
                        code: res.code,
                        message: res.message
                    }
                    $("#errorReadyModal").modal();
                } else if (res.code == 140) { //case user is a guest
                    $scope.user = { firstName: "Guest" };
                }else{
                    $scope.user = res.user;
                    $scope.playlist = res.playlist;
                    var videoKey = $routeParams.key;
                    for (var i = 0; i < $scope.playlist.length; i++) {
                        if ($scope.playlist[i].key == videoKey) {
                            $scope.video = $scope.playlist[i];
                            $scope.link = $scope.playlist[i].link;
                            saveVideoInClient($scope.video);
                            break;
                        }
                    }
                }
            })
            .catch(function (err) {
                $scope.user = { firstName: "Guest" }; //making sure the page will not display
                $scope.error = err;
                $("#errorModal").modal();
            })
    });

    //Adding 3 last video views to local storage
    //cheacking first if there is already the same video in the list already. if there is, function returns.
    // to be used at the footer
    function saveVideoInClient(video) {
        var wachedVideosString = localStorage.getItem("wachedVideos");
        var saveVideos = {};
        if (wachedVideosString) {
            var wachedVideos = JSON.parse(wachedVideosString);
            var firstVideo = wachedVideos.firstVideo;
            var secondVideo = wachedVideos.secondVideo;
            var thirdVideo = wachedVideos.thirdVideo;
            var prop;
            for (prop in wachedVideos) {
                if (wachedVideos[prop]) {
                    if (wachedVideos[prop].key == video.key) {
                        return;
                    }
                }
            }
            thirdVideo = secondVideo;
            secondVideo = firstVideo;
            firstVideo = video;
            saveVideos = {
                firstVideo: firstVideo,
                secondVideo: secondVideo,
                thirdVideo: thirdVideo
            }
        } else {
        saveVideos.firstVideo = video;
        }
        var saveVideoString = JSON.stringify(saveVideos);
        localStorage.setItem("wachedVideos", saveVideoString);
}
})();