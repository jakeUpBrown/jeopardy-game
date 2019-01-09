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
    this.players.forEach(function(player) {
      if(player.selected)
        return player;
    });
    
    return {};
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
    if(event.keyCode === 13)
    {
      document.getElementById('addPlayerButton').click();
    }
  },
  anyKeyUp: function(event)
  {
    // get selected player
    var selectedPlayer = playerList.getSelectedPlayer();
    
    if(selectedPlayer !== undefined)
    {
      // there was a player selected. try to assign 
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

window.onkeyup = 
