var handlers = {
  buttonClicked: function(event)
  {
    if(event.target.id === 'multiplyButton')
      view.setResultsArea(view.getFirstNumber() * view.getSecondNumber());
    else if(event.target.id === 'divideButton')
      view.setResultsArea(view.getFirstNumber() / view.getSecondNumber());
  }
};


var view = {
  setResultsArea: function(text)
  {
    var resultsArea = document.getElementById('resultsArea');
    resultsArea.textContent = text;
    this.clearNumberInputs();
  },
  getFirstNumber: function()
  {
    return document.getElementById('firstNumberInput').valueAsNumber;    
  },
  getSecondNumber: function()
  {
    return document.getElementById('secondNumberInput').valueAsNumber;    
  },
  clearNumberInputs: function()
  {
    this.clearFirstNumber();
    this.clearSecondNumber();
  },
  clearFirstNumber: function()
  {
    document.getElementById('firstNumberInput').value = '';
  },
  clearSecondNumber: function()
  {
    document.getElementById('secondNumberInput').value = '';
  }
};