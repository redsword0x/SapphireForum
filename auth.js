// Authentication functions

// Initialize authentication listeners
function initAuth() {
    // Ensure Firebase is initialized
    if (!firebase.apps.length) {
      try {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized successfully');
      } catch (error) {
        console.error('Firebase initialization error', error);
      }
    }
  
    // Auth state change listener
    firebase.auth().onAuthStateChanged(function(user) {
      // Update UI based on auth state
      window.app.updateAuthUI(user);
      
      if (user) {
        console.log('User logged in:', user.email);
        
        // Save user data to Firestore if new user
        if (user.metadata.creationTime === user.metadata.lastSignInTime) {
          saveUserData(user);
        }
      } else {
        console.log('User logged out');
      }
    });
  }
  
  // Login user
  async function loginUser(email, password) {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      alert(error.message);
      throw error;
    }
  }
  
  // Create new user
  async function createUser(email, password, username) {
    try {
      // Create user with email and password
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Update profile with username
      await user.updateProfile({
        displayName: username,
        photoURL: `https://ui-avatars.com/api/?name=${username.substring(0, 2)}&background=8b5cf6&color=fff`
      });
      
      // Save user data to Firestore
      await saveUserData(user, username);
      
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      alert(error.message);
      throw error;
    }
  }
  
  // Save user data to Firestore
  async function saveUserData(user, username = null) {
    try {
      const userRef = firebase.firestore().collection('users').doc(user.uid);
      
      // Prepare user data
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: username || user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Save to Firestore
      await userRef.set(userData, { merge: true });
      console.log('User data saved to Firestore');
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }
  
  // Logout user
  async function logoutUser() {
    try {
      await firebase.auth().signOut();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      alert(error.message);
      throw error;
    }
  }
  
  // Get current user data from Firestore
  async function getCurrentUserData() {
    const user = firebase.auth().currentUser;
    
    if (!user) return null;
    
    try {
      const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
      
      if (userDoc.exists) {
        return userDoc.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }
  