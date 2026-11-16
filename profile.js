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
            position: "Center Forward / Striker",
            height: "5'11\" (180 cm)",
            weight: "75 kg",
            dominant: "Right Foot",
            location: "Los Angeles, USA",
            team: "AthletIQ FC",
            experience: "Professional",
            bio: "Passionate football striker focused on clinical finishing, tactical discipline, and exploring professional trial invitations and club opportunities.",
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
    const profPosition = document.getElementById("profPosition");
    const profLocation = document.getElementById("profLocation");
    const profBio = document.getElementById("profBio");
    const profHeight = document.getElementById("profHeight");
    const profWeight = document.getElementById("profWeight");
    const profDominant = document.getElementById("profDominant");
    const profTeam = document.getElementById("profTeam");
    const profEmail = document.getElementById("profEmail");
    const statPostsCount = document.getElementById("statPostsCount");
    const statConnectionsCount = document.getElementById("statConnectionsCount");
    const statMemberSince = document.getElementById("statMemberSince");
    const myPostsList = document.getElementById("myPostsList");

    // Modal elements
    const editModal = document.getElementById("editModal");
    const btnEditProfile = document.getElementById("btnEditProfile");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const btnSaveProfile = document.getElementById("btnSaveProfile");
    const btnShareProfile = document.getElementById("btnShareProfile");

    const editName = document.getElementById("editName");
    const editRole = document.getElementById("editRole");
    const editSport = document.getElementById("editSport");
    const editPosition = document.getElementById("editPosition");
    const editHeight = document.getElementById("editHeight");
    const editWeight = document.getElementById("editWeight");
    const editDominant = document.getElementById("editDominant");
    const editLocation = document.getElementById("editLocation");
    const editTeam = document.getElementById("editTeam");
    const editBio = document.getElementById("editBio");

    // Settings elements
    const settingsBtn = document.getElementById("settingsBtn");
    const dropdown = document.getElementById("settingsDropdown");
    const darkToggle = document.getElementById("darkModeToggle");
    const signOut = document.getElementById("signOut");

    // --- Tab Switching ---
    const tabButtons = document.querySelectorAll(".profile-tab-btn");
    const tabPanels = {
        posts: document.getElementById("tabContentPosts"),
        accolades: document.getElementById("tabContentAccolades"),
        contact: document.getElementById("tabContentContact")
    };

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-tab");
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            Object.keys(tabPanels).forEach(key => {
                if (tabPanels[key]) {
                    tabPanels[key].hidden = key !== target;
                    tabPanels[key].classList.toggle("active", key === target);
                }
            });
        });
    });

    // --- Share Profile ---
    if (btnShareProfile) {
        btnShareProfile.addEventListener("click", () => {
            navigator.clipboard.writeText(window.location.href);
            alert("Profile link copied to clipboard!");
        });
    }

    // --- Render Profile Details ---
    function renderProfile() {
        profAvatar.textContent = (account.name || "A").charAt(0).toUpperCase();
        profName.textContent = account.name || "Athlete";
        profRole.textContent = account.role || "Player";
        profRole.className = "badge-role " + (account.role || "player");
        profSport.textContent = account.sport || "Football";
        profPosition.textContent = account.position || "Striker / Forward";
        profLocation.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${account.location || "Location not set"}`;
        profBio.textContent = account.bio || "No bio added yet. Click 'Edit Profile' to customize your athletic portfolio.";

        if (profHeight) profHeight.textContent = account.height || "5'11\" (180 cm)";
        if (profWeight) profWeight.textContent = account.weight || "75 kg";
        if (profDominant) profDominant.textContent = account.dominant || "Right";
        if (profTeam) profTeam.textContent = account.team || "Independent / Free Agent";
        if (profEmail) profEmail.textContent = sessionEmail;

        if (account.createdAt && statMemberSince) {
            statMemberSince.textContent = new Date(account.createdAt).getFullYear();
        }

        // Connections count
        if (statConnectionsCount) {
            try {
                const requests = JSON.parse(localStorage.getItem("athletiq_requests") || "[]");
                const count = requests.filter(r => (r.from === sessionEmail || r.to === sessionEmail) && r.status === "accepted").length;
                statConnectionsCount.textContent = count;
            } catch (e) {
                statConnectionsCount.textContent = "0";
            }
        }
    }

    // --- Render My Posts ---
    function renderMyPosts() {
        if (!myPostsList) return;
        myPostsList.innerHTML = "";
        let posts = [];
        try {
            posts = JSON.parse(localStorage.getItem("athletiq:posts") || "[]");
        } catch (e) { posts = []; }

        const myPosts = posts.filter(p => p.email === sessionEmail);
        if (statPostsCount) statPostsCount.textContent = myPosts.length;

        if (myPosts.length === 0) {
            myPostsList.innerHTML = `
                <div class="card-aesthetic" style="text-align:center; padding: 40px 20px; color: var(--text-muted);">
                    <i class="fa-solid fa-film" style="font-size: 36px; color: var(--green-primary); margin-bottom: 12px; display:block;"></i>
                    <h4 style="color:var(--text-main); margin-bottom:6px;">No highlights published yet</h4>
                    <p style="font-size:13px; margin-bottom: 16px;">Post match clips, drills, and training milestones to attract scout interest.</p>
                    <a href="post.html" class="btn-primary" style="font-size:13px; padding: 8px 20px;">Upload Highlight</a>
                </div>
            `;
            return;
        }

        myPosts.slice().reverse().forEach(post => {
            const card = document.createElement("div");
            card.className = "post-card";
            card.style.position = "relative";

            const delBtn = document.createElement("button");
            delBtn.className = "btn-outline";
            delBtn.style.cssText = "position:absolute; top:18px; right:18px; padding:4px 10px; font-size:11px; border-color:transparent; color:#ef4444;";
            delBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
            delBtn.onclick = () => {
                if (confirm("Delete this highlight post?")) {
                    const updated = posts.filter(p => p.id !== post.id);
                    localStorage.setItem("athletiq:posts", JSON.stringify(updated));
                    renderMyPosts();
                }
            };
            card.appendChild(delBtn);

            const header = document.createElement("div");
            header.className = "post-card-header";
            header.innerHTML = `
                <div class="post-author-wrap">
                    <div class="post-avatar">${(account.name || 'A').charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="post-author-name">${account.name}</div>
                        <div class="post-author-meta">
                            <span class="badge-sport">${post.sport || 'Highlight'}</span>
                            <span>•</span>
                            <span>${new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            `;
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
    if (btnEditProfile && editModal) {
        btnEditProfile.onclick = () => {
            editName.value = account.name || "";
            editRole.value = account.role || "player";
            editSport.value = account.sport || "Football";
            editPosition.value = account.position || "Striker / CF";
            editHeight.value = account.height || "5'11\" (180 cm)";
            editWeight.value = account.weight || "75 kg";
            editDominant.value = account.dominant || "Right Foot";
            editTeam.value = account.team || "AthletIQ FC";
            editLocation.value = account.location || "Los Angeles, USA";
            editBio.value = account.bio || "";
            editModal.hidden = false;
        };

        if (closeModalBtn) closeModalBtn.onclick = () => { editModal.hidden = true; };
        window.addEventListener("click", (e) => {
            if (e.target === editModal) editModal.hidden = true;
        });

        if (btnSaveProfile) {
            btnSaveProfile.onclick = () => {
                const name = editName.value.trim();
                if (name.length < 2) {
                    alert("Please enter a valid name.");
                    return;
                }

                account.name = name;
                account.role = editRole.value;
                account.sport = editSport.value.trim();
                account.position = editPosition.value.trim();
                account.height = editHeight.value.trim();
                account.weight = editWeight.value.trim();
                account.dominant = editDominant.value.trim();
                account.team = editTeam.value.trim();
                account.location = editLocation.value.trim();
                account.bio = editBio.value.trim();

                localStorage.setItem("athletiq:" + sessionEmail, JSON.stringify(account));
                editModal.hidden = true;
                renderProfile();
            };
        }
    }

    // --- Dropdown & Settings ---
    if (settingsBtn && dropdown) {
        settingsBtn.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("active");
        };
        document.addEventListener("click", (e) => {
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
    const savedTheme = localStorage.getItem("darkMode");
    setDarkMode(savedTheme === null ? true : savedTheme === "true");

    if (darkToggle) {
        darkToggle.onchange = () => { setDarkMode(darkToggle.checked); };
    }

    if (signOut) {
        signOut.onclick = () => {
            if (confirm("Sign out of AthletIQ?")) {
                localStorage.removeItem("athletiq:session");
                window.location.href = "signin.html";
            }
        };
    }

    renderProfile();
    renderMyPosts();
})();
