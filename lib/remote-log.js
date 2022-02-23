var fs = require('fs');
var log = require('./log.js')();

module.exports = function(socket, sn) {

    return {
        log: function(data, severity) {
            socket.emit("0", `${sn}|${severity}|${data}`);
        },
        error: function(data, severity) {
            socket.emit("l", `${sn}|${severity}|${data}`);
        }
    }
};