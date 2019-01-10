var playerList= 
{
  players: [],
  addNewPlayer: function(player)
  {
    player.index = this.players.length;
    this.players.push(player);
  },
  getPlayerBoxString: function(index)
  {
    var player = this.players[index];
    var playerName = player.playerName;
    var keyBound;
    
    if(player.keyBound === undefined)
      keyBound = 'n/a';
    else
      keyBound = String.fromCharCode(player.keyBound);
      
    return playerName + ' (' + keyBound + ')';
  },
  getPlayerMoneyTotalString: function(index)
  {
    return '$' + this.players[index].money;
  },
  isMaxCapacity: function()
  {
    return this.players.length >= 3;
  },
  togglePlayerSelected: function(index)
  {
    this.players.forEach(function(player, loopIndex) {
      player.selected = loopIndex === index ? !player.selected : false;
    });
  },
  getSelectedPlayer: function()
  {
    var playerRet = undefined;
    this.players.forEach(function(player) {
      if(player.selected)
        playerRet = player;
    });
    
    return playerRet;
  },
  isKeyCodeValid: function(keyCode)
  {
    // check if keycode is alphanumeric
    if(!util.isKeyAlphaNumeric(keyCode))
      return false;
    
    var boolRet = true;
    
    // check that no other player has claimed the keycode
    this.players.forEach(function(player) {
      if(player.keyBound === keyCode)
        boolRet = false;
    });
    
    // if here, the key should be alphaNumeric and free. return true;
    return boolRet;
  },
  keyBuzzed: function(keyCode)
  {
    var playerBuzzed = false;
    this.players.forEach(function(player) {
      if(player.keyBound === keyCode)
      {
        this.playerBuzzed(player);
        playerBuzzed = true;
      }
    }, this);
    
    return playerBuzzed;
  },
  playerBuzzed: function(player)
  {
    if(player.buzzedIn === true || currentQuestion.isWinner(player))
      return;
    
    currentQuestion.playerBuzzed(player);
    
    player.buzzedIn = true;
    view.displayPlayers();
    setTimeout(function() {
      window.playerList.unbuzzPlayer(player.index)
    }, 2000);
  },
  unbuzzPlayer: function(index)
  {
    playerList.players[index].buzzedIn = false;
    view.displayPlayers();
  },
  unbuzzAllPlayers: function()
  {
    this.players.forEach(function(player, index) {
      playerList.unbuzzPlayer(index);
    });
  }
};

class BoardTile
{
  constructor(row, column, money, textContent)
  {
    this.row = row;
    this.column = column;
    this.money = money;
    this.textContent = textContent;
    
    this.available = true;
  }
  
  isClicked()
  {
    // prompt the current question to start
    if(this.available === false)
      return;
    
    var questionStarted = currentQuestion.startFromTile(this);
    
    // set the question to unavailable if the startFromTile returned affirmative
    if(questionStarted === true)
      this.available = false;
  }
  
  createElement()
  {
    var element = document.createElement('div');
    element.className = 'board-grid-item';
    element.textContent = this.available ? ('$' + this.money) : '';
    element.row = this.row;
    element.col = this.column;
    element.addEventListener('click', handlers.boardTileClicked);
    return element;
  }
};


var boardGrid = 
{
  ROWS: 5,
  COLUMNS: 6,
  boardTiles: undefined,
  roundNum: 0,
  fillBoardTiles: function()
  {
    this.boardTiles = [];
    for(var row = 0; row < this.ROWS; row++)
    {
      var rowObject = [];
      for(var col = 0; col < this.COLUMNS; col++)
      {
        rowObject[col] = new BoardTile(row, col, this.getMoneyValue(row), '');
      }
      this.boardTiles[row] = rowObject;
    }
  },
  getMoneyValue: function(row)
  {
    var rowIncrement = this.roundNum == 0 ? 200 : 400;
    
    return (row + 1) * rowIncrement;
  },
  nextRound: function()
  {
    this.roundNum++;
  }
  
};

var currentQuestion = 
{  
  started: false,
  answerWindowOpen: false,
  winnerIndex: -1,
  tile: undefined,
  startFromTile: function(tile)
  {
    this.tile = tile;
    return this.startRound();
  },
  // want to be able to start a game and display a countdown
  startRound: function()
  {
    if(this.started === true)
      return false;
    
    // make sure no players are selected
    playerList.togglePlayerSelected(undefined);
    
    this.started = true;
    this.displayCountdown();
    return true;
  },
  displayCountdown: function()
  {
    playerList.unbuzzAllPlayers();
    this.decrementCountdown(3);
  },
  decrementCountdown: function(value)
  {    
    if(value <= 0)
    {
      view.displayCountdown('GO!');
      this.openAnswerWindow();
      return;
    }
    else
    {
      view.displayCountdown(value);
      
      setTimeout(function() {
        currentQuestion.decrementCountdown(--value);
      }, 1000);
    }
  },
  openAnswerWindow: function()
  {
    this.answerWindowOpen = true;
    setTimeout(this.endRound, 3000);
  },
  playerBuzzed: function(player)
  {
    if(this.answerWindowOpen === true && this.winnerIndex === -1)
    {
      // found the winner.
      this.playerWon(player);
    }
  },
  playerWon: function(player)
  {
    this.winnerIndex = player.index;
    player.money = player.money + this.tile.money;
    
  },
  isWinner: function(player)
  {
    return player.index == this.winnerIndex;
  },
  endRound: function()
  {
    var countdownSpace = document.getElementById('countdownSpace');
    
    currentQuestion.winnerIndex = -1;
    currentQuestion.started = false;
    currentQuestion.answerWindowOpen = false;
    view.hideCountdown();
    playerList.unbuzzAllPlayers();
    view.displayPlayers();
    view.displayBoardGrid();
  }
  
  // once the game is started, the first player to buzz in should be declared the winner
  
  
};

var handlers = {
  addNewPlayer: function()
  {
    var playerNameInput = document.getElementById('playerNameInput');
    
    if(playerNameInput === undefined || playerNameInput.value === undefined || playerNameInput.value === '')
      // don't add a new player
      return;
    
    if(window.playerList.isMaxCapacity())
    {
      window.alert('Too many dicks on the dancefloor.');
      return;
    }
    
    var newPlayer = {playerName: playerNameInput.value,
                     selected: false,
                     buzzedIn: false,
                     money: 0};
    playerNameInput.value = '';
    window.playerList.addNewPlayer(newPlayer);
    view.displayPlayers();
  },
  playerBoxSelected: function(event)
  {
    if(currentQuestion.started)
      return;
    
    var id = event.target.id;
    
    var playerIndex = parseInt(id.substring(id.lastIndexOf('-') + 1));
    
    // find player index to toggle.
    
    window.playerList.togglePlayerSelected(playerIndex);
    view.displayPlayers();
  },
  playerNameKeyDown: function(event)
  {     
    event.stopPropagation();

    if(event.keyCode === 13)
    {
      document.getElementById('addPlayerButton').click();
    }
  },
  anyKeyDown: function(event)
  {
    console.log(event);
    
    // get selected player
    var selectedPlayer = window.playerList.getSelectedPlayer();
    
    if(selectedPlayer !== undefined)
    {
      // if the key code is the same as the current player's, just skip the logic of trying to assign it.
      if(event.keyCode !== selectedPlayer.keyBound)
      {
        if(event.keyCode === 27)
        {
          // it's escape. wil want to toggle all players to unselected
          window.playerList.togglePlayerSelected(undefined);
          return;
        }

        // there was a player selected. try to assign the key to the player
        // check to see if any other player has claimed this keyCode
        if(window.playerList.isKeyCodeValid(event.keyCode))
          selectedPlayer.keyBound = event.keyCode;
        else
          window.alert('Invalid Key');
      }
      
      // always set the selected player to false and refresh the players displayed
      selectedPlayer.selected = false;
      view.displayPlayers();
      return;
    }
    
    if(util.isKeyAlphaNumeric(event.keyCode))
    {
      // found alphanumeric key. will want to buzz the player in if it's assigned to anyone
      var playerBuzzed = window.playerList.keyBuzzed(event.keyCode);
    }
    
    // if here, no player was selected. will want to check if any key matched a player
  },
  startRound: function()
  {
    currentQuestion.startRound();
  },
  boardTileClicked: function(event)
  {
    var targetDiv = event.target;
    
    boardGrid.boardTiles[targetDiv.row][targetDiv.col].isClicked();
  }
};


var triviaApiGetter = 
    {
      categories: [],
      getQuestionUrl: function(amount, difficulty, category)
      {
        var url = 'https://opentdb.com/api.php?'
        
        url = this.appendQualifier(url, 'amount', amount);
        url = this.appendQualifier(url, 'difficulty', difficulty);
        url = this.appendQualifier(url, 'category', category);
        url = this.appendQualifier(url, 'type', 'multiple');
        
        return url;
      },
      appendQualifier: function(url, qualName, qualValue)
      {
        if(qualValue !== undefined && qualName !== undefined)
        {
          var lastUrlChar = url.charAt(url.length - 1);
          
          if(lastUrlChar !== '?' && lastUrlChar !== '&')
            url += '&';
                  
          url += qualName + '=' + qualValue;
          
          return url;
        }
      },
      executeRequest: function()
      {
        var request = new XMLHttpRequest();
        
        request.open('GET', this.getQuestionUrl(2, 'easy', 9), true);
        
        request.onload = function()
        {
          debugger;
          var data = JSON.parse(this.response);
          
          if(request.status >= 200 && request.status < 400)
          {
            console.log('success');
          }
          else
          {
            console.log('error');
          }
        }
        
        request.send();
      }
    }


var view = 
{
  displayPlayers: function()
  {
    // for each player, create an element for the DOM
   
    var playerBoxContainer = document.getElementById('playerBoxContainer');
    
    // clear player box container
    playerBoxContainer.innerHTML = '';
    
    window.playerList.players.forEach(function(player, index){
          
      var flexChildElement = document.createElement('div');
      flexChildElement.className = 'flex-child';
      
      var moneyTotalBox = document.createElement('div');
      moneyTotalBox.className = 'money-total-box';
      moneyTotalBox.textContent = playerList.getPlayerMoneyTotalString(index);
      
      var separator = document.createElement('div');
      separator.className = 'line-separator';
      
      var playerNameBox = document.createElement('label');
      playerNameBox.className = 'player-name-box';
      playerNameBox.textContent = playerList.getPlayerBoxString(index);
      
      var buzzer = document.createElement('div');
      buzzer.className = 'buzzer';
      
      // figure out what the color should be based on the details
      if(currentQuestion.isWinner(player))
      {
         buzzer.style.backgroundColor = 'green';
      }
      else if(player.buzzedIn)
      {
        buzzer.style.backgroundColor = "red";
      }
      else
      {
        buzzer.style.backgroundColor = 'white';
      }
      
      flexChildElement.style.backgroundColor = player.selected ? '#ecf8f2' : '#060CE9';
      moneyTotalBox.style.color = playerNameBox.style.color = player.selected ? '#060CE9' : 'white';
      
      flexChildElement.id = "playerbox-" + index;
      
      flexChildElement.addEventListener('click', handlers.playerBoxSelected);
    
      moneyTotalBox.id = "moneytotalbox-" + index;
      playerNameBox.id = "playernamebox-" + index;
      
      
      flexChildElement.appendChild(buzzer);
      flexChildElement.appendChild(moneyTotalBox);
      flexChildElement.appendChild(separator);
      flexChildElement.appendChild(playerNameBox);
      

      
      playerBoxContainer.appendChild(flexChildElement);
    });
  },
  displayBoardGrid: function()
  {
    // get grid container
    // add board tile elements to grid container
    var gridContainer = document.getElementById('board-grid');
    
    var elements = gridContainer.getElementsByClassName("board-grid-item");

    while (elements[0]) {
        elements[0].parentNode.removeChild(elements[0]);
    }
        
    for(var row = 0; row < boardGrid.boardTiles.length; row++)
    {
     for(var col = 0; col < boardGrid.boardTiles[row].length; col++)
     {
       gridContainer.appendChild(boardGrid.boardTiles[row][col].createElement());
     }
    }
  }
  ,
  displayCountdown: function(content)
  {
    var countdownSpace = document.getElementById('countdownSpace');
    
    countdownSpace.innerHTML = content;
    countdownSpace.style.zIndex=10;
  },
  hideCountdown: function()
  {
    var countdownSpace = document.getElementById('countdownSpace');
    
    countdownSpace.innerHTML = '';
    countdownSpace.style.zIndex=0;
  }
};

var util = 
{
  isKeyAlphaNumeric: function(keyCode)
  {
    return (event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 65 && event.keyCode <= 90);
  }
};



var testers = 
{
  fillPlayers : function()
  {
    playerList.addNewPlayer({playerName: 'player 1', money: 0, selected: false, buzzedIn: false, keyBound: 'X'.charCodeAt(0)});
    playerList.addNewPlayer({playerName: 'player 2', money: 0, selected: false, buzzedIn: false, keyBound: 'C'.charCodeAt(0)});
    playerList.addNewPlayer({playerName: 'player 3', money: 0, selected: false, buzzedIn: false, keyBound: 'V'.charCodeAt(0)});
    view.displayPlayers();
  }

};

window.onkeydown = handlers.anyKeyDown;
//testers.fillPlayers();

boardGrid.fillBoardTiles();
view.displayBoardGrid();
