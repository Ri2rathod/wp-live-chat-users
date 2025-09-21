import { useEffect } from 'react';

export function BuyMeCoffeeWidget() {
  useEffect(() => {
    const initWidget = () => {
      const script = document.createElement('script');
      script.id = 'bmc-widget-script';
      script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
      script.setAttribute('data-name', 'BMC-Widget');
      script.setAttribute('data-cfasync', 'false');
      script.setAttribute('data-id', 'rathodri2');
      script.setAttribute('data-description', 'Support me on Buy me a coffee!');
      script.setAttribute('data-message', '');
      script.setAttribute('data-color', '#5F7FFF');
      script.setAttribute('data-position', 'Right');
      script.setAttribute('data-x_margin', '18');
      script.setAttribute('data-y_margin', '18');
      
      // Remove any existing widget script
      const existingScript = document.getElementById('bmc-widget-script');
      if (existingScript) {
        existingScript.remove();
      }

      // Remove any existing widget elements
      const existingWidget = document.querySelector('.bmc-btn-container');
      if (existingWidget) {
        existingWidget.remove();
      }

      document.body.appendChild(script);
    };

    initWidget();

    // Cleanup function
    return () => {
      const script = document.getElementById('bmc-widget-script');
      if (script) {
        script.remove();
      }
      const widget = document.querySelector('.bmc-btn-container');
      if (widget) {
        widget.remove();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return null;
}