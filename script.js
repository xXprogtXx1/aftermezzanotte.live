console.log('SCRIPT CARICATO!'); // Test immediato

const socket = io();
let nickname = '';
let intervalId = null;

function getItalianTime() {
    // FIX: Stringa ISO parsabile per ITALY
    const opts = { 
        timeZone: 'Europe/Rome',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    };
    return new Date().toLocaleString('sv-SE', opts).replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+:\d+)/, '$3-$1-$2T$4');
}

function getHourIT() {
    const timeStr = getItalianTime();
    console.log('Ora IT parsata:', timeStr);
    const date = new Date(timeStr);
    return date.getHours();
}

function getTargetTime() {
    const hourIT = getHourIT();
    console.log('Hour IT:', hourIT);
    
    if (hourIT >= 0 && hourIT < 7) {
        console.log('CHAT APERTA (00-07)');
        return 'open';
    }
    
    console.log('COUNTDOWN a mezzanotte');
    const nowStr = getItalianTime();
    const nowIT = new Date(nowStr);
    const tomorrow = new Date(nowIT);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
}

function updateTimer() {
    const target = getTargetTime();
    
    if (target === 'open') {
        document.getElementById('countdown-section').classList.remove('active');
        document.getElementById('nickname-section').classList.add('active');
        return;
    }
    
    const nowStr = getItalianTime();
    const nowIT = new Date(nowStr);
    const diff = target - nowIT;
    
    console.log('Diff ms:', diff, 'Ora:', nowStr);
    
    if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        
        document.getElementById('hours').textContent = h.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = m.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = s.toString().padStart(2, '0');
        
        document.getElementById('countdown-section').classList.add('active');
        document.getElementById('nickname-section').classList.remove('active');
    } else {
        document.getElementById('countdown-section').classList.remove('active');
        document.getElementById('nickname-section').classList.add('active');
    }
}

// Eventi
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM pronto');
    
    document.getElementById('join-btn').onclick = (e) => {
        e.preventDefault();
        nickname = document.getElementById('nickname-input').value.trim();
        if (nickname) {
            document.getElementById('nickname-section').classList.remove('active');
            document.getElementById('chat-section').classList.add('active');
            socket.emit('chat-message', { 
                nick: nickname, 
                text: `${nickname} entra alle ${getItalianTime().split(' ')[1]}` 
            });
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

// Chat
socket.on('chat-message', (data) => {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `<strong>${data.nick}</strong> <small>${new Date(data.timestamp).toLocaleTimeString()}</small> ${data.text}`;
    document.getElementById('messages').appendChild(div);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
});

// START
console.log('Avvio timer...');
intervalId = setInterval(updateTimer, 1000);
setTimeout(updateTimer, 100); // Immediato
