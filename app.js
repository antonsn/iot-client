//let serverUrl = "http://20.71.255.57:80"
let serverUrl = "http://iot-cloud.azurewebsites.net:80"
//let serverUrl = "http://localhost:80"
//let serverUrl = "http://192.168.2.101:80"
let portId = "/dev/ttyUSB0"

var io = require('socket.io-client');


var serialRequest = ""
var density = 0.0
var temperature = 0.0
var flow1 = 0.0



// Serial Port initializations
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const port = new SerialPort(portId, { baudRate: 115200 })
const parser = port.pipe(new Readline({ delimiter: '\r' }))

parser.on('data', readSerialData)


function readSerialData(data) {
  try {

    //log.info("serial data:" + data);
    let serialResponse = data.toString('utf8');
    switch (serialRequest) {   // serialRequest will contain a previously received command or empty string
      case "SYS":
        log.info("Command Received: " + serialRequest);
        serialRequest = "";
        density = parseFloat(serialResponse);
        log.info("Density : " + density);
        break;

      case "TEMP":
        log.info("Command Received: " + serialRequest);
        serialRequest = "";
        temperature = parseFloat(serialResponse);
        log.info("Temperature : " + temperature);
        break;

      case "FLOW1":
        log.info("Command Received: " + serialRequest);
        serialRequest = "";
        flow1 = parseFloat(serialResponse);
        log.info("Flow1 : " + flow1);
        break;

      default:

        if (serialResponse.includes('SYS')) {
          serialRequest = "SYS";
        } else if (serialResponse.includes('TEMP')) {
          serialRequest = "TEMP";
        } else if (serialResponse.includes('FLOW1')) {
          serialRequest = "FLOW1"
        } else {
          serialRequest = "";
        }
        break;
    }
  } catch (e) { log.error(e.message) }
}

var util = require('util');
var log = require("./log.js")();


const { getSerialNumber, getSerialNumberSync } = require('raspi-serial-number');
const { download } = require('./lib/downloadFile.js');
const sn = getSerialNumberSync();

var socket = io.connect(serverUrl, { reconnect: true, transports: ["websocket"] });

socket.on('connect', function (socket) {
  log.info(`Connected to cloud ${serverUrl}!`);
});

socket.on("connect_error", (err) => {
  log.info(`connect_error due to ${err}`);
});


socket.on("request", function (request) {

  try {
    log.info("request ");
    log.info(util.inspect(request, false, null));

    socket.emit("response", request.command + " received");

    var response = {
      request: request
    };

    switch (request.command) {

      case "p":
        const currentTimeInSec = Math.trunc(new Date().getTime() / 1000)
        socket.emit("response", `${currentTimeInSec}|${sn}|${density}|${temperature}${flow1}`);
        break;

      case "ping":

        response.data = {
          time: new Date().toISOString(),
          sn: sn,
          dens: density,
          temp: temperature,
          flow: flow1
        };
        callResponse(response)

        break;

      case "update":

      let url = request.data.url;
  
      
      
      
     

        break;

      case "execute-cmd":

        exec(request.params, function (error, stdout, stderr) {
          log.info("stdout:" + stdout);
          log.error("stderr:" + stderr);
          log.error("error:" + error);

          response.error = error + stderr;
          response.out = stdout;

          callResponse(response);

        });


        break;

    }

  } catch (e) { log.error(e.message) }
});



function callResponse(response) {

  log.info("response ");
  log.info(util.inspect(response, false, null));

  socket.emit("response", response);
}


