// app.js
// 1. 引入 Firebase 套件
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

// 2. Firebase 連線設定 (貼上你的金鑰)
const firebaseConfig = {
    apiKey: "AIzaSyAVPf4LDvIwdwDAOmLR5LCb2YOrHBKYQL0",
    authDomain: "boss-timer-eb97e.firebaseapp.com",
    databaseURL: "https://boss-timer-eb97e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "boss-timer-eb97e",
    storageBucket: "boss-timer-eb97e.firebasestorage.app",
    messagingSenderId: "132421383690",
    appId: "1:132421383690:web:3dbe0a3aabbd275254d1f3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 3. 變數設定
let userName = "";
const totalChannels = 60;
const respawnTimeMs = 240 * 60 * 1000; 
let channelsData = {}; 

// 4. 登入與初始化介面
function initChannels() {
    const grid = document.getElementById('channelGrid');
    grid.innerHTML = ""; 
    for (let i = 1; i <= totalChannels; i++) {
        const box = document.createElement('div');
        box.className = 'channel-box';
        box.innerHTML = `
            <div class="ch-title">CH ${i}</div>
            <div class="status" id="status-${i}">未確認</div>
            <div class="action-btns">
                <button onclick="window.setMonitor(${i})">監視</button>
                <button onclick="window.setPatrol(${i})">巡邏</button>
                <button onclick="window.setDead(${i})">擊殺</button>
            </div>
        `;
        grid.appendChild(box);
    }
}

while (!userName) {
    userName = prompt("請輸入您的遊戲 ID 以進入計時器：");
}
document.getElementById('currentUser').innerText = userName;
initChannels();

// 5. 寫入資料到 Firebase (按鈕功能)
window.setMonitor = (ch) => {
    set(ref(db, 'channels/' + ch), { state: 'monitoring', detail: `${userName} 監視中` });
};

window.setPatrol = (ch) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    set(ref(db, 'channels/' + ch), { state: 'patrolled', detail: `${timeStr} 巡邏過` });
};

window.setDead = (ch) => {
    const targetTime = Date.now() + respawnTimeMs;
    set(ref(db, 'channels/' + ch), { state: 'dead', targetTime: targetTime, detail: '計算中...' });
};

// 6. 監聽 Firebase 資料變化 (畫面更新引擎)
onValue(ref(db, 'channels'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
        channelsData = data;
        for (let i = 1; i <= totalChannels; i++) {
            if (data[i] && data[i].state !== 'dead') {
                updateUI(i, data[i].state, data[i].detail);
            }
        }
    }
});

// 7. 本地倒數計時器 (每秒執行)
setInterval(() => {
    for (let i = 1; i <= totalChannels; i++) {
        if (channelsData[i] && channelsData[i].state === 'dead') {
            const remainMs = channelsData[i].targetTime - Date.now();
            
            if (remainMs <= 0) {
                updateUI(i, 'spawned', '已重生 / 可擊殺');
            } else {
                const remainMins = Math.floor(remainMs / 60000);
                const remainSecs = Math.floor((remainMs % 60000) / 1000);
                updateUI(i, 'dead', `倒數: ${remainMins}分 ${remainSecs}秒`);
            }
        }
    }
}, 1000);

// 8. 實際改變 HTML DOM 的函式
function updateUI(ch, state, detailText) {
    const statusDiv = document.getElementById(`status-${ch}`);
    if(statusDiv) {
        statusDiv.className = `status status-${state}`;
        statusDiv.innerText = detailText;
    }
}