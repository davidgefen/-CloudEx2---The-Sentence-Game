var rootURL = 'http://cloudex2.mybluemix.net/'; //'http://localhost:3000/';//
var getGameData = rootURL + 'getGameData';
var joinGameURL = rootURL + 'joinGame';
var newGameURL = rootURL + 'newGame';
var CurrentGame = rootURL + 'getLastSentence';
var leaveGame = rootURL + 'leaveGame';
var sendSentenceURL = rootURL + 'addSentence';
var SkipPlayerURL = rootURL + 'skipPlayer';
var userIdCookie = 'userId';

var gameHasEnded = false;

var currentGame = '';
var timeToWait = 2000;
var timeOfTurn = 120000;
var setTimerObj;

$(document).ready(function () {
    init();
});

/**
 * to initiate play at beginning of te game
 */
function init(){
    $.get( getGameData, function( existingGames ) {
        for(var i = 0; i < existingGames.length; ++i) {
            $('#existing_games').find('tbody')
                .append($('<tr>')
                    .append($('<td>')
                        .text(existingGames[i]._id)//display game id
                    )
                    .append($('<td>')
                        .append($("<input type='submit' value='Join' onclick='joinGame(this.id)'>")
                            .attr('id', existingGames[i]._id)
                        )
                    )
                );
        }
    }).fail(function() {
        console.log('Problem loading page');
        init();
    });
}

/**
 * jion an existing game
 * @param gameId
 */
function joinGame(gameId) {
    $.post( joinGameURL + '?userId=' + getCookie(userIdCookie) + '&gameId=' + gameId, function(json) {

    }).done(function() {
        currentGame = gameId;
        console.log('Game was joined');
        startGame();
    }).fail(function() {
        console.log('Game was not joined');
        joinGame(gameId);
    });
}

/**
 * create a new game
 */
function createNewGame(){
    $.post( newGameURL + '?userId=' + getCookie(userIdCookie), function(res) {
        currentGame = res;
    }).done(function() {
        console.log('New game was created');
        startGame();
    }).fail(function() {
        console.log('Game was not created');
        createNewGame();
    });
}

/**
 * start the game,
 * continue the existing game
 */
function startGame(){
    gameHasEnded = false;
    $('#selectGame').addClass('hidden');
    setTimeout(function(){
        var gameData;
        $.get( CurrentGame + '?gameId=' + currentGame , function ( thisGame ) {
            gameData = thisGame;
        }).done(function () {
                if (gameData['currentPlayer'].toString() === [getCookie(userIdCookie)].toString()) {
                    //prepare user to play
                    if (gameData['sentences'] != undefined) {
                        $('#previous_sentence').text(gameData['sentences'].pop());
                    }
                    $('#wait').addClass('hidden');
                    $('#game').removeClass('hidden');
                    setGameTimer(timeOfTurn);
                    startGame();
                } else if(!gameHasEnded){//prepare user to wait
                    $('#game').addClass('hidden');
                    $('#wait').removeClass('hidden');
                    startGame();
                }
            }
        ).fail(function () {
                console.log('Server error');
                startGame();
            }
        );
    }, timeToWait);
}

/**
 * set timer to wait in the game
 * @param timeToWait time to wait
 */
function setGameTimer(timeToWait){
    setTimerObj = setTimeout(function(){
        var gameData;
        $.get( SkipPlayerURL + '?gameId=' + currentGame , function () {
        }).fail(function () {
                console.log('error in skipping player');
                setGameTimer(1);
            }
        );
    }, timeToWait);
}

function gameIdToInput() {
    $('#gameIdInput').val(currentGame);
}

/**
 * end the game
 */
function endGame(){
    gameHasEnded = true;
    clearTimeout(setTimerObj);
    var gameData;
    $.get( CurrentGame + '?gameId=' + currentGame , function ( thisGame ) {
        gameData = thisGame;
    }).done(function () {
            if (gameData['sentences'] != undefined) {
                gameData['sentences'].forEach(function (sentence) {
                    $('#').text(sentence);
                    $('#gameResult').append($('<p>').text(sentence).append('</br>'));
                });
            }
            $('#game').addClass('hidden');
            $('#gameResult').removeClass('hidden');
            $.post(leaveGame + '?gameId=' + currentGame + '&userId=' + getCookie(userIdCookie), function (thisGame) {
                currentGame = "";
            });
        }
    ).fail(function() {
        console.log('Game was not ended');
        endGame();
    });
}

/**
 * send sentence to user
 */
function sendSentence(){
    clearTimeout(setTimerObj);
    $.get( sendSentenceURL + '?gameId=' + currentGame + '&sentence=' + $('#sentence').val(), function ( thisGame ) {})
        .fail(function() {
            console.log('Sentence was not sent');
            sendSentence();
    });
    $('#sentence').val("");
}

/**
 * returns cookie with name cname
 * @param cname name of cookie to return
 * @returns {*}
 */
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}