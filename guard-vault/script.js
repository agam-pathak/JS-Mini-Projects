const chars = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./'
};

const passwordOutput = document.getElementById('password-output');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const lengthSlider = document.getElementById('length');
const lenVal = document.getElementById('len-val');
const strengthMeter = document.querySelector('.strength-meter');
const strengthText = document.getElementById('strength-text');

// Initialize
lengthSlider.oninput = () => lenVal.innerText = lengthSlider.value;
generateBtn.onclick = generatePassword;
copyBtn.onclick = copyToClipboard;

function generatePassword() {
    const length = +lengthSlider.value;
    const settings = {
        uppercase: document.getElementById('uppercase').checked,
        lowercase: document.getElementById('lowercase').checked,
        numbers: document.getElementById('numbers').checked,
        symbols: document.getElementById('symbols').checked
    };

    let charPool = '';
    if (settings.uppercase) charPool += chars.uppercase;
    if (settings.lowercase) charPool += chars.lowercase;
    if (settings.numbers) charPool += chars.numbers;
    if (settings.symbols) charPool += chars.symbols;

    if (!charPool) {
        alert('PLEASE SELECT AT LEAST ONE PARAMETER');
        return;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
        password += charPool[Math.floor(Math.random() * charPool.length)];
    }

    passwordOutput.value = password;
    calculateStrength(password, settings);
}

function calculateStrength(pw, sets) {
    let score = pw.length;
    let variety = Object.values(sets).filter(v => v).length;
    
    // Add points for variety
    score += variety * 4;

    strengthMeter.classList.remove('weak', 'medium', 'strong');
    
    if (score < 16) {
        strengthMeter.classList.add('weak');
        strengthText.innerText = 'WEAK ENTROPY';
    } else if (score < 24) {
        strengthMeter.classList.add('medium');
        strengthText.innerText = 'MEDIUM SECURITY';
    } else {
        strengthMeter.classList.add('strong');
        strengthText.innerText = 'MAXIMUM ENTROPY';
    }
}

async function copyToClipboard() {
    const pw = passwordOutput.value;
    if (!pw) return;
    
    try {
        await navigator.clipboard.writeText(pw);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span style="color:var(--primary); font-size:0.7rem">COPIED</span>';
        setTimeout(() => copyBtn.innerHTML = originalText, 1500);
    } catch (err) {
        console.error('Copy failed', err);
    }
}

// Initial Generate
generatePassword();
