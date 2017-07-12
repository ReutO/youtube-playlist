var express = require("express");
var fs = require("fs");
var bodyParser = require('body-parser'); //for post requests
var randToken = require('rand-token'); //Create a token generator 
var crypto = require('crypto'); //for hashing a password
var firebase = require("firebase-admin"); // firebase

firebase.initializeApp({
    serviceAccount: "./ovadia-music-a97df37204e4.json",
    databaseURL: "https://ovadia-music.firebaseio.com/"
});

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname));

//making sure the data is in place:

//creating data directory in case it was deleted
if (!fs.existsSync("./data")) {
    console.log("Data directory was deleted. Creating a new one.");
    fs.mkdirSync("./data");
}

//checks if data file exists. 
//If it does, it just return.
//If it doesn't, then the file is created.
//if there are problems to create it, function ask to create it in console.log
function checkForFile() {
    fs.exists("./data/data.json", function (exists) {
        if (exists) {
            console.log("Data file exists");
            return;
        } else {
            console.log("creating data file");
            fs.writeFile("./data/data.json","", function (err) {
                if (err) {
                    console.log("having problems creating data file. Please create one to continue: ./data/data.json");
                    console.log(JSON.parse(err));
                } else {
                    console.log ("Data file was created");
                }
            })
        }
    });
}
checkForFile()

//an object that contains all server responses to the client.
var serverResponses = {
    responseSuccess: {code:100, message: "Response success"},
    errorReadingJsonFile: { code: 110, message: "There's a problem completing the task, Try again later or contact us" },
    errorWritingJsonFile: { code: 120, message: "There's a problem completing the task, Try again later or contact us" },
    errorUserNotExist: { code: 130, message: "User does not exist in our data. Please try to login again" },
    notRegistered: { code: 140, message: "User isn't registered" },
    passwordNotCorrect: { code: 150, message: "please check your password again" },
    emailNotCorrect: { code: 160, message: "Your email isn't registered" },
    userExistAlready: { code: 170, message: "You might be registered already" },
    noVideoChange: { code: 180, message: "No changes were made. Wasn't found in data" }
}
//promise function for all the times there's a request to read the json file.
function readJson() {
    var readJsonFile = new Promise(function (resolve, reject) {
        fs.readFile("./data/data.json", "utf-8", function (err, text) {
            if (err) {
                reject(err);
            }
            else {
                try {
                    if (text) {
                        var arr = JSON.parse(text);
                        console.log("reading json file succeeded");
                        resolve(arr);
                    } else {  // for first use whe json file is empty
                        console.log("json file is empty");
                        resolve(text);
                    }

                }
                catch(err){
                    reject(err);
                }

            }
        });
    });
    return readJsonFile;
}
//promise function for all the times there's a request to write on the json file.
function writeJson(arr) {
    var writeJsonFile = new Promise(function (resolve, reject) {
        fs.writeFile("./data/data.json", JSON.stringify(arr), function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
    return writeJsonFile;
}
//functtion that calls the read promise and recieves function to use at the ".then" part.
function usingReadPromise(request, response, func) {
    readJson()
        .then(func)
        .catch(function (err) {
            console.log(JSON.stringify(serverResponses.errorReadingJsonFile));
            console.log(JSON.stringify(err));
            response.send(serverResponses.errorReadingJsonFile);
        });

}
//functtion that calls the write promise, sends back to client response. can recieve a vlaue to send the client.
function usingWritePromise(request, response, arr, val) {
    writeJson(arr)
        .then(function () {
            console.log(JSON.stringify(serverResponses.responseSuccess));
            if (val) {
                response.send(val);

            } else {
                response.send(serverResponses.responseSuccess);
            }
        })
        .catch(function (err) {
            console.log(JSON.stringify(serverResponses.errorWritingJsonFile));
            console.log(JSON.stringify(err));
            response.send(serverResponses.errorWritingJsonFile);
        });
}
//function that creates hash password and resolves hash password for compairing.
function makingCompairingHashPassword(userPassword, saltPass) {
    //generates random string of characters i.e salt
    //length - Length of the random string.
    var genRandomString = function (length) {
        return crypto.randomBytes(Math.ceil(length / 2))
                .toString('hex') //convert to hexadecimal format
                .slice(0, length);   //return required number of characters
    }
    //hash password with sha512.
    var sha512 = function (password, salt) {
        var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
        hash.update(password);
        var value = hash.digest('hex');
        return {
            salt: salt,
            passwordHash: value
        }
    }
    // function that will use the above functions to generate the hash 
    function saltHashPassword(userpassword) {
        var salt = genRandomString(16); //Gives salt of length 16
        var passwordData = sha512(userpassword, salt);
        var password = {
            hash: passwordData.passwordHash,
            salt: passwordData.salt
        }
        return password;
    }
    if (saltPass == "") { //making hash password
        console.log("making hash password");
        var hashPassword = saltHashPassword(userPassword);
        return hashPassword;
    }
    else { //for compairing hash password
        console.log("comparing hash password with user password");
        var saltHashpassword = sha512(userPassword, saltPass);
        return saltHashpassword.passwordHash;
    }
}
//creating a key for a video on playlist data
function makeKey() {
    var key = Date.now();
    return key;
}

// cheaking if there is a token in cookie and spliting it.
//if there isn't a token, function returns false.
function getToken(request) {
    var cookie = request.headers.cookie;
    if (!cookie) {
        console.log("no cookie in client");
        return false;
    } else {
        var arrCookie = cookie.split("=");
        var userToken = arrCookie[1];
        return userToken;
    }
}
//cheaking if user exists and return he's playlist.
// if user doesn't exist function returns false.
function userPlaylist (token, arr){
    var isUserExist = false;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].user.token == token) {
            console.log("user wants to make changes in playlist: " + arr[i].user.firstName + " " + arr[i].user.lastName);
            isUserExist = true;
            var playlist = arr[i].playlist;
            break;
        }
    }
    if (!isUserExist) {
        console.log("User does not exist");
        return isUserExist;
    } else {
        return playlist;
    }
}
//login. 
//creating and sending the client a token for every success login. 
//Returns 4 possibilities: errors, email not registered, password not correct, success
app.post("/login", function (request, response) {
    console.log("User requested path: http://localhost:3000/login/");
    usingReadPromise(request, response, function (arr) {
        var emailLogin = request.body.email;
        var passwordLogin = request.body.password;
        var isEmail = false;
        var isPassword = false;
        var userName = "";
        if (arr) {  //if json file is empty, the code inside souldn't be done.
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].user.email == emailLogin) {
                    isEmail = true;
                    userName = arr[i].user.firstName;
                    var hashPassword = makingCompairingHashPassword(passwordLogin, arr[i].user.password.salt);
                    if (arr[i].user.password.hash == hashPassword) {
                        isPassword = true;
                        var token = randToken.generate(16); //creating a token for the user.
                        arr[i].user.token = token;
                        break;
                    }
                }
            }
        }
        if (isEmail && isPassword) {
            var resSuccess = {
                code: serverResponses.responseSuccess.code,
                token: token,
            }
            console.log("user: " + userName + " login to the site");
            usingWritePromise(request, response, arr, resSuccess);
        } else if (isEmail && !isPassword) {
            var responseNoPass = {
                    code: serverResponses.passwordNotCorrect.code,
                    message: userName + ", " + serverResponses.passwordNotCorrect.message
            }
            console.log("sending user error:" + JSON.stringify(responseNoPass));
            response.send(responseNoPass);
        } else if (!isEmail && !isPassword || !isEmail && isPassword) {
            var responseNoEmail = serverResponses.emailNotCorrect;
            console.log("sending user error:" + JSON.stringify(responseNoEmail));
            response.send(responseNoEmail);
        }
    })
});
//registration. 
//creating a token and sending to the client.
//Sending back 3 possibilities: errors, sucssess with user data, or - user already exist.
app.post("/register", function (request, response) {
    console.log("User requested path: http://localhost:3000/register");
    usingReadPromise(request, response, function (arr) {
        var hashPassword = makingCompairingHashPassword(request.body.password, "");
        var user = {
            user: {      //user details
                firstName: request.body.firstName,
                lastName: request.body.lastName,
                email: request.body.email,
                password: hashPassword,
                token: randToken.generate(16)
            },
            playlist: [] //user playlist
        }
        if (!arr) { //checks if the JSON file is empty - on first user
            console.log("no users in data.json");
            var arrUser = [user];  //to save an array of users for later use
            usingWritePromise(request, response, arrUser, user);
        } else {
            var isExist = false;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].user.email == user.user.email) {
                    isExist = true;
                    break;
                }
            } if (isExist) {
                console.log(JSON.stringify (serverResponses.userExistAlready));
                response.send(serverResponses.userExistAlready);
            } else {
                arr.push(user);
                usingWritePromise(request, response, arr, user);
            }
        }
       })
});
//client request everytime it needs permission only for listed customers
//function takes token from the cookie and compair with the data.
//sends back the user object or a guest, or error of cannot read json.
app.get("/isGuest", function (request, response) {
    console.log("User requested path: http://localhost:3000//isGuest");
    usingReadPromise(request, response, function (arr) {
        var isexist = false;
        var token = getToken(request);
        if (token) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].user.token == token) {
                    console.log("user has entered: " + arr[i].user.firstName + " " + arr[i].user.lastName);
                    isexist = true;
                    response.send(arr[i]);
                    break;
                }
            }
        }
        if (!token || !isexist) {  // case there is no cookie or if token does not mach to the user in the data
            console.log("user is a guest");
            response.send(serverResponses.notRegistered);
        }
    })
});
// change video.
// function recieves the video info from client and searching the user in data (using the token)
// returns 5 options: user isn't registered, user not exist in data, no changes, errors in writing/reading json, success
app.post("/videoChange", function (request, response) {
    console.log("User requested path: http://localhost:3000/videoChange/");
    var token = getToken(request);
    if (token){
        var video = request.body.videoChange;
        usingReadPromise(request, response, function (arr) {
            var isVideoChange = false;
            var playlist = userPlaylist(token, arr);
            if (playlist){
                for (var i = 0; i < playlist.length; i++) {
                    if (playlist[i].key == video.key) {
                        playlist[i] = video;
                        console.log("video has been changed");
                        isVideoChange = true;
                    }
                }
                if (!isVideoChange) {
                    console.log(JSON.stringify(serverResponses.noVideoChange));
                    response.send(serverResponses.noVideoChange);
                } else {
                    usingWritePromise(request, response, arr, "");
                }
            } else {
                console.log(JSON.stringify(serverResponses.errorUserNotExist));
                response.send(serverResponses.errorUserNotExist);
            }
        });
    } else {
        console.log(JSON.stringify(serverResponses.notRegistered));
        response.send(serverResponses.notRegistered);
    }
});
// adding video.
// function recieves the video info from client and searching the user in data (using the token)
// returns 4 options: user isn't registered, user not exist in data, errors in writing/reading json, success
app.post("/addVideo", function (request, response) {
    console.log("User requested path: http://localhost:3000/addVideo/");
    var token = getToken(request);
    if (token){
        var addVideo = request.body.addVideo;
        addVideo.key = makeKey();
        usingReadPromise(request, response, function (arr) {
            var playlist = userPlaylist (token, arr);
            if (playlist) {
                playlist.push(addVideo);
                for (var i = 0; i < arr; i++) {
                    if (arr[i].user.token == token) {
                        arr[i].playlist == playlist;
                        break;
                    }
                }
                usingWritePromise(request, response, arr, "");
            } else {
                console.log(JSON.stringify(serverResponses.errorUserNotExist));
                response.send(serverResponses.errorUserNotExist);
            }
        });
    } else {
        console.log(JSON.stringify(serverResponses.notRegistered));
        response.send(serverResponses.notRegistered);
    }
});

// deleting video.
// function recieves key from client and searching the key in user data (using the token)
// returns 5 options: user isn't registered, user not exist in data, no changes- video wasn't found in data, errors in writing/reading json, success
app.get("/deleteVideo/:key", function (request, response) {
    console.log("User requested path: http://localhost:3000/deleteVideo/:key");
    var token = getToken(request);
    if (token){
        var videoKey = request.params.key;
        usingReadPromise(request, response, function (arr) {
            var playlist = userPlaylist(token, arr);
            if (playlist) {
                var isVideoDelete = false;
                for (var i = 0; i < playlist.length; i++) {
                    if (playlist[i].key == videoKey) {
                        playlist.splice(i, 1);
                        isVideoDelete = true;
                        break;
                    }
                }
                if (!isVideoDelete) {
                    console.log(JSON.stringify(serverResponses.noVideoChange));
                    response.send(serverResponses.noVideoChange);
                } else {
                    usingWritePromise(request, response, arr, "");
                }
            } else {
                console.log(JSON.stringify(serverResponses.errorUserNotExist));
                response.send(serverResponses.errorUserNotExist);
            }
        });
    } else {
        console.log(JSON.stringify(serverResponses.notRegistered));
        response.send(serverResponses.notRegistered);
    }
});

app.listen(process.env.PORT || 3000, function () {
console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
