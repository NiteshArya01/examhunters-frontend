import React, { useState, useEffect } from 'react';
import './NetworkBanner.css';

const NetworkBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineAlert(true);
      // 3.5 सेकंड बाद सक्सेस मैसेज हटा दें
      const timer = setTimeout(() => {
        setShowOnlineAlert(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineAlert(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="global-network-banner global-offline">
        <span>⚠️ <strong>No Internet Connection!</strong> Please check your network connection.</span>
      </div>
    );
  }

  if (showOnlineAlert) {
    return (
      <div className="global-network-banner global-online">
        <span>✅ <strong>Internet Connected!</strong> You are back online.</span>
      </div>
    );
  }

  return null;
};

export default NetworkBanner;