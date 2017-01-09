var Err = require('./error.js');


var MXConnection = function (exchangeUrl, timeout) {

    this.timeout = timeout || 5000;
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

        this.mxConnection.on('connect', cb);
    },
   
    killConnection: function () {
        this.mxConnection.removeAllListeners();
        this.mxConnection.destroy();
    }

}

module.exports = MXConnection;