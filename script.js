var playersObject = 
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
    var newPlayer = {playerName: this.newPlayerName.value};
    playerNameInput.value = '';
  }
}

