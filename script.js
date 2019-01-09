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
      keyBound = 'no key bound';
    else
      keyBound = String.fromCharCode(player.keyBound);
      
    return playerName + " (" + keyBound + ")";
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
    if(player.buzzedIn === true)
      return;
    
    currentRound.playerBuzzed(player);
    
    player.buzzedIn = true;
    view.displayPlayers();
    setTimeout(function() {
      window.playerList.unbuzzPlayer(player.index)
    }, 500);
  },
  unbuzzPlayer: function(index)
  {
    playerList.players[index].buzzedIn = false;
    view.displayPlayers();
  }
};



var currentRound = 
{  
  started: false,
  winnerIndex: -1,
  // want to be able to start a game and display a countdown
  startRound: function()
  {
    if(this.started === true)
      return;
    
    this.started = true;
    this.displayCountdown();
  },
  displayCountdown: function()
  {
    // should go 3...2...1... go
    // get the countdownSpace element
    this.decrementCountdown(3);
  },
  decrementCountdown: function(value)
  {
    var countdownSpace = document.getElementById('countdownSpace');
    
    if(value <= 0)
    {
      countdownSpace.innerHTML = 'GO!';
      this.startGame();
      return;
    }
    else
    {
      countdownSpace.innerHTML = value;
      
      setTimeout(function() {
        currentRound.decrementCountdown(--value);
      }, 1000);
    }
  },
  startGame: function()
  {
    this.started = true;
    setTimeout(this.endRound, 5000);
  },
  playerBuzzed: function(player)
  {
    if(this.started === true && this.winnerIndex === -1)
    {
      // found the winner.
      this.winnerIndex = player.index;
    }
  },
  isWinner: function(player)
  {
    return player.index == this.winnerIndex;
  },
  endRound: function()
  {
    var countdownSpace = document.getElementById('countdownSpace');
    
    countdownSpace.innerHTML = '';
    currentRound.winnerIndex = -1;
    currentRound.started = false;
    
    view.displayPlayers();
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
    
    var newPlayer = {playerName: playerNameInput.value, selected: false, buzzedIn: false};
    playerNameInput.value = '';
    window.playerList.addNewPlayer(newPlayer);
    view.displayPlayers();
  },
  playerBoxSelected: function(event)
  {
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
    currentRound.startRound();
  }
};


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
      
      if(currentRound.isWinner(player))
      {
         flexChildElement.style.backgroundColor = 'green';
      }
      else if(player.buzzedIn)
      {
        flexChildElement.style.backgroundColor = "red";
      }
      else
      {
        flexChildElement.style.backgroundColor = player.selected ? '#ecf8f2' : 'white';
      }
      
      flexChildElement.id = "playerbox-" + index;
      
      flexChildElement.addEventListener('click', handlers.playerBoxSelected);
      
      var playerNameBox = document.createElement('label');
      playerNameBox.className = 'player-name-box';
      playerNameBox.textContent = playerList.getPlayerBoxString(index);
      
      playerNameBox.id = "playernamebox-" + index;
      
      flexChildElement.appendChild(playerNameBox);
      
      playerBoxContainer.appendChild(flexChildElement);
    });
  }
};

var util = 
{
  isKeyAlphaNumeric: function(keyCode)
  {
    return (event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 65 && event.keyCode <= 90);
  }
};


window.onkeydown = handlers.anyKeyDown;
