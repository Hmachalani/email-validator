var dns = require('dns'),
	net = require('net'),
	os = require('os'),
	winston = require('winston'),
	Err = require('./lib/error.js'),
	MXConnection = require('./lib/MXConnection.js'),
	async = require('async');


const Enums = {
	SUCCESS_MSG: 'success',
};




var EmailValidator = function (emails, timeout) {
	this.timeout = timeout || 5000;
	this.triagedEmails = this.triageEmails(emails);
	this.verifiedEmails = {};

}

EmailValidator.prototype = {

	triageEmails: function (emails) {
		var sortedEmails = {};

		for (var i in emails) {
			var email = emails[i];
			var domain = email.split('@')[1];
			if (!domain) continue; //skip malformed email

			
			if(!sortedEmails[domain]) sortedEmails[domain] = [];
			sortedEmails[domain].push(email);
		}

		return sortedEmails;
	},

	//main function
	validateAll: function (cb) {
		var self = this;
		async.eachOf(this.triagedEmails, function (emailsArray, domain, cb) {
			self.validateDomainEmails(emailsArray, domain, cb);
		}, function (err) {
			if(err) 
			cb(err, self.verifiedEmails);
		});
	},

	validateDomainEmails: function (emails, domain, callback) {
		var self = this;
		self._resolveMXAddresses(domain, (err, addresses) => {
			if (err) {
				for(var i in emails) {
					self.verifiedEmails[emails[i]] = {email: emails[i], isValid : false, err:err, errCode: Err.BAD_DOMAIN };
				}
				return callback();
			} 
			async.eachSeries(addresses, (mxAddress, cb) => {

				var connection = new MXConnection(mxAddress);
				connection.connect(function(err){
					if(err) {
						console.error("Failed to connect to " + mxAddress.exchange + " with error ==>" + err);
						connection.killConnection(); //skip mxAddress.
						return cb();
					}	
					self._validateEmails(connection, emails, cb); 
				});

			}, function (err) {
				if (err == Enums.SUCCESS_MSG) return callback();
				callback(err);
			});
		});
	},


	_validateEmails: function (connection, emails, cb) {
		
		const fromEmail = 'henrim@outlook.com';
		var self = this;

		async.waterfall([
			function (cb) { self._sayHelo(connection, cb); },
			function (cb) { self._verifyEmail(connection, fromEmail, emails[0], cb) },
		], function (err) {
			if (err) return cb(err);
			cb(Enums.SUCCESS_MSG);
		});

	},



	_resolveMXAddresses: function (domain, cb) {

		dns.resolveMx(domain, function (err, addresses) {
			if (err || addresses.length === 0) return cb(err, false);
			addresses = addresses.sort(function (a, b) {
				return a.priority - b.priority
			});
			cb(null, addresses);
		});
	},


	//pragma: SMTP chat
	_sayHelo: function (connection, cb) {
		console.log("saying helo");
		this._sendCommands(connection, ["helo"], (err,));
	},

	_verifyEmail: function (connection, fromEmail, toEmail, cb) {
		var self = this;
		console.log("verifying email");
		this._sendCommands(connection, ["mail from: <" + fromEmail + ">", "rcpt to: <" + toEmail + ">"], function (err) {
			err ? self.verifiedEmails[toEmail] = { email: toEmail, isValid: false, err: err } : self.verifiedEmails[toEmail] = { email: toEmail, isValid: true };
			cb(err);
		});
	},

	_sendCommands: function (connection, commands, callback) {
		var self = this;

		async.each(commands, function (command, cb) {
			command += "\r\n";
			connection.write(command, (data) => { self._onData(data, cb); });
		}, function (err) {
			callback(err);
		});
	},

	_onData: function (data, cb) {
		if (data.indexOf("220") == 0 || data.indexOf("250") == 0 || data.indexOf("\n220") != -1 || data.indexOf("\n250") != -1) {
			console.log("220... "+ data);
			cb(); //all good.
		} else if (data.indexOf("\n550") != -1 || data.indexOf("550") == 0) {
			console.error("error 550... "+ data);
			cb('Error 550 with data=' + data);
		} else {
			console.error("oh oh... "+ data);
			cb('undetermined');
		}
	},

}

module.exports = EmailValidator;







/*


	var res, undetermined;
	var cond = false, j = 0;
	async.doWhilst(function (done) {
		var conn = net.createConnection(25, addresses[j].exchange);
		var commands = ["helo " + addresses[j].exchange, "mail from: <" + from_email + ">", "rcpt to: <" + email + ">"];
		// console.log(commands);
		var i = 0;
		conn.setEncoding('ascii');
		conn.setTimeout(timeout);
		conn.on('error', function (err) {
			winston.error(err);
			conn.emit('false');
		});
		conn.on('false', function () {
			res = false
			undetermined = false;
			cond = false;
			done(err, false);
			conn.removeAllListeners();
			conn.destroy();
		});
		conn.on('connect', function () {
			conn.on('prompt', function () {
				if (i < 3) {
					conn.write(commands[i]);
					conn.write('\r\n');
					i++;
				} else {

					res = true;
					undetermined = false;
					cond = false;
					done(err, true);
					conn.removeAllListeners();
					conn.destroy(); //destroy socket manually
				}
			});
			conn.on('undetermined', function () {
				j++;
				//in case of an unrecognisable response tell the callback we're not sure
				cond = true;
				res = false;
				undetermined = true;
				done(err, false, true);

				conn.removeAllListeners();
				conn.destroy(); //destroy socket manually

			});
			conn.on('timeout', function () {
				conn.emit('undetermined');
			});
			conn.on('data', function (data) {
				if (data.indexOf("220") == 0 || data.indexOf("250") == 0 || data.indexOf("\n220") != -1 || data.indexOf("\n250") != -1) {
					conn.emit('prompt');
				} else if (data.indexOf("\n550") != -1 || data.indexOf("550") == 0) {
					conn.emit('false');
				} else {
					conn.emit('undetermined');
				}
			});
		});
	}, function () {
		return j < addresses.length && cond
	}, function (err) {
		callback(err, res, undetermined);
	})
});


	}

}




var

var resolveMX = function () {


}

module.exports = function (emails, callback, timeout, from_email) {
	timeout = timeout || 5000;
	from_email = from_email || email;

	var sortedEmails = _triageEmails(emails);

	if (!/^\S+@\S+$/.test(email)) {
		callback(null, false);
		return;
	}


};*/

// compatibility

