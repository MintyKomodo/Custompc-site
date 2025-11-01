/**
 * Crisp Chat Integration - Better than Tawk.to
 * Modern, reliable live chat solution
 */

class CrispChat {
    constructor() {
        this.isLoaded = false;
        this.websiteId = '04b92cf5-f7ff-4191-9f98-44433c84752b';
        this.init();
    }

    /**
     * Initialize Crisp Chat
     */
    init() {
        // Set up Crisp configuration
        window.$crisp = [];
        window.CRISP_WEBSITE_ID = this.websiteId;
        
        // Configure Crisp before loading
        this.configure();
        
        // Load Crisp script
        this.loadScript();
    }

    /**
     * Configure Crisp appearance and behavior
     */
    configure() {
        // Set brand colors
        window.$crisp.push(["set", "theme", "color", "#2196F3"]);
        
        // Set company info
        window.$crisp.push(["set", "session", "data", [
            ["company", "CustomPC.tech"],
            ["website", "https://custompc.tech"]
        ]]);
        
        // Configure welcome message
        window.$crisp.push(["set", "message", "text", [
            "👋 Welcome to CustomPC.tech! How can we help you with your custom PC build today?"
        ]]);
        
        // Set availability
        window.$crisp.push(["set", "availability", "online"]);
        
        // Configure position (bottom-right)
        window.$crisp.push(["set", "position", "right"]);
    }

    /**
     * Load Crisp script dynamically
     */
    loadScript() {
        const script = document.createElement("script");
        script.src = "https://client.crisp.chat/l.js";
        script.async = true;
        
        script.onload = () => {
            this.isLoaded = true;
            console.log('✅ Crisp Chat loaded successfully');
            this.setupEventListeners();
        };
        
        script.onerror = () => {
            console.error('❌ Failed to load Crisp Chat');
            this.showFallback();
        };
        
        document.head.appendChild(script);
    }

    /**
     * Set up event listeners for Crisp
     */
    setupEventListeners() {
        // Listen for chat events
        window.$crisp.push(["on", "chat:opened", () => {
            console.log('Chat opened');
            this.trackEvent('chat_opened');
        }]);

        window.$crisp.push(["on", "message:sent", (message) => {
            console.log('Message sent:', message);
            this.trackEvent('message_sent');
        }]);

        window.$crisp.push(["on", "message:received", (message) => {
            console.log('Message received:', message);
            this.trackEvent('message_received');
        }]);
    }

    /**
     * Track chat events for analytics
     */
    trackEvent(eventName) {
        // You can integrate with Google Analytics or other tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                event_category: 'chat',
                event_label: 'crisp_chat'
            });
        }
    }

    /**
     * Show fallback contact options if chat fails to load
     */
    showFallback() {
        const fallback = document.createElement('div');
        fallback.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #2196F3;
                color: white;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 9999;
                max-width: 300px;
            ">
                <h4 style="margin: 0 0 10px 0;">💬 Chat Unavailable</h4>
                <p style="margin: 0 0 10px 0; font-size: 14px;">
                    Our live chat is temporarily unavailable. Contact us:
                </p>
                <div style="display: flex; gap: 10px;">
                    <a href="mailto:support@custompc.tech" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 5px;
                        text-decoration: none;
                        font-size: 12px;
                    ">📧 Email</a>
                    <a href="contact.html" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        padding: 8px 12px;
                        border-radius: 5px;
                        text-decoration: none;
                        font-size: 12px;
                    ">📝 Contact Form</a>
                </div>
                <button onclick="this.parentElement.remove()" style="
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                ">×</button>
            </div>
        `;
        document.body.appendChild(fallback);
    }

    /**
     * Open chat programmatically
     */
    openChat() {
        if (this.isLoaded && window.$crisp) {
            window.$crisp.push(["do", "chat:open"]);
        }
    }

    /**
     * Close chat programmatically
     */
    closeChat() {
        if (this.isLoaded && window.$crisp) {
            window.$crisp.push(["do", "chat:close"]);
        }
    }

    /**
     * Send a message programmatically
     */
    sendMessage(message) {
        if (this.isLoaded && window.$crisp) {
            window.$crisp.push(["do", "message:send", ["text", message]]);
        }
    }

    /**
     * Set user information
     */
    setUser(userInfo) {
        if (this.isLoaded && window.$crisp) {
            window.$crisp.push(["set", "user", "email", userInfo.email]);
            window.$crisp.push(["set", "user", "nickname", userInfo.name]);
            if (userInfo.phone) {
                window.$crisp.push(["set", "user", "phone", userInfo.phone]);
            }
        }
    }

    /**
     * Show/hide chat widget
     */
    setVisibility(visible) {
        if (this.isLoaded && window.$crisp) {
            if (visible) {
                window.$crisp.push(["do", "chat:show"]);
            } else {
                window.$crisp.push(["do", "chat:hide"]);
            }
        }
    }
}

// Initialize Crisp Chat when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Only load on pages where chat is needed
    const chatPages = ['index.html', 'builds.html', 'about.html', 'contact.html', 'payments.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (chatPages.includes(currentPage) || window.location.pathname === '/') {
        window.crispChat = new CrispChat();
        console.log('🚀 Crisp Chat initialized for', currentPage);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrispChat;
}