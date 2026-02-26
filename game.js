let isLoginMode = true;
let gameActive = false;
let score = 0;
let timeLeft = 60;
let combo = 0;
let bossActive = false;
let bossHP = 15;
let nextBossScore = 200;

const container = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const alertBox = document.getElementById('alert');
const comboEl = document.getElementById('combo-meter');

const mailTypes = [
    { icon: '☁️', type: 'dreams' },
    { icon: '👂', type: 'whispers' },
    { icon: '👻', type: 'shadows' }
];

function toggleMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('form-title').innerText = isLoginMode ? "VOID LOGIN" : "CREATE ACCOUNT";
    document.getElementById('main-btn').innerText = isLoginMode ? "ENTER VOID" : "SIGN UP";
}

function handleAuth() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('ui-bar').style.display = 'flex';
    document.body.classList.add('game-started');
    gameActive = true;
    startTimer();
    spawnMail();
}

function spawnMail() {
    if (!gameActive || bossActive) return;

    const rand = Math.random();
    let data, className = 'package';

    if (rand > 0.90) { data = { icon: '💣', type: 'bomb' }; className += ' void-bomb'; }
    else if (rand > 0.85) { data = { icon: '💰', type: 'gold' }; className += ' special'; }
    else { data = mailTypes[Math.floor(Math.random() * mailTypes.length)]; }

    const mail = document.createElement('div');
    mail.className = className;
    mail.innerHTML = data.icon;
    mail.dataset.type = data.type;
    mail.style.left = Math.random() * (container.clientWidth - 60) + 'px';
    mail.style.top = '-60px';
    container.appendChild(mail);

    let fallSpeed = 2 + (score / 500);
    const fallInterval = setInterval(() => {
        if (!gameActive || bossActive) return clearInterval(fallInterval);
        let top = parseFloat(mail.style.top);
        mail.style.top = (top + fallSpeed) + 'px';

        if (top > container.clientHeight) {
            clearInterval(fallInterval);
            mail.remove();
            if (data.type !== 'bomb') score = Math.max(0, score - 10);
            scoreEl.innerText = score;
            spawnMail();
        }
    }, 16);

    setupDrag(mail, fallInterval);
}

// --- UNIVERSAL DRAG LOGIC (MOBILE + DESKTOP) ---
function setupDrag(el, interval) {
    const onStart = (e) => {
        if (e.type === 'touchstart') e.preventDefault(); // Stop mobile scrolling
        
        clearInterval(interval);
        el.style.zIndex = 1000;
        const rect = container.getBoundingClientRect();

        const move = (ev) => {
            // Get coordinates from either mouse or touch event
            const clientX = ev.type === 'touchmove' ? ev.touches[0].clientX : ev.clientX;
            const clientY = ev.type === 'touchmove' ? ev.touches[0].clientY : ev.clientY;

            // Center the item on the finger/cursor
            el.style.left = (clientX - rect.left - (el.offsetWidth / 2)) + 'px';
            el.style.top = (clientY - rect.top - (el.offsetHeight / 2)) + 'px';
        };

        const onEnd = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('touchmove', move);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchend', onEnd);
            checkDrop(el);
        };

        document.addEventListener('mousemove', move);
        document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    };

    el.onmousedown = onStart;
    el.addEventListener('touchstart', onStart, { passive: false });
}

function checkDrop(mail) {
    const bins = document.querySelectorAll('.bin');
    let hit = false;

    if (mail.dataset.type === 'bomb') {
        score = Math.max(0, score - 50);
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 300);
    } else {
        bins.forEach(bin => {
            const b = bin.getBoundingClientRect();
            const m = mail.getBoundingClientRect();
            if (m.left < b.right && m.right > b.left && m.top < b.bottom && m.bottom > b.top) {
                if (bin.dataset.type === mail.dataset.type) {
                    combo++;
                    score += 10 * combo;
                    hit = true;
                }
            }
        });
    }

    mail.remove();
    scoreEl.innerText = score;
    if (score >= nextBossScore && !bossActive) spawnBoss();
    else spawnMail();
}

function startTimer() {
    const clock = setInterval(() => {
        if (!gameActive) return clearInterval(clock);
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function spawnBoss() {
    bossActive = true;
    const boss = document.createElement('div');
    boss.className = 'package';
    boss.style.cssText = 'width:150px;height:150px;font-size:5rem;left:40%;top:30%;border:5px solid red;';
    boss.innerHTML = '👹';
    
    // Boss interaction for mobile/desktop
    const hitBoss = () => {
        bossHP--;
        if (bossHP <= 0) {
            boss.remove();
            bossActive = false;
            nextBossScore += 500;
            score += 200;
            scoreEl.innerText = score;
            spawnMail();
        }
    };

    boss.onclick = hitBoss;
    boss.addEventListener('touchstart', (e) => {
        e.preventDefault();
        hitBoss();
    });

    container.appendChild(boss);
}

function endGame() {
    gameActive = false;
    alert("Void Closed! Score: " + score);
    location.reload();
}