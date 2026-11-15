// --- Authentication Check ---
const sessionEmail = localStorage.getItem("athletiq:session");
const rawAccount = sessionEmail ? localStorage.getItem("athletiq:" + sessionEmail) : null;
const currentAccount = rawAccount ? JSON.parse(rawAccount) : null;

if (!currentAccount) {
    window.location.href = "signin.html";
} else {
    initHomePage();
}

function initHomePage() {
    // --- Elements ---
    const settingsBtn = document.getElementById("settingsBtn");
    const dropdown = document.getElementById("settingsDropdown");
    const darkToggle = document.getElementById("darkModeToggle");
    const signOut = document.getElementById("signOut");
    const homeAvatar = document.getElementById("homeAvatar");
    const homeTitle = document.getElementById("homeWelcomeTitle");
    const homeSub = document.getElementById("homeWelcomeSub");
    const notifCount = document.getElementById("notif-count");
    const homeFeed = document.getElementById("homeFeed");

    // Populate user profile info
    if (homeAvatar) homeAvatar.textContent = currentAccount.name.charAt(0).toUpperCase();
    if (homeTitle) homeTitle.textContent = "Welcome back, " + currentAccount.name + "!";
    if (homeSub) {
        const roleNames = { player: "Player", coach: "Coach", agency: "Sports Agency" };
        const roleLabel = roleNames[currentAccount.role] || currentAccount.role;
        homeSub.textContent = roleLabel + " · " + sessionEmail;
    }

    // --- Notification Badge ---
    if (typeof Connections !== "undefined" && notifCount) {
        const count = Connections.unreadCount(sessionEmail);
        if (count > 0) {
            notifCount.textContent = count;
            notifCount.hidden = false;
        } else {
            notifCount.hidden = true;
        }
    }

    // --- Settings Dropdown ---
    if (settingsBtn && dropdown) {
        settingsBtn.addEventListener("click", (e) => {
            e.preventDefault();
            dropdown.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".settings-container")) {
                dropdown.classList.remove("active");
            }
        });
    }

    // --- Dark Mode ---
    function setDarkMode(enabled) {
        document.body.classList.toggle("dark-mode", enabled);
        localStorage.setItem("darkMode", enabled);
        if (darkToggle) darkToggle.checked = enabled;
    }

    setDarkMode(localStorage.getItem("darkMode") === "true");

    if (darkToggle) {
        darkToggle.addEventListener("change", () => {
            setDarkMode(darkToggle.checked);
        });
    }

    // --- Sign Out ---
    if (signOut) {
        signOut.addEventListener("click", () => {
            const confirmLogout = confirm("Are you sure you want to sign out?");
            if (confirmLogout) {
                localStorage.removeItem("athletiq:session");
                window.location.href = "signin.html";
            }
        });
    }

    // --- Load Media from IndexedDB ---
    function openDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("athletiq-media", 1);
            request.onupgradeneeded = () => { request.result.createObjectStore("files"); };
            request.onsuccess = () => { resolve(request.result); };
            request.onerror = () => { reject(request.error); };
        });
    }

    function getMedia(id) {
        return openDb().then((db) => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction("files", "readonly");
                const req = tx.objectStore("files").get(id);
                req.onsuccess = () => { resolve(req.result); };
                req.onerror = () => { reject(req.error); };
            });
        });
    }

    // --- Load Posts for Feed ---
    const activeBlobUrls = [];
    function loadFeed() {
        if (!homeFeed) return;
        homeFeed.innerHTML = "";
        activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
        activeBlobUrls.length = 0;

        let posts = [];
        try {
            const rawPosts = localStorage.getItem("athletiq:posts");
            posts = rawPosts ? JSON.parse(rawPosts) : [];
        } catch (e) {
            posts = [];
        }

        if (posts.length === 0) {
            homeFeed.innerHTML = '<div class="no-posts-card"><p>No posts yet in the community.</p><a href="post.html" class="action-btn" style="display:inline-block;margin-top:10px;">Be the first to share</a></div>';
            return;
        }

        posts.slice().reverse().forEach((post) => {
            const postCard = document.createElement("div");
            postCard.className = "post-card";

            const postHeader = document.createElement("div");
            postHeader.className = "post-card-header";

            const authorAvatar = document.createElement("div");
            authorAvatar.className = "post-avatar";
            authorAvatar.textContent = (post.author || "A").charAt(0).toUpperCase();

            const authorInfo = document.createElement("div");
            authorInfo.className = "post-author-info";

            const authorName = document.createElement("div");
            authorName.className = "post-author-name";
            authorName.textContent = post.author || "Athlete";

            const postMeta = document.createElement("div");
            postMeta.className = "post-author-meta";
            postMeta.textContent = (post.role ? post.role : "Member") + (post.sport ? " · " + post.sport : "");

            authorInfo.appendChild(authorName);
            authorInfo.appendChild(postMeta);
            postHeader.appendChild(authorAvatar);
            postHeader.appendChild(authorInfo);
            postCard.appendChild(postHeader);

            if (post.text) {
                const postText = document.createElement("p");
                postText.className = "post-card-text";
                postText.textContent = post.text;
                postCard.appendChild(postText);
            }

            if (post.mediaType) {
                const mediaSpot = document.createElement("div");
                mediaSpot.className = "post-card-media";
                postCard.appendChild(mediaSpot);

                getMedia(post.id).then((blob) => {
                    if (blob) {
                        const blobUrl = URL.createObjectURL(blob);
                        activeBlobUrls.push(blobUrl);
                        if (post.mediaType === "video") {
                            const video = document.createElement("video");
                            video.src = blobUrl;
                            video.controls = true;
                            video.style.maxWidth = "100%";
                            video.style.borderRadius = "8px";
                            mediaSpot.appendChild(video);
                        } else {
                            const img = document.createElement("img");
                            img.src = blobUrl;
                            img.alt = "Post media";
                            img.style.maxWidth = "100%";
                            img.style.borderRadius = "8px";
                            mediaSpot.appendChild(img);
                        }
                    }
                }).catch(() => {});
            }

            const postFooter = document.createElement("div");
            postFooter.className = "post-card-footer";
            postFooter.textContent = new Date(post.createdAt).toLocaleString();
            postCard.appendChild(postFooter);

            homeFeed.appendChild(postCard);
        });
    }

    loadFeed();
}
