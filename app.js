// Initialize UI components and event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Firebase initialization
    initializeApp();
    
    // UI elements
    const homePage = document.getElementById('home-page');
    const threadDetailPage = document.getElementById('thread-detail-page');
    const homeLink = document.getElementById('home-link');
    const threadsContainer = document.getElementById('threads-list');
    const newThreadBtn = document.getElementById('new-thread-btn');
    const newThreadModal = document.getElementById('new-thread-modal');
    const authModal = document.getElementById('auth-modal');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const backToThreadsBtn = document.getElementById('back-to-threads');
    const categoryFilter = document.getElementById('category-filter');
    const timeFilter = document.getElementById('time-filter');
    const userProfile = document.querySelector('.user-profile');
    const authButtons = document.querySelector('.auth-buttons');
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close');
    
    // Auth tab switching
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
  
    // Show/hide pages
    function showPage(pageId) {
      document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
      });
      document.getElementById(pageId).classList.add('active');
    }
    
    // Event: Go to home page
    homeLink.addEventListener('click', function(e) {
      e.preventDefault();
      showPage('home-page');
      document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
      });
      homeLink.classList.add('active');
    });
    
    // Event: Back to threads
    backToThreadsBtn.addEventListener('click', function() {
      showPage('home-page');
    });
    
    // Event: Open new thread modal
    newThreadBtn.addEventListener('click', function() {
      // Check if user is logged in
      if (!isUserLoggedIn()) {
        openAuthModal();
        return;
      }
      newThreadModal.style.display = 'block';
    });
    
    // Event: Open auth modal
    loginBtn.addEventListener('click', openAuthModal);
    signupBtn.addEventListener('click', openAuthModal);
    
    function openAuthModal() {
      authModal.style.display = 'block';
    }
    
    // Event: Close modals
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
      });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
      if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
      }
    });
    
    // Auth tabs switching
    loginTab.addEventListener('click', function() {
      switchTab(this, loginForm);
    });
    
    signupTab.addEventListener('click', function() {
      switchTab(this, signupForm);
    });
    
    switchToSignup.addEventListener('click', function(e) {
      e.preventDefault();
      switchTab(signupTab, signupForm);
    });
    
    switchToLogin.addEventListener('click', function(e) {
      e.preventDefault();
      switchTab(loginTab, loginForm);
    });
    
    function switchTab(tabButton, tabContent) {
      // Update active tab button
      document.querySelectorAll('.tab-header div').forEach(tab => {
        tab.classList.remove('active');
      });
      tabButton.classList.add('active');
      
      // Update active tab content
      document.querySelectorAll('.tab-content > div').forEach(content => {
        content.classList.remove('active');
      });
      tabContent.classList.add('active');
    }
    
    // Filter threads
    categoryFilter.addEventListener('change', filterThreads);
    timeFilter.addEventListener('change', filterThreads);
    
    function filterThreads() {
      const category = categoryFilter.value;
      const sortBy = timeFilter.value;
      
      // Reset the threads list and show loading state
      threadsContainer.innerHTML = '';
      addLoadingThreads(2);
      
      // Fetch filtered threads
      getThreads(category, sortBy);
    }
    
    // Add loading thread skeletons
    function addLoadingThreads(count) {
      for (let i = 0; i < count; i++) {
        const loadingThread = document.createElement('div');
        loadingThread.className = 'thread-item loading';
        loadingThread.innerHTML = `
          <div class="shimmer-avatar"></div>
          <div class="thread-content">
            <div class="shimmer-title"></div>
            <div class="shimmer-text"></div>
            <div class="shimmer-text short"></div>
          </div>
          <div class="thread-stats">
            <div class="shimmer-stat"></div>
            <div class="shimmer-stat"></div>
          </div>
        `;
        threadsContainer.appendChild(loadingThread);
      }
    }
    
    // Create thread template
    function createThreadElement(thread) {
      const threadEl = document.createElement('div');
      threadEl.className = 'thread-item';
      threadEl.innerHTML = `
        <div class="avatar">
          <img src="${thread.authorPhotoURL || 'https://via.placeholder.com/50'}" alt="${thread.authorName}">
        </div>
        <div class="thread-content">
          <div class="thread-title">
            <a href="#" data-thread-id="${thread.id}">${thread.title}</a>
          </div>
          <div class="thread-meta">
            <span class="author">@${thread.authorName}</span>
            <span class="date">${formatDate(thread.createdAt)}</span>
            <span class="category ${thread.category}">${capitalizeFirstLetter(thread.category)}</span>
          </div>
          <div class="thread-excerpt">
            ${thread.content.substring(0, 150)}${thread.content.length > 150 ? '...' : ''}
          </div>
          <div class="thread-stats">
            <div class="stat">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M5 12h14"></path></svg>
              <span>${thread.upvotes || 0}</span>
            </div>
            <div class="stat">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 12-7 7-7-7"></path><path d="M5 12h14"></path></svg>
              <span>${thread.downvotes || 0}</span>
            </div>
            <div class="stat">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span>${thread.replyCount || 0}</span>
            </div>
          </div>
        </div>
      `;
      
      // Add click event to thread title
      const threadTitle = threadEl.querySelector('.thread-title a');
      threadTitle.addEventListener('click', function(e) {
        e.preventDefault();
        const threadId = this.getAttribute('data-thread-id');
        openThreadDetail(threadId);
      });
      
      return threadEl;
    }
    
    // Open thread detail view
    function openThreadDetail(threadId) {
      showPage('thread-detail-page');
      
      // Clear previous content
      document.getElementById('main-post').innerHTML = '';
      document.getElementById('replies-list').innerHTML = '';
      document.getElementById('reply-count').textContent = '0';
      
      // Show loading state
      const mainPost = document.getElementById('main-post');
      mainPost.innerHTML = `
        <div class="post-header">
          <div class="shimmer-avatar"></div>
          <div class="post-author">
            <div class="shimmer-title"></div>
            <div class="shimmer-text short"></div>
          </div>
        </div>
        <div class="shimmer-title"></div>
        <div class="shimmer-text"></div>
        <div class="shimmer-text"></div>
        <div class="shimmer-text"></div>
      `;
      
      // Fetch thread details
      getThreadDetail(threadId);
    }
    
    // Create thread detail template
    function createThreadDetailElement(thread) {
      const threadEl = document.createElement('div');
      threadEl.innerHTML = `
        <div class="post-header">
          <div class="avatar">
            <img src="${thread.authorPhotoURL || 'https://via.placeholder.com/50'}" alt="${thread.authorName}">
          </div>
          <div class="post-author">
            <div class="author-name">
              ${thread.authorName}
              ${thread.authorRole ? `<span class="author-role">${thread.authorRole}</span>` : ''}
            </div>
            <div class="post-date">${formatDate(thread.createdAt)}</div>
          </div>
        </div>
        <h1 class="post-title">${thread.title}</h1>
        <div class="post-category ${thread.category}">${capitalizeFirstLetter(thread.category)}</div>
        <div class="post-content">${formatContent(thread.content)}</div>
        <div class="post-footer">
          <div class="post-actions">
            <button class="action-btn" title="Share">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
              Share
            </button>
            <button class="action-btn" title="Report">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Report
            </button>
          </div>
          <div class="vote-buttons">
            <button class="vote-btn" title="Upvote" data-thread-id="${thread.id}" data-vote="up">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M5 12h14"></path></svg>
            </button>
            <span class="vote-count">${(thread.upvotes || 0) - (thread.downvotes || 0)}</span>
            <button class="vote-btn" title="Downvote" data-thread-id="${thread.id}" data-vote="down">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 12-7 7-7-7"></path><path d="M5 12h14"></path></svg>
            </button>
          </div>
        </div>
      `;
      
      // Add event listeners to vote buttons
      const voteButtons = threadEl.querySelectorAll('.vote-btn');
      voteButtons.forEach(button => {
        button.addEventListener('click', function() {
          if (!isUserLoggedIn()) {
            openAuthModal();
            return;
          }
          
          const threadId = this.getAttribute('data-thread-id');
          const voteType = this.getAttribute('data-vote');
          
          // Call vote function from firestore.js
          voteThread(threadId, voteType);
        });
      });
      
      return threadEl;
    }
    
    // Create reply element
    function createReplyElement(reply) {
      const replyEl = document.createElement('div');
      replyEl.className = 'reply-item';
      replyEl.innerHTML = `
        <div class="post-header">
          <div class="avatar">
            <img src="${reply.authorPhotoURL || 'https://via.placeholder.com/50'}" alt="${reply.authorName}">
          </div>
          <div class="post-author">
            <div class="author-name">
              ${reply.authorName}
              ${reply.authorRole ? `<span class="author-role">${reply.authorRole}</span>` : ''}
            </div>
            <div class="post-date">${formatDate(reply.createdAt)}</div>
          </div>
        </div>
        <div class="post-content">${formatContent(reply.content)}</div>
        <div class="post-footer">
          <div class="post-actions">
            <button class="action-btn" title="Reply">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>
              Reply
            </button>
          </div>
          <div class="vote-buttons">
            <button class="vote-btn" title="Upvote" data-reply-id="${reply.id}" data-vote="up">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M5 12h14"></path></svg>
            </button>
            <span class="vote-count">${(reply.upvotes || 0) - (reply.downvotes || 0)}</span>
            <button class="vote-btn" title="Downvote" data-reply-id="${reply.id}" data-vote="down">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 12-7 7-7-7"></path><path d="M5 12h14"></path></svg>
            </button>
          </div>
        </div>
      `;
      
      return replyEl;
    }
    
    // Check if user is logged in
    function isUserLoggedIn() {
      return !!firebase.auth().currentUser;
    }
    
    // Update UI based on auth state
    function updateAuthUI(user) {
      if (user) {
        authButtons.classList.add('hidden');
        userProfile.classList.remove('hidden');
        
        // Update user avatar
        const userAvatar = document.getElementById('user-avatar');
        if (user.photoURL) {
          userAvatar.src = user.photoURL;
        } else {
          // Generate initials for avatar if no photo
          const displayName = user.displayName || user.email.split('@')[0];
          const initials = displayName.substring(0, 2).toUpperCase();
          userAvatar.src = `https://ui-avatars.com/api/?name=${initials}&background=8b5cf6&color=fff`;
        }
        
        // Show reply form
        const replyFormContainer = document.getElementById('reply-form-container');
        replyFormContainer.classList.remove('hidden');
      } else {
        authButtons.classList.remove('hidden');
        userProfile.classList.add('hidden');
        
        // Hide reply form
        const replyFormContainer = document.getElementById('reply-form-container');
        replyFormContainer.classList.add('hidden');
      }
    }
    
    // Format date
    function formatDate(timestamp) {
      if (!timestamp) return 'Just now';
      
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diff = (now.getTime() - date.getTime()) / 1000; // seconds
      
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
      
      return date.toLocaleDateString();
    }
    
    // Capitalize first letter
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Format post content (basic conversion of line breaks)
    function formatContent(content) {
      if (!content) return '';
      
      // Convert line breaks to <br>
      return content.replace(/\n/g, '<br>');
    }
    
    // Initialize app
    function initializeApp() {
      // Initialize Firebase
      firebase.initializeApp({
        apiKey: "AIzaSyBbd4nmAU22Aj-zSz3rpbKGba8Zu8YboFc",
        authDomain: "forum-964b4.firebaseapp.com",
        projectId: "forum-964b4",
        storageBucket: "forum-964b4.firebasestorage.app",
        messagingSenderId: "540135812357",
        appId: "1:540135812357:web:1cac08e82b098923571b6c"
      });
  
      // Initialize auth and firestore listeners
      initAuth();
      
      // Load initial threads
      getThreads();
      
      // Setup form submissions
      setupForms();
    }
    
    // Setup form submissions
    function setupForms() {
      // New thread form
      const newThreadForm = document.getElementById('new-thread-form');
      newThreadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const titleInput = document.getElementById('thread-title-input');
        const categoryInput = document.getElementById('thread-category');
        const contentInput = document.getElementById('thread-content');
        
        // Create new thread
        createThread(
          titleInput.value,
          categoryInput.value,
          contentInput.value
        ).then(() => {
          // Reset form and close modal
          newThreadForm.reset();
          newThreadModal.style.display = 'none';
          
          // Refresh threads
          filterThreads();
        });
      });
      
      // Reply form
      const replyForm = document.getElementById('reply-form');
      replyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const contentInput = document.getElementById('reply-content');
        const threadTitle = document.getElementById('thread-title');
        const threadId = threadTitle.getAttribute('data-thread-id');
        
        // Create reply
        createReply(threadId, contentInput.value).then(() => {
          // Reset form
          replyForm.reset();
          
          // Refresh thread detail
          openThreadDetail(threadId);
        });
      });
      
      // Login form
      const loginFormElement = document.getElementById('login-form-element');
      loginFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        
        // Login user
        loginUser(emailInput.value, passwordInput.value).then(() => {
          // Reset form and close modal
          loginFormElement.reset();
          authModal.style.display = 'none';
        });
      });
      
      // Signup form
      const signupFormElement = document.getElementById('signup-form-element');
      signupFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usernameInput = document.getElementById('signup-username');
        const emailInput = document.getElementById('signup-email');
        const passwordInput = document.getElementById('signup-password');
        const confirmPasswordInput = document.getElementById('signup-confirm-password');
        
        // Check if passwords match
        if (passwordInput.value !== confirmPasswordInput.value) {
          alert('Passwords do not match!');
          return;
        }
        
        // Create user
        createUser(emailInput.value, passwordInput.value, usernameInput.value).then(() => {
          // Reset form and close modal
          signupFormElement.reset();
          authModal.style.display = 'none';
        });
      });
      
      // Logout
      const logoutLink = document.getElementById('logout-link');
      logoutLink.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Logout user
        logoutUser();
      });
    }
    
    // Expose functions to window for use in other scripts
    window.app = {
      addThread: function(thread) {
        const threadEl = createThreadElement(thread);
        
        // Remove loading skeletons if present
        const loadingThreads = threadsContainer.querySelectorAll('.thread-item.loading');
        if (loadingThreads.length > 0) {
          threadsContainer.innerHTML = '';
        }
        
        threadsContainer.appendChild(threadEl);
      },
      
      updateThreadDetail: function(thread) {
        const mainPost = document.getElementById('main-post');
        mainPost.innerHTML = '';
        
        const threadEl = createThreadDetailElement(thread);
mainPost.appendChild(threadEl);

        
        // Update thread title in header
        const threadTitle = document.getElementById('thread-title');
        threadTitle.textContent = thread.title;
        threadTitle.setAttribute('data-thread-id', thread.id);
      },
      
      updateReplies: function(replies) {
        const repliesContainer = document.getElementById('replies-list');
        repliesContainer.innerHTML = '';
        
        // Update reply count
        const replyCount = document.getElementById('reply-count');
        replyCount.textContent = replies.length;
        
        // Add replies
        replies.forEach(reply => {
          const replyEl = createReplyElement(reply);
          repliesContainer.appendChild(replyEl);
        });
      },
      
      updateAuthUI: updateAuthUI
    };
  });