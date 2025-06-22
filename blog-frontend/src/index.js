import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Enhanced Error boundary for the root level
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Root level error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
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
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            maxWidth: '500px',
            margin: '1rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}>Q</span>
            </div>
            
            <h1 style={{ 
              color: '#333', 
              marginBottom: '1rem',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              Qalam - Something went wrong
            </h1>
            
            <p style={{ 
              color: '#666', 
              marginBottom: '1.5rem',
              lineHeight: '1.5'
            }}>
              We're sorry, but something unexpected happened. Please refresh the page or try again later.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                Reload Page
              </button>
              
              <button 
                onClick={() => window.location.href = '/'}
                style={{
                  background: 'white',
                  color: '#6366F1',
                  border: '2px solid #6366F1',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#6366F1';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#6366F1';
                }}
              >
                Go Home
              </button>
            </div>
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontSize: '0.875rem', 
                  color: '#6B7280',
                  fontWeight: '600'
                }}>
                  Show Error Details (Development)
                </summary>
                <div style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  background: '#FEF2F2',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#DC2626',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  overflow: 'auto',
                  maxHeight: '200px',
                  border: '1px solid #FECACA'
                }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </div>
              </details>
            )}
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
    console.log(`📊 ${metric.name}:`, Math.round(metric.value), metric.unit || 'ms');
  }
  
  // In production, you could send to analytics
  if (process.env.NODE_ENV === 'production') {
    // Example: send to Google Analytics, Vercel Analytics, etc.
    try {
      if (window.gtag) {
        window.gtag('event', metric.name, {
          value: Math.round(metric.value),
          event_category: 'Web Vitals',
          non_interaction: true,
        });
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }
});

// Service Worker registration (optional)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered:', registration);
      })
      .catch((registrationError) => {
        console.log('❌ SW registration failed:', registrationError);
      });
  });
}

// Enhanced global error handling
window.addEventListener('error', (event) => {
  console.error('🚨 Global error:', {
    message: event.error?.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  });
  
  // Prevent the default browser behavior
  event.preventDefault();
});

// Performance observer for additional metrics
if ('PerformanceObserver' in window) {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚡ ${entry.name}:`, Math.round(entry.duration), 'ms');
        }
      }
    });
    
    observer.observe({ entryTypes: ['navigation', 'paint'] });
  } catch (error) {
    console.error('Performance observer error:', error);
  }
}

// Prevent console spam in production
if (process.env.NODE_ENV === 'production') {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.log = (...args) => {
    if (args[0]?.includes?.('📊') || args[0]?.includes?.('✅') || args[0]?.includes?.('❌')) {
      originalLog(...args);
    }
  };
  
  console.warn = () => {};
  console.error = (...args) => {
    if (args[0]?.includes?.('🚨')) {
      originalError(...args);
    }
  };
}

// Browser compatibility check
try {
  // Check for modern JavaScript features
  new Function("(a = 0) => a");
  
  // Check for required APIs
  if (!window.fetch) {
    throw new Error('Fetch API not supported');
  }
  
  if (!window.Promise) {
    throw new Error('Promise not supported');
  }
  
} catch (e) {
  document.getElementById('root').innerHTML = 
    '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; text-align: center; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);"><div style="background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 500px; margin: 1rem;"><h1 style="color: #333; margin-bottom: 1rem;">Browser Not Supported</h1><p style="color: #666; margin-bottom: 1.5rem;">Your browser is too old to run this application.</p><p style="color: #888; font-size: 0.9rem;">Please update to a modern browser like Chrome, Firefox, Safari, or Edge.</p></div></div>';
}
