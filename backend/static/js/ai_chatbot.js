class AIChatbot {
    constructor(options = {}) {
        this.options = {
            containerId: 'ai-chatbot-container',
            currentStep: '',
            portfolioId: '',
            ...options
        };

        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createChatbotUI();
        this.bindEvents();
        this.addWelcomeMessage();
    }

    createChatbotUI() {
        const container = document.createElement('div');
        container.id = this.options.containerId;
        container.className = 'ai-chatbot-container';
        container.innerHTML = `
            <div class="ai-chatbot-toggle" id="ai-chatbot-toggle">
                <i class="fas fa-robot"></i>
                <span>AI Assistant</span>
            </div>
            <div class="ai-chatbot-window" id="ai-chatbot-window" style="display: none;">
                <div class="ai-chatbot-header">
                    <h4><i class="fas fa-robot"></i> Portfolio AI Assistant</h4>
                    <button class="ai-chatbot-close" id="ai-chatbot-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="ai-chatbot-messages" id="ai-chatbot-messages"></div>
                <div class="ai-chatbot-input-container">
                    <input type="text" id="ai-chatbot-input" placeholder="Ask me anything about your portfolio..." />
                    <button id="ai-chatbot-send">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="ai-chatbot-suggestions" id="ai-chatbot-suggestions"></div>
            </div>
        `;

        // Add styles
        const styles = `
            <style>
                .ai-chatbot-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .ai-chatbot-toggle {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                }
                
                .ai-chatbot-toggle:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                }
                
                .ai-chatbot-window {
                    position: absolute;
                    bottom: 70px;
                    right: 0;
                    width: 350px;
                    height: 500px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .ai-chatbot-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .ai-chatbot-header h4 {
                    margin: 0;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .ai-chatbot-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.3s ease;
                }
                
                .ai-chatbot-close:hover {
                    background: rgba(255,255,255,0.2);
                }
                
                .ai-chatbot-messages {
                    flex: 1;
                    padding: 15px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .ai-message {
                    background: #f8f9fa;
                    padding: 10px 15px;
                    border-radius: 15px;
                    max-width: 80%;
                    align-self: flex-start;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .user-message {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 15px;
                    max-width: 80%;
                    align-self: flex-end;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .ai-chatbot-input-container {
                    padding: 15px;
                    display: flex;
                    gap: 10px;
                    border-top: 1px solid #eee;
                }
                
                .ai-chatbot-input-container input {
                    flex: 1;
                    padding: 10px 15px;
                    border: 1px solid #ddd;
                    border-radius: 20px;
                    outline: none;
                    font-size: 14px;
                }
                
                .ai-chatbot-input-container input:focus {
                    border-color: #667eea;
                }
                
                .ai-chatbot-input-container button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.3s ease;
                }
                
                .ai-chatbot-input-container button:hover {
                    transform: scale(1.1);
                }
                
                .ai-chatbot-suggestions {
                    padding: 10px 15px;
                    border-top: 1px solid #eee;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                }
                
                .suggestion-chip {
                    background: #f0f0f0;
                    border: 1px solid #ddd;
                    border-radius: 15px;
                    padding: 5px 12px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .suggestion-chip:hover {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }
                
                .typing-indicator {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 10px 15px;
                    color: #666;
                    font-size: 14px;
                }
                
                .typing-dots {
                    display: flex;
                    gap: 3px;
                }
                
                .typing-dot {
                    width: 6px;
                    height: 6px;
                    background: #999;
                    border-radius: 50%;
                    animation: typing 1.4s infinite ease-in-out;
                }
                
                .typing-dot:nth-child(1) { animation-delay: -0.32s; }
                .typing-dot:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes typing {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
        document.body.appendChild(container);
    }

    bindEvents() {
        const toggle = document.getElementById('ai-chatbot-toggle');
        const close = document.getElementById('ai-chatbot-close');
        const input = document.getElementById('ai-chatbot-input');
        const send = document.getElementById('ai-chatbot-send');

        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.closeChat());

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        send.addEventListener('click', () => this.sendMessage());
    }

    toggleChat() {
        const window = document.getElementById('ai-chatbot-window');
        this.isOpen = !this.isOpen;
        window.style.display = this.isOpen ? 'flex' : 'none';

        if (this.isOpen) {
            document.getElementById('ai-chatbot-input').focus();
        }
    }

    closeChat() {
        this.isOpen = false;
        document.getElementById('ai-chatbot-window').style.display = 'none';
    }

    addWelcomeMessage() {
        this.addMessage("Hi! I'm your Portfolio AI Assistant. I can help you with portfolio creation, content suggestions, and answer any questions you have. What would you like to know?", 'ai');
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('ai-chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'ai' ? 'ai-message' : 'user-message';
        messageDiv.textContent = text;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.messages.push({ text, sender });
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('ai-chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <span>AI is typing</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    sendMessage() {
        const input = document.getElementById('ai-chatbot-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Send to backend
        fetch('/ai-chatbot/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({
                message: message,
                current_step: this.options.currentStep,
                portfolio_id: this.options.portfolioId
            })
        })
            .then(response => response.json())
            .then(data => {
                this.hideTypingIndicator();

                // Add AI response
                this.addMessage(data.response, 'ai');

                // Show suggestions
                if (data.suggestions) {
                    this.showSuggestions(data.suggestions);
                }
            })
            .catch(error => {
                this.hideTypingIndicator();
                this.addMessage("Sorry, I'm having trouble connecting right now. Please try again later.", 'ai');
            });
    }

    showSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('ai-chatbot-suggestions');
        suggestionsContainer.innerHTML = '';

        suggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            chip.addEventListener('click', () => {
                document.getElementById('ai-chatbot-input').value = suggestion;
                this.sendMessage();
            });
            suggestionsContainer.appendChild(chip);
        });
    }
}

// AI Chatbot auto-initialization temporarily disabled
/*
// Auto-initialize chatbot if on portfolio creation pages
document.addEventListener('DOMContentLoaded', function () {
    console.log('🤖 AI Chatbot: Checking if should initialize...');

    const currentStep = document.body.getAttribute('data-current-step') || '';
    const portfolioId = window.location.pathname.split('/').filter(Boolean).pop() || '';
    const currentPath = window.location.pathname;

    console.log('🤖 AI Chatbot: Current step:', currentStep);
    console.log('🤖 AI Chatbot: Portfolio ID:', portfolioId);
    console.log('🤖 AI Chatbot: Current path:', currentPath);

    // Check if we're on a portfolio creation page
    const shouldInitialize = currentStep ||
        currentPath.includes('/create/') ||
        currentPath.includes('/step-') ||
        currentPath.includes('/summary/') ||
        currentPath.includes('/projects/') ||
        currentPath.includes('/education/') ||
        currentPath.includes('/experience/') ||
        currentPath.includes('/skills/') ||
        currentPath.includes('/certifications/') ||
        currentPath.includes('/languages/') ||
        currentPath.includes('/hobbies/') ||
        currentPath.includes('/extras/') ||
        currentPath.includes('/personal_info');

    console.log('🤖 AI Chatbot: Should initialize:', shouldInitialize);

    if (shouldInitialize) {
        console.log('🤖 AI Chatbot: Initializing...');
        try {
            new AIChatbot({
                currentStep: currentStep,
                portfolioId: portfolioId
            });
            console.log('🤖 AI Chatbot: Successfully initialized!');
        } catch (error) {
            console.error('🤖 AI Chatbot: Error initializing:', error);
        }
    } else {
        console.log('🤖 AI Chatbot: Not on portfolio creation page, skipping initialization');
    }
});
*/
