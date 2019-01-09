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
  }
};


var handlers = {
  addNewPlayer: function()
  {
    var playerNameInput = document.getElementById('playerNameInput');
    var newPlayer = {playerName: playerNameInput.value};
    playerNameInput.value = '';
    window.playerList.addNewPlayer(newPlayer);
    view.displayPlayers();
  },
  playerBoxSelected: function(event)
  {
    console.log(event);
  }
};


var view = 
{
  displayPlayers: function()
  {
    // for each player, create an element for the DOM
   
    var playerBoxContainer = document.getElementById('playerBoxContainer');
    
    debugger;
    // clear player box container
    playerBoxContainer.innerHTML = '';
    
    this.playerList.players.forEach(function(player, index){
          
      var flexChildElement = document.createElement('div');
      flexChildElement.className = 'flex-child';

      var playerNameBox = document.createElement('label');
      playerNameBox.className = 'player-name-box';
      playerNameBox.textContent = playerList.getPlayerBoxString(index);
      
      flexChildElement.appendChild(playerNameBox);
      
      playerBoxContainer.appendChild(flexChildElement);
    });
  }
};
