// aftermezzanotte.live - Frontend completo
// Backend: wss://aftermezzanotte-backend.onrender.com
const SOCKET_URL = 'wss://aftermezzanotte-backend.onrender.com';
let socket;
let myNick = '';
let usersOnline = 0;

// Elementi DOM
const countdownEl = document.getElementById('countdown-container');
const nicknameEl = document.getElementById('nickname-container');
const chatEl = document.getElementById('chat-container');
const timeUnits = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds')
};
const nickInput = document.getElementById('nickInput');
const nickBtn = document.getElementById('nickBtn');
const badgeEl = document.getElementById('online-badge');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const titleEl = document.querySelector('.title');

// Inizializzazione
document.addEventListener('DOMContentLoaded', init);

function init() {
  // Carica nickname salvato
  const savedNick = localStorage.getItem('aftermezzanotte_nick');
  if (savedNick) {
    myNick = savedNick;
    nickInput.value = savedNick;
  }

  // Check ora attuale
  if (isAfterMidnight()) {
    showNickname();
  } else {
    startCountdown();
  }

  // Event listeners
  nickBtn.addEventListener('click', handleNickname);
  nickInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleNickname();
  });
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function isAfterMidnight() {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  todayMidnight.setTime(todayMidnight.getTime() + (now.getTimezoneOffset() * 60000)); // Local offset
  const italyOffset = now.toLocaleString("it-IT", {timeZone: "Europe/Rome"}).includes('CEST') ? 2 : 1;
  todayMidnight.setHours(todayMidnight.getHours() + italyOffset);
  return now >= todayMidnight;
}

function startCountdown() {
  countdownEl.classList.remove('hidden');
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const now = new Date();
  const italyNow = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Rome"}));
  const tomorrowMidnight = new Date(italyNow);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
  tomorrowMidnight.setHours(0, 0, 0, 0);

  const diff = tomorrowMidnight - italyNow;
  if (diff <= 0) {
    showNickname();
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  timeUnits.days.textContent = days.toString().padStart(2, '0');
  timeUnits.hours.textContent = hours.toString().padStart(2, '0');
  timeUnits.minutes.textContent = minutes.toString().padStart(2, '0');
  timeUnits.seconds.textContent = seconds.toString().padStart(2, '0');

  // Update badge con stima utenti (prima della chat)
  badgeEl.textContent = `${usersOnline || '?'} online`;
}

function showNickname() {
  countdownEl.classList.add('hidden');
  nicknameEl.classList.remove('hidden');
  titleEl.textContent = 'aftermezzanotte.live';
  nickInput.focus();
}

function handleNickname() {
  const nick = nickInput.value.trim();
  if (nick && nick.length >= 2 && nick.length <= 20) {
    myNick = nick;
    localStorage.setItem('aftermezzanotte_nick', nick);
    initChat();
  } else {
    alert('Nickname: 2-20 caratteri');
    nickInput.focus();
  }
}

function initChat() {
  nicknameEl.classList.add('hidden');
  chatEl.classList.remove('hidden');
  titleEl.textContent = `Benvenuto, ${myNick}`;

  // Connetti Socket.IO
  socket = io(SOCKET_URL, {
    transports: ['websocket'],
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('🟢 Connesso a aftermezzanotte');
    socket.emit('join', myNick);
  });

  socket.on('usersUpdate', (count) => {
    usersOnline = count;
    badgeEl.textContent = `${count} online`;
  });

  socket.on('message', (data) => {
    addMessage(data.nick, data.message);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Disconnesso');
    badgeEl.textContent = 'Riconnessione...';
  });

  chatInput.focus();
}

function sendMessage() {
  const message = chatInput.value.trim();
  if (message && socket && myNick) {
    socket.emit('message', { nick: myNick, message });
    chatInput.value = '';
  }
}

function addMessage(nick, message) {
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `<strong>${escapeHtml(nick)}:</strong> ${escapeHtml(message)}`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Cleanup on unload
window.addEventListener('beforeunload', () => {
  if (socket) socket.disconnect();
});
