import React from 'react';
import { Button } from '@/components/ui/button';

interface IncomeRecordingFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function IncomeRecordingForm({ onClose }: IncomeRecordingFormProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Income Recording</h2>
        <p className="text-muted-foreground mb-4">
          Income is automatically tracked from various sources. Manual income recording has been disabled.
        </p>
        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </div>
  );
}
