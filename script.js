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


// App State
let currentTheme = 'dark';
let currentUser = {
    name: 'User'
};

// --- Auth Simulation ---

function simulateLogin() {
    const name = prompt("Enter your name to sign in:");
    if (name) {
        currentUser.name = name;
        userNameLabel.innerText = name;
        userAvatarLetter.innerText = name.charAt(0).toUpperCase();

        const welcomeUserName = document.getElementById('welcomeUserName');
        if (welcomeUserName) {
            welcomeUserName.innerText = name;
        }

        body.classList.remove('is-logged-out');
        sidebar.classList.add('collapsed'); // Collapse by default when logged in
    }
}

function simulateLogout() {
    if (confirm("Are you sure you want to log out?")) {
        body.classList.add('is-logged-out');
        sidebar.classList.remove('collapsed'); // Expand by default when logged out
        resetChat();
    }
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
