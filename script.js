var handlers = {
 doButtonStuff: function()
  {
    debugger;
    console.log('in doButtonStuff');
    
    var dateField = document.getElementById('pField');
    var oldString = dateField.textContent;
    
    var newString = oldString[oldString.length - 1] + oldString.substring(0, oldString.length - 2)
    dateField.textContent = newString;
  }
};
