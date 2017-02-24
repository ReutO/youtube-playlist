(function () {

    "use strict";

    var addVideoModule = angular.module("addVideoModule", ["serviceModule"]);

    addVideoModule.controller("AddVideoController", function ($scope, $http, $menuFocus, $embedUrl, $wachedVideos) {

        //adding last watch videos to the scope (to be used in the footer html)
        $scope.wachedVideos = $wachedVideos.returnWachedVideos();

        //calling menuFocus service to change the focus on the main menu
        var menuFocus = function () {
            $menuFocus.startMenuFocus("menuPlaylist", "menuLogin", "menuHome");
        }
        menuFocus();

        //cheacking if the user is registered and saving in scope the user details.
        $http.get("/isGuest")
            .then(function (response) {
                var res = response.data;
                if (res.code == 110) {  // case there's a problem reading json file in the server
                    $scope.user = {firstName: "Guest"}; //making sure the page will not display
                    $scope.modal = {
                        code: res.code,
                        message: res.message
                    }
                    $("#errorReadyModal").modal();
                } else if (res.code == 140) { //case user is a guest
                    $scope.user = { firstName: "Guest" };
                } else {  //case success - reciving registered user
                    $scope.user = res.user;
                }
            })
            .catch(function (err) {
                $scope.user = { firstName: "Guest" }; //making sure the page will not display
                $scope.error = err;
                $("#errorModal").modal();
            });

        //adding video function
        // user can add a regular url from youtube, this function changes the url to an embed link to put in iframe
        // errors: defected link, user isn't registered, user not exist in data, errors in writing/reading json
        // in case of sucsess, user relocated to playlist.
        $scope.addVideo = function () {
            var isLinkOk = false;
            var addVideo = {
                name: $scope.videoName,
                genre: $scope.videoGenre,
                details: $scope.videoDesc,
                link:""
            };
            var userLink = decodeURIComponent($scope.videoLink);
            var urlVariables = $scope.videoLink.substr($scope.videoLink.indexOf("?") + 1).split('&');
            addVideo.link = $embedUrl.createEmbedUrl(urlVariables); // calling embedUrl service to create embed link.
            if (!addVideo.link) {
                $scope.modal = {
                    title: "Video was not added",
                    message: "You might have entered a defected url"
                }
                $("#generalModal").modal();
            } else {
                $http.post("/addVideo", { addVideo: addVideo })
                    .then(function (response) {
                        var res = response.data;
                        if (res.code == 110 || res.code==120) {  // case there's a problem reading / writing json file
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
                            location.hash = "#!/playlist";
                        } else {    // case the response is with unexpected errors
                            $scope.error = res;
                            $("#errorModal").modal();
                        }
                    },function (err) {
                        $scope.error = err;
                        $("#errorModal").modal();
                    })
            }
        }
    });
})();