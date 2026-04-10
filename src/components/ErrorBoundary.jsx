import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("NC County Financials error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", background: "#060e1a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif", color: "#c8d8e8",
          padding: 32, textAlign: "center",
        }}>
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#e8f1f8", marginBottom: 12 }}>
              Something went wrong
            </h2>
            <p style={{ color: "#4a6d8c", maxWidth: 400, lineHeight: 1.6, margin: "0 auto" }}>
              The financial data could not be displayed. Please refresh the page.
              If the problem persists, contact the site administrator.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 24, padding: "10px 24px", borderRadius: 8,
                border: "1px solid #3a7ca5", background: "#132744",
                color: "#5FA8D3", cursor: "pointer", fontSize: 14, fontWeight: 600,
              }}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
