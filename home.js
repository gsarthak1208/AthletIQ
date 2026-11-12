const settingsBtn = document.getElementById("settingsBtn");
const dropdown = document.getElementById("settingsDropdown");
const darkToggle = document.getElementById("darkModeToggle");
const signOut = document.getElementById("signOut");

// Open and close dropdown
settingsBtn.addEventListener("click", () => {
    dropdown.classList.toggle("active");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
    if (!e.target.closest(".settings-container")) {
        dropdown.classList.remove("active");
    }
});

// Dark mode
function setDarkMode(enabled) {
    document.body.classList.toggle("dark-mode", enabled);
    localStorage.setItem("darkMode", enabled);
    darkToggle.checked = enabled;
}

// Load saved theme
setDarkMode(localStorage.getItem("darkMode") === "true");

// Toggle theme
darkToggle.addEventListener("change", () => {
    setDarkMode(darkToggle.checked);
});

// Sign out
signOut.addEventListener("click", () => {
    const confirmLogout = confirm("Are you sure you want to sign out?");

    if (confirmLogout) {
        window.location.href = "login.html";
    }
});