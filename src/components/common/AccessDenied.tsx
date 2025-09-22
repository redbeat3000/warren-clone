import React from 'react';
import { motion } from 'framer-motion';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface AccessDeniedProps {
  requiredRole?: string;
  currentRole?: string;
  onGoBack?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ 
  requiredRole, 
  currentRole, 
  onGoBack 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-96 p-8 text-center"
    >
      <div className="bg-warning/10 rounded-full p-6 mb-6">
        <ShieldExclamationIcon className="h-16 w-16 text-warning" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-3">
        Access Restricted
      </h2>
      
      <p className="text-muted-foreground mb-2">
        You don't have permission to access this section.
      </p>
      
      {requiredRole && currentRole && (
        <p className="text-sm text-muted-foreground mb-6">
          This section requires <span className="font-medium text-warning">{requiredRole}</span> role, 
          but you have <span className="font-medium">{currentRole}</span> role.
        </p>
      )}
      
      {onGoBack && (
        <Button onClick={onGoBack} variant="outline">
          Go to Dashboard
        </Button>
      )}
    </motion.div>
  );
};