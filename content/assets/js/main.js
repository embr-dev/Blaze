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
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({
            url: e.srcElement.children.url.value
        })
    })
        .then(res => res.json())
        .then(res => {
            if (!res.error) {
                if (res.port) {
                    error.textContent = '';
                    form.remove();
                    logs.classList.remove('hidden');
                    controls.classList.remove('hidden');

                    const win = window.open(`http://localhost:${res.port}/${e.srcElement.children.filename.value}`, 'popup', `left=${window.screen.width},top=0,width=600,height=700`);
                    win.focus();

                    ws.onmessage = (e) => {
                        const log = document.createElement('div');
                        log.textContent = JSON.parse(e.data).msg;
                        log.classList = JSON.parse(e.data).type;
                        logs.appendChild(log);
                        
                        window.scrollTo(0, document.body.offsetHeight);
                    }

                    controls.querySelector('#stop').addEventListener('click', (e) => {
                        ws.send(JSON.stringify({
                            action: 'stop'
                        }));

                        win.close();

                        logs.classList.add('hidden');
                        controls.classList.add('hidden');
                    });

                    controls.querySelector('#done').addEventListener('click', (e) => {
                        ws.send(JSON.stringify({
                            action: 'done'
                        }));

                        win.close();

                        logs.classList.add('hidden');
                        controls.classList.add('hidden');
                    });
                } else {
                    error.textContent = 'The server did not provide a port';
                }
            } else {
                error.textContent = res.errorMsg;
            }
        })

    const ws = new WebSocket(window.origin.replace('http', 'ws').replace('https', 'wss'));

    ws.onerror = (e) => {
        error.textContent = 'Failed to connect to server';
    }
})