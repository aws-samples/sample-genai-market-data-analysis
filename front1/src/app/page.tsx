import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatPage } from '@/components/ChatPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <main id="main-content" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <ErrorBoundary>
          <div className="h-screen flex flex-col">
            <ChatPage className="flex-1" />
          </div>
        </ErrorBoundary>
      </main>
    </ProtectedRoute>
  );
}