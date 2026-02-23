const socket = io();
let nickname = '';
let intervalId = null;

// Ora italiana senza parsing tricky
function getItalianHour() {
    return new Date().toLocaleString('it-IT', { 
        timeZone: 'Europe/Rome', 
        hour: 'numeric', 
        hour12: false,
        timeZoneName: 'short'
    });
}

function getItalianTime() {
    return new Date().toLocaleString('it-IT-u-ca-gregory', { 
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// Calcola target: mezzanotte o 7:00
function getTargetTime() {
    const nowStr = getItalianTime();
    const nowIT = new Date(nowStr);
    const hourIT = nowIT.getHours();
    
    console.log('Ora italiana:', nowStr, 'Hour:', hourIT); // DEBUG
    
    if (hourIT >= 0 && hourIT < 7) {
        return { type: 'open' };
    } 
    
    // Dopo 7:00 → mezzanotte PROSSIMA
    const tomorrowMidnightStr = nowIT.getFullYear() + '-' + 
        String(nowIT.getMonth() + 1).padStart(2, '0') + '-' + 
        String(nowIT.getDate() + 1).padStart(2, '0') + 'T00:00:00';
    return { type: 'countdown', target: new Date(tomorrowMidnightStr + '+01:00') };
}

// Aggiorna timer/UI
function updateTimer() {
    const target = getTargetTime();
    
    if (target.type === 'open') {
        // Chat aperta 00:00-06:59
        if (document.getElementById('countdown-section').classList.contains('active')) {
            document.getElementById('countdown-section').classList.remove('active');
            document.getElementById('nickname-section').classList.add('active');
        }
        return;
    }
    
    // Countdown
    const nowIT = new Date(getItalianTime());
    const diff = target.target - nowIT;
    
    if (diff > 0) {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        
        document.getElementById('countdown-section').classList.add('active');
        document.getElementById('nickname-section').classList.remove('active');
    } else {
        // Mezza notte: apri chat
        document.getElementById('countdown-section').classList.remove('active');
        document.getElementById('nickname-section').classList.add('active');
    }
}

// Eventi chat (invariati)
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('join-btn').onclick = () => {
        nickname = document.getElementById('nickname-input').value.trim();
        if (nickname) {
            document.getElementById('nickname-section').classList.remove('active');
            document.getElementById('chat-section').classList.add('active');
            socket.emit('chat-message', { nick: nickname, text: `${nickname} si è unito! 🌙 (${getItalianHour()})` });
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
});

// Socket.IO messaggi
socket.on('chat-message', (data) => {
    const messages = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.innerHTML = `<strong>${data.nick}</strong> <small>${new Date(data.timestamp).toLocaleTimeString('it-IT')}</small><span>${data.text}</span>`;
    messages.appendChild(msgDiv);
    messages.scrollTop = messages.scrollHeight;
});

// START TIMER
console.log('Inizio timer... Ora IT:', getItalianTime());
intervalId = setInterval(updateTimer, 1000);
updateTimer(); // Immediato
