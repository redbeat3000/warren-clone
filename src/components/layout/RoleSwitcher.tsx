import React, { createContext, useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, UserIcon, CogIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type DemoRole = 'chairperson' | 'treasurer' | 'secretary' | 'member' | 'viewer' | null;

interface RoleSwitcherContextType {
  demoRole: DemoRole;
  setDemoRole: (role: DemoRole) => void;
  isDemoMode: boolean;
}

const RoleSwitcherContext = createContext<RoleSwitcherContextType | undefined>(undefined);

export const useRoleSwitcher = () => {
  const context = useContext(RoleSwitcherContext);
  if (context === undefined) {
    throw new Error('useRoleSwitcher must be used within a RoleSwitcherProvider');
  }
  return context;
};

export const RoleSwitcherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [demoRole, setDemoRole] = useState<DemoRole>(null);

  return (
    <RoleSwitcherContext.Provider
      value={{
        demoRole,
        setDemoRole,
        isDemoMode: demoRole !== null,
      }}
    >
      {children}
    </RoleSwitcherContext.Provider>
  );
};

const roleOptions = [
  { value: 'chairperson', label: 'Chairperson', icon: CogIcon, description: 'Full admin access' },
  { value: 'treasurer', label: 'Treasurer', icon: CogIcon, description: 'Financial management' },
  { value: 'secretary', label: 'Secretary', icon: CogIcon, description: 'Records management' },
  { value: 'member', label: 'Member', icon: UserIcon, description: 'Basic member access' },
  { value: 'viewer', label: 'Viewer', icon: EyeIcon, description: 'Read-only access' },
];

export const RoleSwitcher: React.FC = () => {
  const { demoRole, setDemoRole, isDemoMode } = useRoleSwitcher();

  const activeRole = roleOptions.find(role => role.value === demoRole);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-2"
    >
      {isDemoMode && (
        <Badge variant="secondary" className="text-xs">
          Demo Mode
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <EyeIcon className="h-4 w-4 mr-1" />
            {isDemoMode ? `View as ${activeRole?.label}` : 'Switch Role'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">Demo Mode</p>
            <p className="text-xs text-muted-foreground">
              Experience the system from different user perspectives
            </p>
          </div>
          <DropdownMenuSeparator />
          
          {!isDemoMode && (
            <DropdownMenuItem onClick={() => setDemoRole('chairperson')}>
              <EyeIcon className="h-4 w-4 mr-2" />
              Enter Demo Mode
            </DropdownMenuItem>
          )}

          {isDemoMode && (
            <>
              {roleOptions.map((role) => (
                <DropdownMenuItem
                  key={role.value}
                  onClick={() => setDemoRole(role.value as DemoRole)}
                  className={demoRole === role.value ? 'bg-accent' : ''}
                >
                  <role.icon className="h-4 w-4 mr-2" />
                  <div>
                    <div className="text-sm">{role.label}</div>
                    <div className="text-xs text-muted-foreground">{role.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDemoRole(null)}>
                <UserIcon className="h-4 w-4 mr-2" />
                Exit Demo Mode
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};