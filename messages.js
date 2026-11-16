(function () {
    let sessionEmail = localStorage.getItem("athletiq:session");
    if (!sessionEmail) {
        sessionEmail = "alex@athletiq.com";
        localStorage.setItem("athletiq:session", sessionEmail);
    }

    if (!localStorage.getItem("athletiq:" + sessionEmail)) {
        localStorage.setItem("athletiq:" + sessionEmail, JSON.stringify({
            name: "Alex Morgan",
            role: "player",
            sport: "Football",
            location: "Los Angeles, USA",
            team: "AthletIQ FC",
            experience: "Professional",
            bio: "Passionate football striker exploring opportunities, matches, and coach connections on AthletIQ.",
            createdAt: new Date().toISOString()
        }));
    }

    const rawAccount = localStorage.getItem("athletiq:" + sessionEmail);
    const myAccount = rawAccount ? JSON.parse(rawAccount) : { name: "Alex Morgan", role: "player" };

    // --- DOM Elements ---
    const convoList = document.getElementById("convoList");
    const chatSearch = document.getElementById("chatSearch");
    const chatEmptyState = document.getElementById("chatEmptyState");
    const chatActivePanel = document.getElementById("chatActivePanel");
    const roomAvatar = document.getElementById("roomAvatar");
    const roomName = document.getElementById("roomName");
    const roomRole = document.getElementById("roomRole");
    const chatMessages = document.getElementById("chatMessages");
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");

    // Dropdown & Dark mode
    const settingsBtn = document.getElementById("settingsBtn");
    const dropdown = document.getElementById("settingsDropdown");
    const darkToggle = document.getElementById("darkModeToggle");
    const signOut = document.getElementById("signOut");

    let activePartnerEmail = null;

    // --- Message Helpers ---
    const MSG_KEY = "athletiq_messages";
    function loadMessages() {
        try {
            return JSON.parse(localStorage.getItem(MSG_KEY) || "[]");
        } catch (e) {
            return [];
        }
    }

    function saveMessage(from, to, text) {
        const msgs = loadMessages();
        const newMsg = {
            id: Date.now() + "-" + Math.random().toString(36).slice(2, 6),
            from: from,
            to: to,
            text: text,
            createdAt: new Date().toISOString()
        };
        msgs.push(newMsg);
        localStorage.setItem(MSG_KEY, JSON.stringify(msgs));
        return newMsg;
    }

    function getConversationHistory(otherEmail) {
        return loadMessages().filter(m =>
            (m.from === sessionEmail && m.to === otherEmail) ||
            (m.from === otherEmail && m.to === sessionEmail)
        ).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }

    function getLastMessage(otherEmail) {
        const history = getConversationHistory(otherEmail);
        return history.length > 0 ? history[history.length - 1] : null;
    }

    function timeOf(iso) {
        return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // --- Get Potential Contacts ---
    function getAllContacts() {
        const contacts = [];
        const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.indexOf("athletiq:") !== 0) continue;
            const email = key.slice("athletiq:".length);
            if (!EMAIL_RE.test(email) || email === sessionEmail) continue;

            try {
                const acc = JSON.parse(localStorage.getItem(key));
                if (acc && acc.name) {
                    contacts.push({ email: email, name: acc.name, role: acc.role, sport: acc.sport || "" });
                }
            } catch (e) {}
        }
        return contacts;
    }

    // --- Render Sidebar Conversations ---
    function renderConversations() {
        convoList.innerHTML = "";
        const query = chatSearch.value.trim().toLowerCase();
        let contacts = getAllContacts();

        if (query) {
            contacts = contacts.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.email.toLowerCase().includes(query)
            );
        }

        // Sort by most recent message, then name
        contacts.sort((a, b) => {
            const lastA = getLastMessage(a.email);
            const lastB = getLastMessage(b.email);
            if (lastA && lastB) return lastB.createdAt.localeCompare(lastA.createdAt);
            if (lastA) return -1;
            if (lastB) return 1;
            return a.name.localeCompare(b.name);
        });

        if (contacts.length === 0) {
            const empty = document.createElement("div");
            empty.className = "list-empty";
            empty.textContent = 'No contacts found. Create another account or find people in "Connect" to start chatting.';
            convoList.appendChild(empty);
            return;
        }

        contacts.forEach(contact => {
            const item = document.createElement("div");
            item.className = "convo-item" + (contact.email === activePartnerEmail ? " active" : "");

            const av = document.createElement("div");
            av.className = "convo-avatar";
            av.textContent = contact.name.charAt(0).toUpperCase();

            const info = document.createElement("div");
            info.className = "convo-info";

            const top = document.createElement("div");
            top.className = "convo-top";
            const nameEl = document.createElement("div");
            nameEl.className = "convo-name";
            nameEl.textContent = contact.name;

            const timeEl = document.createElement("div");
            timeEl.className = "convo-time";

            const lastMsg = getLastMessage(contact.email);
            if (lastMsg) timeEl.textContent = timeOf(lastMsg.createdAt);

            top.appendChild(nameEl);
            top.appendChild(timeEl);

            const lastEl = document.createElement("div");
            lastEl.className = "convo-last-msg";
            if (lastMsg) {
                lastEl.classList.add("has-msg");
                lastEl.textContent = (lastMsg.from === sessionEmail ? "You: " : "") + lastMsg.text;
            } else {
                lastEl.textContent = (contact.role ? contact.role : "Member") + (contact.sport ? " · " + contact.sport : "");
            }

            info.appendChild(top);
            info.appendChild(lastEl);

            item.appendChild(av);
            item.appendChild(info);

            item.onclick = function () {
                openChat(contact);
            };

            convoList.appendChild(item);
        });
    }

    // --- Open Chat Room ---
    function openChat(contact) {
        activePartnerEmail = contact.email;
        chatEmptyState.hidden = true;
        chatActivePanel.hidden = false;

        roomAvatar.textContent = contact.name.charAt(0).toUpperCase();
        roomName.textContent = contact.name;
        roomRole.textContent = (contact.role ? contact.role : "Member") + (contact.sport ? " · " + contact.sport : "") + " (" + contact.email + ")";

        renderMessages();
        renderConversations();
        chatInput.focus();
    }

    // --- Render Messages in Chat Room ---
    function renderMessages() {
        if (!activePartnerEmail) return;
        chatMessages.innerHTML = "";
        const history = getConversationHistory(activePartnerEmail);

        if (history.length === 0) {
            const empty = document.createElement("div");
            empty.className = "messages-empty";
            empty.textContent = "No messages yet. Say hello to start the conversation!";
            chatMessages.appendChild(empty);
            return;
        }

        history.forEach(msg => {
            const isMe = msg.from === sessionEmail;
            const bubbleWrap = document.createElement("div");
            bubbleWrap.className = "msg-bubble-wrap " + (isMe ? "sent" : "received");

            const bubble = document.createElement("div");
            bubble.className = "msg-bubble";
            bubble.textContent = msg.text;

            const time = document.createElement("div");
            time.className = "msg-time";
            time.textContent = timeOf(msg.createdAt);

            bubbleWrap.appendChild(bubble);
            bubbleWrap.appendChild(time);
            chatMessages.appendChild(bubbleWrap);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // --- Send Message ---
    chatForm.onsubmit = function (e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text || !activePartnerEmail) return;

        saveMessage(sessionEmail, activePartnerEmail, text);
        chatInput.value = "";
        renderMessages();
        renderConversations();
    };

    chatSearch.oninput = renderConversations;

    // Realtime across tabs
    window.addEventListener("storage", function (e) {
        if (e.key === MSG_KEY) {
            renderConversations();
            renderMessages();
        }
    });

    // Check if ?to=email in URL to auto-open
    const params = new URLSearchParams(window.location.search);
    const toParam = params.get("to");
    if (toParam) {
        const raw = localStorage.getItem("athletiq:" + toParam);
        if (raw) {
            try {
                const acc = JSON.parse(raw);
                openChat({ email: toParam, name: acc.name, role: acc.role, sport: acc.sport });
            } catch (e) {}
        }
    }

    // --- Dropdown & Dark Mode ---
    if (settingsBtn && dropdown) {
        settingsBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle("active");
        };
        document.addEventListener("click", function (e) {
            if (!e.target.closest(".settings-container")) {
                dropdown.classList.remove("active");
            }
        });
    }

    function setDarkMode(enabled) {
        document.body.classList.toggle("dark-mode", enabled);
        localStorage.setItem("darkMode", enabled);
        if (darkToggle) darkToggle.checked = enabled;
    }
    // Same default as the other pages: dark unless the user turned it off
    const savedTheme = localStorage.getItem("darkMode");
    setDarkMode(savedTheme === null ? true : savedTheme === "true");

    if (darkToggle) {
        darkToggle.onchange = function () {
            setDarkMode(darkToggle.checked);
        };
    }

    if (signOut) {
        signOut.onclick = function () {
            if (confirm("Are you sure you want to sign out?")) {
                localStorage.removeItem("athletiq:session");
                window.location.href = "signin.html";
            }
        };
    }

    renderConversations();
})();
