import NCCountyFinancials from './nc-county-financials';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <div style={{ margin: 0, padding: 0 }}>
        <NCCountyFinancials />
      </div>
    </ErrorBoundary>
  );
}
