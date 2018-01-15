/**
 * Created by davidgefen on 31/05/2016.
 */

/**
 * get IP for database
 * @returns {*}
 * @constructor
 */
var DBIP = function () {
    var mongoUrl;
    if(process && process.env && process.env.VCAP_SERVICES) {
        var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
        for (var svcName in vcapServices) {
            if (svcName.match(/^mongo.*/)) {
                mongoUrl = vcapServices[svcName][0].credentials.uri;
                mongoUrl = mongoUrl || vcapServices[svcName][0].credentials.url;
                break;
            }
        }
    } else {
        mongoUrl = "mongodb://localhost:27017";
    }
    return mongoUrl;
};

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectId = require('mongodb').ObjectId;

var collectionName = "Games";
var userCollectionName = 'users';
var userUrl = DBIP();// + userCollectionName;
var url = DBIP();// + collectionName;

var exports = module.exports = {};

/**
 * create new user
 * @param callback return err or id for new user
 */
exports.createNewUser = function (callback){
    var newData = {};
    MongoClient.connect(userUrl, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', userUrl);
            // Get the documents collection
            var collection = db.collection(userCollectionName);
            collection.insert(newData, function (err, result) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    console.log('Inserted documents into the collection.');
                    console.log(result);
                    callback(null, result)
                }
            });
        }
    });
};

/**
 * return data on existing games
 * @param callback to handle error or returned data
 */
exports.getGamesData = function (callback) {
    var arr = [];
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            // Get the documents collection
            var stream = db.collection(collectionName).find().stream();
            stream.on("data", function(item) {arr.push(item)});
            stream.on("end", function(){callback(null, arr);});
        }
    });
};

/**
 * create new game in the DB
 * @param player player to be added to new game
 * @param callback handle error or return result
 */
exports.createNewGame = function (player, callback) {
    var newData = {'players':[player], 'sentences': [], 'currentPlayer': player.toString()};

    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            // Get the documents collection
            var collection = db.collection(collectionName);
            collection.insert(newData, function (err, result) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    console.log('Inserted documents into the collection.');
                    callback(null, result);
                }
            });
        }
    });
};

/**
 * return the last sentance in game to callback function
 * @param gameId game to retrieve sentence from
 * @param callback
 */
exports.getLastSentence = function (gameId, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            // Get the documents collection
            var stream = db.collection(collectionName).find({_id: new ObjectId(gameId)}).stream();
            stream.on("data", function(item) {callback(null, item)});
        }
    });
};

/**
 * add plaer to an existing game
 * @param userId id of user to add to game
 * @param gameId game to add user to
 * @param callback send error to callback funtion
 */
exports.joinGame = function (userId, gameId, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            // Get the documents collection
            var collection = db.collection(collectionName);
            collection.update({_id: new ObjectId(gameId)}, {$push: {'players': userId}}, function (err) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    console.log('Added player to game.');
                    callback();
                }
                db.close();
            });
        }
    });
};

/**
 * leave existing game
 * @param gameId user to leave game
 * @param callback
 */
exports.leaveGame = function (gameId, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            // Get the documents collection
            var stream = db.collection(collectionName).find({_id: new ObjectId(gameId)}).stream();
            stream.on("data", function(item) {//got current game data
                //get index of current user in array
                if(item['players'].indexOf(item['currentPlayer']) !== item['players'].length - 1){
                    removePlayer(item['players'][item['players'].indexOf(item['currentPlayer'])], gameId, item['players'][item['players'].indexOf(item['currentPlayer']) + 1], callback);
                } else {
                    deleteGame(gameId, callback);
                }
            });
        }
    });
};

/**
 * add sentence to game
 * @param gameId game to add sentence to
 * @param sentence to add to game
 * @param callback to return result
 */
exports.addSentence = function (gameId, sentence, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.status(500);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            // Get the documents collection
            var stream = db.collection(collectionName).find({_id: new ObjectId(gameId)}).stream();
            stream.on("data", function(item) {//got current game data
                //get index of current user in array
                if(item['players'].indexOf(item['currentPlayer']) !== item['players'].length - 1){
                    addSentenceInnerFunc(gameId, item['players'][item['players'].indexOf(item['currentPlayer']) + 1], sentence, callback);
                } else {
                    addSentenceInnerFunc(gameId, item['players'][0], sentence, callback);
                }
            });
        }
    });
};

/**
 * skipp current player in game
 * @param gameId id of game to get next player in
 * @param callback
 */
exports.skipPlayer = function (gameId, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.status(500);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            // Get the documents collection
            var stream = db.collection(collectionName).find({_id: new ObjectId(gameId)}).stream();
            stream.on("data", function(item) {//got current game data
                //get index of current user in array
                if(item['players'].indexOf(item['currentPlayer']) !== item['players'].length - 1){
                    setCurrentPlayer(gameId, item['players'][item['players'].indexOf(item['currentPlayer']) + 1], callback);
                } else {
                    setCurrentPlayer(gameId, item['players'][0], callback);
                }
            });
        }
    });
};

/**
 * add sentence to game
 * @param gameId game to add sentence to
 * @param nextPlayer next player to play the game
 * @param sentence to add
 * @param callback
 */
function addSentenceInnerFunc(gameId, nextPlayer, sentence, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            //get index of current user in array
            var collection = db.collection(collectionName);
            collection.update({_id: new ObjectId(gameId)}, {$push: {'sentences': sentence}}, function (err, result) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    console.log('Added sentence to game.');
                    setCurrentPlayer(gameId, nextPlayer, callback);
                }
            });
        }
    });
}

/**
 * set player of the game to next player
 * @param gameId game to play
 * @param nextPlayer id of the next player to play the game
 * @param callback
 */
function setCurrentPlayer(gameId, nextPlayer, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            var collection = db.collection(collectionName);
            collection.update({_id: new ObjectId(gameId)}, {$set: {'currentPlayer': nextPlayer.toString()}}, function (err, result) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    console.log('updated current player.');
                    callback(null);
                    db.close();
                }
            });
        }
    });
}

/**
 * remove plater from game
 * @param gameId game to remove player from
 * @param nextPlayer next player to play
 * @param callback
 */
function removePlayer(userId, gameId, nextPlayer, callback) {
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            //get index of current user in array
            var collection = db.collection(collectionName);
            collection.update({_id: new ObjectId(gameId)}, {$pull : {'players': userId}}, function (err, result) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    console.log('Added sentence to game.');
                    setCurrentPlayer(gameId, nextPlayer, callback);
                }
            });
        }
    });
}

/**
 * delete gmae from DB
 * @param gameId game to delete
 * @param callback
 */
function deleteGame(gameId, callback){
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            callback(err);
        } else {
            //HURRAY!! We are connected. smile emoticon
            console.log('Connection established to', url);
            // Get the documents collection
            var collection = db.collection(collectionName);
            collection.remove({_id: new ObjectId(gameId)}, function (err, result) {
                if (err) {
                    console.log(err);
                    callback(err);
                } else {
                    console.log('Ended game: ' + gameId);
                    callback(null);
                }
                db.close();
            });
        }
    });
}
