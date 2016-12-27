
var emailExists = require("email-full-validate"),
    csv = require("fast-csv"),
    fs = require('fs');


var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});


app.post('/upload', function (req, res) {

    // create an incoming form object
    var form = new formidable.IncomingForm();

    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;

    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '/uploads');

    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function (field, file) {
        var newPath = path.join(form.uploadDir, file.name);
        fs.rename(file.path, newPath);

        validateEmails(newPath, res);

    });

    // log any errors that occur
    form.on('error', function (err) {
        console.log('An error has occured: \n' + err);
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function () {
        res.end('success');
    });

    // parse the incoming request containing the form data
    form.parse(req);

});

var port= process.env.PORT || 8080;
var server = app.listen(port, function () {
    console.log('Server listening on port 8080');
});




var validateEmails = function (path, res) {
    var stream = fs.createReadStream(path);

    var csvStream = csv()
        .on("data", function (data) {
            console.log(data);
            var asyncFunctions = [];
            for (var i = 0; i < data.length; i++) {
                validateEmail(data[i], res);
            }

        })
        .on("end", function () {
            console.log("done");
        });

    stream.pipe(csvStream);

}




var validateEmail = function (email, res) {
    emailExists.check(email, function (err, res) {
        console.log(email +" valid? "+res);
        if(err)console.err(err);
    });
}
