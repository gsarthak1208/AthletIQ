// --- Authentication & Preview Check ---
// If you preview home.html without signing in first, a demo account is auto-loaded
// so you can see and test your home page immediately!
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
            text: "Great training session today! Focusing on agility drills and quick sprint transitions. Looking forward to our tournament next weekend! ⚽🔥",
            mediaType: "",
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
            id: 1002,
            email: "coach.davis@athletiq.com",
            author: "Coach Davis",
            role: "coach",
            sport: "Basketball",
            text: "Open basketball trials and high-performance development clinics are starting this Thursday. Open to all aspiring college players! Send me a message if interested. 🏀🏆",
            mediaType: "",
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
