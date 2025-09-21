import { WorkflowDashboard } from '@/components/workflow-dashboard';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-4">
        {/* Main Dashboard - includes unified header */}
        <WorkflowDashboard />
      </div>
    </div>
  );
}
