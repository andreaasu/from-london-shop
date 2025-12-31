import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
                    <h1 style={{ color: 'red' }}>Something went wrong.</h1>
                    <p>Please refer to the console for more details.</p>
                    <pre style={{ textAlign: 'left', background: '#f0f0f0', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '20px' }}>Reload Page</button>
                </div>
            );
        }

        return this.props.children;
    }
}
