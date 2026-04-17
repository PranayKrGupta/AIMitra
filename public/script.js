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
let currentUser = { name: 'User', id: null };
let authToken = localStorage.getItem('token');
let currentConversationId = null;

// Initialization on load
document.addEventListener('DOMContentLoaded', () => {
    if (authToken) {
        fetchProfile();
        fetchChatHistory();
    }
});

// --- Auth Architecture ---

async function fetchProfile() {
    try {
        const res = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            const user = await res.json();
            currentUser.name = user.displayName || user.fullName;
            currentUser.id = user._id;
            
            // Update UI
            body.classList.remove('is-logged-out');
            sidebar.classList.add('collapsed');
            if (userNameLabel) userNameLabel.innerText = currentUser.name;
            const sideAvatarLetter = document.getElementById('userAvatarLetter');
            if (sideAvatarLetter) sideAvatarLetter.innerText = currentUser.name.charAt(0).toUpperCase();
            
            const welcomeUserName = document.getElementById('welcomeUserName');
            if (welcomeUserName) {
                welcomeUserName.innerText = currentUser.name;
            }
        } else {
            // Token likely expired
            processLogout();
        }
    } catch (e) {
        console.error("Profile fetch failed", e);
    }
}

async function fetchChatHistory() {
    try {
        const res = await fetch('/api/chat/history', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            const history = await res.json();
            const chatHistory = document.getElementById('chatHistory');
            if (chatHistory) {
                chatHistory.innerHTML = ''; // Clear default mock chats
                history.forEach(convo => {
                    const li = document.createElement('li');
                    li.className = 'history-item';
                    li.setAttribute('data-chat-id', convo._id);
                    li.innerHTML = `<i data-lucide="message-square"></i><span>${convo.title}</span>`;
                    li.addEventListener('click', () => loadConversation(convo._id, convo.title, li));
                    chatHistory.appendChild(li);
                });
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }
    } catch (e) {
        console.error("History fetch failed", e);
    }
}

async function loadConversation(id, title, liElement) {
    currentConversationId = id;
    
    // UI Updates
    const items = document.querySelectorAll('.history-item');
    items.forEach(i => i.classList.remove('active'));
    if (liElement) liElement.classList.add('active');
    
    messagesArea.innerHTML = '';
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) chatContainer.classList.remove('landing-mode');
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (window.innerWidth <= 768) sidebar.classList.remove('active');

    // Fetch messages
    try {
        const res = await fetch(`/api/chat/${id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
            const messages = await res.json();
            messages.forEach(msg => {
                addMessage(msg.role, msg.content);
            });
        }
    } catch (e) {
        console.error("Failed to load conversation", e);
    }
}

function simulateLogin() {
    const authModalOverlay = document.getElementById('authModalOverlay');
    if (authModalOverlay) {
        if (typeof setAuthMode === 'function') setAuthMode(false);
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
    localStorage.removeItem('token');
    authToken = null;
    currentConversationId = null;
    currentUser = { name: 'User', id: null };
    body.classList.add('is-logged-out');
    sidebar.classList.remove('collapsed');
    document.getElementById('chatHistory').innerHTML = ''; // clear history on logout
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
        
        if (e.error === 'network') {
            alert('Voice Input Failed: Your browser cannot connect to its translation servers. If you are using Brave, Opera, or a strict ad-blocker, try using Google Chrome or Edge. Also ensure your internet connection is active.');
        } else if (e.error !== 'no-speech' && e.error !== 'not-allowed') {
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
        // We no longer mock addChatToHistory here.
        // It will be handled when /api/chat returns a conversationId.
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

async function simulateBotResponse(userMsg) {
    // Typing indicator
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

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
            body: JSON.stringify({ prompt: userMsg, conversationId: currentConversationId })
        });
        
        const data = await response.json();
        
        messagesArea.removeChild(loadingRow);

        if (response.ok) {
            // If new chat, the backend generated an ID for us
            if (!currentConversationId && data.conversationId) {
                currentConversationId = data.conversationId;
                // Refresh history so the new chat shows up in the sidebar
                if(authToken) fetchChatHistory(); 
            }
            addMessage('bot', data.response);
        } else {
            console.error('API Error:', data);
            addMessage('bot', "I'm sorry, I encountered an error connecting to my servers.");
        }
    } catch (error) {
        messagesArea.removeChild(loadingRow);
        console.error('Fetch error:', error);
        addMessage('bot', "Network error. Please make sure the backend server is running.");
    }
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
    currentConversationId = null;
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

    const dropdownItems = settingsDropdown.querySelectorAll('.dropdown-item:not([onclick]):not([id="profileDropdownItem"]):not([id="feedbackDropdownItem"]):not([id="helpDropdownItem"])');
    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            settingsDropdown.classList.remove('active');
        });
    });

    const helpDropdownItem = document.getElementById('helpDropdownItem');
    if (helpDropdownItem) {
        helpDropdownItem.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme') || 'dark';
            window.open(`help.html?theme=${theme}`, '_blank');
            settingsDropdown.classList.remove('active');
        });
    }
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

    saveProfileBtn.addEventListener('click', async () => {
        const newName = displayNameInput.value.trim();
        const newUsername = usernameInput.value.trim();
        
        saveProfileBtn.disabled = true;
        saveProfileBtn.innerText = 'Saving...';
        
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ fullName: newName, username: newUsername })
            });
            
            if (res.ok) {
                const user = await res.json();
                currentUser.name = user.fullName;
                
                if (userNameLabel) userNameLabel.innerText = currentUser.name;
                if (sideAvatarLetter) sideAvatarLetter.innerText = currentUser.name.charAt(0).toUpperCase();
                
                const welcomeUserName = document.getElementById('welcomeUserName');
                if (welcomeUserName) {
                    welcomeUserName.innerText = currentUser.name;
                }
                
                profileModalOverlay.classList.remove('active');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to preserve profile details');
            }
        } catch (error) {
            console.error(error);
            alert('A network error occurred.');
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerText = 'Save';
        }
    });

    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            const confirmDelete = confirm('Are you sure you want to permanently delete your account? This action cannot be undone and will erase all your chat history.');
            if (!confirmDelete) return;

            deleteAccountBtn.disabled = true;
            deleteAccountBtn.innerText = 'Deleting...';

            try {
                const res = await fetch('/api/user/profile', {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (res.ok) {
                    alert('Your account has been successfully deleted.');
                    profileModalOverlay.classList.remove('active');
                    processLogout(); 
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to delete account');
                }
            } catch (error) {
                console.error('Delete error', error);
                alert('A network error occurred while attempting to delete your account.');
            } finally {
                deleteAccountBtn.disabled = false;
                deleteAccountBtn.innerText = 'Delete Account';
            }
        });
    }
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
        tabSignup.style.background = 'var(--accent-gradient)';
        tabSignup.style.color = 'white';
        tabSignup.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)';
        
        tabLogin.style.background = 'transparent';
        tabLogin.style.color = 'var(--text-muted)';
        tabLogin.style.boxShadow = 'none';
        
        nameInputContainer.style.display = 'flex';
        authSubmitBtn.innerText = 'Sign up';
    } else {
        tabLogin.style.background = 'var(--accent-gradient)';
        tabLogin.style.color = 'white';
        tabLogin.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)';
        
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
                const endpoint = isSignupMode ? '/api/auth/signup' : '/api/auth/login';
                const payload = isSignupMode 
                    ? { fullName: name, email, password }
                    : { email, password };
                
                authSubmitBtn.disabled = true;
                authSubmitBtn.innerText = 'Loading...';
                
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, body: data })))
                .then(res => {
                    authSubmitBtn.disabled = false;
                    authSubmitBtn.innerText = isSignupMode ? 'Sign up' : 'Log in';
                    
                    if (res.ok) {
                        // Success!
                        authToken = res.body.token;
                        localStorage.setItem('token', authToken);
                        
                        currentUser.name = res.body.user.displayName || res.body.user.fullName;
                        currentUser.id = res.body.user.id;
                        
                        if (userNameLabel) userNameLabel.innerText = currentUser.name;
                        const sideAvatarLetter = document.getElementById('userAvatarLetter');
                        if (sideAvatarLetter) sideAvatarLetter.innerText = currentUser.name.charAt(0).toUpperCase();

                        const welcomeUserName = document.getElementById('welcomeUserName');
                        if (welcomeUserName) {
                            welcomeUserName.innerText = currentUser.name;
                        }

                        body.classList.remove('is-logged-out');
                        sidebar.classList.add('collapsed');
                        authModalOverlay.classList.remove('active');
                        
                        fetchChatHistory(); // Load their saved chats!
                    } else {
                        // Error handles
                        showError(emailError, authEmailInput, res.body.error || 'Authentication failed');
                    }
                })
                .catch(err => {
                    console.error('Auth error', err);
                    authSubmitBtn.disabled = false;
                    authSubmitBtn.innerText = isSignupMode ? 'Sign up' : 'Log in';
                    showError(emailError, authEmailInput, 'Server connection error');
                });
            }
        });
    }
}

// --- Feedback Modal Logic ---
const feedbackDropdownItem = document.getElementById('feedbackDropdownItem');
const feedbackModalOverlay = document.getElementById('feedbackModalOverlay');
const feedbackTextarea = document.getElementById('feedbackTextarea');
const feedbackSendBtn = document.getElementById('feedbackSendBtn');
const closeFeedbackModalBtn = document.getElementById('closeFeedbackModalBtn');

if (feedbackDropdownItem && feedbackModalOverlay) {
    feedbackDropdownItem.addEventListener('click', () => {
        feedbackModalOverlay.classList.add('active');
        if (settingsDropdown) settingsDropdown.classList.remove('active');
        // Reset state
        feedbackTextarea.value = '';
        feedbackSendBtn.disabled = true;
        setTimeout(() => feedbackTextarea.focus(), 300);
    });

    closeFeedbackModalBtn.addEventListener('click', () => {
        feedbackModalOverlay.classList.remove('active');
    });

    feedbackModalOverlay.addEventListener('click', (e) => {
        if (e.target === feedbackModalOverlay) {
            feedbackModalOverlay.classList.remove('active');
        }
    });

    feedbackTextarea.addEventListener('input', () => {
        feedbackSendBtn.disabled = feedbackTextarea.value.trim() === '';
    });

    feedbackSendBtn.addEventListener('click', () => {
        const feedback = feedbackTextarea.value.trim();
        if (feedback) {
            // Here you would typically send the feedback to a server
            console.log('Feedback submitted:', feedback);
            
            // Show success state (optional but good for UX)
            feedbackSendBtn.innerText = 'Sent!';
            feedbackSendBtn.disabled = true;
            
            setTimeout(() => {
                feedbackModalOverlay.classList.remove('active');
                // Reset button text after modal closes
                setTimeout(() => {
                    feedbackSendBtn.innerText = 'Send';
                    feedbackTextarea.value = '';
                }, 300);
            }, 1000);
        }
    });
}

// --- About Page Logic ---
const aboutDropdownItem = document.getElementById('aboutDropdownItem');
if (aboutDropdownItem) {
    aboutDropdownItem.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') || 'dark';
        window.open(`about.html?theme=${theme}`, '_blank');
        if (settingsDropdown) settingsDropdown.classList.remove('active');
    });
}




