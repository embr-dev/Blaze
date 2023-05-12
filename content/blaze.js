const form = document.querySelector('form');
const error = document.querySelector('.red');
const logs = document.querySelector('.logs');
const controls = document.querySelector('.controls');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    fetch('/form', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({
            url: e.srcElement.children.url.value,
        }),
    })
        .then((res) => res.json())
        .then((res) => {
            if (!res.error) {
                if (res.port) {
                    error.textContent = '';
                    form.remove();
                    logs.classList.remove('hidden');
                    controls.classList.remove('hidden');

                    var win = window.open(`http://localhost:${res.port}/${e.srcElement.children.filename.value}`, 'popup', `left=${window.screen.width},top=${window.screen.height},width=600,height=700`);
                    var done = false;
                    win.focus();

                    window.onfocus = () => {
                        document.documentElement.click();
                    };

                    window.onbeforeunload = (e) => {
                        win.close();
                    };

                    const close = setInterval(() => {
                        if (win.closed && !done) {
                            clearInterval(close);

                            ws.send(
                                JSON.stringify({
                                    action: 'stop',
                                })
                            );

                            location.reload();
                        }
                    }, 1);

                    ws.onmessage = (e) => {
                        const data = JSON.parse(e.data);

                        if (data.type == 'log' || data.type == 'error') {
                            const log = document.createElement('div');
                            log.textContent = data.msg;
                            log.classList = data.type;
                            logs.appendChild(log);

                            window.scrollTo(0, document.body.offsetHeight);
                        } else if (data.type == 'action') {
                            if (data.action === 'closed') {
                                win.close();

                                logs.classList.add('hidden');
                                controls.classList.add('hidden');
                            }
                        }
                    };

                    document.documentElement.addEventListener('click', (e) => {
                        win.focus();
                    });

                    controls.querySelector('#stop').addEventListener('click', (e) => {
                        ws.send(
                            JSON.stringify({
                                action: 'stop',
                            })
                        );

                        location.reload();
                    });

                    controls.querySelector('#done').addEventListener('click', (e) => {
                        done = true;

                        ws.send(
                            JSON.stringify({
                                action: 'done',
                            })
                        );

                        error.textContent = 'Your website has been downloaded, check the /downloads folder inside the blaze server directory';
                    });
                } else {
                    error.textContent = 'The server did not provide a port';
                }
            } else {
                error.textContent = res.errorMsg;
            }
        });

    const ws = new WebSocket(window.origin.replace('http', 'ws').replace('https', 'wss'));

    ws.onerror = (e) => {
        error.textContent = 'Failed to connect to server';
    };
});