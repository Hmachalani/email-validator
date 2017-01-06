
var emailExists = require("email-full-validate"),
    csv = require("fast-csv"),
    fs = require('fs');


var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/reports')));


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});


app.get('/reports', function (req, res) {
    const uploadsFolder = './public/reports/';
    fs.readdir(uploadsFolder, (err, files) => {
        var out = [];
        for (var i in files) {
            var file = files[i];
            var filePath = "./reports/"+file; 
            out.push({ name: file, path: filePath });
        }

        res.send(out);

    })
});


app.post('/upload', function (req, res) {

    // create an incoming form object
    var form = new formidable.IncomingForm();

    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;

    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '/uploads');
    form.publicDir = path.join(__dirname, '/public/reports');


    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function (field, file) {
        var filePrefix = file.name.split(".")[0];
        var readPath = path.join(form.uploadDir, file.name);
        var writePath = path.join(form.publicDir, filePrefix + "-validated.csv");
        fs.rename(file.path, readPath);

        validateEmails(readPath, writePath);

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

var port = process.env.PORT || 8080;
var server = app.listen(port, function () {
    console.log('Server listening on port 8080');
});




var validateEmails = function (readPath, writePath) {
    var readStream = fs.createReadStream(readPath);
    var writeStream = fs.createWriteStream(writePath)
    var csvWriteStream = csv.createWriteStream({ headers: true });
    csvWriteStream.pipe(writeStream);

    var csvReadStream = csv({ headers: true })
        .transform(function (data, next) {
            validateEmail(data, next);
        })
        .on("data", function (data) {
            console.log(data);
            csvWriteStream.write(data);

        })
        .on("end", function (data) {
            console.log("done");
            csvWriteStream.end();
        });

    readStream.pipe(csvReadStream);

}




var validateEmail = function (data, next) {
    var email = data.email;
    emailExists.check(email, function (err, res) {
        console.log(email + " valid? " + res);
        if (err) console.error(err);
        data.valid = res;
        next(null, data);
    });
}
