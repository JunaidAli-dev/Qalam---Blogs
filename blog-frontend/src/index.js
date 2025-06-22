import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Error boundary for the root level
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Root level error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            maxWidth: '400px'
          }}>
            <h1 style={{ color: '#333', marginBottom: '1rem' }}>
              Qalam - Something went wrong
            </h1>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              We're sorry, but something unexpected happened. Please refresh the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Check if the DOM element exists
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a div with id="root" in your HTML.');
}

// Create root with error handling
const root = ReactDOM.createRoot(rootElement);

// Render the app with error boundary
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

// Enhanced performance monitoring
reportWebVitals((metric) => {
  // Log performance metrics in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Performance metric:', metric);
  }
  
  // In production, you could send to analytics
  if (process.env.NODE_ENV === 'production') {
    // Example: send to Google Analytics, Vercel Analytics, etc.
    // gtag('event', metric.name, {
    //   value: Math.round(metric.value),
    //   event_category: 'Web Vitals',
    //   non_interaction: true,
    // });
  }
});

// Service Worker registration (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Prevent console errors in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
