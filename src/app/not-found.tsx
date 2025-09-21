import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-slate-400" />
            </div>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
            <CardDescription>
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-slate-600">
              <p>You can:</p>
              <ul className="mt-2 space-y-1">
                <li>• Go back to the dashboard</li>
                <li>• Configure your settings</li>
                <li>• Check your URL spelling</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/" className="flex-1">
                <Button className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/settings" className="flex-1">
                <Button variant="outline" className="w-full">
                  Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}