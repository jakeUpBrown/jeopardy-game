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
    view.updatePlayerBuzzed(player.index);
    setTimeout(function() {
      window.playerList.unbuzzPlayer(player.index)
    }, 2000);
  },
  unbuzzPlayer: function(index)
  {
    if(playerList.players[index].buzzerTimeout === true)
    {
      playerList.players[index].buzzerTimeout = false;
      view.updatePlayerBuzzed(index);
    }
  },
  unbuzzAllPlayers: function()
  {
    let redisplayPlayers = false;
    
    for(let i = 0; i < playerList.players.length; i++)
    {
      this.unbuzzPlayer(i);
    }
    
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
  
    this.scrambleAnswers();
    
    this.available = true;
  }
  
  
  scrambleAnswers()
  {
    if(this.answer === '' || this.answer == undefined || this.wrongOptions == '' || this.wrongOptions === undefined)
      return;
    
    let answerOrder = [];
    answerOrder.push(this.answer);    
    answerOrder = answerOrder.concat(this.wrongOptions);
    
    var currentIndex = answerOrder.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = answerOrder[currentIndex];
    answerOrder[currentIndex] = answerOrder[randomIndex];
    answerOrder[randomIndex] = temporaryValue;
    }

    // after the shuffle, find the index of the correct answer
    for(let i = 0; i < answerOrder.length; i++)
    {
      if(answerOrder[i] === this.answer)
      {
        this.correctAnswerIndex = i;
        break;
      }
    }
    
  this.answerOrder = answerOrder;
  }
  
  isClicked(element)
  {
    // prompt the current question to start
    if(this.available === false)
      return;
    
    var questionStarted = currentQuestion.startFromTile(this, element);
    
    // set the question to unavailable if the startFromTile returned affirmative
    if(questionStarted === true)
      this.available = false;
  }
  createElement()
  {
    var element = document.createElement('div');
    element.className = 'board-grid-item board-grid-item-font';
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
    
    this.scrambleAnswers();
  }

  hasQuestionPopulated()
  {
    return !(this.question === '' || this.question === undefined);
  }
  
  getAnswerByIndex(index)
  {
    return this.answerOrder[index]; 
  }
  
  getCorrectAnswerIndex()
  {
    return this.correctAnswerIndex;
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
  buzzWindowOpen: false,
  promptAnswerWindowOpen: false,
  answererIndex: -1,
  answerSelectedIndex: -1,
  previousAnswerers: [],
  tile: undefined,
  element: undefined,
  phaseEndingTimeout: undefined,
  startFromTile: function(tile, element)
  {
    this.tile = tile;
    this.element = element;
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
    view.expandTileToFillBoard(this.element);
    return true;
  },
  displayCountdown: function()
  {
    playerList.unbuzzAllPlayers();
    this.decrementCountdown(0);
  },
  decrementCountdown: function(value)
  {    
    if(value <= 0)
    {
      view.displayCountdown('GO!');
      this.openBuzzWindow(5000);
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
  startQuestion: function(speak)
  {
    view.displayQA();
    if(speak === true)
      return voiceAudio.speak(this.tile.question);
    else
      return false;
  },
  openBuzzWindow: function(timeoutLength, speakQuestion)
  {
    if(this.phaseEndingTimeout !== undefined)
      clearTimeout(this.phaseEndingTimeout);
    
    playerList.unbuzzAllPlayers();
    
    this.answerSelectedIndex = -1;
    
    let voiceStarted = this.startQuestion(speakQuestion);
    
    this.answererIndex = -1;
    this.buzzWindowOpen = true;
    
    // if the voice didn't start, need to set the timeout here.
    if(voiceStarted == false)
    {
      this.phaseEndingTimeout = setTimeout(this.showCorrectAnswer, timeoutLength);
    }
    // else, the voiceAudio already set the timeout for after the question is finished being read. 

    view.displayPlayers();
  },
  playerBuzzed: function(player)
  {
    // check that the buzz window is open, nobody is currently answering and that the player hasn't buzzed before.
    if(this.buzzWindowOpen === true && this.answererIndex === -1 && !this.playerBuzzedBefore(player))
    {
      // found the winner.
      this.promptPlayer(player);
    }
  },
  playerBuzzedBefore: function(player)
  {    
    return this.previousAnswerers.includes(player.index);
  },
  promptPlayer: function(player)
  {
    this.previousAnswerers.push(player.index);
    this.answererIndex = player.index;
    
    this.openPromptAnswerWindow(player);
  },
  openPromptAnswerWindow: function(player)
  {
    this.promptAnswerWindowOpen = true;
    
    handlers.buzzedPlayerKeyUp = false;
    
    this.answererIndex = player.index;
    this.answerSelectedIndex = 0;
    
    view.displayQA(false);
    
    if(this.phaseEndingTimeout !== undefined)
      clearTimeout(this.phaseEndingTimeout)
    
    this.phaseEndingTimeout = setTimeout(this.checkPlayerAnswer, 5000);
  },
  playerWon: function(player)
  {
    player.money += this.getMoneyValue();
    this.showCorrectAnswer();
  },
  playerLost: function(player)
  {
    window.view.markSelectedAnswerAsIncorrect();

    player.money -= this.getMoneyValue();

    soundEffects.playTimesUp();
        
    // check if there are any other players still to guess.
    if(window.currentQuestion.previousAnswerers.length != window.playerList.players.length)
    {
      // if there are , open up the buzz window in 1 second
      window.currentQuestion.phaseEndingTimeout = setTimeout(function ()
                                                             {
        window.currentQuestion.openBuzzWindow(3000, false);
      }, 1000);
    }
    else
    {
      // if there aren't, end the round in 1 second.
      window.currentQuestion.showCorrectAnswer();
    }
  },
  isAnswerer: function(player)
  {
    return player.index == this.answererIndex;
  },
  checkPlayerAnswer: function()
  {
    // close the promptAnswerWindow. to prevent further changes of the answer
    this.promptAnswerWindowOpen = true;
    // check if the player got the answer right.
        
    if(currentQuestion.answerSelectedIndex === currentQuestion.tile.correctAnswerIndex)
    {
      currentQuestion.playerWon(playerList.players[currentQuestion.answererIndex]);
    }
    else
    {     
      currentQuestion.playerLost(playerList.players[currentQuestion.answererIndex]);
    }
  },
  showCorrectAnswer: function()
  {
    currentQuestion.started = false;
    currentQuestion.promptAnswerWindowOpen = false;
    currentQuestion.buzzWindowOpen = false;
    // set the className of the correct answer to correct-answer
    window.view.showCorrectAnswer();
    
    setTimeout(window.currentQuestion.endRound, 2000);
  },
  endRound: function()
  {    
    currentQuestion.answererIndex = -1;
    currentQuestion.started = false;
    currentQuestion.promptAnswerWindowOpen = false;
    currentQuestion.previousAnswerers = [];
    currentQuestion.buzzWindowOpen = false;
    view.hideQuestionSpace();
    playerList.unbuzzAllPlayers();
    view.displayPlayers();
    view.displayBoardGrid();
  },
  speechEnded: function()
  {
    if(this.phaseEndingTimeout === undefined)
    {
      this.phaseEndingTimeout = setTimeout(this.showCorrectAnswer, 3000);    
    }
  },
  rotateAnswerSelected: function()
  {
    if(this.promptAnswerWindowOpen == false)
      return;
    
    console.log("rotateAnswerSelected");
    this.answerSelectedIndex = (this.answerSelectedIndex + 1) % (this.tile.wrongOptions.length + 1)
    view.displayQA(false);
  },
  getAnswerer: function()
  {
    if(this.answererIndex < 0)
      return undefined;
    
    return playerList.players[this.answererIndex];
  },
  getMoneyValue: function()
  {
    return rowColumnInfo.getRowMoneyValue(this.tile.row);
  },
  isInMiddleOfQuestion: function()
  {
    return this.started;
  }
};

var handlers = {
  buzzedPlayerKeyUp: false,
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
  anyKeyUp: function(event)
  {
    // check if the player is the current answerer
    var answeringPlayer = window.currentQuestion.getAnswerer();
    
    if(answeringPlayer !== undefined && (event.keyCode === answeringPlayer.keyBound))
    {
      if(handlers.buzzedPlayerKeyUp === false)
      {
        handlers.buzzedPlayerKeyUp = true;
        return;
      }
      
      currentQuestion.rotateAnswerSelected();
      return;
    }
    
  },
  startRound: function()
  {
    currentQuestion.startRound();
  },
  boardTileClicked: function(event)
  {
    var targetDiv = event.target;
    
    boardGrid.boardTiles[targetDiv.row][targetDiv.col].isClicked(event.target);
  },
  speakerClicked: function()
  {
    console.log('speaker clicked');
    let newChar = voiceAudio.toggleValid();
    
    let speakerElement = document.getElementById('speaker-icon');
    speakerElement.textContent = newChar;
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
  green: '#2ECC40',
  white: '#fdfdfd',
  red: '#FF4136',
  blue: '#060ce9',
  displayPlayers: function()
  {
    // for each player, create an element for the DOM
   
    console.log(this);
    
    var playerBoxContainer = document.getElementById('playerBoxContainer');
    
    // clear player box container
    playerBoxContainer.innerHTML = '';
    
    window.playerList.players.forEach(function(player, index){
          
      var flexChildElement = document.createElement('div');
      flexChildElement.className = 'flex-child';
      
      var moneyTotalBox = document.createElement('div');
      moneyTotalBox.className = 'money-total-box';
      moneyTotalBox.textContent = playerList.getPlayerMoneyTotalString(index);
      moneyTotalBox.className += moneyTotalBox.textContent.includes('-') ? ' money-negative' : ' money-positive';
      
      var playerNameBox = document.createElement('label');
      playerNameBox.className = 'player-name-box';
      playerNameBox.textContent = playerList.getPlayerBoxString(index);
      
      playerNameBox.className += player.selected ? ' name-selected' : ' name-unselected';
      playerNameBox.style.color = player.selected ? window.view.blue : window.view.white;
      playerNameBox.addEventListener('click', handlers.playerBoxSelected);

      var buzzer = document.createElement('div');
      buzzer.className = 'buzzer';
      
      let timer = window.view.createTimerElement();
      
      flexChildElement.className += currentQuestion.isAnswerer(player) ? ' podium-lit-up' : ' podium-dim';
      
      flexChildElement.id = "playerbox-" + index;    
      moneyTotalBox.id = "moneytotalbox-" + index;
      playerNameBox.id = "playernamebox-" + index;
      buzzer.id = "buzzer-" + index;
      timer.id = 'timer-' + index;
      
      flexChildElement.appendChild(buzzer);
      flexChildElement.appendChild(moneyTotalBox);
      flexChildElement.appendChild(playerNameBox);
      flexChildElement.appendChild(timer);
      
      playerBoxContainer.appendChild(flexChildElement);
      
      update
    });
  },
  updatePlayerBuzzed: function(index)
  {
    let flexChildElement = document.getElementById('playerbox-' + index);
    
    let buzzer = flexChildElement.getElementById('buzzer-' + index);
    
    let timer = flexChildElement.getElementById('timer-' + index);
      
    // figure out what the color should be based on the details
    if(currentQuestion.answererIndex === index)
    {
      // buzzer should be green
      buzzer.style.backgroundColor = window.view.green;
      flexChildElement.style.backgroundColor = window.view.white;
      timer.className += ' timer-start';
    }
    else if(playerList.players[index].buzzerTimeout)
    {
      buzzer.style.backgroundColor = window.view.red;
    }
    else
    {
      buzzer.style.backgroundColor = window.view.white;
    }
    
  },
  createTimerElement: function()
  {
    let timerElement = document.createElement('div');

    for(let i = 0; i < 9; i++)
    {
      let timerCell = document.createElement('div');
      timerCell.className = 'light-up-cell';
      timerElement.appendChild(timerCell);
    }

    timerElement.className = 'light-up-timer';
    return timerElement;
  },
  displayQA: function()
  {
    let questionArea = document.getElementById('question-holder');
    questionArea.textContent = util.decodeHtmlString(currentQuestion.tile.question);
    
    let answerGrid = document.getElementById('answer-grid');
    
    while(answerGrid.firstChild)
    {
      answerGrid.removeChild(answerGrid.firstChild);
    }
    
    for(let i = 0; i < currentQuestion.tile.answerOrder.length; i++)
    {
      let answerElement = this.createAnswerElement(i);
    
      if(i === currentQuestion.answerSelectedIndex)
        answerElement.className = 'selected-answer';
      
      answerGrid.appendChild(answerElement);
    }
    
    let questionSpace = document.getElementById('question-space');
    questionSpace.style.zIndex = 10;
  },
  createAnswerElement: function(answerIndex)
  {
    let answerElement = document.createElement('p');
    answerElement.textContent = currentQuestion.tile.getAnswerByIndex(answerIndex);
    
    //if(answerIndex === currentQuestion.tile.correctAnswerIndex)
      //answerElement.style.backgroundColor = 'red';
    
    answerElement.id = 'answer-option' + answerIndex;
    
    return answerElement;
  },
  markSelectedAnswerAsIncorrect: function()
  {
    let answerOption = document.getElementById('answer-option' + window.currentQuestion.answerSelectedIndex);
    answerOption.className = 'incorrect-answer';
    answerOption.clientHeight;
  },
  showCorrectAnswer: function()
  {
    let answerOption = document.getElementById('answer-option' + window.currentQuestion.tile.correctAnswerIndex);
    answerOption.className = 'correct-answer';
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
    var questionSpace = document.getElementById('question-space');
    
    questionSpace.innerHTML = content;
    questionSpace.style.zIndex=10;
    
  },
  startLightUpTimer: function(playerIndex)
  {
    // get light up timer
    var lightUpTimer = document.getElementsByClassName('light-up-timer')[playerIndex];
        
    // add timer-start to className.
    lightUpTimer.className = lightUpTimer.className.replace('timer-start', '');
    lightUpTimer.offsetHeight; // no need to store this anywhere, the reference is enough
    lightUpTimer.className += ' timer-start';
  },
  updatePlayerSelected: function()
  {
    // find the index of the player selected.
    let playerSelected = playerList.getSelectedPlayer();
    
    let playerSelectedIndex = playerSelected === undefined ? -1 : playerSelected.index;
    
    let playerNameElements = document.getElementsByClassName('player-name-box');
    
    for(let i = 0; i < playerNameElements.length; i++)
    {
      let classArray = playerNameElements[i].className.split(/\s+/);
            
      if(classArray.includes('name-selected') && i !== playerSelectedIndex)
      {
        util.replaceClassName(playerNameElements, 'name-selected', 'name-unselected');
      }
      else if(classArray.includes('name-unselected') && i == playerSelectedIndex)
      {
        util.replaceClassName(playerNameElements[i], 'name-unselected', 'name-selected');
      }
    }
  },
  hideQuestionSpace: function()
  {
    var questionSpace = document.getElementById('question-space');
    questionSpace.style.zIndex=0;
  },
  displayCategoryHeaders: function()
  {
    for(let i = 0; i < boardGrid.COLUMNS; i++)
    {
      // get category header element from DOM
      let categoryHeader = document.getElementById('category-header' + i);
            
      categoryHeader.textContent = rowColumnInfo.getCategoryName(i);
      this.expandFontSizeToFill(categoryHeader);
    }
    
  },
  updateAnswerSelected: function()
  {
    console.log("NEED TO UPDATE ANSWER SELECTED VIEW");
  },
  expandFontSizeToFill: function(element)
  {
    let parent = element.parentNode;
    
    // get the max width of the container.
    var maxWidth = parent.clientWidth;
    
    // get the max height of the container.
    var maxHeight = parent.clientHeight;
    
    var clearance = element.textContent.length < 6 ? 45 : 35;
    
    let fakeElement = document.createElement('label');
    fakeElement.className = 'fakeElement fakeInvisible';
    fakeElement.textContent = element.textContent;
    fakeElement.style.maxWidth = (maxWidth - clearance) + 'px';
    parent.appendChild(fakeElement);
        
    let fontSize = util.getNumberFromPixelString(window.getComputedStyle(fakeElement, null).getPropertyValue('font-size'));
    
    while(fakeElement.clientWidth <= (maxWidth - clearance) && fakeElement.clientHeight <= (maxHeight - clearance))
    {
      fontSize++;
      // increase the font size
      fakeElement.style.fontSize = (fontSize) + 'px';
    }
    
    element.style.fontSize = fontSize + 'px';
    
    parent.removeChild(fakeElement);
  },
  expandTileToFillBoard: function(element)
  {
    let grid = document.getElementById('board-grid');
    
    
    let timesPerSecond = 100;
    let seconds = .1;
    
    let totalFrames = Math.ceil(timesPerSecond * seconds);
    let millisPerFrame = 1000 / timesPerSecond;
    
    let borderWidth = util.getElementPropertyValue(element, 'border-width');
    
    let endFontSize = util.getElementPropertyValue(element, 'font-size') * 7; // constant?
    
    let animatedElement = element.cloneNode(true);
    animatedElement.className = 'board-grid-item-font animated-grid-item';
    grid.appendChild(animatedElement);
    animatedElement.style.left = element.offsetLeft + borderWidth + 'px';
    animatedElement.style.top = element.offsetTop + borderWidth + 'px';
    animatedElement.style.lineHeight = animatedElement.style.height = element.clientHeight + 'px';
    animatedElement.style.width = element.clientWidth + 'px';
    animatedElement.style.zIndex = 20;
    
    setIntervalXWithXParemeter(function (x)
    {
      window.view.resizeTile(animatedElement, 1 / (totalFrames - x), endFontSize);
    }.bind(this), millisPerFrame, totalFrames,
    function ()
     {
      // will want to set an interval for the animatedElement to disappear 
      setTimeout(function()
      {
        console.log(animatedElement);
        grid.removeChild(animatedElement);
        window.currentQuestion.openBuzzWindow(5000, true);
      }.bind(this), 1000);
     }.bind(this));
    
  },
  resizeTile: function(element, percentageOfDelta, endFontSize)
  {
    var one=new Date();
    let parent = element.parentNode;
    // find distance that needs to be covered. percentageOfDelta will tell how much of the remaining needs to be added
    // add the delta * percentageOfDelta
    element.style.top = (element.offsetTop - ((element.offsetTop) * percentageOfDelta)) + 'px';
    element.style.left = (element.offsetLeft - ((element.offsetLeft) * percentageOfDelta)) + 'px';
    
    element.style.lineHeight = element.style.height = (element.clientHeight + (Math.abs(parent.clientHeight - element.clientHeight) * percentageOfDelta)) + 'px';
    element.style.width = (element.clientWidth + (Math.abs(parent.clientWidth - element.clientWidth) * percentageOfDelta)) + 'px';
    
    let currentFontSize = util.getElementPropertyValue(element, 'font-size');
    
    element.style.fontSize = currentFontSize + (Math.abs(endFontSize - currentFontSize) * percentageOfDelta) + 'px';
    
    element.style.display = 'none';
    element.style.display = 'block';
    
    var two=new Date();

     //Calculate difference btw the two dates
     console.log('execution: ' + (two.getMilliseconds()-one.getMilliseconds()));
  }
};


var soundEffects = 
{
  playTimesUp: function()
  {
    new Audio('https://cdn.glitch.com/1bdfd8b4-5c96-433d-9016-2c5c714cf5c0%2FTimes-up.mp3?1547510667439').play();
  }
};

var voiceAudio = 
{
  
  voice : [],
  msg: [],
  valid: true,
  enabledIcon: '\uD83D\uDD0A',
  disabledIcon: '\uD83D\uDD08',
  init: function()
  {
    if (!'speechSynthesis' in window) {
      this.valid = false;
    }
    
    this.msg = new SpeechSynthesisUtterance();
    this.voice = window.speechSynthesis.getVoices()[4];
    this.msg.pitch = 1;
    this.msg.rate = 1.5;
  },
  speak: function(text)
  {
    if(!this.valid)
      return false;
        
    this.stop();
        
    text = util.sanitizeTextForSpeech(text);
    
    /*
    let textQueue = this.splitUpMessageUnder100(text);
    
    for(let i = 0; i < textQueue.length; i++)
    {
    
      this.msg.text = textQueue[i];
      
      window.speechSynthesis.speak(this.msg);    
    }
    */
    
    this.msg.text = text;
    
    this.msg.onend = function(event)
    {
      console.log('speech ended');
      window.currentQuestion.speechEnded();
    };
    
    window.speechSynthesis.speak(this.msg);
    
    return true;
  },
  stop: function()
  {
    window.speechSynthesis.cancel();
  },
  splitUpMessageUnder100: function(text)
  {
    if(text.length <= 100)
      return [text];
       
    // need to break up the sentences into pieces that the translater
    let rawSplitTextBuffer = text.split('.');
    
    let rawSplitText = [];
    
    // make sure that every component of raw split text is under 100 characters.
    for(let rawIndex = 0; rawIndex < rawSplitTextBuffer.length; rawIndex++)
    {
      let rawString = rawSplitTextBuffer[rawIndex];
            
      while(!(rawString.length < 100))
      {
        // will need to split this text up anyway.
                
        // start at char index 98, move backwards and find the first space.
        for(let i = 98; i >= 0; i--)
        {
          if(rawString.charAt(i) === ' ')
          {
            // extract every character before i index and add to rawStrings
            rawSplitText.push(rawString.substring(0,i + 1));
            rawString = rawString.substring(i + 1);
            break;
          }
        }
            
        // repeat until text.length < 100.
      }
      
      // rawString should contain string with < 100 characters.
      // add back the period to the end.
      rawSplitText.push(rawString + '.');
    }
    
    let validSplitText = [''];
        
    for(let rawIndex = 0; rawIndex < rawSplitText.length; rawIndex++)
    {
      let rawString = rawSplitText[rawIndex];
    
      // check if adding the rawSplitText[rawIndex] will exceed the valid split text index.
      if(validSplitText[validSplitText.length - 1].length + rawString.length <= 100)
      {
        validSplitText[validSplitText.length - 1] += rawString;
      }
      else
      {
        // need to push to validSplitText
        validSplitText.push(rawString);
      }
    }
        
    return validSplitText;
  },
  toggleValid: function()
  {
    this.valid = !this.valid;

    if(!this.valid)
      this.stop();
    
    return this.valid ? this.enabledIcon : this.disabledIcon;
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
  },
  getNumberFromPixelString: function(pixelString)
  {
    if(pixelString.length < 3)
      return 0;
    
    return parseInt(pixelString.substring(0,pixelString.length - 2));
  },
  sanitizeTextForSpeech: function(text)
  {
    text = this.decodeHtmlString(text);
    
    // for the text-to-speech guy, replace any 3 or more underscores with "blank"
    text = text.replace("[_]{3,}", "blank");
    
    return text;
  },
  decodeHtmlString: function(html)
  {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  },
  getElementPropertyValue: function(element, property)
  {
    return this.getNumberFromPixelString(window.getComputedStyle(element, null).getPropertyValue(property));
  },
  replaceClassName: function(element, oldClassName, newClassName)
  {
    let classArray = element.className.split("/\s+/");
    
    classArray.fiter(function(value)
        {
          return value === oldClassName;
        });
        
    classArray.push(newClassName);
    
    let combinedNewClassName = '';
    
    for(let i = 0; i < classArray.length; i++)
    {
      combinedNewClassName += classArray[i];
    }
    
    element.className = combinedNewClassName;
  }
};


function setIntervalXWithXParemeter(callback, delay, repetitions, endCallBack) {
    var x = 0;
    var intervalID = window.setInterval(function () {

       callback(x);

       if (++x >= repetitions) {
           window.clearInterval(intervalID);
         endCallBack();
       }
    }, delay);
}


var testers = 
{
  fillPlayers : function()
  {
    playerList.addNewPlayer({playerName: 'player 1', money: 0, selected: false, buzzerTimeout: false, keyBound: 'X'.charCodeAt(0)});
    playerList.addNewPlayer({playerName: 'player 2', money: 0, selected: false, buzzerTimeout: false, keyBound: 'C'.charCodeAt(0)});
    playerList.addNewPlayer({playerName: 'player 3', money: 0, selected: false, buzzerTimeout: false, keyBound: 'V'.charCodeAt(0)});
    view.displayPlayers();
  },
  audioTest: function()
  {

  }

};

voiceAudio.init();
voiceAudio.init();

triviaApiGetter.generateToken();
boardGrid.fillBoardTiles();

rowColumnInfo.init(0);

window.onkeydown = handlers.anyKeyDown;
window.onkeyup = handlers.anyKeyUp;

testers.fillPlayers();

//voiceAudio.speak("This. is. Jeopardy!");

view.displayBoardGrid();




voiceAudio.valid = false;


