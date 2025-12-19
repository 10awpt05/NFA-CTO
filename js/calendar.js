const calendarGrid = document.getElementById('calendar-grid');
  const monthYear = document.getElementById('month-year');

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDate = today.getDate();

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  monthYear.textContent = monthNames[currentMonth] + " " + currentYear;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Add blank cells for days before first of month
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    calendarGrid.appendChild(emptyCell);
  }

  // Add all days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.textContent = day;
    if(day === currentDate) {
      dayCell.classList.add('today');
    }
    calendarGrid.appendChild(dayCell);
  }