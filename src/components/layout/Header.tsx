import React from 'react';
import { motion } from 'framer-motion';
import { 
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border-b border-border px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <BellIcon className="h-6 w-6 text-muted-foreground" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-xs text-destructive-foreground font-medium">3</span>
            </span>
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <Cog6ToothIcon className="h-6 w-6 text-muted-foreground" />
          </motion.button>

          {/* User Profile */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-3 p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <UserCircleIcon className="h-8 w-8 text-muted-foreground" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">Chairperson</p>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}