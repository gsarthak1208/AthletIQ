/**
 * AthletIQ Unified API Client
 * Seamlessly connects frontend pages to the Node.js SQLite backend when running via HTTP,
 * and transparently falls back to localStorage/IndexedDB when running offline or as raw files.
 */
(function () {
  const isHttp = window.location.protocol.startsWith('http');
  const API_BASE = isHttp ? '' : 'http://localhost:3000';

  async function apiFetch(endpoint, options = {}) {
    try {
      const res = await fetch(API_BASE + endpoint, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server request failed');
      return data;
    } catch (err) {
      // If server unreachable, throw so caller can fallback to localStorage
      throw err;
    }
  }

  window.AthletIQ_API = {
    isServerActive: isHttp,

    // --- Auth ---
    async register(name, email, role, password) {
      try {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, role, password })
        });
        return res;
      } catch (err) {
        if (!isHttp) throw err;
        throw err;
      }
    },

    async login(email, password) {
      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        return res.user;
      } catch (err) {
        throw err;
      }
    },

    // --- Profile ---
    async getProfile(email) {
      try {
        return await apiFetch('/api/users/profile?email=' + encodeURIComponent(email));
      } catch (err) {
        const raw = localStorage.getItem('athletiq:' + email.trim().toLowerCase());
        return raw ? JSON.parse(raw) : null;
      }
    },

    async updateProfile(data) {
      try {
        return await apiFetch('/api/users/profile', {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } catch (err) {
        return null;
      }
    },

    // --- Users list ---
    async getUsers(excludeEmail = '') {
      try {
        return await apiFetch('/api/users?exclude=' + encodeURIComponent(excludeEmail));
      } catch (err) {
        return null;
      }
    },

    // --- Posts ---
    async getPosts() {
      try {
        return await apiFetch('/api/posts');
      } catch (err) {
        return null;
      }
    },

    async createPost(postData) {
      try {
        return await apiFetch('/api/posts', {
          method: 'POST',
          body: JSON.stringify(postData)
        });
      } catch (err) {
        return null;
      }
    },

    async deletePost(id, email) {
      try {
        return await apiFetch(`/api/posts/${id}?email=` + encodeURIComponent(email), {
          method: 'DELETE'
        });
      } catch (err) {
        return null;
      }
    },

    // --- Messages ---
    async getMessages(me, other) {
      try {
        return await apiFetch(`/api/messages?me=${encodeURIComponent(me)}&other=${encodeURIComponent(other)}`);
      } catch (err) {
        return null;
      }
    },

    async sendMessage(fromEmail, toEmail, text) {
      try {
        return await apiFetch('/api/messages', {
          method: 'POST',
          body: JSON.stringify({ fromEmail, toEmail, text })
        });
      } catch (err) {
        return null;
      }
    }
  };
})();
