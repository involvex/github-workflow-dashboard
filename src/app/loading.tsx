import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600">
              Setting up your workflow monitoring dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}