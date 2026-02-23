const socket = io();
let nickname = '';
let intervalId;

// Ora italiana corretta CET/CEST
function getItalianTime() {
    return new Date().toLocaleString("sv", { timeZone: "Europe/Rome" }); // "sv" dà formato ISO pulito
}

// Ottiene target time: mezzanotte o 7:00
function getTargetTime() {
    const nowIT = new Date(getItalianTime());
    const todayMidnight = new Date(nowIT.getFullYear(), nowIT.getMonth(), nowIT.getDate(), 0, 0, 0);
    const today7am = new Date(nowIT.getFullYear(), nowIT.getMonth(), nowIT.getDate(), 7, 0, 0);
    
    const hourIT = nowIT.getHours();
    
    if (hourIT >= 0 && hourIT < 7) {
        // Aperto: mostra chat
        return null;
    } else if (hourIT < 24) {
        // Dopo 7:00, countdown a mezzanotte PROSSIMA
        const nextMidnight = new Date(todayMidnight);
        nextMidnight.setDate(nextMidnight.getDate() + 1);
        return nextMidnight;
    }
}

// Aggiorna UI basato su ora
function updateTimer() {
    const target = getTargetTime();
    const nowIT = new Date(getItalianTime());
    
    if (!target) {
        // Aperto 00:00-07:00: mostra chat
        document.getElementById('countdown-section').classList.remove('active');
        document.getElementById('nickname-section').classList.add('active');
        return;
    }
    
    // Countdown attivo
    const diff = target - nowIT;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    
    // Rilascia alle 00:00
    if (diff <= 0) {
        document.getElementById('countdown-section').classList.remove('active');
        document.getElementById('nickname-section').classList.add('active');
    }
}

// Eventi (invariati)
document.getElementById('join-btn').onclick = () => {
    nickname = document.getElementById('nickname-input').value.trim();
    if (nickname) {
        document.getElementById('nickname-section').classList.remove('active');
        document.getElementById('chat-section').classList.add('active');
        socket.emit('chat-message', { nick: nickname, text: `${nickname} si è unito alla chat notturna! 🌙` });
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

// Socket.IO (invariato)
socket.on('chat-message', (data) => {
    const messages = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.innerHTML = `<strong>${data.nick}</strong><small>${new Date(data.timestamp).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</small> <span>${data.text}</span>`;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
});

// Avvia timer ogni secondo
intervalId = setInterval(updateTimer, 1000);
updateTimer(); // Immediato
