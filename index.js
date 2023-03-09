import express from 'express';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as url from 'url';
import * as path from 'node:path';
import { WebSocketServer } from 'ws';

const app = express();
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
var wss;

app.use(express.json());

app.use(express.static(path.join(__dirname, './content/'), { extensions: ['html'] }));

app.post('/form', (req, res) => {
    const gameUrl = req.body.url;

    if (gameUrl) {
        wss.on('connection', (conn) => {
            const blazeProxy = express();

            blazeProxy.all('*', async (req, res) => {
                try {
                    const file = await fetch(gameUrl + req.originalUrl);
                    const data = new Buffer.from(await file.arrayBuffer());

                    const url = req.baseUrl + req.path.replace(req.baseUrl + req.path.split('\\').pop().split('/').pop(), '');
                    fs.mkdir(`./game${url}`, { recursive: true }, (e) => {
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

                    if (fs.existsSync(url)) {
                        console.log(file.status)
                        if (file.status != 404) {
                            fs.writeFileSync(`./game${req.baseUrl + req.path}`, data);
                        } else {
                            conn.send(JSON.stringify({
                                type: 'error',
                                msg: `Could not find ${req.path}`,
                                timestamp: new Date()
                            }));
                        }
                    } else {
                        fs.mkdir(`./game${url}`, { recursive: true }, (e) => {
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

                    res.writeHead(file.status, { 'Content-Type': file.headers.get('content-type').split(';')[0] });
                    res.end(data);
                } catch (e) {
                    conn.send(JSON.stringify({
                        type: 'error',
                        msg: 'An error occoured check the console for more information.',
                        timestamp: new Date()
                    }));

                    console.error(e);
                    return res.sendStatus(404);
                }
            })

            const blazeProxyServer = blazeProxy.listen(5001, () => {
                console.log(`Your Blaze proxy server is running on port ${blazeProxyServer.address().port}`);
            });

            blazeProxyServer.addListener('error', (e) => {
                console.error(e);
                console.log('The blaze proxy server encountered an error ^^^^^^^^^^^');
                return res.json({ error: true, errorMsg: 'The blaze proxy server encountered an error. Please check the logs.' });
            })

            blazeProxyServer.addListener('listening', (e) => {
                return res.json({ error: false, port: blazeProxyServer.address().port });
            })
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