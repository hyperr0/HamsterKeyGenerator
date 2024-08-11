const EVENTS_DELAY = 20000;
const defaultLanguage = document.documentElement.getAttribute('lang') || 'en';
const gamePromoConfigs = {
    MyCloneArmy: {
        appToken: '74ee0b5b-775e-4bee-974f-63e7f4d5bacb',
        promoId: 'fe693b26-b342-4159-8808-15e3ff7f8767'
    },
    ChainCube2048: {
        appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2',
        promoId: 'b4170868-cef0-424f-8eb9-be0622e8e8e3'
    },
    TrainMiner: {
        appToken: '82647f43-3f87-402d-88dd-09a90025313f',
        promoId: 'c4480ac7-e178-4973-8061-9ed5b2e17954'
    },
    BikeRide3D: {
        appToken: 'd28721be-fd2d-4b45-869e-9f253b554e50',
        promoId: '43e35910-c168-4634-ad4f-52fd764a843f'
    },
};

let currentAppConfig = gamePromoConfigs.MyCloneArmy;
let currentLanguage = defaultLanguage;
let keygenActive = false;

document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('languageSelect');
    const gameSelect = document.getElementById('gameSelect');
    const supportedLangs = Array.from(languageSelect.options).map(option => option.value);

    const storedLang = localStorage.getItem('language');
    const userLang = storedLang || navigator.language || navigator.userLanguage;
    const defaultLang = supportedLangs.includes(userLang) ? userLang : defaultLanguage;

    // Yeni eklenen kontrol: Dil kodu belirtilmemişse hata fırlat
    if (!defaultLang || !supportedLangs.includes(defaultLang)) {
        console.error('Language code is not specified or not supported');
        alert('Language code is not specified or not supported.');
        return;
    } else {
        switchLanguage(defaultLang);
    }

    gameSelect.addEventListener('change', () => {
        const selectedGame = gameSelect.value;
        currentAppConfig = gamePromoConfigs[selectedGame];
    });
});

async function loadTranslations(language) {
    if (!language) {
        console.error('Language code is not specified');
        alert('Language code is not specified.');
        return;
    }

    try {
        const response = await fetch(`locales/${language}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translations: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
        alert('Failed to load translations. Check the console for details.');
        throw error;
    }
}

async function getTranslation(key) {
    const translations = await loadTranslations(currentLanguage);
    return translations[key] || key;
}

function applyTranslations(translations) {
    document.querySelector('h1').innerText = translations.title;
    document.getElementById('keyCountLabel').innerText = keygenActive
        ? translations.selectKeyCountLabel_selected + document.getElementById('keyCountSelect').value
        : translations.selectKeyCountLabel;
    document.getElementById('startBtn').innerText = translations.generateButton;
    document.getElementById('generatedKeysTitle').innerText = translations.generatedKeysTitle;
    document.getElementById('creatorChannelBtn').innerText = translations.footerButton;
    document.getElementById('copyAllBtn').innerText = translations.copyAllKeysButton;
    document.getElementById('gameSelectLabel').innerText = translations.selectGameLabel;

    document.querySelectorAll('.copyKeyBtn').forEach(button => {
        button.innerText = translations.copyKeyButton || 'Copy Key';
    });
}

async function switchLanguage(language) {
    try {
        const translations = await loadTranslations(language);
        applyTranslations(translations);
        currentLanguage = language;
        localStorage.setItem('language', language);
        document.getElementById('languageSelect').value = language;
    } catch (error) {
        console.error('Error switching language:', error);
    }
}

document.getElementById('languageSelect').addEventListener('change', () => {
    const newLanguage = document.getElementById('languageSelect').value;

    // Dil kodu kontrolü
    if (!newLanguage) {
        console.error('Language code is not specified');
        alert('Language code is not specified.');
    } else {
        switchLanguage(newLanguage);
    }
});

document.getElementById('startBtn').addEventListener('click', async () => {
    const startBtn = document.getElementById('startBtn');
    const keyCountSelect = document.getElementById('keyCountSelect');
    const keyCountLabel = document.getElementById('keyCountLabel');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const keyContainer = document.getElementById('keyContainer');
    const keysList = document.getElementById('keysList');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const generatedKeysTitle = document.getElementById('generatedKeysTitle');
    const keyCount = parseInt(keyCountSelect.value);
    document.getElementById("gameSelect").disabled = true;

    progressBar.style.width = '0%';
    progressText.innerText = '0%';
    progressContainer.classList.remove('hidden');
    keyContainer.classList.add('hidden');
    generatedKeysTitle.classList.add('hidden');
    keysList.innerHTML = '';
    keyCountSelect.classList.add('hidden');
    keyCountLabel.innerText = await getTranslation('selectKeyCountLabel_selected') + keyCount;
    startBtn.classList.add('hidden');
    copyAllBtn.classList.add('hidden');
    startBtn.disabled = true;

    let progress = 0;
    keygenActive = true;

    const updateProgress = (increment) => {
        const steps = 10;
        const stepIncrement = increment / steps;
        let step = 0;

        const increaseProgress = () => {
            if (!keygenActive) return;
            if (step < steps) {
                progress += stepIncrement;
                progressBar.style.width = `${progress}%`;
                progressText.innerText = `${Math.round(progress)}%`;
                step++;
                setTimeout(increaseProgress, 2000 / steps + Math.random() * 1000);
            }
        };

        increaseProgress();
    };

    const generateKeyProcess = async () => {
        const clientId = generateClientId();
        let clientToken;
        try {
            clientToken = await login(clientId);
        } catch (error) {
            alert(`Failed to log in: ${error.message}`);
            startBtn.disabled = false;
            return null;
        }

        for (let i = 0; i < 7; i++) {
            await sleep(EVENTS_DELAY * delayRandom());
            const hasCode = await emulateProgress(clientToken);
            updateProgress(10 / keyCount);
            if (hasCode) {
                break;
            }
        }

        try {
            const key = await generateKey(clientToken);
            updateProgress(30 / keyCount);
            return key;
        } catch (error) {
            alert(`Failed to generate key: ${error.message}`);
            return null;
        }
    };

    const keys = await Promise.all(Array.from({ length: keyCount }, generateKeyProcess));

    keygenActive = false;

    progressBar.style.width = '100%';
    progressText.innerText = '100%';

    if (keys.length > 1) {
        const keyItemsPromises = keys.filter(key => key).map(async (key, index) => {
            const copyKeyButtonText = await getTranslation('copyKeyButton');
            return `
                <div class="key-item">
                    <div class="key-number">${index + 1}</div>
                    <input type="text" value="${key}" readonly>
                    <button class="copyKeyBtn copy-button" data-key="${key}">${copyKeyButtonText}</button>
                </div>
            `;
        });
        const keyItemsHtml = await Promise.all(keyItemsPromises);
        keysList.innerHTML = keyItemsHtml.join('');
        copyAllBtn.classList.remove('hidden');
    } else if (keys.length === 1) {
        keysList.innerHTML = `
            <div class="key-item">
                <div class="key-number">1</div>
                <input type="text" value="${keys[0]}" readonly>
                <button class="copyKeyBtn copy-button" data-key="${keys[0]}">${await getTranslation('copyKeyButton')}</button>
            </div>
        `;
    }

    keyContainer.classList.remove('hidden');
    generatedKeysTitle.classList.remove('hidden');
    startBtn.classList.remove('hidden');
    startBtn.disabled = false;

    document.querySelectorAll('.copyKeyBtn').forEach(button => {
        button.addEventListener('click', (event) => {
            const key = event.target.getAttribute('data-key');
            navigator.clipboard.writeText(key).then(async () => {
                event.target.innerText = await getTranslation('keyCopied');
                event.target.style.backgroundColor = '#28a745';
                setTimeout(async () => {
                    event.target.innerText = await getTranslation('copyKeyButton');
                    event.target.style.backgroundColor = '#6a0080';
                }, 2000);
            });
        });
    });

    copyAllBtn.addEventListener('click', async (event) => {
        const keysText = Array.from(keysList.querySelectorAll('input'))
            .map(input => input.value)
            .join('\n');
        navigator.clipboard.writeText(keysText).then(async () => {
            event.target.innerText = await getTranslation('keysCopied');
            event.target.style.backgroundColor = '#28a745';
            setTimeout(async () => {
                event.target.innerText = await getTranslation('copyAllKeysButton');
                event.target.style.backgroundColor = '#6a0080';
            }, 2000);
        });
    });

    startBtn.disabled = false;
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function delayRandom() {
    return 1 + Math.random();
}

function generateClientId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function login(clientId) {
    const response = await fetch(`https://dev2.berealit.dev/api/v1/auth/guest-login/${currentAppConfig.appToken}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            appToken: currentAppConfig.appToken,
            authData: {
                client_id: clientId,
                platform: 'web',
                device_id: '',
                os_version: '',
                os_name: '',
                language: currentLanguage,
                sdk_version: '2.0.0',
            },
        }),
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.client_token;
}

async function emulateProgress(clientToken) {
    const response = await fetch('https://dev2.berealit.dev/api/v1/metrics/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
            event_name: 'Gameplay_Step_Completed',
            event_properties: {
                step_id: 'gameplay_step',
                step_name: 'Gameplay Step',
            },
            app_token: currentAppConfig.appToken,
            client_token: clientToken,
            device_token: 'not-a-real-device',
            platform: 'web',
        }),
    });

    if (!response.ok) {
        throw new Error(`Emulate progress failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.hasCode;
}

async function generateKey(clientToken) {
    const response = await fetch('https://dev2.berealit.dev/api/v1/promotions/generate-key', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clientToken}`,
        },
        body: JSON.stringify({
            promo_id: currentAppConfig.promoId,
            app_token: currentAppConfig.appToken,
            client_token: clientToken,
            platform: 'web',
        }),
    });

    if (!response.ok) {
        throw new Error(`Key generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.promo_code;
}