import React from 'react';
import logger from './utils/logger';

/**
 * Error Boundary component to catch and handle errors during rendering
 * Prevents the entire app from crashing due to i18n or other errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console in development
    logger.error('[ErrorBoundary] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI with bilingual error message
      return (
        <div className="zd-container">
          <div className="zd-error" style={{ padding: '20px', textAlign: 'center' }}>
            <h3>Something went wrong</h3>
            <p>Algo salió mal</p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Please refresh the page to try again.<br />
              Por favor, actualice la página para intentar de nuevo.
            </p>
            <button
              className="zd-btn zd-btn--primary"
              onClick={() => window.location.reload()}
              style={{ marginTop: '15px' }}
            >
              Refresh / Actualizar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
