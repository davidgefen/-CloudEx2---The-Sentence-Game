//import external libraries
var express = require('express');
var auth = require('basic-auth');
var dbHandle = require('./DBHandle.js');
var dbInit = require('./dataHandler.js');

//run external libraries
var app = express();

//define global configurations
var CorrectLogin = {username: '1', password: '1'};

/**
 * run server on available port or port 3000
 */
app.listen(process.env.VCAP_APP_PORT || 3000, function () {
    dbInit.createCollection();//initiate database
    console.log('App is up and running');
});

/**
 * makes sure authentication was successful before use of the service is allowed
 */
app.use(function (req, res, next) {
    //get credentials the user entered
    var credentials = auth(req);
    //make sure credentials match correct authentication credentials
    if (!credentials || credentials.name !== CorrectLogin.username || credentials.pass !== CorrectLogin.password) {
        //authentication was unsuccessful
        res.setHeader('WWW-Authenticate', 'Basic realm="Authorization is required in order to access"');
        return res.status(401).send('Unauthorized access!');
    } else {
        //access was granted so go to required site
        return next();
    }
});

/**
 * returns index.html for get on root URL and creates new user for new login
 */
app.get('/', function (req, res) {
    function initialCallback(err, result) {
        if(err){
            res.status(500);
        } else {
            res.cookie('userId', result['insertedIds'][0].toString());
            res.status(200).sendfile('index.html');
        }
    }
    dbHandle.createNewUser(initialCallback);
});

/**
 * return main.css
 */
app.get('/main.css', function (req, res) {
    res.status(200).sendfile('main.css');
});

/**
 * return jquery-2.2.3.min.js
 */
app.get('/jquery-2.2.3.min.js', function (req, res) {
    res.status(200).sendfile('jquery-2.2.3.min.js');
});

/**
 * return jquery-2.2.3.min.js
 */
app.get('/index.js', function (req, res) {
    res.status(200).sendfile('index.js');
});

/**
 * return data about games from mongodb
 */
app.get('/getGameData', function (req, res) {
    function getGamesCallback(err, result) {
        if(err){
            res.status(500);
        } else {
            res.status(200).send(result);
        }
    }
    dbHandle.getGamesData(getGamesCallback);
});

/**
 * create new game
 */
app.post('/newGame', function (req, res){
    function newGameCallback(err, result) {
        if(err){
            res.status(500);
        } else {
            res.status(200);
            res.send(result['insertedIds'][0].toString());
        }
    }
    dbHandle.createNewGame(req.query.userId, newGameCallback);
});

/**
 * join existing game
 */
app.post('/joinGame', function (req, res){
    function joinGameCallback(err) {
        if(err){
            res.status(500);
        } else {
            res.status(200);
            res.send('SUCCESS');
        }
    }
    dbHandle.joinGame(req.query.userId, req.query.gameId, joinGameCallback);
});

/**
 * get last sentence within a game
 */
app.get('/getLastSentence', function (req, res){
    function lastSentenceCallback(err, result) {
        if(err){
            res.status(500);
        } else {
            res.status(200);
            res.send(result);
        }
    }
    dbHandle.getLastSentence(req.query.gameId, lastSentenceCallback);
});

/**
 * add a new sentence to a game
 */
app.get('/addSentence', function (req, res) {
    function newSentenceCallback(err) {
        if(err){
            res.status(500);
        } else {
            res.status(200);
        }
    }
    dbHandle.addSentence(req.query.gameId, req.query.sentence, newSentenceCallback);
});

/**
 * skip next player
 */
app.get('/skipPlayer', function (req, res) {
    function SkipPlayerCallback(err) {
        if(err){
            res.status(500);
        } else {
            res.status(200);
        }
    }
    dbHandle.skipPlayer(req.query.gameId, SkipPlayerCallback);
});

/**
 * remove player from game and delete game if it is the last one
 */
app.post('/leaveGame', function (req, res) {
    function leaveGameCallback(err) {
        if(err){
            res.status(500);
        } else {
            res.status(200);
        }
    }
    dbHandle.leaveGame(req.query.gameId, leaveGameCallback);
});