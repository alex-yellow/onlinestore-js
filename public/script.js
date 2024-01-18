const mess = document.querySelector('#mess');
if(mess){
    setTimeout(() => {
        mess.remove();
    }, 5000);
}

  // Получаем элемент с датой
  var dateElement = document.getElementById('myDate'); // Замените 'yourDateElementId' на актуальный идентификатор элемента

  // Получаем текст из элемента
  var dateString = dateElement.innerText;

  // Создаем объект Date из строки
  var date = new Date(dateString);

  // Форматируем дату
  var formattedDate = date.toString().slice(0, 24); // Вырезаем часть строки, содержащую информацию о временной зоне

  // Устанавливаем отформатированную дату обратно в элемент
  dateElement.innerText = formattedDate;