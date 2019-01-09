var playerList= 
{
  players: [],
  addNewPlayer: function(player)
  {
    this.players.push(player);
  },
  getPlayerBoxString: function(index)
  {
    var player = this.players[index];
    var playerName = player.playerName;
    var keyBound = player.keyBound;
    
    if(keyBound === undefined)
      keyBound = 'no key bound';
      
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
    return this.players.forEach(function(player) {
      if(player.selected)
        return player;
    });
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
  }
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
    
    var newPlayer = {playerName: playerNameInput.value, selected: false};
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
  playerNameKeyUp: function(event)
  {     
    event.stopPropagation();

    if(event.keyCode === 13)
    {
      document.getElementById('addPlayerButton').click();
    }
  },
  anyKeyUp: function(event)
  {
    debugger;
    console.log(event);
    
    // get selected player
    var selectedPlayer = window.playerList.getSelectedPlayer();
    
    if(selectedPlayer !== undefined)
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
      {
        selectedPlayer.keyBound = event.keyCode;
      }
      else
      {
        window.alert('Key was already bound to another player');
      }
      return;
    }
    
    // if here, no player was selected. will want to check if any key matched a player
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
      
      flexChildElement.style.backgroundColor = player.selected ? '#ecf8f2' : 'white';
      
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


window.onkeyup = handlers.anyKeyUp;
