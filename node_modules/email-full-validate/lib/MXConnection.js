var Err = require('./error.js'),
    net = require('net');


var MXConnection = function (exchangeUrl, timeout) {

    this.timeout = timeout || 5000;

    this.timeout = 50000;
    this.exchangeUrl = exchangeUrl;
}


MXConnection.prototype = {

    connect: function (cb) {
        var self = this;
        this.mxConnection = net.createConnection(25, this.exchangeUrl);
        this.mxConnection.setEncoding('ascii');
        this.mxConnection.setTimeout(this.timeout, () => {
            self.killConnection();
            cb(Err.createError(Err.TIMEOUT, "Timed out"));
        });

        this.mxConnection.on('error', cb);
        this.mxConnection.on('connect', cb);
    },

    write: function(cmd, cb) {
        this.mxConnection.write(cmd, cb);
    },
   
    killConnection: function () {
        this.mxConnection.removeAllListeners();
        this.mxConnection.destroy();
    }

}

module.exports = MXConnection;