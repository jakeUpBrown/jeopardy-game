


var handlers = {
  displayFileExtension: function()
  {
    var fileNameInput = document.getElementById('fileNameInput');
    
    var resultsArea = document.getElementById('resultsArea');
    resultsArea.textContent = stringOperations.getFileExtension(fileNameInput.value);
    
    fileNameInput.value = '';
  }
}

var stringOperations = {
  getFileExtension: function(fileName)
  {
    return fileName.substring(fileName.lastIndexOf('.'));
  }
}
