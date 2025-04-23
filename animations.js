// animations.js - Pure vanilla JavaScript animations for Sapphire Forum

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  
  // Add ripple effect to buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const x = e.clientX - e.target.getBoundingClientRect().left;
      const y = e.clientY - e.target.getBoundingClientRect().top;
      
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
  
  // Add smooth scroll to top when logo is clicked
  const logo = document.querySelector('.logo');
  logo.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // Add hover effects for thread items
  const threadItems = document.querySelectorAll('.thread-item');
  threadItems.forEach(item => {
    item.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px)';
    });
    
    item.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });
  
  // Animate the page transitions
  function animatePageTransition(from, to) {
    if (!from || !to) return;
    
    from.style.animation = 'fadeOut 0.3s forwards';
    
    setTimeout(() => {
      from.classList.remove('active');
      to.classList.add('active');
      to.style.animation = 'fadeIn 0.3s forwards';
    }, 300);
  }
  
  // Add this function to the window object to use it in app.js
  window.animatePageTransition = animatePageTransition;
  
  // Create keyframes for fadeOut if it doesn't exist
  if (!document.querySelector('#fadeOutKeyframes')) {
    const style = document.createElement('style');
    style.id = 'fadeOutKeyframes';
    style.innerHTML = `
      @keyframes fadeOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add styles for ripple effect
  if (!document.querySelector('#rippleStyles')) {
    const style = document.createElement('style');
    style.id = 'rippleStyles';
    style.innerHTML = `
      .btn {
        position: relative;
        overflow: hidden;
      }
      
      .ripple {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.7);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      }
      
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add pulse effect to new thread button
  const newThreadBtn = document.getElementById('new-thread-btn');
  if (newThreadBtn) {
    setInterval(() => {
      newThreadBtn.classList.add('pulse');
      setTimeout(() => {
        newThreadBtn.classList.remove('pulse');
      }, 1000);
    }, 5000);
    
    // Add pulse animation styles
    if (!document.querySelector('#pulseStyles')) {
      const style = document.createElement('style');
      style.id = 'pulseStyles';
      style.innerHTML = `
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(26, 86, 219, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(26, 86, 219, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(26, 86, 219, 0);
          }
        }
        
        .pulse {
          animation: pulse 1s;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Add typing animation to textareas
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    textarea.addEventListener('focus', function() {
      this.style.transition = 'border-color 0.3s';
      this.style.borderColor = 'var(--primary)';
    });
    
    textarea.addEventListener('blur', function() {
      this.style.borderColor = 'var(--gray-light)';
    });
  });
  
  // Add fade-in animation when page loads
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);
});
