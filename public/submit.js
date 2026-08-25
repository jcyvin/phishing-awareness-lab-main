document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('loginAttempt') || '{}');
    const username = data.username || '';
    const password = data.password || '';

    const statusEl = document.getElementById('statusText');

    if (!username || !password) {
        if (statusEl) {
            statusEl.textContent = 'Missing login information. Redirecting...';
        }

        setTimeout(() => {
            window.location.href = '/';
        }, 900);

        return;
    }

    if (statusEl) {
        statusEl.textContent = `Processing login for ${username}...`;
    }

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username
        })
    })
        .then(async (response) => {
            const payload = await response.json();

            if (!response.ok || !payload.success) {
                const message = payload.message || 'Invalid username or password.';

                if (statusEl) {
                    statusEl.textContent = message;
                }

                setTimeout(() => {
                    alert(message);
                    window.location.href = '/';
                }, 500);

                return;
            }

            localStorage.setItem(
                'loginSuccess',
                JSON.stringify({
                    username: payload.username || username,
                    loginTime: payload.loginTime || new Date().toISOString()
                })
            );

            window.location.href = 'success.html';
        })
        .catch(() => {
            localStorage.setItem(
                'loginSuccess',
                JSON.stringify({
                    username,
                    loginTime: new Date().toISOString()
                })
            );

            window.location.href = 'success.html';
        });
});
