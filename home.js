// --- Authentication & Session Check ---
let sessionEmail = localStorage.getItem("athletiq:session");
if (!sessionEmail) {
    sessionEmail = "alex@athletiq.com";
    localStorage.setItem("athletiq:session", sessionEmail);
}

// Ensure demo user exists
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

// Seed sample community posts if feed is empty
if (!localStorage.getItem("athletiq:posts")) {
    localStorage.setItem("athletiq:posts", JSON.stringify([
        {
            id: 1001,
            email: "marcus@athletiq.com",
            author: "Marcus Vance",
            role: "player",
            sport: "Football",
            text: "Great training session today! Focusing on agility drills and quick sprint transitions. Looking forward to our showcase match this weekend! ⚽🔥",
            mediaType: "",
            likes: 14,
            likedBy: [],
            comments: [
                { author: "Coach Davis", text: "Keep that intensity up, Marcus!", createdAt: new Date().toISOString() }
            ],
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
            id: 1002,
            email: "coach.davis@athletiq.com",
            author: "Coach Davis",
            role: "coach",
            sport: "Basketball",
            text: "Open basketball trials and high-performance development clinics are starting this Thursday. Open to all aspiring college players! Send me a direct message if interested. 🏀🏆",
            mediaType: "",
            likes: 29,
            likedBy: [],
            comments: [],
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
    ]));
}

// Seed sample users for Connect and Messages if needed
if (!localStorage.getItem("athletiq:marcus@athletiq.com")) {
    localStorage.setItem("athletiq:marcus@athletiq.com", JSON.stringify({
        name: "Marcus Vance",
        role: "player",
        sport: "Football",
        location: "London, UK",
        team: "North FC",
        experience: "Semi-Pro",
        bio: "Speedy winger looking for club opportunities.",
        createdAt: new Date().toISOString()
    }));
}
if (!localStorage.getItem("athletiq:coach.davis@athletiq.com")) {
    localStorage.setItem("athletiq:coach.davis@athletiq.com", JSON.stringify({
        name: "Coach Davis",
        role: "coach",
        sport: "Basketball",
        location: "Chicago, USA",
        team: "Windy City Academy",
        experience: "12 years coaching",
        bio: "Head coach helping youth athletes reach collegiate levels.",
        createdAt: new Date().toISOString()
    }));
}

const rawAccount = localStorage.getItem("athletiq:" + sessionEmail);
const currentAccount = rawAccount ? JSON.parse(rawAccount) : { name: "Alex Morgan", role: "player" };

initHomePage();

function initHomePage() {
    // --- Elements ---
    const homeAvatar = document.getElementById("homeAvatar");
    const creatorAvatar = document.getElementById("creatorAvatar");
    const homeTitle = document.getElementById("homeWelcomeTitle");
    const homeSub = document.getElementById("homeWelcomeSub");
    const homeRoleBadge = document.getElementById("homeRoleBadge");
    const statPosts = document.getElementById("statPosts");
    const statConnections = document.getElementById("statConnections");
    const notifCount = document.getElementById("notif-count");
    const homeFeed = document.getElementById("homeFeed");

    // Quick creator elements
    const quickPostText = document.getElementById("quickPostText");
    const quickPostMedia = document.getElementById("quickPostMedia");
    const quickPostSport = document.getElementById("quickPostSport");
    const quickMediaPreview = document.getElementById("quickMediaPreview");
    const mediaPreviewContent = document.getElementById("mediaPreviewContent");
    const btnRemoveQuickMedia = document.getElementById("btnRemoveQuickMedia");
    const btnPublishQuick = document.getElementById("btnPublishQuick");

    // Settings elements
    const settingsBtn = document.getElementById("settingsBtn");
    const dropdown = document.getElementById("settingsDropdown");
    const darkToggle = document.getElementById("darkModeToggle");
    const signOut = document.getElementById("signOut");

    let currentSportFilter = "all";
    let selectedMediaFile = null;

    // --- Populate Profile Summary ---
    const initials = (currentAccount.name || "A").charAt(0).toUpperCase();
    if (homeAvatar) homeAvatar.textContent = initials;
    if (creatorAvatar) creatorAvatar.textContent = initials;
    if (homeTitle) homeTitle.textContent = currentAccount.name;
    if (homeRoleBadge) {
        homeRoleBadge.textContent = currentAccount.role || "Player";
        homeRoleBadge.className = "badge-role " + (currentAccount.role || "player");
    }
    if (homeSub) {
        homeSub.textContent = (currentAccount.sport || "All Sports") + " · " + (currentAccount.location || "Global");
    }

    // Populate stats
    function updateProfileStats() {
        let posts = [];
        try { posts = JSON.parse(localStorage.getItem("athletiq:posts") || "[]"); } catch (e) {}
        const myCount = posts.filter(p => p.email === sessionEmail).length;
        if (statPosts) statPosts.textContent = myCount;

        if (statConnections) {
            try {
                const requests = JSON.parse(localStorage.getItem("athletiq_requests") || "[]");
                const connCount = requests.filter(r => (r.from === sessionEmail || r.to === sessionEmail) && r.status === "accepted").length;
                statConnections.textContent = connCount;
            } catch (e) {
                statConnections.textContent = "0";
            }
        }
    }
    updateProfileStats();

    // Notification Badge
    if (typeof Connections !== "undefined" && notifCount) {
        const count = Connections.unreadCount(sessionEmail);
        if (count > 0) {
            notifCount.textContent = count;
            notifCount.hidden = false;
        } else {
            notifCount.hidden = true;
        }
    }

    // --- Settings Dropdown & Dark Mode ---
    if (settingsBtn && dropdown) {
        settingsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("active");
        });
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

    // Load theme preference (default to dark for athletic aesthetic)
    const savedTheme = localStorage.getItem("darkMode");
    setDarkMode(savedTheme === null ? true : savedTheme === "true");

    if (darkToggle) {
        darkToggle.addEventListener("change", () => {
            setDarkMode(darkToggle.checked);
        });
    }

    if (signOut) {
        signOut.addEventListener("click", () => {
            if (confirm("Sign out of AthletIQ?")) {
                localStorage.removeItem("athletiq:session");
                window.location.href = "signin.html";
            }
        });
    }

    // --- IndexedDB for Heavy Media Storage ---
    function openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("athletiq-media", 1);
            request.onupgradeneeded = () => { request.result.createObjectStore("files"); };
            request.onsuccess = () => { resolve(request.result); };
            request.onerror = () => { reject(request.error); };
        });
    }

    function saveMediaToDb(id, file) {
        return openDb().then((db) => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction("files", "readwrite");
                tx.objectStore("files").put(file, id);
                tx.oncomplete = () => { resolve(); };
                tx.onerror = () => { reject(tx.error); };
            });
        });
    }

    function getMediaFromDb(id) {
        return openDb().then((db) => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction("files", "readonly");
                const req = tx.objectStore("files").get(id);
                req.onsuccess = () => { resolve(req.result); };
                req.onerror = () => { reject(req.error); };
            });
        });
    }

    // --- Quick Inline Post Creator Logic ---
    if (quickPostMedia) {
        quickPostMedia.addEventListener("change", () => {
            const file = quickPostMedia.files[0];
            if (!file) return;
            selectedMediaFile = file;

            const url = URL.createObjectURL(file);
            mediaPreviewContent.innerHTML = "";
            const isVideo = file.type.startsWith("video/");
            const el = document.createElement(isVideo ? "video" : "img");
            el.src = url;
            if (isVideo) el.controls = true;
            mediaPreviewContent.appendChild(el);
            quickMediaPreview.hidden = false;
        });
    }

    if (btnRemoveQuickMedia) {
        btnRemoveQuickMedia.addEventListener("click", () => {
            selectedMediaFile = null;
            quickPostMedia.value = "";
            mediaPreviewContent.innerHTML = "";
            quickMediaPreview.hidden = true;
        });
    }

    if (btnPublishQuick) {
        btnPublishQuick.addEventListener("click", async () => {
            const text = quickPostText.value.trim();
            const sport = quickPostSport.value;

            if (!text && !selectedMediaFile) {
                alert("Please write a post or attach a photo/video.");
                return;
            }

            btnPublishQuick.disabled = true;
            btnPublishQuick.textContent = "Posting…";

            try {
                const id = Date.now();
                let mediaType = "";

                if (selectedMediaFile) {
                    await saveMediaToDb(id, selectedMediaFile);
                    mediaType = selectedMediaFile.type.startsWith("video/") ? "video" : "image";
                }

                let posts = [];
                try { posts = JSON.parse(localStorage.getItem("athletiq:posts") || "[]"); } catch (e) {}

                const newPost = {
                    id: id,
                    email: sessionEmail,
                    author: currentAccount.name,
                    role: currentAccount.role || "player",
                    sport: sport,
                    text: text,
                    mediaType: mediaType,
                    likes: 0,
                    likedBy: [],
                    comments: [],
                    createdAt: new Date().toISOString()
                };

                posts.push(newPost);
                localStorage.setItem("athletiq:posts", JSON.stringify(posts));

                // Clear input
                quickPostText.value = "";
                if (btnRemoveQuickMedia) btnRemoveQuickMedia.click();

                updateProfileStats();
                loadFeed();
            } catch (err) {
                alert("Could not publish post. Please try again.");
            }

            btnPublishQuick.disabled = false;
            btnPublishQuick.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Post';
        });
    }

    // --- Sport Filter Pills ---
    const filterPills = document.querySelectorAll(".filter-pill");
    filterPills.forEach(pill => {
        pill.addEventListener("click", () => {
            filterPills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            currentSportFilter = pill.getAttribute("data-sport");
            loadFeed();
        });
    });

    // --- Load & Render Feed ---
    const activeBlobUrls = [];
    function loadFeed() {
        if (!homeFeed) return;
        homeFeed.innerHTML = "";
        activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
        activeBlobUrls.length = 0;

        let posts = [];
        try {
            posts = JSON.parse(localStorage.getItem("athletiq:posts") || "[]");
        } catch (e) {
            posts = [];
        }

        // Apply Sport Filter
        if (currentSportFilter !== "all") {
            posts = posts.filter(p => (p.sport || "").toLowerCase() === currentSportFilter.toLowerCase());
        }

        if (posts.length === 0) {
            homeFeed.innerHTML = `
                <div class="card-aesthetic" style="text-align:center; padding: 40px 20px; color: var(--text-muted);">
                    <i class="fa-solid fa-trophy" style="font-size: 38px; color: var(--green-primary); margin-bottom: 12px; display:block;"></i>
                    <h4 style="color:var(--text-main); margin-bottom:6px;">No posts in ${currentSportFilter === "all" ? "the community" : currentSportFilter} yet</h4>
                    <p style="font-size:13px; max-width:320px; margin:0 auto;">Be the first athlete or coach to publish a highlight or update!</p>
                </div>
            `;
            return;
        }

        posts.slice().reverse().forEach((post) => {
            const card = document.createElement("div");
            card.className = "post-card";

            // Header
            const header = document.createElement("div");
            header.className = "post-card-header";

            const authorWrap = document.createElement("div");
            authorWrap.className = "post-author-wrap";

            const avatar = document.createElement("div");
            avatar.className = "post-avatar";
            avatar.textContent = (post.author || "A").charAt(0).toUpperCase();

            const info = document.createElement("div");
            const nameRow = document.createElement("div");
            nameRow.className = "post-author-name";
            nameRow.innerHTML = `${post.author} <i class="fa-solid fa-circle-check text-green" style="font-size:12px;" title="Verified Profile"></i>`;

            const metaRow = document.createElement("div");
            metaRow.className = "post-author-meta";
            metaRow.innerHTML = `
                <span class="badge-role ${post.role || 'player'}">${post.role || 'Player'}</span>
                <span>•</span>
                <span class="badge-sport">${post.sport || 'General'}</span>
                <span>•</span>
                <span>${new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            `;

            info.appendChild(nameRow);
            info.appendChild(metaRow);
            authorWrap.appendChild(avatar);
            authorWrap.appendChild(info);

            header.appendChild(authorWrap);

            // If author is me, show delete
            if (post.email === sessionEmail) {
                const delBtn = document.createElement("button");
                delBtn.className = "btn-outline";
                delBtn.style.cssText = "padding: 4px 10px; font-size: 11px; border-color: transparent;";
                delBtn.innerHTML = '<i class="fa-solid fa-trash" style="color: #ef4444;"></i>';
                delBtn.title = "Delete post";
                delBtn.onclick = () => {
                    if (confirm("Delete this post?")) {
                        let allPosts = JSON.parse(localStorage.getItem("athletiq:posts") || "[]");
                        allPosts = allPosts.filter(p => p.id !== post.id);
                        localStorage.setItem("athletiq:posts", JSON.stringify(allPosts));
                        updateProfileStats();
                        loadFeed();
                    }
                };
                header.appendChild(delBtn);
            }

            card.appendChild(header);

            // Body Text
            if (post.text) {
                const pText = document.createElement("p");
                pText.className = "post-card-text";
                pText.textContent = post.text;
                card.appendChild(pText);
            }

            // Media
            if (post.mediaType) {
                const mediaBox = document.createElement("div");
                mediaBox.className = "post-card-media";
                card.appendChild(mediaBox);

                getMediaFromDb(post.id).then(blob => {
                    if (blob) {
                        const blobUrl = URL.createObjectURL(blob);
                        activeBlobUrls.push(blobUrl);
                        if (post.mediaType === "video") {
                            const video = document.createElement("video");
                            video.src = blobUrl;
                            video.controls = true;
                            mediaBox.appendChild(video);
                        } else {
                            const img = document.createElement("img");
                            img.src = blobUrl;
                            img.alt = "Post media";
                            mediaBox.appendChild(img);
                        }
                    }
                }).catch(() => {});
            }

            // Action Bar (Like, Comment, Share)
            const actionBar = document.createElement("div");
            actionBar.className = "post-action-bar";

            // Likes
            const likesCount = post.likes || 0;
            const isLiked = Array.isArray(post.likedBy) && post.likedBy.includes(sessionEmail);

            const likeBtn = document.createElement("button");
            likeBtn.className = "action-btn-item" + (isLiked ? " liked" : "");
            likeBtn.innerHTML = `<i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i> <span>${likesCount}</span>`;
            likeBtn.onclick = () => {
                let allPosts = JSON.parse(localStorage.getItem("athletiq:posts") || "[]");
                const target = allPosts.find(p => p.id === post.id);
                if (target) {
                    if (!Array.isArray(target.likedBy)) target.likedBy = [];
                    const index = target.likedBy.indexOf(sessionEmail);
                    if (index === -1) {
                        target.likedBy.push(sessionEmail);
                        target.likes = (target.likes || 0) + 1;
                    } else {
                        target.likedBy.splice(index, 1);
                        target.likes = Math.max(0, (target.likes || 1) - 1);
                    }
                    localStorage.setItem("athletiq:posts", JSON.stringify(allPosts));
                    loadFeed();
                }
            };

            // Comments Toggle
            const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;
            const commentBtn = document.createElement("button");
            commentBtn.className = "action-btn-item";
            commentBtn.innerHTML = `<i class="fa-regular fa-comment"></i> <span>${commentsCount}</span>`;

            // Share
            const shareBtn = document.createElement("button");
            shareBtn.className = "action-btn-item";
            shareBtn.innerHTML = `<i class="fa-solid fa-arrow-up-from-bracket"></i> <span>Share</span>`;
            shareBtn.onclick = () => {
                navigator.clipboard.writeText(window.location.href);
                alert("Post link copied to clipboard!");
            };

            actionBar.appendChild(likeBtn);
            actionBar.appendChild(commentBtn);
            actionBar.appendChild(shareBtn);
            card.appendChild(actionBar);

            // Comments Expandable Section
            const commentsBox = document.createElement("div");
            commentsBox.className = "post-comments-box";
            commentsBox.hidden = true; // Click commentBtn to toggle

            const commentsList = document.createElement("div");
            commentsList.className = "comments-list";

            function renderCommentsList() {
                commentsList.innerHTML = "";
                const currentComments = post.comments || [];
                currentComments.forEach(c => {
                    const cRow = document.createElement("div");
                    cRow.className = "comment-single";
                    cRow.innerHTML = `
                        <div class="comment-avatar">${(c.author || 'A').charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="comment-author">${c.author}</div>
                            <div class="comment-text">${c.text}</div>
                        </div>
                    `;
                    commentsList.appendChild(cRow);
                });
            }
            renderCommentsList();

            const commentInputRow = document.createElement("div");
            commentInputRow.className = "comment-input-row";

            const commentInput = document.createElement("input");
            commentInput.className = "comment-input-field";
            commentInput.placeholder = "Write an athletic critique or comment...";

            const commentSubmit = document.createElement("button");
            commentSubmit.className = "btn-post-comment";
            commentSubmit.textContent = "Reply";
            commentSubmit.onclick = () => {
                const cText = commentInput.value.trim();
                if (!cText) return;

                let allPosts = JSON.parse(localStorage.getItem("athletiq:posts") || "[]");
                const target = allPosts.find(p => p.id === post.id);
                if (target) {
                    if (!Array.isArray(target.comments)) target.comments = [];
                    target.comments.push({
                        author: currentAccount.name,
                        text: cText,
                        createdAt: new Date().toISOString()
                    });
                    localStorage.setItem("athletiq:posts", JSON.stringify(allPosts));
                    post.comments = target.comments;
                    commentInput.value = "";
                    renderCommentsList();
                    commentBtn.querySelector("span").textContent = target.comments.length;
                }
            };

            commentInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") commentSubmit.click();
            });

            commentInputRow.appendChild(commentInput);
            commentInputRow.appendChild(commentSubmit);

            commentsBox.appendChild(commentsList);
            commentsBox.appendChild(commentInputRow);
            card.appendChild(commentsBox);

            commentBtn.onclick = () => {
                commentsBox.hidden = !commentsBox.hidden;
                if (!commentsBox.hidden) commentInput.focus();
            };

            homeFeed.appendChild(card);
        });
    }

    loadFeed();
}
