import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function IncomeDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Income Management</h1>
        <p className="text-muted-foreground">
          Track all income sources and monitor dividend-eligible amounts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Income Tracking System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Income is automatically tracked from:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Registration fees (from contributions)</li>
            <li>Loan interest (from loan repayments)</li>
            <li>Fines and penalties (from fines)</li>
            <li>Investment profits (from investment records)</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            All income is automatically calculated in the Dividends section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
