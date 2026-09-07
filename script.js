/* --- STATE MANAGEMENT --- */
const AppState = {
    user: {
        name: 'Nisa',
        age: 8,
        gender: 'Kız',
        points: 40,
        moods: { 'Pzt': '😊', 'Sal': '😌' },
        inventory: []
    },
    progress: {
        completedTongue: 0,
        completedLip: 0,
        completedGames: 0
    },
    activeExercise: null,
    mediaStreams: {
        camera: null,
        micAudioContext: null,
        micAnalyser: null,
        micStream: null
    }
};

/* --- DATA: EXERCISES --- */
const tongueExercises = [
    { id: 't1', title: '1. Sabit Dışarıda', desc: 'Dilini hiçbir yere değdirmeden dışarı çıkar ve 5 saniye bekle.', duration: 5, reps: 1, type: 'camera', icon: '👅' },
    { id: 't2', title: '2. İçeri - Dışarı', desc: 'Dilini dışarı çıkar ve içeri çek. 5 kere tekrarla.', duration: 3, reps: 5, type: 'camera', icon: '👅' },
    { id: 't3', title: '3. Köşeden Köşeye', desc: 'Dilini çıkar ve dudağının bir köşesinden diğerine götür.', duration: 5, reps: 2, type: 'camera', icon: '👅' }
];

const lipExercises = [
    { id: 'l1', title: '1. Ağız Aç-Kapat', desc: 'Ağzını "aa" der gibi açıp kapat. 3 tekrar yap.', duration: 3, reps: 3, type: 'camera', icon: '👄' },
    { id: 'l9', title: '9. Pa, Pa, Pa', desc: '"Pa, pa, pa" de. Mikrofon sesini algılayacak.', duration: 4, reps: 3, type: 'mic', icon: '🎙️' },
    { id: 'l10', title: '10. Ba, Ba, Ba', desc: '"Ba, ba, ba" de. Temiz ve net söyle.', duration: 4, reps: 3, type: 'mic', icon: '🎙️' }
];

/* --- INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadUserData();
    renderWeeklyMoods();
    renderExercises('tongue');
});

/* --- DATA STORAGE (LocalStorage) --- */
function saveUserData() {
    localStorage.setItem('neurobloom_state', JSON.stringify(AppState));
    updateUIHeader();
}

function loadUserData() {
    const saved = localStorage.getItem('neurobloom_state');
    if (saved) {
        Object.assign(AppState, JSON.parse(saved));
        document.getElementById('onboarding-modal').classList.add('hidden');
    }
    updateUIHeader();
}

function updateUIHeader() {
    document.getElementById('welcome-text').innerText = `Merhaba ${AppState.user.name}! 🌸`;
    document.getElementById('user-points-badge').innerText = `⭐ ${AppState.user.points} Puan`;
    document.getElementById('stat-ex-count').innerText = AppState.progress.completedTongue + AppState.progress.completedLip;
    document.getElementById('stat-game-count').innerText = AppState.progress.completedGames;
}

/* --- NAVIGATION --- */
function switchPage(pageId, btnEl) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`page-${pageId}`).classList.add('active');
    btnEl.classList.add('active');

    // Sayfa değiştiğinde kamera/mikrofon KANITLANMIŞ OLARAK kapatılır (Gizlilik)
    stopHardwareTracks();
}

/* --- ONBOARDING FLOW --- */
function nextOnboardingStep(step) {
    document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`onboarding-step-${step}`).classList.add('active');
}

function completeOnboarding() {
    const name = document.getElementById('user-name-input').value.trim();
    if (name) AppState.user.name = name;
    AppState.user.age = document.getElementById('user-age-input').value;
    AppState.user.gender = document.getElementById('user-gender-input').value;

    saveUserData();
    document.getElementById('onboarding-modal').classList.add('hidden');
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}

/* --- MOOD SYSTEM --- */
function selectMood(emoji, label) {
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const today = days[new Date().getDay()];
    AppState.user.moods[today] = emoji;
    saveUserData();
    renderWeeklyMoods();
    document.getElementById('home-bot-message').innerText = `Bugün ${label} hissettiğini kaydettim! Harikasın 🌸`;
}

function renderWeeklyMoods() {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const grid = document.getElementById('weekly-mood-grid');
    grid.innerHTML = '';
    days.forEach(d => {
        const mood = AppState.user.moods[d] || '➖';
        grid.innerHTML += `<div class="day-mood-item"><div>${mood}</div><span>${d}</span></div>`;
    });
}

/* --- EXERCISES LOGIC --- */
function switchExerciseTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderExercises(tab);
}

function renderExercises(tab) {
    const listContainer = document.getElementById('exercise-list');
    listContainer.innerHTML = '';
    const items = tab === 'tongue' ? tongueExercises : lipExercises;

    items.forEach(ex => {
        listContainer.innerHTML += `
            <div class="exercise-card">
                <div class="ex-icon">${ex.icon}</div>
                <div class="ex-info">
                    <h5>${ex.title}</h5>
                    <p>${ex.desc}</p>
                </div>
                <button class="btn btn-sm btn-primary" onclick="openExerciseModal('${ex.id}', '${tab}')">Başla</button>
            </div>
        `;
    });
}

function openExerciseModal(exId, tab) {
    const list = tab === 'tongue' ? tongueExercises : lipExercises;
    AppState.activeExercise = list.find(e => e.id === exId);

    document.getElementById('ex-modal-title').innerText = AppState.activeExercise.title;
    document.getElementById('ex-modal-desc').innerText = AppState.activeExercise.desc;
    document.getElementById('ex-reps').innerText = `Tekrar: 0/${AppState.activeExercise.reps}`;

    const modal = document.getElementById('exercise-active-modal');
    modal.classList.remove('hidden');

    // Arayüz Görünürlüğü
    if (AppState.activeExercise.type === 'camera') {
        document.getElementById('camera-viewport').classList.remove('hidden');
        document.getElementById('mic-viewport').classList.add('hidden');
    } else {
        document.getElementById('camera-viewport').classList.add('hidden');
        document.getElementById('mic-viewport').classList.remove('hidden');
    }
}

/* --- GERÇEK HARDWARE ERİŞİMLERİ (CAMERA & MIC) --- */
async function startCurrentExerciseFlow() {
    const startBtn = document.getElementById('ex-start-btn');
    startBtn.disabled = true;

    if (AppState.activeExercise.type === 'camera') {
        await initCamera();
    } else if (AppState.activeExercise.type === 'mic') {
        await initMicrophone();
    }

    // Sayaç ve Tekrar Başlatma
    let currentRep = 0;
    const totalReps = AppState.activeExercise.reps;

    const interval = setInterval(() => {
        currentRep++;
        document.getElementById('ex-reps').innerText = `Tekrar: ${currentRep}/${totalReps}`;

        if (currentRep >= totalReps) {
            clearInterval(interval);
            finishExercise();
        }
    }, AppState.activeExercise.duration * 1000);
}

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        AppState.mediaStreams.camera = stream;
        const videoEl = document.getElementById('webcam-video');
        videoEl.srcObject = stream;
    } catch (err) {
        alert("Kameraya erişilemedi. Lütfen izinleri kontrol edin.");
    }
}

async function initMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        AppState.mediaStreams.micStream = stream;
        
        // Web Audio API ile Ses Analizi
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;

        AppState.mediaStreams.micAudioContext = audioCtx;
        AppState.mediaStreams.micAnalyser = analyser;

        monitorAudioLevel();
    } catch (err) {
        alert("Mikrofona erişilemedi. Lütfen izinleri kontrol edin.");
    }
}

function monitorAudioLevel() {
    const analyser = AppState.mediaStreams.micAnalyser;
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const audioBar = document.getElementById('audio-bar');
    const feedbackText = document.getElementById('mic-feedback-text');

    function check() {
        if (!AppState.mediaStreams.micStream) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        let average = sum / dataArray.length;

        let volumePercent = Math.min(100, Math.round((average / 128) * 100));
        audioBar.style.width = `${volumePercent}%`;

        if (volumePercent > 30) {
            feedbackText.innerText = "Harika! Ses algılandı 🎉";
            feedbackText.style.color = "var(--accent-green)";
        } else {
            feedbackText.innerText = "Biraz daha yüksek sesle söyle...";
            feedbackText.style.color = "var(--text-dark)";
        }

        requestAnimationFrame(check);
    }
    check();
}

function stopHardwareTracks() {
    if (AppState.mediaStreams.camera) {
        AppState.mediaStreams.camera.getTracks().forEach(t => t.stop());
        AppState.mediaStreams.camera = null;
    }
    if (AppState.mediaStreams.micStream) {
        AppState.mediaStreams.micStream.getTracks().forEach(t => t.stop());
        AppState.mediaStreams.micStream = null;
    }
    if (AppState.mediaStreams.micAudioContext) {
        AppState.mediaStreams.micAudioContext.close();
        AppState.mediaStreams.micAudioContext = null;
    }
}

function finishExercise() {
    stopHardwareTracks();
    AppState.user.points += 10;
    if (AppState.activeExercise.id.startsWith('t')) AppState.progress.completedTongue++;
    else AppState.progress.completedLip++;

    saveUserData();
    closeExerciseModal();
    confetti({ particleCount: 80, spread: 60 });
    alert("Tebrikler! Egzersizi tamamladın ve 10 Yıldız Kazandın! ⭐");
}

function closeExerciseModal() {
    stopHardwareTracks();
    document.getElementById('exercise-active-modal').classList.add('hidden');
    document.getElementById('ex-start-btn').disabled = false;
}

/* --- GAME 1: HARF ÇARKI --- */
function startWheelGame() {
    const area = document.getElementById('active-game-area');
    area.classList.remove('hidden');
    area.innerHTML = `
        <div class="card wheel-container">
            <button class="close-btn" onclick="closeGameArea()">✕</button>
            <h4>Harf Çarkı 🎡</h4>
            <div id="wheel-disc" class="wheel">?</div>
            <button class="btn btn-primary" onclick="spinWheel()">Çarkı Çevir!</button>
            <div id="word-input-section" class="hidden" style="width:100%; margin-top:10px;">
                <p><strong id="target-letter">K</strong> Harfi ile Başlayan 3 Kelime Yaz:</p>
                <input type="text" id="w1" placeholder="1. Kelime" style="width:100%; margin:4px 0; padding:8px;">
                <input type="text" id="w2" placeholder="2. Kelime" style="width:100%; margin:4px 0; padding:8px;">
                <input type="text" id="w3" placeholder="3. Kelime" style="width:100%; margin:4px 0; padding:8px;">
                <button class="btn btn-success" style="width:100%; margin-top:8px;" onclick="checkWheelWords()">Kontrol Et ✅</button>
            </div>
        </div>
    `;
}

function spinWheel() {
    const alphabet = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".replace('Ğ', '');
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    const wheelDisc = document.getElementById('wheel-disc');

    let degrees = 1440 + Math.floor(Math.random() * 360);
    wheelDisc.style.transform = `rotate(${degrees}deg)`;

    setTimeout(() => {
        wheelDisc.innerText = randomLetter;
        document.getElementById('target-letter').innerText = randomLetter;
        document.getElementById('word-input-section').classList.remove('hidden');
    }, 3000);
}

function checkWheelWords() {
    const target = document.getElementById('target-letter').innerText.toLowerCase();
    const w1 = document.getElementById('w1').value.trim().toLowerCase();
    const w2 = document.getElementById('w2').value.trim().toLowerCase();
    const w3 = document.getElementById('w3').value.trim().toLowerCase();

    if (w1.startsWith(target) && w2.startsWith(target) && w3.startsWith(target)) {
        AppState.user.points += 20;
        AppState.progress.completedGames++;
        saveUserData();
        confetti({ particleCount: 100 });
        alert("Süpersin! Tüm kelimeler doğru. +20 Puan ⭐");
        closeGameArea();
    } else {
        alert("Bazı kelimeler çıkan harfle başlamıyor. Lütfen tekrar dene! 💪");
    }
}

/* --- GAME 2: HECE BALIKLARI --- */
function startFishGame() {
    const area = document.getElementById('active-game-area');
    area.classList.remove('hidden');
    area.innerHTML = `
        <div class="card text-center">
            <button class="close-btn" onclick="closeGameArea()">✕</button>
            <h4>Hece Balıkları 🐟</h4>
            <p>Hedef Hece: <strong style="font-size:24px; color:var(--primary-blue)">"BA"</strong></p>
            <p>Doğru balığa dokun!</p>
            <div style="display:flex; justify-content:space-around; margin:30px 0; font-size:40px;">
                <span onclick="catchFish(false)" style="cursor:pointer">🐟 <br><small style="font-size:12px">LA</small></span>
                <span onclick="catchFish(true)" style="cursor:pointer">🐠 <br><small style="font-size:12px">BA</small></span>
                <span onclick="catchFish(false)" style="cursor:pointer">🐡 <br><small style="font-size:12px">MA</small></span>
            </div>
        </div>
    `;
}

function catchFish(isCorrect) {
    if (isCorrect) {
        AppState.user.points += 15;
        AppState.progress.completedGames++;
        saveUserData();
        confetti({ particleCount: 80 });
        alert("Harika! Doğru balığı tuttun! 🎣");
        closeGameArea();
    } else {
        alert("Bu hedef hece değil. Bir daha dene! 💪");
    }
}

function closeGameArea() {
    document.getElementById('active-game-area').classList.add('hidden');
}

/* --- ASSISTANT CHAT LOGIC --- */
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const chatContainer = document.getElementById('chat-messages');
    
    // User Msg
    chatContainer.innerHTML += `
        <div class="chat-msg user">
            <span>👧</span>
            <p>${msg}</p>
        </div>
    `;

    input.value = '';

    // Bot Response Simülasyonu
    setTimeout(() => {
        let reply = "Harika gidiyorsun! Egzersizlerini tamamlamayı unutma 🌸";
        if (msg.toLowerCase().includes("selam") || msg.toLowerCase().includes("merhaba")) {
            reply = `Merhaba ${AppState.user.name}! Bugün harika bir gün, egzersiz yapmaya hazır mısın?`;
        }
        chatContainer.innerHTML += `
            <div class="chat-msg bot">
                <span>🤖</span>
                <p>${reply}</p>
            </div>
        `;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 600);
}

/* --- NEUROBOT ROOM & PARENT MODALS --- */
function openRoomModal() { document.getElementById('room-modal').classList.remove('hidden'); }
function closeRoomModal() { document.getElementById('room-modal').classList.add('hidden'); }

function buyRoomItem(item, cost) {
    if (AppState.user.points >= cost) {
        AppState.user.points -= cost;
        AppState.user.inventory.push(item);
        document.getElementById('room-item-display').innerText = `✨ ${item}`;
        saveUserData();
        alert(`${item} başarıyla satın alındı ve odaya eklendi! 🎉`);
    } else {
        alert("Yeterli yıldız puanın yok. Egzersiz yaparak puan kazanabilirsin! ⭐");
    }
}

function openParentModal() {
    document.getElementById('parent-modal').classList.remove('hidden');
    document.getElementById('parent-ex-log').innerText = AppState.progress.completedTongue + AppState.progress.completedLip;
    const moods = Object.entries(AppState.user.moods).map(([d, m]) => `${d}: ${m}`).join(', ');
    document.getElementById('parent-mood-log').innerText = moods || 'Henüz Kayıt Yok';
}

function closeParentModal() { document.getElementById('parent-modal').classList.add('hidden'); }

function selectPlan(planName) {
    alert(`${planName} paketi seçildi. Ödeme adımına yönlendiriliyorsunuz.`);
}
