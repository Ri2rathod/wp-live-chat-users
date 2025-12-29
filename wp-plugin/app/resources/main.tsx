import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import ChatApp from './ChatApp';
import "./assets/global.css"


// Type definition for the dataset attributes
interface ChatAppDataset {
  [key: string]: string;
}

// Type definition for the container element
interface ChatContainer extends HTMLElement {
  dataset: ChatAppDataset;
}

// Function to initialize the chat app
const initBookAppointment = (): void => {
  // Find all instances of the shortcode on the page
  const containers = document.querySelectorAll('.chatpulse-chat') as NodeListOf<ChatContainer>;
  
  // Render each instance
  containers.forEach((container: ChatContainer) => {
    // Ensure the container exists and is a valid HTMLElement
    if (!container || !(container instanceof HTMLElement)) {
      console.warn('Invalid container found for chat app');
      return;
    }

    try {
      // Create a root for this container
      const root: Root = createRoot(container);
      
      // Render the component with the dataset attributes as props
      root.render(
        <StrictMode>
          <ChatApp {...container.dataset} />
        </StrictMode>
      );
    } catch (error) {
      console.error('Failed to initialize chat app:', error);
    }
  });
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initBookAppointment);
