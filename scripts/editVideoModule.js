(function () {

    "use strict";

    var editVideoModule = angular.module("editVideoModule", ["serviceModule"]);

    editVideoModule.controller("EditVideoController", function ($scope, $http, $menuFocus, $routeParams, $embedUrl, $wachedVideos) {

        //adding last watch videos to the scope (to be used in the footer html)
        $scope.wachedVideos = $wachedVideos.returnWachedVideos();

        //calling menuFocus service to change the focus on the main menu
        var menuFocus = function () {
            $menuFocus.startMenuFocus("menuPlaylist", "menuLogin", "menuHome");
        }
        menuFocus();

        // cheacking if user registered
        //if registered, function takes the video key from the url.
        // if there is no key, function ask to select a video from playlist.
        // when there is a key, function adds to the scope to be used as a placeholder in html
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
                } else {
                    $scope.user = res.user;
                        $scope.playlist = res.playlist;
                        $scope.videoKey = $routeParams.key;
                        for (var i = 0; i < $scope.playlist.length; i++) {
                            if ($scope.playlist[i].key == $scope.videoKey) {
                                $scope.videoEdit = $scope.playlist[i];
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

        //edit video function
        // user can add a regular url from youtube, this function changes the url to embed link to put in iframe
        //if link is no good, function active modal and return.
        // errors: defected link, user isn't registered, user not exist in data, errors in writing/reading json
        // in case of sucsess, local storage is updated and user relocate to playlist.
        $scope.editVideo = function () {
            if ($scope.videoLink) {
                var pageURL = decodeURIComponent($scope.videoLink);
                var urlVariables = pageURL.substr(pageURL.indexOf("?") + 1).split('&');
                $scope.videoEdit.link = $embedUrl.createEmbedUrl(urlVariables); // calling embedUrl service to create embed link.
                if (!$scope.videoEdit.link) {
                    $scope.modal = {
                        title: "Video was not added",
                        message: "You might have entered a defected url"
                    }
                    $("#generalModal").modal();
                    return;
                }
            }
            $http.post("/videoChange", { videoChange: $scope.videoEdit })
                .then(function (response) {
                    var res = response.data;
                    if (res.code == 110 || res.code == 120) {  // case there's a problem reading / writing json file
                        $scope.modal = {
                            code: res.code,
                            message: res.message
                        }
                        $("#errorReadyModal").modal();
                    } else if (res.code == 130 || res.code == 140) {  //case user doesn't appear in data / not registered
                        $scope.modal = {
                            title: "Oops!",
                            message: res.message
                        }
                        $("#generalModal").modal();
                    } else if (res.code == 100) {  // case success
                        // cheacking if last views on local storage need to be updated
                        if ($scope.wachedVideos) {
                            var watchedVideosUpdate = $scope.wachedVideos;
                            var isVideoReplaced = false;
                            var prop;
                            for (prop in watchedVideosUpdate) {
                                if (watchedVideosUpdate[prop]) {
                                    if (watchedVideosUpdate[prop].key == $scope.videoEdit.key) {
                                        watchedVideosUpdate[prop] = $scope.videoEdit;
                                        isVideoReplaced = true;
                                        break;
                                    }
                                }
                            }
                            if (isVideoReplaced) {
                                var watchedVideosUpdateString = JSON.stringify(watchedVideosUpdate);
                                localStorage.setItem("wachedVideos", watchedVideosUpdateString);
                            }
                        }
                        location.hash = "#!/playlist";
                    } else {    // case the response is with uexpected errors
                        $scope.error = res;
                        $("#errorModal").modal();
                    }
                },function (err) {
                    $scope.error = err;
                    $("#errorModal").modal();
                })
        }
    });
})();