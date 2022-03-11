module.exports = function(socket, sn) {

    return {
        log: function(data) {
            socket.emit("l", `${sn}|0|${data}`);
        },
        error: function(data) {
            socket.emit("l", `${sn}|1|${data}`);
        }
    }
};