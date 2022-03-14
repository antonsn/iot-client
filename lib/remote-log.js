const log = require("./log.js")()

module.exports = function (socket, sn) {

    return {
        log: function (data) {
            log.info(`${data}`)
            socket.emit("l", `${sn}|0|${data}`);

        },
        error: function (data) {
            log.error(`${data}`)
            socket.emit("l", `${sn}|1|${data}`);

        }
    }
};