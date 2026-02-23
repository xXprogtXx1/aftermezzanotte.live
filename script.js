const socket = io();
let nickname = '';
let intervalId;

// Ora italiana
function getItalianTime() {
    return new Date().toLocaleString("en-US", {timeZone: "Europe/Rome"});
}

// Countdown
function updateCountdown() {
    const nowIT = new Date(getItalianTime());
    let midnightIT = new Date(nowIT.getFullYear(), nowIT.getMonth(), nowIT.getDate(), 24, 0, 0);
    if (nowIT > midnightIT) midnightIT.setDate(midnightIT.getDate() + 1);

    const diff = midnightIT - nowIT;
    if (diff > 0) {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    } else {
        clearInterval(intervalId);
        document.getElementById('countdown-section').classList.remove('active');
        document.getElementById('nickname-section').classList.add('active');
    }
}

// Eventi
document.getElementById('join-btn').onclick = () => {
    nickname = document.getElementById('nickname-input').value.trim();
    if (nickname) {
        document.getElementById('nickname-section').classList.remove('active');
        document.getElementById('chat-section').classList.add('active');
        socket.emit('chat-message', { nick: nickname, text: `${nickname} si è unito alla chat!` });
    }
};

document.getElementById('message-form').onsubmit = (e) => {
    e.preventDefault();
    const msg = document.getElementById('message-input').value.trim();
    if (msg && nickname) {
        socket.emit('chat-message', { nick: nickname, text: msg });
        document.getElementById('message-input').value = '';
    }
};

// Socket.IO
socket.on('chat-message', (data) => {
    const messages = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.innerHTML = `<strong>${data.nick}</strong><small>${new Date(data.timestamp).toLocaleTimeString('it-IT')}</small> <span>${data.text}</span>`;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
});

// Inizializza
intervalId = setInterval(updateCountdown, 1000);
updateCountdown();
