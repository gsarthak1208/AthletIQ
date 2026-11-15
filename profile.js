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

    const raw = localStorage.getItem("athletiq:" + sessionEmail);
    const account = raw ? JSON.parse(raw) : { name: "Alex Morgan", role: "player" };

    // --- DOM Elements ---
    const profAvatar = document.getElementById("profAvatar");
    const profName = document.getElementById("profName");
    const profRole = document.getElementById("profRole");
    const profSport = document.getElementById("profSport");
    const profLocation = document.getElementById("profLocation");
    const profBio = document.getElementById("profBio");
    const profEmail = document.getElementById("profEmail");
    const profTeam = document.getElementById("profTeam");
    const profExp = document.getElementById("profExp");
    const statPostsCount = document.getElementById("statPostsCount");
    const statConnectionsCount = document.getElementById("statConnectionsCount");
    const statMemberSince = document.getElementById("statMemberSince");
    const myPostsList = document.getElementById("myPostsList");

    // Modal elements
    const editModal = document.getElementById("editModal");
    const btnEditProfile = document.getElementById("btnEditProfile");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const btnSaveProfile = document.getElementById("btnSaveProfile");
    const editMsg = document.getElementById("editMsg");

    const editName = document.getElementById("editName");
    const editRole = document.getElementById("editRole");
    const editSport = document.getElementById("editSport");
    const editLocation = document.getElementById("editLocation");
    const editTeam = document.getElementById("editTeam");
    const editExp = document.getElementById("editExp");
    const editBio = document.getElementById("editBio");

    // Settings & Dark mode
    const settingsBtn = document.getElementById("settingsBtn");
    const dropdown = document.getElementById("settingsDropdown");
    const darkToggle = document.getElementById("darkModeToggle");
    const signOut = document.getElementById("signOut");

    // --- Render Profile ---
    function renderProfile() {
        profAvatar.textContent = (account.name || "A").charAt(0).toUpperCase();
        profName.textContent = account.name || "Athlete";
        profRole.textContent = account.role || "Player";
        profSport.textContent = account.sport || "All Sports";
        profLocation.innerHTML = '<i class="fa-solid fa-location-dot"></i> ' + (account.location || "Location not set");
        profBio.textContent = account.bio || "No bio added yet. Tell the sports community about your athletic career!";
        profEmail.textContent = sessionEmail;
        profTeam.textContent = account.team || "Independent / Free Agent";
        profExp.textContent = account.experience || "Amateur / Athlete";

        if (account.createdAt) {
            statMemberSince.textContent = new Date(account.createdAt).getFullYear();
        }

        // Stats: connections
        if (typeof Connections !== "undefined") {
            try {
                const requests = JSON.parse(localStorage.getItem("athletiq_requests") || "[]");
                const count = requests.filter(r => (r.from === sessionEmail || r.to === sessionEmail) && r.status === "accepted").length;
                statConnectionsCount.textContent = count;
            } catch (e) {
                statConnectionsCount.textContent = 0;
            }
        }
    }

    // --- Render My Posts ---
    function renderMyPosts() {
        myPostsList.innerHTML = "";
        let posts = [];
        try {
            posts = JSON.parse(localStorage.getItem("athletiq:posts") || "[]");
        } catch (e) { posts = []; }

        const myPosts = posts.filter(p => p.email === sessionEmail);
        statPostsCount.textContent = myPosts.length;

        if (myPosts.length === 0) {
            myPostsList.innerHTML = '<div class="no-posts-card"><p>You haven\'t posted anything yet.</p><a href="post.html" class="action-btn" style="display:inline-block;margin-top:10px;">Create your first post</a></div>';
            return;
        }

        myPosts.slice().reverse().forEach(post => {
            const card = document.createElement("div");
            card.className = "post-card";

            const delBtn = document.createElement("button");
            delBtn.className = "btn-post-del";
            delBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
            delBtn.onclick = function () {
                if (confirm("Delete this post?")) {
                    const updated = posts.filter(p => p.id !== post.id);
                    localStorage.setItem("athletiq:posts", JSON.stringify(updated));
                    renderMyPosts();
                }
            };
            card.appendChild(delBtn);

            const header = document.createElement("div");
            header.className = "post-card-header";
            const av = document.createElement("div");
            av.className = "post-avatar";
            av.textContent = (account.name || "A").charAt(0).toUpperCase();

            const info = document.createElement("div");
            info.className = "post-author-info";
            const name = document.createElement("div");
            name.className = "post-author-name";
            name.textContent = account.name;
            const meta = document.createElement("div");
            meta.className = "post-author-meta";
            meta.textContent = (post.sport ? post.sport + " · " : "") + new Date(post.createdAt).toLocaleDateString();

            info.appendChild(name);
            info.appendChild(meta);
            header.appendChild(av);
            header.appendChild(info);
            card.appendChild(header);

            if (post.text) {
                const text = document.createElement("p");
                text.className = "post-card-text";
                text.textContent = post.text;
                card.appendChild(text);
            }

            myPostsList.appendChild(card);
        });
    }

    // --- Modal Logic ---
    btnEditProfile.onclick = function () {
        editName.value = account.name || "";
        editRole.value = account.role || "player";
        editSport.value = account.sport || "";
        editLocation.value = account.location || "";
        editTeam.value = account.team || "";
        editExp.value = account.experience || "";
        editBio.value = account.bio || "";
        editMsg.hidden = true;
        editModal.hidden = false;
    };

    closeModalBtn.onclick = function () {
        editModal.hidden = true;
    };

    window.onclick = function (e) {
        if (e.target === editModal) editModal.hidden = true;
    };

    btnSaveProfile.onclick = function () {
        const name = editName.value.trim();
        if (name.length < 2) {
            editMsg.className = "msg bad";
            editMsg.textContent = "Please enter a valid name.";
            editMsg.hidden = false;
            return;
        }

        account.name = name;
        account.role = editRole.value;
        account.sport = editSport.value.trim();
        account.location = editLocation.value.trim();
        account.team = editTeam.value.trim();
        account.experience = editExp.value.trim();
        account.bio = editBio.value.trim();

        localStorage.setItem("athletiq:" + sessionEmail, JSON.stringify(account));
        editModal.hidden = true;
        renderProfile();
    };

    // --- Dropdown & Settings ---
    if (settingsBtn && dropdown) {
        settingsBtn.onclick = function (e) {
            e.preventDefault();
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
    setDarkMode(localStorage.getItem("darkMode") === "true");

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

    renderProfile();
    renderMyPosts();
})();
