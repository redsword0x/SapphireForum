// Firestore database functions

// Get threads with filtering and sorting
async function getThreads(category = 'all', sortBy = 'recent') {
    try {
      // Clear existing threads
      const threadsContainer = document.getElementById('threads-list');
      
      // Create query
      let query = firebase.firestore().collection('threads');
      
      // Apply category filter
      if (category !== 'all') {
        query = query.where('category', '==', category);
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.orderBy('upvotes', 'desc');
          break;
        case 'commented':
          query = query.orderBy('replyCount', 'desc');
          break;
        case 'recent':
        default:
          query = query.orderBy('createdAt', 'desc');
          break;
      }
      
      // Limit to 20 threads
      query = query.limit(20);
      
      // Execute query
      const querySnapshot = await query.get();
      
      // Remove loading skeletons
      threadsContainer.innerHTML = '';
      
      // Check if we have results
      if (querySnapshot.empty) {
        threadsContainer.innerHTML = `
          <div class="no-results">
            <p>No threads found. Be the first one to create a thread in this category!</p>
          </div>
        `;
        return;
      }
      
      // Process results
      querySnapshot.forEach((doc) => {
        const threadData = {
          id: doc.id,
          ...doc.data()
        };
        
        // Add thread to UI
        window.app.addThread(threadData);
      });
    } catch (error) {
      console.error('Error getting threads:', error);
    }
  }
  
  // Get thread detail and replies
  async function getThreadDetail(threadId) {
    try {
      // Get thread document
      const threadDoc = await firebase.firestore().collection('threads').doc(threadId).get();
      
      if (!threadDoc.exists) {
        alert('Thread not found!');
        return;
      }
      
      // Get thread data
      const threadData = {
        id: threadDoc.id,
        ...threadDoc.data()
      };
      
      // Update thread detail view
      window.app.updateThreadDetail(threadData);
      
      // Get replies
      const repliesQuery = firebase.firestore()
        .collection('threads')
        .doc(threadId)
        .collection('replies')
        .orderBy('createdAt', 'asc');
      
      const repliesSnapshot = await repliesQuery.get();
      
      const replies = [];
      repliesSnapshot.forEach((doc) => {
        replies.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Update replies view
      window.app.updateReplies(replies);
      
      // Update view count
      updateThreadViewCount(threadId);
    } catch (error) {
      console.error('Error getting thread detail:', error);
    }
  }
  
  // Create new thread
  async function createThread(title, category, content) {
    try {
      const user = firebase.auth().currentUser;
      
      if (!user) {
        alert('You must be logged in to create a thread.');
        return;
      }
      
      // Ensure Firebase is properly initialized
      if (!firebase.apps.length) {
        alert('Firebase connection issue. Please refresh the page.');
        return;
      }
      
      // Get user data
      const userData = await getCurrentUserData();
      
      // Create thread object
      const threadData = {
        title: title,
        category: category,
        content: content,
        authorId: user.uid,
        authorName: userData?.displayName || user.displayName || user.email.split('@')[0],
        authorPhotoURL: userData?.photoURL || user.photoURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        upvotes: 0,
        downvotes: 0,
        viewCount: 0,
        replyCount: 0
      };
      
      console.log('Attempting to create thread with data:', { ...threadData, authorId: '[REDACTED]' });
      
      // Save to Firestore with explicit permissions check
      const threadRef = await firebase.firestore().collection('threads').add(threadData);
      console.log('Thread created with ID:', threadRef.id);
      
      return threadRef.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      
      // More specific error message for permissions issues
      if (error.code === 'permission-denied') {
        alert('Permission denied: You do not have access to create threads. Please ensure you are properly logged in.');
      } else {
        alert('Error creating thread: ' + error.message);
      }
      
      throw error;
    }
  }
  
  // Create reply to thread
  async function createReply(threadId, content) {
    try {
      const user = firebase.auth().currentUser;
      
      if (!user) {
        alert('You must be logged in to reply.');
        return;
      }
      
      // Get user data
      const userData = await getCurrentUserData();
      
      // Create reply object
      const replyData = {
        content: content,
        authorId: user.uid,
        authorName: userData?.displayName || user.displayName || user.email.split('@')[0],
        authorPhotoURL: userData?.photoURL || user.photoURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        upvotes: 0,
        downvotes: 0
      };
      
      // Start a batch
      const batch = firebase.firestore().batch();
      
      // Add reply to thread's replies collection
      const replyRef = firebase.firestore()
        .collection('threads')
        .doc(threadId)
        .collection('replies')
        .doc();
      
      batch.set(replyRef, replyData);
      
      // Update thread's reply count
      const threadRef = firebase.firestore().collection('threads').doc(threadId);
      batch.update(threadRef, {
        replyCount: firebase.firestore.FieldValue.increment(1),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Commit the batch
      await batch.commit();
      
      console.log('Reply added with ID:', replyRef.id);
      return replyRef.id;
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Error creating reply: ' + error.message);
    }
  }
  
  // Update thread view count
  async function updateThreadViewCount(threadId) {
    try {
      // Get current view state from localStorage
      const viewedThreads = JSON.parse(localStorage.getItem('viewedThreads') || '[]');
      
      // Check if thread has been viewed in this session
      if (!viewedThreads.includes(threadId)) {
        // Update view count
        await firebase.firestore().collection('threads').doc(threadId).update({
          viewCount: firebase.firestore.FieldValue.increment(1)
        });
        
        // Add thread to viewed threads
        viewedThreads.push(threadId);
        localStorage.setItem('viewedThreads', JSON.stringify(viewedThreads));
      }
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  }
  
  // Vote on thread
  async function voteThread(threadId, voteType) {
    try {
      const user = firebase.auth().currentUser;
      
      if (!user) {
        alert('You must be logged in to vote.');
        return;
      }
      
      const userVoteRef = firebase.firestore()
        .collection('threads')
        .doc(threadId)
        .collection('votes')
        .doc(user.uid);
      
      // Get user's current vote
      const userVoteDoc = await userVoteRef.get();
      const currentVote = userVoteDoc.exists ? userVoteDoc.data().type : null;
      
      // Start a batch
      const batch = firebase.firestore().batch();
      
      // Reference to the thread
      const threadRef = firebase.firestore().collection('threads').doc(threadId);
      
      // Logic for handling different vote scenarios
      if (!currentVote) {
        // User hasn't voted before
        batch.set(userVoteRef, { type: voteType, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        
        if (voteType === 'up') {
          batch.update(threadRef, { upvotes: firebase.firestore.FieldValue.increment(1) });
        } else {
          batch.update(threadRef, { downvotes: firebase.firestore.FieldValue.increment(1) });
        }
      } else if (currentVote === voteType) {
        // User is removing their vote
        batch.delete(userVoteRef);
        
        if (voteType === 'up') {
          batch.update(threadRef, { upvotes: firebase.firestore.FieldValue.increment(-1) });
        } else {
          batch.update(threadRef, { downvotes: firebase.firestore.FieldValue.increment(-1) });
        }
      } else {
        // User is changing their vote
        batch.update(userVoteRef, { type: voteType, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        
        if (voteType === 'up') {
          batch.update(threadRef, { 
            upvotes: firebase.firestore.FieldValue.increment(1),
            downvotes: firebase.firestore.FieldValue.increment(-1)
          });
        } else {
          batch.update(threadRef, { 
            upvotes: firebase.firestore.FieldValue.increment(-1),
            downvotes: firebase.firestore.FieldValue.increment(1)
          });
        }
      }
      
      // Commit the batch
      await batch.commit();
      
      // Refresh thread detail to reflect new vote count
      getThreadDetail(threadId);
      
      console.log('Vote recorded successfully');
    } catch (error) {
      console.error('Error voting on thread:', error);
      alert('Error voting on thread: ' + error.message);
    }
  }
  