import express from 'express';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as url from 'url';
import * as path from 'node:path';
import { WebSocketServer } from 'ws';
import mime from 'mime';
import cors from 'cors'

const app = express();
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
var wss;
let port = 5001;

app.use(express.json());
app.use(cors({ origin: '*' }))
app.use(express.static(path.join(__dirname, './content/'), { extensions: ['html'] }));

app.post('/form', (req, res) => {
    const gameUrl = req.body.url;

    if (gameUrl) {
        fs.rmSync('./downloads/', { recursive: true, force: true });

        wss.on('connection', (conn) => {
            const blazeProxy = express();
            blazeProxy.use(cors({ origin: '*' }))

            const paths = [];

            blazeProxy.all('*', async (req, res) => {
                try {
                    const file = await fetch(gameUrl + req.originalUrl);
                    const fileExtension = mime.getExtension(file.headers.get('content-type').split(';')[0]
                        .replace('text/javascript', 'application/javascript'));

                    const data = new Buffer.from(await file.arrayBuffer());

                    const url = req.baseUrl + req.path.replace(req.baseUrl + req.path.split('\\').pop().split('/').pop(), '');
                    fs.mkdir(`./downloads${url}`, { recursive: true }, (e) => {
                        if (e) {
                            conn.send(JSON.stringify({
                                type: 'error',
                                msg: 'An error occoured check the console for more information.',
                                timestamp: new Date()
                            }));

                            console.error(e);
                            return res.sendStatus(404);
                        };
                    });

                    conn.send(JSON.stringify({
                        type: 'log',
                        msg: req.baseUrl + req.path,
                        timestamp: new Date()
                    }));

                    paths.push(req.baseUrl + req.path);

                    if (file.status != 404 || file.status != 403) {
                        if (!fs.existsSync(`./downloads${req.baseUrl + req.path}`)) {
                            fs.mkdir(`./downloads${url}`, { recursive: true }, (e) => {
                                if (e) {
                                    conn.send(JSON.stringify({
                                        type: 'error',
                                        msg: 'An error occoured check the console for more information.',
                                        timestamp: new Date()
                                    }));

                                    console.error(e);
                                    return res.sendStatus(404);
                                };
                            });
                        }

                        setTimeout(() => {
                            if (req.path.includes('.') && req.path !== '/') {
                                try {
                                    fs.writeFileSync(`./downloads${req.baseUrl + req.path}`, data);
                                } catch (e) {
                                    console.error(e);

                                    conn.send(JSON.stringify({
                                        type: 'error',
                                        msg: `An error occoured when trying to write ${req.path} to the disk. Check the console for more information`,
                                        timestamp: new Date()
                                    }));
                                }
                            } else if (req.path === '/') {
                                try {
                                    fs.writeFileSync(`./downloads${req.baseUrl + '/index.html'}`, data);
                                } catch (e) {
                                    console.error(e);

                                    conn.send(JSON.stringify({
                                        type: 'error',
                                        msg: `An error occoured when trying to write ${req.path} to the disk. Check the console for more information`,
                                        timestamp: new Date()
                                    }));
                                }
                            } else if (!req.path.includes('.')) {
                                try {
                                    fs.writeFileSync(`./downloads${req.baseUrl + req.path + '.' + fileExtension}`, data);
                                } catch (e) {
                                    console.error(e);

                                    conn.send(JSON.stringify({
                                        type: 'error',
                                        msg: `An error occoured when trying to write ${req.path} to the disk. Check the console for more information`,
                                        timestamp: new Date()
                                    }));
                                }
                            } else {
                                conn.send(JSON.stringify({
                                    type: 'error',
                                    msg: `An internal error occoured`,
                                    timestamp: new Date()
                                }));
                            }
                        }, 500)
                    } else if (file.status == 404) {
                        conn.send(JSON.stringify({
                            type: 'error',
                            msg: `Could not find ${req.path}`,
                            timestamp: new Date()
                        }));
                    } else if (file.status == 403) {
                        conn.send(JSON.stringify({
                            type: 'error',
                            msg: `Could not access ${req.path}`,
                            timestamp: new Date()
                        }));
                    }

                    res.writeHead(file.status, { 'Content-Type': file.headers.get('content-type').split(';')[0] });
                    res.end(data);

                    if (!fileExtension) {
                        conn.send(JSON.stringify({
                            type: 'error',
                            msg: `${req.baseUrl + req.path} has an invalid invalid file type`,
                            timestamp: new Date()
                        }));
                    }
                } catch (e) {
                    conn.send(JSON.stringify({
                        type: 'error',
                        msg: 'An error occoured check the console for more information',
                        timestamp: new Date()
                    }));

                    console.error(e);
                    return res.sendStatus(404);
                }
            })

            var blazeProxyServer = blazeProxy.listen();

            blazeProxyServer.addListener('error', (e) => {
                if (e.message.includes('EADDRINUSE')) {
                    port += 1;
                    blazeProxyServer = blazeProxy.listen(port);
                } else {
                    console.log(e);
                    console.log('The blaze proxy server encountered an error ^^^^^^^^^^^');
                    try {
                        return res.json({ error: true, errorMsg: 'The blaze proxy server encountered an error. Please check the logs.' });
                    } catch (e) { }
                }
            })

            blazeProxyServer.addListener('listening', () => {
                try {
                    return res.json({ error: false, port: blazeProxyServer.address().port });
                } catch (e) { }

                console.log(`Your Blaze proxy server is running on port ${blazeProxyServer.address().port}`);
            })

            blazeProxyServer.addListener('close', (e) => {
                console.log(`Your Blaze proxy server has stoped`);
            })

            conn.on('message', (e) => {
                const data = JSON.parse(e.toString());

                if (data.action == 'stop') {
                    conn.send(JSON.stringify({
                        type: 'action',
                        action: 'closed',
                        timestamp: new Date()
                    }));

                    setTimeout(() => {
                        fs.rmSync('./downloads/', { recursive: true, force: true });
                    }, 1000)
                } else if (data.action == 'done') {
                    conn.send(JSON.stringify({
                        type: 'action',
                        action: 'closed',
                        timestamp: new Date()
                    }));

                    conn.send(JSON.stringify({
                        type: 'data',
                        data: paths,
                        timestamp: new Date()
                    }));
                }
            });
        });
    }
})

app.use((req, res) => {
    res.status(404);
    res.sendFile(path.join(url.fileURLToPath(new URL('./content/', import.meta.url)), '/404.html'));
});

const blazeServer = app.listen(5000, () => {
    console.log(`Your Blaze server is running on port ${blazeServer.address().port} using node ${process.version}`);
});

wss = new WebSocketServer({ server: blazeServer });