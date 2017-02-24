(function () {

    "use strict";

    var playlistModule = angular.module("playlistModule", ["serviceModule"]);

    playlistModule.controller("PlaylistController", function ($scope, $http, $menuFocus, $wachedVideos) {

        $scope.wachedVideos = $wachedVideos.returnWachedVideos();

        //calling menuFocus service to change the focus on the main menu
        var menuFocus = function () {
            $menuFocus.startMenuFocus("menuPlaylist", "menuLogin", "menuHome");
        }
        menuFocus();

        //cheacking if the user is registered and saving in scope the user details and playlist
        $http.get("/isGuest")
            .then(function (response) {
                var res = response.data;
                if (res.code == 110) {  // case there's a problem reading json file in the server
                    $scope.user = { firstName: "Guest" }; //making sure the page will not display
                    $scope.modal = {
                        code: res.code,
                        message: res.message
                    }
                    $("#errorReadyModal").modal();
                } else if (res.code == 140) { //case user is a guest
                    $scope.user = { firstName: "Guest" };
                } else if (res.user) {  //case success - reciving registered user
                    $scope.user = res.user;
                    $scope.playlist = res.playlist;
                } else {    // case the response is with errors
                    $scope.error = res;
                    $("#errorModal").modal();
                }
            })
            .catch(function (err) {
                $scope.error = err;
                $("#errorModal").modal();
            });

        //function for deleting video.
        // sending the key of the video to the server.
        // recieving different errors: user isn't registered, user not exist in data, no changes- video wasn't found in data, errors in writing/reading json.
        // in case of success, the video is deleted from last views in local storage, and the page is reloaded.
        $scope.deleteVideo = function (key) {
            $http.get("/deleteVideo/"+key)
            .then(function (response) {
                var res = response.data
                // case of different errors and video was not deleted:
                if (res.code > 100) {
                    $scope.modal = {
                        code: res.code,
                        message: res.message
                    }
                    $("#errorReadyModal").modal();
                    // case success:
                } else if (res.code == 100) {
                    var wachedVideosString = localStorage.getItem("wachedVideos");
                    if (wachedVideosString) {
                        var wachedVideos = JSON.parse(wachedVideosString);
                        var prop;
                        for (prop in wachedVideos) {
                            if (wachedVideos[prop].key == key) {
                                //re-arraging the propperties
                                if (prop == "firstVideo") {
                                    wachedVideos.firstVideo = wachedVideos.secondVideo;
                                    wachedVideos.secondVideo = wachedVideos.thirdVideo;
                                    delete wachedVideos.thirdVideo;
                                } else if (prop == "secondVideo") {
                                    wachedVideos.secondVideo = wachedVideos.thirdVideo;
                                    delete wachedVideos.thirdVideo;
                                } else if (prop == "thirdVideo") {
                                    delete wachedVideos.thirdVideo;
                                }
                                var saveVideoString = JSON.stringify(wachedVideos);
                                localStorage.setItem("wachedVideos", saveVideoString);
                                break;
                            }
                        }
                    }
                    location.reload();
                } else {    // case the response is with unexpected errors
                    $scope.error = res;
                    $("#errorModal").modal();
                }
            }), function (err) {
                $scope.user = { firstName: "Guest" }; //making sure the page will not display
                $scope.error = err;
                $("#errorModal").modal();
            }
        }

        //logout function - delete cookies and local storage
        $scope.logout = function () {
            if ($scope.wachedVideos) {
                localStorage.removeItem("wachedVideos");
            }
            document.cookie = "token" + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            location.reload();
        }
    });
})();