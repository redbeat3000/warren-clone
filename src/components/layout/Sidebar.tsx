import React from 'react';
import { motion } from 'framer-motion';
import { 
  HomeIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  BanknotesIcon,
  ExclamationTriangleIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigation = [
  { name: 'Dashboard', id: 'dashboard', icon: HomeIcon },
  { name: 'Members', id: 'members', icon: UsersIcon },
  { name: 'Contributions', id: 'contributions', icon: CurrencyDollarIcon },
  { name: 'Loans', id: 'loans', icon: BanknotesIcon },
  { name: 'Fines', id: 'fines', icon: ExclamationTriangleIcon },
  { name: 'Expenses', id: 'expenses', icon: ArrowTrendingDownIcon },
  { name: 'Dividends', id: 'dividends', icon: ChartBarIcon },
  { name: 'Reports', id: 'reports', icon: ClipboardDocumentListIcon },
  { name: 'Messages', id: 'messages', icon: ChatBubbleLeftRightIcon },
  { name: 'Settings', id: 'settings', icon: Cog6ToothIcon },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <motion.div 
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-sidebar-border">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-3"
        >
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">C</span>
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">Chama</span>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item, index) => {
          const isActive = activeSection === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 + 0.3 }}
              onClick={() => onSectionChange(item.id)}
              className={`
                group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }
              `}
            >
              <item.icon
                className={`mr-3 h-5 w-5 transition-transform duration-200 ${
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                }`}
                aria-hidden="true"
              />
              {item.name}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto h-2 w-2 rounded-full bg-accent"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center space-x-3"
        >
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              Admin User
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              Chairperson
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}