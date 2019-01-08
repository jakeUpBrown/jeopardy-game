var handlers = {
 submitYear: function()
  {    
    var yearInput = document.getElementById('yearInput');    
    var resultsArea = document.getElementById('resultsArea');
  
    if(window.isLeapYear(yearInput.valueAsNumber))
    {
      resultsArea.textContent = 'Leap Year';
      resultsArea.style.color = 'green';
    }
    else
    {
      resultsArea.textContent = 'Not A Leap Year';
      resultsArea.style.color = 'red';
    }

    yearInput.textContent = '';
  }
};

function isLeapYear(year)
{
  return year % 4 == 0 && year % 2000 != 0;
}
