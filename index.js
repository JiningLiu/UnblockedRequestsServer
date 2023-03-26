const express = require('express');
const app = express();
const port = process.env.PORT || (() => {
    const min = Math.ceil(1024);
    const max = Math.floor(65535);
    process.env.PORT = Math.floor(Math.random() * (max - min) + min);
    return process.env.PORT;
})();

const { v4: uuid } = require('uuid');

// const fetch = require('node-fetch');

// const fs = require('fs');
// const logFile = fs.createWriteStream('./logs/log.txt', {
//     flags: 'a',
// });

app.use((req, _res, next) => {
    const port = req.app.settings.port;

    const request = {
        id: uuid(),
        host: req.get('host'),
        fullHost: req.protocol + '://' + req.get('host') +
            (port == 80 || port == 443 || port == null ? '' : ':' + port) +
            req.path,
        path: req.url.split('?')[0],
        paths: req.url.split('?')[0].split('/').filter((path) => path !== ''),
        params: Object.fromEntries(new URLSearchParams(req.url.split('?')[1])),
        timestamp: new Date().toISOString(),
    };

    req.log = request;

    // logFile.write(JSON.stringify(request) + '\r\n');

    console.log('New request:', request);

    // console.log('\nRequest', request.id, 'logged to ../logs/log.txt');

    console.log('\n========================================\n');

    next();
});

app.get('/', (req, res) => {
    res.send(req.log);
});

// app.get('/test', async (_req, res) => {
//     const json = await fetch(
//         'CODESPACES_FORWARDED_URL',
//     )
//         .then((response) => {
//             return response.json();
//         });

//     res.send(json);
// });

app.listen(port, () => {
    console.log('========================================');
    console.log(
        `UnblockedRequests (server, alpha 1.0) listening on port ${port}`,
    );
    console.log('========================================\n');
});
