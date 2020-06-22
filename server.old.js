var http = require('http');
var fs = require('fs');
var url = require('url');

var extensions = {
    'html': 'text/html',
    'css' : 'text/css',
    'js': 'application/x-javascript',
    'png': 'image/png',
    'json': 'application/json'
};

http.createServer(function (req, res) {
    var q = url.parse(req.url, true);
    var filename = "." + q.pathname;
    var incoming = "";
    req.on('data', function (chunck) {
        incoming += chunck;
    });
    req.on('end', function() {
        if (incoming) fs.writeFile(filename, incoming, function() { });
        if (q.pathname == '/') {
            return fs.readFile('./index.old.html', function(err, data) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.write(data);
                return res.end();
            });
        }
        console.log("Sending: " + filename);
        fs.readFile(filename, function (err, data) {
            var file_arr = q.pathname.split('.');
            var filetype = file_arr[file_arr.length-1];
            if (err) {
                console.log("Error sending " + filename + ".\n" + err);
                res.writeHead(404, {'Content-Type': 'text/html'});
                return res.end('<p style="color: red">404</p>Dummy, file ' + filename + ' doesn\'t exist.');
            }
            res.writeHead(200, {'Content-Type': extensions[filetype]});
            res.write(data);
            return res.end();
        });
    });
}).listen(8080);