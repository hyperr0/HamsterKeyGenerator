document.addEventListener('DOMContentLoaded', () => {
    const games = {
        1: { name: 'Chain Cube 2048', appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2', promoId: 'b4170868-cef0-424f-8eb9-be0622e8e8e3', timing: 30000, attempts: 20 },
        2: { name: 'Train Miner', appToken: '82647f43-3f87-402d-88dd-09a90025313f', promoId: 'c4480ac7-e178-4973-8061-9ed5b2e17954', timing: 30000, attempts: 15 },
        3: { name: 'Merge Away', appToken: '8d1cc2ad-e097-4d35-b754-26ed982adbf2', promoId: '9b7a5dbb-90ef-49b7-97df-4d7e64fe4e8f', timing: 30000, attempts: 20 },
        4: { name: 'Twerk Race 3D', appToken: '21f7c75d-0a08-4de0-a234-356f5f22fabb', promoId: 'b23f96d0-e1d2-42e7-8811-30d1e1abdb1f', timing: 30000, attempts: 15 },
        5: { name: 'Polysphere', appToken: '1e8b7b73-9e49-4e58-b9a7-cb295ff4304a', promoId: 'a20d4fd4-c8cb-44ad-9bb7-96df2b0aaf08', timing: 30000, attempts: 20 },
        6: { name: 'Mow And Trim', appToken: '4fd3b1e7-6ac0-4fef-9c4e-2b228029fc1b', promoId: '63dd0bb8-dace-4f5a-a005-99b54c0c4cc0', timing: 30000, attempts: 15 },
        7: { name: 'Cafe Dash', appToken: '3f8a5b7e-c04d-4d0a-85e6-35b0f39fd4c8', promoId: '8b07d1be-d82a-451b-a279-2dbe84366483', timing: 30000, attempts: 20 },
        8: { name: 'Zoopolis', appToken: '2f709df4-e3d0-44e6-a7b5-7e021c1fd276', promoId: 'ebfd23b4-7b58-48db-8476-3ae964d94926', timing: 30000, attempts: 15 },
        9: { name: 'Gangs Wars', appToken: '37c7d442-1cfb-4d9a-8b71-c37e4f2452e5', promoId: 'dfeb4d7f-08c4-4e82-a0a6-6b51151fe468', timing: 30000, attempts: 20 }
    };

    const keyRange = document.getElementById('keyRange');
    const keyValue = document.getElementById('keyValue');
    const keyCountGroup = document.getElementById('keyCountGroup');
    const startBtnContainer = document.getElementById('startBtnContainer');
    const startBtn = document.getElementById('startBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressLog = document.getElementById('progressLog');
    const keysList = document.getElementById('keysList');
    const keyContainer = document.getElementById('keyContainer');
    const generatedKeysTitle = document.getElementById('generatedKeysTitle');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const generateMoreBtn = document.getElementById('generateMoreBtn');
    const gameSelectContainer = document.getElementById('gameSelectContainer');

    let selectedGame = null;

    gameSelectContainer.addEventListener('click', (e) => {
        const gameElement = e.target.closest('.game-option');
        if (gameElement) {
            selectedGame = games[gameElement.getAttribute('data-game')];
            keyCountGroup.classList.remove('hidden');
            startBtnContainer.classList.remove('hidden');
        }
    });

    keyRange.addEventListener('input', () => {
        keyValue.textContent = keyRange.value;
    });

    startBtn.addEventListener('click', async () => {
        const keyCount = parseInt(keyRange.value, 10);
        startBtnContainer.classList.add('hidden');
        keyCountGroup.classList.add('hidden');
        progressContainer.classList.remove('hidden');
        keyContainer.classList.remove('hidden');
        generatedKeysTitle.classList.remove('hidden');

        keysList.innerHTML = '';

        for (let i = 0; i < keyCount; i++) {
            await generateKey(i + 1, selectedGame);
        }

        copyAllBtn.classList.remove('hidden');
    });

    async function generateKey(index, game) {
        updateProgress(index, game);
        await sleep(game.timing);

        try {
            const promoKey = await requestPromoKey(game);
            displayKey(promoKey, index);
        } catch (error) {
            console.error('Key generation failed:', error);
            displayKey('Failed to generate key', index);
        }

        updateProgress(index + 1, game);
    }

    function displayKey(key, index) {
        const keyItem = document.createElement('div');
        keyItem.classList.add('key-item');
        keyItem.innerHTML = `
            <span>${index}. ${key}</span>
            <button class="copy-btn" data-key="${key}">Copy</button>
        `;
        keysList.appendChild(keyItem);
    }

    function updateProgress(index, game) {
        const progressPercentage = (index / keyRange.value) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        progressText.textContent = `${progressPercentage.toFixed(0)}%`;
        progressLog.textContent = `Generating key ${index} for ${game.name}...`;
    }

    async function requestPromoKey(game) {
        const loginData = {
            deviceId: uuidv4(),
            appToken: game.appToken
        };

        const loginResponse = await fetch('https://auth.hamster.io/v1/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });

        const loginResult = await loginResponse.json();
        const token = loginResult.token;

        const promoResponse = await fetch(`https://promo.hamster.io/v1/promo/${game.promoId}/redeem`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const promoResult = await promoResponse.json();
        return promoResult.code;
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    copyAllBtn.addEventListener('click', () => {
        const allKeys = Array.from(document.querySelectorAll('.key-item span')).map(el => el.textContent).join('\n');
        copyToClipboard(allKeys);
    });

    keysList.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
            const key = e.target.getAttribute('data-key');
            copyToClipboard(key);
        }
    });

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Keys copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
});
