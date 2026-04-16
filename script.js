// Initialize Lucide Icons
lucide.createIcons();

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const messagesArea = document.getElementById('messagesArea');
const welcomeScreen = document.getElementById('welcomeScreen');
const themeToggle = document.getElementById('themeToggle');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistoryItems = document.querySelectorAll('.history-item');
const suggestionChips = document.querySelectorAll('.suggestion-chip');
const body = document.body;
const userNameLabel = document.getElementById('userNameLabel');
const userAvatarLetter = document.getElementById('userAvatarLetter');
const micBtn = document.querySelector('.mic-btn');


// App State
let currentTheme = 'dark';
let currentUser = {
    name: 'User'
};

// --- Auth Simulation ---

function simulateLogin() {
    const authModalOverlay = document.getElementById('authModalOverlay');
    if (authModalOverlay) {
        if (typeof setAuthMode === 'function') {
            setAuthMode(false); // Defaults to Log in
        }
        
        authModalOverlay.classList.add('active');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function simulateLogout() {
    const logoutModalOverlay = document.getElementById('logoutModalOverlay');
    if (logoutModalOverlay) {
        logoutModalOverlay.classList.add('active');
        const settingsDropdown = document.getElementById('settingsDropdown');
        if (settingsDropdown) settingsDropdown.classList.remove('active');
    } else {
        if (confirm("Are you sure you want to log out?")) {
            processLogout();
        }
    }
}

function processLogout() {
    body.classList.add('is-logged-out');
    sidebar.classList.remove('collapsed'); // Expand by default when logged out
    resetChat();
}

// Sidebar manual toggle
const globalSidebarToggle = document.getElementById('globalSidebarToggle');
globalSidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    if (sidebar.classList.contains('collapsed')) {
        globalSidebarToggle.title = "Expand menu";
    } else {
        globalSidebarToggle.title = "Collapse menu";
    }
});

// --- Sidebar Interactivity ---

// Toggle sidebar on mobile
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && !sidebar.contains(e.target)) {
        if (menuToggle && menuToggle.contains(e.target)) return;
        sidebar.classList.remove('active');
    }
});

let newChatCount = 0;

function addChatToHistory(title) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;
    
    const existingItems = chatHistory.querySelectorAll('.history-item');
    existingItems.forEach(item => item.classList.remove('active'));

    const li = document.createElement('li');
    li.className = 'history-item active';
    li.setAttribute('data-chat-id', 'new-' + newChatCount);
    
    li.innerHTML = `
        <i data-lucide="message-square"></i>
        <span>${title}</span>
    `;

    li.addEventListener('click', () => {
        const items = chatHistory.querySelectorAll('.history-item');
        items.forEach(i => i.classList.remove('active'));
        li.classList.add('active');
        
        resetChat();
        
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.classList.remove('landing-mode');
        }
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }

        addMessage('bot', `Loading your conversation about "${title}"...`);
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });

    chatHistory.prepend(li);
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// --- Chat Interaction ---

// Speech Recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    micBtn.addEventListener('click', () => {
        try {
            recognition.start();
            micBtn.style.color = '#ef4444'; // Red color to indicate listening
            micBtn.title = 'Listening...';
        } catch(e) {
            console.log("Speech recognition is already running.");
        }
    });

    recognition.addEventListener('result', (e) => {
        const transcript = e.results[0][0].transcript;
        const currentVal = chatInput.value;
        chatInput.value = currentVal ? currentVal + ' ' + transcript : transcript;
        chatInput.dispatchEvent(new Event('input')); // Trigger auto-grow and button enable
        micBtn.style.color = '';
        micBtn.title = 'Voice Input';
    });

    recognition.addEventListener('speechend', () => {
        recognition.stop();
        micBtn.style.color = '';
        micBtn.title = 'Voice Input';
    });

    recognition.addEventListener('error', (e) => {
        console.error('Speech recognition error:', e.error);
        micBtn.style.color = '';
        micBtn.title = 'Voice Input';
        if (e.error !== 'no-speech' && e.error !== 'not-allowed') {
            alert('Speech recognition error: ' + e.error);
        }
    });
} else {
    micBtn.addEventListener('click', () => {
        alert("Your browser does not support Speech Recognition. Please try Chrome, Safari, or Edge.");
    });
}

// Auto-grow textarea
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';

    // Enable/Disable send button
    sendBtn.disabled = chatInput.value.trim() === '';
});

// Handle enter key
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

sendBtn.addEventListener('click', handleSendMessage);

function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    let isNewChat = false;
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer && chatContainer.classList.contains('landing-mode')) {
        isNewChat = true;
        chatContainer.classList.remove('landing-mode');
        if (welcomeScreen) {
            welcomeScreen.style.opacity = '0';
            setTimeout(() => {
                welcomeScreen.style.display = 'none';
            }, 300);
        }
    } else {
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
    }

    if (isNewChat) {
        newChatCount++;
        addChatToHistory(`New Chat #${newChatCount}`);
    }

    addMessage('user', text);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Simulate bot response
    simulateBotResponse(text);
}

function addMessage(role, text) {
    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${role}-row`;

    const avatarIcon = role === 'user' ? 'U' : 'AI';

    messageRow.innerHTML = `
        <div class="message-content">
            <div class="message-avatar">${avatarIcon}</div>
            <div class="message-text">${formatText(text)}</div>
        </div>
    `;

    messagesArea.appendChild(messageRow);

    // Scroll to bottom
    messagesArea.scrollTo({
        top: messagesArea.scrollHeight,
        behavior: 'smooth'
    });
}

function simulateBotResponse(userMsg) {
    // Typing indicator simulation
    const loadingRow = document.createElement('div');
    loadingRow.className = 'message-row bot-row loading';
    loadingRow.innerHTML = `
        <div class="message-content">
            <div class="message-avatar">AI</div>
            <div class="message-text">Thinking...</div>
        </div>
    `;
    messagesArea.appendChild(loadingRow);
    messagesArea.scrollTop = messagesArea.scrollHeight;

    setTimeout(() => {
        messagesArea.removeChild(loadingRow);

        let response = "";
        const lowerMsg = userMsg.toLowerCase();

        if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
            response = "Hello! I'm AI Mitra. How can I assist you today with your projects or queries?";
        } else if (lowerMsg.includes('time')) {
            response = `The current local time is ${new Date().toLocaleTimeString()}.`;
        } else if (lowerMsg.includes('weather')) {
            response = "I don't have real-time GPS access, but it looks like a great day for coding!";
        } else {
            response = "That's an interesting topic! As an AI, I can help you explore that further. Would you like me to provide a detailed breakdown or just a summary?";
        }

        addMessage('bot', response);
    }, 1500);
}

function formatText(text) {
    // Simple formatting for demo (bold, etc)
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}

// --- Utilities ---

// New Chat Functionality
newChatBtn.addEventListener('click', resetChat);

function resetChat() {
    messagesArea.innerHTML = '';
    messagesArea.appendChild(welcomeScreen);

    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) chatContainer.classList.add('landing-mode');

    if (welcomeScreen) {
        welcomeScreen.style.display = 'block';
        // setTimeout ensures opacity transitions after display is set to block
        setTimeout(() => welcomeScreen.style.opacity = '1', 50);
    }

    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
    }
}

// Theme Toggle
themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.body.setAttribute('data-theme', currentTheme);

    themeToggle.innerHTML = currentTheme === 'light' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
    lucide.createIcons();
});

// Clickable Suggestions
suggestionChips.forEach(chip => {
    chip.addEventListener('click', () => {
        chatInput.value = chip.innerText;
        chatInput.dispatchEvent(new Event('input'));
        handleSendMessage();
    });
});

// Settings Dropdown Toggle
const settingsMenuBtn = document.getElementById('settingsMenuBtn');
const settingsDropdown = document.getElementById('settingsDropdown');

if (settingsMenuBtn && settingsDropdown) {
    settingsMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!settingsDropdown.contains(e.target) && e.target !== settingsMenuBtn) {
            settingsDropdown.classList.remove('active');
        }
    });

    const dropdownItems = settingsDropdown.querySelectorAll('.dropdown-item:not([onclick])');
    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            settingsDropdown.classList.remove('active');
        });
    });
}

// Profile Modal Logic
const profileDropdownItem = document.getElementById('profileDropdownItem');
const profileModalOverlay = document.getElementById('profileModalOverlay');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const displayNameInput = document.getElementById('displayNameInput');
const usernameInput = document.getElementById('usernameInput');
const globalModalAvatar = document.getElementById('modalAvatarLetter');
const sideAvatarLetter = document.getElementById('userAvatarLetter');

if (profileDropdownItem && profileModalOverlay) {
    profileDropdownItem.addEventListener('click', () => {
        // Only makes sense if logged in, but we handle logic:
        displayNameInput.value = currentUser.name !== 'User' ? currentUser.name : '';
        
        let derivedUsername = '';
        if (currentUser.email && currentUser.email.includes('@')) {
            derivedUsername = currentUser.email.split('@')[0];
        } else if (currentUser.name !== 'User') {
            derivedUsername = currentUser.name.toLowerCase().replace(/\s/g, '');
        }
        
        usernameInput.value = derivedUsername;
        globalModalAvatar.innerText = currentUser.name.charAt(0).toUpperCase();

        profileModalOverlay.classList.add('active');
        if (settingsDropdown) settingsDropdown.classList.remove('active');
    });

    cancelProfileBtn.addEventListener('click', () => {
        profileModalOverlay.classList.remove('active');
    });

    profileModalOverlay.addEventListener('click', (e) => {
        if (e.target === profileModalOverlay) {
            profileModalOverlay.classList.remove('active');
        }
    });

    saveProfileBtn.addEventListener('click', () => {
        if (displayNameInput.value.trim()) {
            currentUser.name = displayNameInput.value.trim();
            if (userNameLabel) userNameLabel.innerText = currentUser.name;
            if (sideAvatarLetter) sideAvatarLetter.innerText = currentUser.name.charAt(0).toUpperCase();
            
            const welcomeUserName = document.getElementById('welcomeUserName');
            if (welcomeUserName) {
                welcomeUserName.innerText = currentUser.name;
            }
        }
        profileModalOverlay.classList.remove('active');
    });
}

// Logout Modal Logic
const logoutModalOverlay = document.getElementById('logoutModalOverlay');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

if (logoutModalOverlay) {
    cancelLogoutBtn.addEventListener('click', () => {
        logoutModalOverlay.classList.remove('active');
    });

    logoutModalOverlay.addEventListener('click', (e) => {
        if (e.target === logoutModalOverlay) {
            logoutModalOverlay.classList.remove('active');
        }
    });

    confirmLogoutBtn.addEventListener('click', () => {
        processLogout();
        logoutModalOverlay.classList.remove('active');
    });
}

// Auth Modal Logic
const authModalOverlay = document.getElementById('authModalOverlay');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const nameInputContainer = document.getElementById('nameInputContainer');

const authNameInput = document.getElementById('authNameInput');
const authEmailInput = document.getElementById('authEmailInput');
const authPasswordInput = document.getElementById('authPasswordInput');

const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

let isSignupMode = false;

function setAuthMode(signup) {
    isSignupMode = signup;
    // Clear errors
    if(nameError) nameError.style.display = 'none';
    if(emailError) emailError.style.display = 'none';
    if(passwordError) passwordError.style.display = 'none';
    if(authNameInput) authNameInput.parentElement.style.borderColor = '';
    if(authEmailInput) authEmailInput.parentElement.style.borderColor = '';
    if(authPasswordInput) authPasswordInput.parentElement.style.borderColor = '';

    // Clear inputs
    if(authNameInput) authNameInput.value = '';
    if(authEmailInput) authEmailInput.value = '';
    if(authPasswordInput) authPasswordInput.value = '';
    
    if (signup) {
        tabSignup.style.background = 'var(--chat-bg)';
        tabSignup.style.color = 'var(--text-main)';
        tabSignup.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        
        tabLogin.style.background = 'transparent';
        tabLogin.style.color = 'var(--text-muted)';
        tabLogin.style.boxShadow = 'none';
        
        nameInputContainer.style.display = 'flex';
        authSubmitBtn.innerText = 'Sign up';
    } else {
        tabLogin.style.background = 'var(--chat-bg)';
        tabLogin.style.color = 'var(--text-main)';
        tabLogin.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        
        tabSignup.style.background = 'transparent';
        tabSignup.style.color = 'var(--text-muted)';
        tabSignup.style.boxShadow = 'none';
        
        nameInputContainer.style.display = 'none';
        authSubmitBtn.innerText = 'Log in';
    }
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pwd) {
    // Requires at least one letter, one number, min 8 characters.
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&_.\-]{8,}$/.test(pwd);
}

function showError(element, inputEl, message) {
    element.innerText = message;
    element.style.display = 'block';
    inputEl.parentElement.style.borderColor = '#ef4444';
}

function hideError(element, inputEl) {
    element.style.display = 'none';
    inputEl.parentElement.style.borderColor = '';
}

if (authModalOverlay) {
    if (tabLogin) tabLogin.addEventListener('click', () => setAuthMode(false));
    if (tabSignup) tabSignup.addEventListener('click', () => setAuthMode(true));

    if (closeAuthModalBtn) {
        closeAuthModalBtn.addEventListener('click', () => {
            authModalOverlay.classList.remove('active');
        });
    }

    authModalOverlay.addEventListener('click', (e) => {
        if (e.target === authModalOverlay) {
            authModalOverlay.classList.remove('active');
        }
    });

    if (authSubmitBtn) {
        authSubmitBtn.addEventListener('click', () => {
            const name = authNameInput.value.trim();
            const email = authEmailInput.value.trim();
            const password = authPasswordInput.value;
            
            let isValid = true;
            
            hideError(nameError, authNameInput);
            hideError(emailError, authEmailInput);
            hideError(passwordError, authPasswordInput);

            if (isSignupMode) {
                if (!name) {
                    showError(nameError, authNameInput, "Name is required");
                    isValid = false;
                }
            }

            if (!email) {
                showError(emailError, authEmailInput, "Email is required");
                isValid = false;
            } else if (!validateEmail(email)) {
                showError(emailError, authEmailInput, "Please enter a valid email address");
                isValid = false;
            }

            if (!password) {
                showError(passwordError, authPasswordInput, "Password is required");
                isValid = false;
            } else if (isSignupMode && !validatePassword(password)) {
                showError(passwordError, authPasswordInput, "Min 8 chars, must include letters and numbers");
                isValid = false;
            } else if (!isSignupMode && password.length < 1) {
                showError(passwordError, authPasswordInput, "Password is required");
                isValid = false;
            }

            if (isValid) {
                const finalName = isSignupMode ? name : email.split('@')[0];

                currentUser.name = finalName;
                currentUser.email = email;
                
                if (userNameLabel) userNameLabel.innerText = finalName;
                
                const sideAvatarLetter = document.getElementById('userAvatarLetter');
                if (sideAvatarLetter) sideAvatarLetter.innerText = finalName.charAt(0).toUpperCase();

                const welcomeUserName = document.getElementById('welcomeUserName');
                if (welcomeUserName) {
                    welcomeUserName.innerText = finalName;
                }

                body.classList.remove('is-logged-out');
                sidebar.classList.add('collapsed');
                authModalOverlay.classList.remove('active');
            }
        });
    }
}

