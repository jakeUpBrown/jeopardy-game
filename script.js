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
    if(this.players[index].money === undefined)
      return '';
    
    return '$' + this.players[index].money.toLocaleString();
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
    if(player.buzzerTimeout === true || currentQuestion.isAnswerer(player))
      return;
    
    currentQuestion.playerBuzzed(player);
    
    player.buzzerTimeout = true;
    view.displayPlayers();
    setTimeout(function() {
      window.playerList.unbuzzPlayer(player.index)
    }, 2000);
  },
  unbuzzPlayer: function(index)
  {
    playerList.players[index].buzzerTimeout = false;
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
  constructor(row, column, question, answer, wrongOptions)
  {
    this.row = row;
    this.column = column;
    this.question = question;
    this.answer = answer;
    this.wrongOptions = wrongOptions;
    
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
    element.textContent = this.available ? ('$' + rowColumnInfo.getRowMoneyValue(this.row)) : '';
    element.row = this.row;
    element.col = this.column;
    element.addEventListener('click', handlers.boardTileClicked);
    return element;
  }
  
  populateQAInfo(data)
  {
    this.question = data.question;
    this.answer = data.correct_answer;
    this.wrongOptions = data.incorrect_answers;
  }

  hasQuestionPopulated()
  {
    return !(this.question === '' || this.question === undefined);
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
    for(let row = 0; row < this.ROWS; row++)
    {
      let rowObject = [];
      for(let col = 0; col < this.COLUMNS; col++)
      {
        rowObject[col] = new BoardTile(row, col, '', '', '');
      }
      this.boardTiles[row] = rowObject;
    }
  },
  loadQuestionsAndAnswers: function()
  {
    // go through each column and prompt triviaApiGetter to load questions and answers from the database
    for(let col = 0; col < this.COLUMNS; col++)
    {
      triviaApiGetter.loadColumnQAs(col);
    }
  },
  populateQAInfoFromData: function(dataNodes)
  {
    if(dataNodes == undefined || dataNodes.length === 0)
    {
      console.log("found undefined dataNodes");
    }
      
    let col = rowColumnInfo.getColIndexFromCategory(dataNodes.results[0].category);
        
    // for each data node, get the difficulty, find the next unpopulated tile with that difficulty in row, popoff the data and assign it to the tile
    for(let i = 0; i < dataNodes.results.length; i++)
    {
      let rowNum = this.findNextRow(col, dataNodes.results[i].difficulty);
      this.boardTiles[rowNum][col].populateQAInfo(dataNodes.results[i]);
    }
    
  },
  getMoneyValue: function(row)
  {
    return rowColumnInfo.getRowMoneyValue(row);
  },
  nextRound: function()
  {
    this.roundNum++;
  },
  findNextRow: function(col, difficulty)
  {
    for(let row = 0; row < this.ROWS; row++)
    {
      // check if the difficulty matches and the question info hasn't been loaded
      if(rowColumnInfo.getRowDifficulty(row) === difficulty && this.boardTiles[row][col].hasQuestionPopulated() === false)
        return row;
    }
  }
  
};

var currentQuestion = 
{  
  started: false,
  answerWindowOpen: false,
  answererIndex: -1,
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
    if(this.answerWindowOpen === true && this.answererIndex === -1)
    {
      // found the winner.
      this.playerWon(player);
    }
  },
  playerWon: function(player)
  {
    this.answererIndex = player.index;
    player.money = player.money + rowColumnInfo.getRowMoneyValue(this.tile.row);
    
  },
  isAnswerer: function(player)
  {
    return player.index == this.answererIndex;
  },
  endRound: function()
  {
    var countdownSpace = document.getElementById('countdownSpace');
    
    currentQuestion.answererIndex = -1;
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
                     buzzerTimeout: false,
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
  sessionToken: undefined,
  getQuestionUrl: function(amount, difficulty, category)
  {
    let url = 'https://opentdb.com/api.php?'

    url = this.appendQualifier(url, 'amount', amount);
    url = this.appendQualifier(url, 'difficulty', difficulty);
    url = this.appendQualifier(url, 'category', category);
    url = this.appendQualifier(url, 'type', 'multiple');
    url = this.appendQualifier(url, 'token', this.sessionToken);
    
    return url;
  },
  appendQualifier: function(url, qualName, qualValue)
  {
    if(qualValue !== undefined && qualName !== undefined)
    {
      let lastUrlChar = url.charAt(url.length - 1);

      if(lastUrlChar !== '?' && lastUrlChar !== '&')
        url += '&';

      url += qualName + '=' + qualValue;

    }
    
    return url;
  },
  loadColumnQAs: function(colNum)
  {
    if(this.sessionToken == undefined)
      this.generateToken();
  
    
    let category = rowColumnInfo.getCategoryId(colNum);
        
    for(let i = 0; i < DifficultyEnum.getValues().length; i++)
    {
      let difficulty = DifficultyEnum.getValues()[i];
      
      let diffCount = rowColumnInfo.getDifficultyCount(difficulty);
      
      if(diffCount === 0)
        return;
      
      let request = new XMLHttpRequest();

      let url = this.getQuestionUrl(diffCount, difficulty, category);
      
      console.log(url);
      
      request.open('GET', url, true);

      request.onload = function()
      {
        let data = JSON.parse(this.response);

        if(request.status >= 200 && request.status < 400)
        {
          window.boardGrid.populateQAInfoFromData(data);
                  
          console.log('success');
        }
        else
        {
          console.log('error');
        }
      }

      request.send();
    }
    
    
  },
  generateToken: function()
  {
      let request = new XMLHttpRequest();

      request.open('GET', 'https://opentdb.com/api_token.php?command=request', true);

      request.onload = function()
      {
        let data = JSON.parse(this.response);

        if(request.status >= 200 && request.status < 400)
        {
          window.triviaApiGetter.sessionToken = data.token;
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
    
      
      var playerNameBox = document.createElement('label');
      playerNameBox.className = 'player-name-box';
      playerNameBox.textContent = playerList.getPlayerBoxString(index);
      
      var buzzer = document.createElement('div');
      buzzer.className = 'buzzer';
      
      // figure out what the color should be based on the details
      if(currentQuestion.isAnswerer(player))
      {
         buzzer.style.backgroundColor = 'green';
         flexChildElement.style.backgroundColor = 'white';
      }
      else if(player.buzzerTimeout)
      {
        buzzer.style.backgroundColor = "red";
      }
      else
      {
        buzzer.style.backgroundColor = 'white';
      }
      
      flexChildElement.className += currentQuestion.isAnswerer(player) ? ' podium-lit-up' : ' podium-dim';
      
      playerNameBox.className += player.selected ? ' name-selected' : ' name-unselected';
      playerNameBox.style.color = player.selected ? '#060CE9' : 'white';
      
      moneyTotalBox.className += moneyTotalBox.textContent.includes('-') ? ' money-negative' : ' money-positive';
      
      flexChildElement.id = "playerbox-" + index;
      
      playerNameBox.addEventListener('click', handlers.playerBoxSelected);
    
      moneyTotalBox.id = "moneytotalbox-" + index;
      playerNameBox.id = "playernamebox-" + index;
      
      
      flexChildElement.appendChild(buzzer);
      flexChildElement.appendChild(moneyTotalBox);
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
  },
  displayCategoryHeaders: function()
  {
    for(let i = 0; i < boardGrid.COLUMNS; i++)
    {
      // get category header element from DOM
      let categoryHeader = document.getElementById('category-header' + i);
      
      console.log(categoryHeader);
      
      categoryHeader.textContent = rowColumnInfo.getCategoryName(i);
    }
    
  },
  expandFontSizeToFill: function(element)
  {
    var parentPadLeft = window.getComputedStyle(element.parent, null).getPropertyValue('padding-left');
    var parentPadRight = window.getComputedStyle(element.parent, null).getPropertyValue('padding-right');
    var parentPadTop = window.getComputedStyle(element.parent, null).getPropertyValue('padding-top');
    var parentPadBottom = window.getComputedStyle(element.parent, null).getPropertyValue('padding-bottom');

    var elementMarginLeft = window.getComputedStyle(element, null).getPropertyValue('margin-left');
    var elementMarginLeft = window.getComputedStyle(element, null).getPropertyValue('margin-left');
    var elementMarginLeft = window.getComputedStyle(element, null).getPropertyValue('margin-left');
    var elementMarginLeft = window.getComputedStyle(element, null).getPropertyValue('margin-left');

    var elementPadLeft = window.getComputedStyle(element.parent, null).getPropertyValue('padding-left');
    var elementPadRight = window.getComputedStyle(element.parent, null).getPropertyValue('padding-right');
    var elementPadTop = window.getComputedStyle(element.parent, null).getPropertyValue('padding-top');
    var elementPadBottom = window.getComputedStyle(element.parent, null).getPropertyValue('padding-bottom');

    // get the max width of the container.
    var maxWidth = element.parent.clientWidth - parentPadLeft - parentPadRight - elementMarginLeft - elementMarginRight;
    
    // get the max height of the container.
    var maxHeight;
    
    while(element.clientWidth < (maxWidth - 5) && element.clientHeight < (maxHeight - 5))
    {
      // increase the font size
      element.style.fontSize++;
    }
  }
};


var DifficultyEnum = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  getValues: function()
  {
    return [this.EASY, this.MEDIUM, this.HARD];
  }
};

var rowColumnInfo = 
{
  rowMoneyValues: [],
  colCategoryValues: [],
  rowDifficulties: [],
  init: function(roundNum)
  {
    for(let i = 0; i < 5; i++)
    {
      this.rowMoneyValues[i] = 200 * (i + 1) * (roundNum + 1);
    }
    
    this.setRowDifficulties(roundNum);
    this.getCategoryOptions();
  },
  getCategoryOptions: function()
  {
    
    let request = new XMLHttpRequest();

    request.open('GET', 'https://opentdb.com/api_category.php', true);

    request.onload = function()
    {
      let data = JSON.parse(this.response);

      if(request.status >= 200 && request.status < 400)
      {
        console.log(data);
        rowColumnInfo.setColCategoryValues(data.trivia_categories);
      }
      else
      {
        console.log('error retrieving category options');
      }
    }

    request.send();
  },
  setColCategoryValues: function(options)
  {
    for(let i = 0; i < boardGrid.COLUMNS; i++)
    {
      let randIndex = Math.floor(Math.random() * (options.length));
      
      // extract element at that index from the options array
      this.colCategoryValues[i] = options.splice(randIndex,1)[0];
            
      let name = this.colCategoryValues[i].name;
      
      if(name.includes(':'))
      {
        this.colCategoryValues[i].name = name.substring(name.lastIndexOf(':') + 1).trim();
        console.log('changed name to ' + this.colCategoryValues[i].name);
      }
    }
    
    view.displayCategoryHeaders();
    
    // load the questions and answers from the API
    boardGrid.loadQuestionsAndAnswers();
  },
  setRowDifficulties: function(roundNum)
  {
    if(roundNum == 0)
      this.rowDifficulties = [DifficultyEnum.EASY, DifficultyEnum.EASY, DifficultyEnum.MEDIUM, DifficultyEnum.MEDIUM, DifficultyEnum.HARD];
    else if(roundNum == 1)
      this.rowDifficulties = [DifficultyEnum.EASY, DifficultyEnum.MEDIUM, DifficultyEnum.MEDIUM, DifficultyEnum.HARD, DifficultyEnum.HARD];
  },
  getRowMoneyValue: function(rowNum)
  {
    let moneyVal = this.rowMoneyValues[rowNum];
    
    if(moneyVal === undefined)
      return '???';
    
    return moneyVal;
  },
  getRowDifficulty: function(rowNum)
  {
    return this.rowDifficulties[rowNum];
  },
  getCategoryId: function(colNum)
  {
    return this.colCategoryValues[colNum].id;
  },
  getCategoryName: function(colNum)
  {
    return this.colCategoryValues[colNum].name;
  },
  getColIndexFromCategory: function(category)
  {
    if(category.includes(':'))
    {
      category = category.substring(category.lastIndexOf(':') + 1).trim();
    }
    
    for(let i = 0; i < this.colCategoryValues.length; i++)
    {
      if(category === this.colCategoryValues[i].name)
        return i;
    }
  },
  getDifficultyCount: function(difficulty) 
  {
    let count = 0;
    
    this.rowDifficulties.forEach(function (rowDiff)
    {
      if(rowDiff === difficulty)
        count++;
    }, this);
    
    return count;
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
    playerList.addNewPlayer({playerName: 'player 1', money: 0, selected: false, buzzerTimeout: false, keyBound: 'X'.charCodeAt(0)});
    playerList.addNewPlayer({playerName: 'player 2', money: 0, selected: false, buzzerTimeout: false, keyBound: 'C'.charCodeAt(0)});
    playerList.addNewPlayer({playerName: 'player 3', money: 0, selected: false, buzzerTimeout: false, keyBound: 'V'.charCodeAt(0)});
    view.displayPlayers();
  }

};

triviaApiGetter.generateToken();
boardGrid.fillBoardTiles();

rowColumnInfo.init(0);

window.onkeydown = handlers.anyKeyDown;
testers.fillPlayers();

view.displayBoardGrid();
