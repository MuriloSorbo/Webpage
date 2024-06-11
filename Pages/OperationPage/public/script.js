let lastTemp = 0;
let lastHum = 0;
let opName = "";
let operationsList = []

document.addEventListener('DOMContentLoaded', function () {
  setInterval(askRoutine, 5000);

  opName = window.location.pathname.substring(11)
  document.getElementById('title').innerHTML = opName

  askRoutine();
  const request = new XMLHttpRequest();
  const url = '/download/operationsLog/' + opName;

  request.open('GET', url);
  request.addEventListener('load', function () {
    if (this.status == 200) {
      dealRequest(this.responseText);
    }
  });
  request.send();
});


function askRoutine() {
  const request2 = new XMLHttpRequest();
  const url2 = '/download/machinestatus';

  request2.open('GET', url2);
  request2.addEventListener('load', function () {
    if (this.status == 200) {
      machineStatus(this.responseText);
    }
  });
  request2.send();
}

function machineStatus(response)
{
  json = JSON.parse(response);
  json = json[0];

  document.getElementById('MACHINE').contentEditable = true;
  document.getElementById('MACHINE').textContent = json.machineName;
  document.getElementById('MACHINE').contentEditable = false;

  setConnectionStatus(json.connected);

  if (!json.connected) 
  {
      setOperation(false, "");
      return;
  }

  setOperation(json.inOperation, json.operationName);
}

function dealRequest(response)
{
  json = JSON.parse(response);

  average = getAverage(json);
  time = getTime(json);

  createTempGraph(getAxisTemp(json))
  createHumGraph(getAxisHum(json))

  // setConnectionStatus(json.connected);

  // if (!json.connected) return;

  document.getElementById('grain').innerHTML = json[0].grain;
  document.getElementById('durTime').innerHTML = time.duration
  setTemperature(average.temp);
  setHumidity(average.hum);
  changeUpdatedTime(time.start);
  setMapPos(average.geo.split(',')[0], average.geo.split(',')[1]);
  // setOperation(json.inOperation, json.operationName);
  
}

function getTime(json)
{
  return { start: convertDateTimeString(json[0].dateTime), duration: getDurationInMinutes(json[0].dateTime, json[json.length - 1].dateTime)}
}

function getDurationInMinutes(dateTime1, dateTime2)
{
  const date1 = new Date(dateTime1);
  const date2 = new Date(dateTime2);

  let diff = (date2.getTime() - date1.getTime()) / 1000;
  diff /= 60

  return Math.abs(Math.round(diff));
}

function getAxisTemp(json)
{
  const delta = []
  const time = []
  let time0 = false;
  json.forEach(log => {
    delta.push(log.temp);
    
    const dateTime = new Date(log.dateTime);
    if (!time0)  time0 = dateTime;

    elapsed = ((dateTime - time0) / 60000).toFixed(1)

    time.push(elapsed)
  });  

  return { y: delta, x: time }
}

function getAxisHum(json)
{
  const delta = []
  const time = []
  let time0 = false;
  json.forEach(log => {
    delta.push(log.hum);
    
    const dateTime = new Date(log.dateTime);
    if (!time0)  time0 = dateTime;

    elapsed = ((dateTime - time0) / 60000).toFixed(1)

    time.push(elapsed)
  });  

  return { y: delta, x: time }
}

function getAverage(json)
{
  let temp = 0
  let hum = 0
  let size = 0;
  let geo = "0.000000, 0.000000";

  json.forEach(log => {
    temp += log.temp;
    hum += log.hum;
    size += 1

    if (geo == "0.000000, 0.000000") 
    {
      geo = log.geo;
    }
  });  
  
  return {temp: (temp /= size).toFixed(2), hum: (hum /= size).toFixed(2), geo: geo}
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
    document.getElementById('opState').innerHTML = "Em Operação";
    document.getElementById('dotState').style.background = "#f39c12";
  }
  else
  {
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
  const stringDateTime = `Realizado em: ${dateTime}`;
  document.getElementById('refreshDate').innerHTML = stringDateTime;
}

function convertDateTimeString(string)
{
  const date = new Date(string);

  return `${(date.getDate() < 10) ? '0' + date.getDate() : date.getDate()}/${(date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)}/${date.getFullYear()} - ${date.getHours() < 10 ? '0' + date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`
}


const editIcon = document.querySelector('.navigation i.material-icons');
const machineName = document.querySelector('#MACHINE');

var map = L.map('map', { attributionControl: false }).setView([51.505, -0.09], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 16
}).addTo(map);

let marker;
let circle;

function setMapPos(lat, long)
{
  if (marker) 
  {
    map.removeLayer(marker);
    map.removeLayer(circle);
  }

  marker = L.marker([lat, long]).addTo(map);
  circle = L.circle([lat, long], {radius: 10}).addTo(map);
  map.fitBounds(circle.getBounds());
}

setMapPos(-23.516641, -47.496185)

function adjustBrTag() {
  var brElement = document.querySelector('.br');
  if (window.innerWidth < 785) {

    brElement.innerHTML = '<br>';
  } else {

    brElement.innerHTML = '';
  }
}

adjustBrTag();

window.addEventListener('resize', adjustBrTag);

function createTempGraph(data)
{
  const options = {
    series: [{
      name: "Temperatura",
      data: data.y
    }],
    chart: {
      width: window.innerWidth > 1000 ? window.innerWidth - 150 : window.innerWidth - 20,
      height: 350,
      type: 'line',
      zoom: {
        enabled: true
      },
      toolbar: {
        show: true
      }
    },
    colors: ['#EC6200'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight'
    },
    title: {
      text: 'Variação de Temperatura',
      align: 'center'
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    xaxis: {
      categories: data.x,
      tickPlacement: 'on',
      labels: {
        rotate: -45,
        style: {
          fontSize: '10px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Temperatura (ºC)'
      }
    }
  };
  
  var chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();
}


function createHumGraph(data)
{
  const options1 = {
    series: [{
      name: "Umidade",
      data: data.y
    }],
    chart: {
      width: window.innerWidth > 1000 ? window.innerWidth - 150 : window.innerWidth - 20,
      height: 400,
      type: 'line',
      zoom: {
        enabled: true
      },
      toolbar: {
        show: true
      }
    },
    colors: ['#1abc9c'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight'
    },
    title: {
      text: 'Variação de Umidade',
      align: 'center'
    },
    grid: {
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    xaxis: {
      categories: data.x,
      tickPlacement: 'on',
      labels: {
        rotate: -45,
        style: {
          fontSize: '10px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Umidade (%)'
      }
    }
  };
  
  var chart1 = new ApexCharts(document.querySelector("#chart1"), options1);
  chart1.render();
}




