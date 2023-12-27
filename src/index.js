const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = process.env['HOST'] || 'localhost';
const PORT = process.env['PORT'] || 3003;
const FILE = process.env['SERVE_FILE'] || 'index.html';

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css'
};

const server = http.createServer(async (req, res) => {
    if (req.url === '/' && req.method === 'PATCH') {
        const buffers = [];
        for await (const chunk of req) {
            buffers.push(chunk);
        }
        const body = Buffer.concat(buffers).toString();
        replaceGlossaryElementInFile(body);
        res.writeHead(204).end();
    } else {
        serveLocalFile(req, res);
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Server started at http://${HOST}:${PORT}`);
});

function serveLocalFile(req, res) {
    var filePath = '.' + req.url.replace(/\?.*$/g, '');
    if (filePath === './') filePath = FILE;

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, 'utf-8', (err, fileContents) => {
        if (err) {
            serveErrorPage(err, res);
        } else {
            if (filePath === FILE)
                fileContents = fileContents.replace(
                    /<div id="glossary-page-container"/,
                    `<div id="glossary-page-container" data-editor-is-running="true"`
                );

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(fileContents, 'utf-8');
        }
    });
}

function serveErrorPage(err, res) {
    if (err.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<html><body>Page not found</body></html>');
    } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<html><body>Internal server error</body></html>');
    }
}

function replaceGlossaryElementInFile(newElementString) {
    fs.readFile(FILE, 'utf8', (err, fileContents) => {
        if (err) return console.log(err);

        const regex = /\n[ \t]*<div id="glossary-page-container".*<\/div>\n/s;

        if (!fileContents.replace(regex, 'replacing-worked').includes('replacing-worked')) {
            return console.log(`Unable to save changes using the regex ${regex}`);
        }

        const updatedFileContents = fileContents.replace(regex, "\n" + newElementString + "\n");

        fs.writeFile(FILE, updatedFileContents, 'utf8', (err) => {
            if (err) return console.log(err);
        });
    });
}