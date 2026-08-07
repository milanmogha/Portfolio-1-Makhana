import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for monitoring
    const errorLog = {
      type: '❌ ADMIN_FRONTEND_ERROR',
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error(JSON.stringify(errorLog));

    this.setState({
      error,
      errorInfo
    });

    // Optional: Send to error tracking service
    this.logErrorToServer(errorLog);
  }

  logErrorToServer = async (errorLog) => {
    try {
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog)
      }).catch(() => {
        console.warn('Could not send error log to server');
      });
    } catch (err) {
      console.warn('Error logging service unavailable');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#fee',
          color: '#c33',
          border: '1px solid #fcc',
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          <h2>⚠️ Admin Panel Error</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <p style={{ marginTop: '10px', fontSize: '12px' }}>
            Please refresh the page or contact support. 
            Check browser console (F12) for more details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
