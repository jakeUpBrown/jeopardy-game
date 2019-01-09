var playerList= 
{
  players: [],
  addNewPlayer: function(player)
  {
    this.players.push(player);
  },
  getPlayerBoxString: function(index)
  {
    var player = players[index];
    var playerName = player.playerName;
    var keyBound = player.keyBound;
    
    if(keyBound === undefined)
      keyBound = '(no key bound)';
      
    return playerName + " " + keyBound;
  }
};



var handlers = {
  addNewPlayer: function()
  {
    var playerNameInput = document.getElementById('playerNameInput');
    var newPlayer = {playerName: playerNameInput.value};
    playerNameInput.value = '';
    window.playerList.addNewPlayer(newPlayer);
  }
};

var view = 
{
  displayPlayers: function()
  {
    // for each player in window.playerList, create an element and display it
  },
  createPlayerElement: function(player)
  {
    // for this player, create an element for the DOM
   
    var playerBoxContainer = document.getElementById('playerBoxContainer');
    
    playerBoxContainer.innerHTML = '';
    
    this.playerList.players.forEach(function(player){
          
      var flexChildElement = document.createElement('div');
      flexChildElement.className = 'flex-child';

      var playerNameBox = document.createElement('label');
      playerNameBox.textContent = playerList
      
      playerBoxContainer.appendChild(flexChildElement);
    });
    
  }
};


      <div class="flex-child">
        <label class="player-name-box">player name 2</label>
      </div>  
