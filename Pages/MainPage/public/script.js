const menu = document.querySelector('.menu');
const NavMenu = document.querySelector('.nav-menu');

menu.addEventListener('click', () => {
    menu.classList.toggle('ativo');
    NavMenu.classList.toggle('ativo');
})

let lastTemp = 0;
let lastHum = 0;
let operationsList = []
let setName = false;
let curOpName = "";

document.addEventListener('DOMContentLoaded', function () {
  setInterval(askRoutine, 5000);
  setOperation(false, "");
  askRoutine();
});

function askRoutine() {
  const request = new XMLHttpRequest();
  const url = '/download/machinestatus';

  request.open('GET', url);
  request.addEventListener('load', function () {
    if (this.status == 200) {
      dealRequest(this.responseText);
    }
  });
  request.send();

  const request2 = new XMLHttpRequest();
  const url2 = '/download/operationsList';

  request2.open('GET', url2);
  request2.addEventListener('load', function () {
    if (this.status == 200) {
      opList(this.responseText);
    }
  });
  request2.send();
}

function dealRequest(response)
{
  json = JSON.parse(response);
  json = json[0];

  setTemperature(json.lstTemp);
  setHumidity(json.lstHum);
  setMapPos(json.lstGeo.split(',')[0], json.lstGeo.split(',')[1]);
  changeUpdatedTime(json.updatedAt);
  if (!setName)
  {
      document.getElementById('MACHINE').contentEditable = true;
      document.getElementById('MACHINE').textContent = json.machineName;
      document.getElementById('MACHINE').contentEditable = false;
      setName = true;
  }
  
  setConnectionStatus(json.connected);

  if (!json.connected) 
  {
      setOperation(false, "");
      return;
  }

   setOperation(json.inOperation, json.operationName);
}

function opList(response)
{
  json = JSON.parse(response);

  json.forEach((operation) => createButton(operation.opName, convertDateTimeString(operation.dateTime)));
}

function setTemperature(val) {  
  document.getElementById('tempText').innerHTML = val + 'ºC';

  val = parseInt(val)

  startTemp = lastTemp;

  if (val == startTemp) return;

  incrementTemp = val > startTemp ? 1 : -1;

  intervalTemp = setInterval(() => {
    document
      .getElementById('tempCircle')
      .setAttribute('stroke-dasharray', `${startTemp} ${100 - startTemp}`);
      startTemp += incrementTemp;

    if (startTemp == val) clearInterval(intervalTemp);
  }, 10);

  lastTemp = val;
}

function setHumidity(val) {
  document.getElementById('humText').innerHTML = val + '%';

  val = parseInt(val)

  startHum = lastHum;

  if (startHum == val) return;

  incrementHum = val > startHum ? 1 : -1;

  intervalHum = setInterval(() => {
    document
      .getElementById('humCircle')
      .setAttribute('stroke-dasharray', `${startHum} ${100 - startHum}`);
      startHum += incrementHum;

    if (startHum == val) clearInterval(intervalHum);
  }, 10);

  lastHum = val;
}

function setOperation(inOperation, opName)
{
  if (inOperation)
  {
    curOpName = opName;
    document.getElementById('opName').innerHTML = "Operação Atual: " + opName;
    document.getElementById('title').style.visibility = "visible";
    document.getElementById('opState').innerHTML = "Em Operação";
    document.getElementById('dotState').style.background = "#f39c12";
  }
  else
  {
    curOpName = "";
    document.getElementById('title').style.visibility  = "hidden";
    document.getElementById('opState').innerHTML = "Fora de Operação";
    document.getElementById('dotState').style.background = "transparent";
  }
}

function setConnectionStatus(status)
{
  if (status)
  {
    document.getElementById('connectionStatus').innerHTML = "Conectado";
    document.getElementById('connectionStatus').style.color = "#27ae60";
    document.getElementById('dotCon').style.background = "#27ae60";
  }
  else
  {
    document.getElementById('connectionStatus').innerHTML = "Desconectado";
    document.getElementById('connectionStatus').style.color = "#e74c3c";
    document.getElementById('dotCon').style.background = "#e74c3c";
  }
}

function changeUpdatedTime(dateTime)
{
  const stringDateTime = `Atualizado em: ${convertDateTimeString(dateTime)}`;
  document.getElementById('refreshDate').innerHTML = stringDateTime;
}

function convertDateTimeString(string)
{
  const date = new Date(string);

  return `${(date.getDate() < 10) ? '0' + date.getDate() : date.getDate()}/${(date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)}/${date.getFullYear()} - ${date.getHours() < 10 ? '0' + date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`
}

function createButton(opName, dateTime) {

    if (operationsList.includes(opName)) return;  
    if (curOpName == opName) return;

    operationsList.push(opName);
    const footer = document.getElementById('buttonsContainer');
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');
    footer.appendChild(buttonContainer);

    const button = document.createElement('button');
        button.addEventListener('click', () => window.location.href="/operation/" + opName);
        button.classList.add('button');
        const btnTitle = document.createElement('span');
        btnTitle.classList.add('btn-title');
        btnTitle.style.display = 'inline-block';
        btnTitle.textContent = opName;
        button.appendChild(btnTitle);
        const btnSubtitle = document.createElement('span');
        btnSubtitle.classList.add('btn-subtitle');
        btnSubtitle.textContent = dateTime;
        btnSubtitle.style.display = 'inline-block';
        button.appendChild(btnSubtitle);
        buttonContainer.appendChild(button);
}

const editIcon = document.querySelector('.navigation i.material-icons');
const machineName = document.querySelector('#MACHINE');

editIcon.addEventListener('click', () => {
    machineName.contentEditable = true;
    machineName.style.color = '#707070';
    machineName.focus();
    
    machineName.addEventListener('keydown', (event) => {
        if (event.keyCode === 13) {
            event.preventDefault();
            if (machineName.textContent.length < 1) return;
            updateMachineName(machineName.textContent);
            machineName.contentEditable = false;
            machineName.style.color = '';
            machineName.style.outline = '';
        }

        else if (machineName.textContent.length >= 10 && event.key !== 'Backspace')
        {
          event.preventDefault();
        }
    });
});

function updateMachineName(name)
{
  const request = new XMLHttpRequest();
  const url = '/upload/machineName';
  
  request.open('POST', url);
  request.setRequestHeader("Content-Type", "application/json");
  const data = {
    machineName: name
  };
  request.addEventListener('load', function () {
    if (this.status == 200) {
      console.log('okay');
    }
  });
  request.send(JSON.stringify(data));
}

const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();

    const buttons = document.querySelectorAll('.button');
    
    buttons.forEach(button => {
        const title = button.querySelector('.btn-title').textContent.toLowerCase();

    
        if (title.includes(searchTerm)) {
            button.style.display = 'block'; 
        } else {
            button.style.display = 'none'; 
        }
    });
});


var map = L.map('map', { attributionControl: false }).setView([51.505, -0.09], 13);


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 16,
}).addTo(map);

let marker;
let circle1;

function setMapPos(lat, long)
{
  if (marker) 
  {
    map.removeLayer(marker);
    map.removeLayer(circle1);
  }

  marker = L.marker([lat, long]).addTo(map);
  circle1 = L.circle([lat, long], {radius: 8}).addTo(map);
  map.fitBounds(circle1.getBounds());
}

setMapPos(0, 0)

