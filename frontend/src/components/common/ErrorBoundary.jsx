import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Application render error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <main className="app-error-boundary">
          <section>
            <AlertTriangle size={28} />
            <h1>Something went wrong.</h1>
            <p>The page crashed while rendering. Refresh to reload the app state.</p>
            <button type="button" onClick={this.handleReload}>
              <RefreshCw size={17} />
              Refresh
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
