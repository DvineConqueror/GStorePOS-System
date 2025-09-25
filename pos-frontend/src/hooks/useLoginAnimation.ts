import { useState } from 'react';

export const useLoginAnimation = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);

  const toggleRoleMode = () => {
    // Add smooth transition effect with directional slide
    const container = document.querySelector('.login-container');
    const logoSection = document.querySelector('.logo-section');
    const formSection = document.querySelector('.form-section');
    
    if (container && logoSection && formSection) {
      // Determine slide direction based on current mode
      const isTransitioningToManager = !isAdminMode; // Currently cashier, going to manager
      
      if (isTransitioningToManager) {
        // Cashier to Manager: slide out to right, slide in from left
        container.classList.add('opacity-0', 'transform', 'translate-x-8');
        logoSection.classList.add('opacity-0', 'transform', 'translate-x-4');
        formSection.classList.add('opacity-0', 'transform', 'translate-x-4');
      } else {
        // Manager to Cashier: slide out to left, slide in from right
        container.classList.add('opacity-0', 'transform', '-translate-x-8');
        logoSection.classList.add('opacity-0', 'transform', '-translate-x-4');
        formSection.classList.add('opacity-0', 'transform', '-translate-x-4');
      }
    }
    
    // Delay the state change for smooth animation
    setTimeout(() => {
      setIsAdminMode(!isAdminMode);
      
      // Slide back in with new content from opposite direction
      setTimeout(() => {
        if (container && logoSection && formSection) {
          const isTransitioningToManager = isAdminMode; // Now we're in the new state
          
          // Remove all transform classes first
          container.classList.remove('opacity-0', 'transform', 'translate-x-8', '-translate-x-8');
          logoSection.classList.remove('opacity-0', 'transform', 'translate-x-4', '-translate-x-4');
          formSection.classList.remove('opacity-0', 'transform', 'translate-x-4', '-translate-x-4');
          
          // Add initial position for slide-in effect
          if (isTransitioningToManager) {
            // Now in Manager mode: slide in from left
            container.classList.add('transform', '-translate-x-8');
            logoSection.classList.add('transform', '-translate-x-4');
            formSection.classList.add('transform', '-translate-x-4');
          } else {
            // Now in Cashier mode: slide in from right
            container.classList.add('transform', 'translate-x-8');
            logoSection.classList.add('transform', 'translate-x-4');
            formSection.classList.add('transform', 'translate-x-4');
          }
          
          // Trigger slide-in animation
          setTimeout(() => {
            container.classList.remove('transform', 'translate-x-8', '-translate-x-8');
            logoSection.classList.remove('transform', 'translate-x-4', '-translate-x-4');
            formSection.classList.remove('transform', 'translate-x-4', '-translate-x-4');
          }, 10);
        }
      }, 50);
    }, 250);
  };

  return {
    isAdminMode,
    toggleRoleMode
  };
};
