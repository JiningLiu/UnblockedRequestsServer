const process = require('process');

const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || (() => {
    const min = Math.ceil(1024);
    const max = Math.floor(65535);
    process.env.PORT = Math.floor(Math.random() * (max - min) + min);
    return process.env.PORT;
})();

const cors = require('cors');

const Inliner = require('inliner');

const { v4: uuid } = require('uuid');

const fs = require('fs');
const logFile = fs.createWriteStream('./logs/log.txt', {
    flags: 'a',
});

app.use(cors());

app.use(async (req, res, next) => {
    const port = req.app.settings.port;

    const request = {
        id: uuid(),
        host: req.get('host'),
        fullHost: req.protocol + '://' + req.get('host') +
            (port == 80 || port == 443 || port == null ? '' : ':' + port) +
            req.path,
        url: req.url.substring(1),
        timestamp: new Date().toISOString(),
    };

    req.log = request;

    logFile.write(JSON.stringify(request) + '\r\n');

    console.log('New request:', request);

    console.log('\nRequest', request.id, 'logged to ../logs/log.txt');

    console.log('\n========================================\n');

    if (isValidURL(request.url) && request.url.length > 0) {
        if (req.get('inline') == 'true') {
            const inlineRequest = new Inliner(request.url);

            inlineRequest
                // .on('progress', (event) => {
                //     console.log('\n!!!!!!!! INLINER PROGRESS ERROR !!!!!!!!\n');
                //     console.log('Inliner Request Progress Event:\n', event);
                //     console.log('\n========================================\n');
                // })
                .on('end', (html) => {
                    res.send(
                        {
                            req: request,
                            data: html,
                        },
                    );
                    next();
                });
        } else {
            const buf = await httpGet(request.url);
            res.send(
                {
                    req: request,
                    data: buf.toString('utf-8'),
                },
            );
            next();
        }
    } else {
        res.status(502);
        res.sendFile(path.join(__dirname, './src/502.html'));
    }
});

app.listen(port, () => {
    console.log('========================================');
    console.log(
        `UnblockedRequests (server, alpha 1.0) listening on port ${port}`,
    );
    console.log('========================================\n');
});

process.on('uncaughtException', function (err) {
    console.log('!!!!!!!!!!! CONNECTION ERROR !!!!!!!!!!!\n');
    console.log('Uncaught Exception Error:\n', err);
    console.log('\n========================================\n');
});

function isValidURL(string) {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
}

function httpGet(url) {
    return new Promise((resolve, reject) => {
        const http = require('http'),
            https = require('https');

        let client = http;

        if (url.toString().indexOf('https') === 0) {
            client = https;
        }

        client.get(url, (resp) => {
            // deno-lint-ignore prefer-const
            let chunks = [];

            // A chunk of data has been recieved.
            resp.on('data', (chunk) => {
                chunks.push(chunk);
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}
