var handlers = {
 animateString: function()
  {    
    var dateField = document.getElementById('pField');
    var oldString = dateField.textContent.trim();
    var newString = oldString[oldString.length - 1] + oldString.substring(0, oldString.length - 1)
    dateField.textContent = newString;
  }
};

setInterval(handlers.animateString, 500);

function isLeapYear(year)
{
  return year % 4 == 0 && year % 2000 != 0;
}
