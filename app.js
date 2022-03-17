const io = require('socket.io-client')
const util = require('util')
const log = require("./lib/log.js")()
const updateDotenv = require('update-dotenv')
const downloader = require('./lib/patch.js')

require('dotenv').config()

let portId = process.env.SERIAL
let serverUrl = process.env.SERVER_URL


let sn
var serialRequest = ""
var density = 0.0
var temperature = 0.0
var flow1 = 0.0

const ping = "p"
const updateSettings = "us"
const applyPatch = "ap"
const restart = "restart"

if (process.env.MOCK_SERIAL !== "true") {
  const { getSerialNumberSync } = require('raspi-serial-number')
  sn = getSerialNumberSync()

  // Serial Port initializations
  const SerialPort = require('serialport')
  const Readline = require('@serialport/parser-readline')
  const port = new SerialPort(portId, { baudRate: 115200 })
  const parser = port.pipe(new Readline({ delimiter: '\r' }))

  parser.on('data', readSerialData)
}
else { //use mock serial

  sn = "mock_pi"
  let between = (min, max) => {
    return Math.floor(
      Math.random() * (max - min) + min
    )
  }

  
  setInterval(() => {
    density = between(0, 5000)
    temperature = between(0, 50)
    flow1 = between(0, 500)
  }, 1000)

}

function readSerialData(data) {
  try {

    //log.info("serial data:" + data)
    let serialResponse = data.toString('utf8')
    switch (serialRequest) {   // serialRequest will contain a previously received command or empty string
      case "SYS":
        log.info("Command Received: " + serialRequest)
        serialRequest = ""

        density = parseFloat(serialResponse)

        log.info("Density : " + density)
        break

      case "TEMP":
        log.info("Command Received: " + serialRequest)
        serialRequest = ""

        temperature = parseFloat(serialResponse)

        log.info("Temperature : " + temperature)
        break

      case "FLOW1":
        log.info("Command Received: " + serialRequest)
        serialRequest = ""

        flow1 = parseFloat(serialResponse)

        log.info("Flow1 : " + flow1)
        break

      default:

        if (serialResponse.includes('SYS')) {
          serialRequest = "SYS"
        } else if (serialResponse.includes('TEMP')) {
          serialRequest = "TEMP"
        } else if (serialResponse.includes('FLOW1')) {
          serialRequest = "FLOW1"
        } else {
          serialRequest = ""
        }
        break
    }
  } catch (e) { log.error(e.message) }
}


var socket = io.connect(serverUrl, { reconnect: true, transports: ["websocket"] })
var rlog = require("./lib/remote-log.js")(socket, sn)

socket.on('connect', function (socket) {
  log.info(`Connected to cloud ${serverUrl}!`)
  rlog.log(`connected to ${serverUrl}`)
})

socket.on("connect_error", (err) => {
  log.info(`connect_error due to ${err}`)
})


socket.on(ping, async function (request) {
  socket.emit("r", `${sn}|${density}|${temperature}|${flow1}`)
})

socket.on(updateSettings, async function (request) {
  try {
    updateDotenv({
      [request.data.settingName]: request.data.settingValue
    }).then(() =>
      rlog.log(`updated setting ${request.data.settingName} to ${request.data.settingValue}`)
    )
  } catch (error) {
    rlog.error(`error updateDotenv  ${error.message}`)
  }

})

socket.on(restart, async function (request) {

  rlog.log(`restart planned `)

  const { exec } = require('child_process');


  setTimeout(function () {
    rlog.log(`restart NOW `)
     process.exit();
  }, 5000)

})


socket.on(applyPatch, async function (request) {
  try {
    let url = request.data.patchUrl
    await downloader.applyPatch(url, rlog, "./")
  } catch (error) {
    rlog.error(`error apply patch ${error.message}`)
  }
})






