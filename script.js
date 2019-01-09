var playerList= 
{
  players: [],
  addNewPlayer: function(player)
  {
    this.players.push(player);
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
  
};
