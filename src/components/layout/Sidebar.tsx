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
  ClipboardDocumentListIcon,
  ChevronUpIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BellIcon,
  ArrowTrendingUpIcon // FIXED: Changed from TrendingUpIcon to ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import AccountSettingsDialog from '@/components/dialogs/AccountSettingsDialog';
import PreferencesDialog from '@/components/dialogs/PreferencesDialog';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const allNavigation = [
  { name: 'Dashboard', id: 'dashboard', icon: HomeIcon, roles: ['chairperson', 'treasurer', 'secretary', 'member', 'viewer'] },
  { name: 'Members', id: 'members', icon: UsersIcon, roles: ['chairperson', 'treasurer', 'secretary'] },
  { name: 'Contributions', id: 'contributions', icon: CurrencyDollarIcon, roles: ['chairperson', 'treasurer', 'secretary', 'member'] },
  { name: 'Loans', id: 'loans', icon: BanknotesIcon, roles: ['chairperson', 'treasurer', 'secretary', 'member'] },
  { name: 'Fines', id: 'fines', icon: ExclamationTriangleIcon, roles: ['chairperson', 'treasurer', 'secretary'] },
  { name: 'Expenses', id: 'expenses', icon: ArrowTrendingDownIcon, roles: ['chairperson', 'treasurer'] },
  { name: 'Income Tracking', id: 'income', icon: ArrowTrendingUpIcon, roles: ['chairperson', 'treasurer', 'secretary'] }, // FIXED: Using ArrowTrendingUpIcon
  { name: 'Dividends', id: 'dividends', icon: ChartBarIcon, roles: ['chairperson', 'treasurer'] },
  { name: 'Meetings', id: 'meetings', icon: CalendarDaysIcon, roles: ['chairperson', 'treasurer', 'secretary'] },
  { name: 'Documents', id: 'documents', icon: DocumentTextIcon, roles: ['chairperson', 'treasurer', 'secretary'] },
  { name: 'Reports', id: 'reports', icon: ClipboardDocumentListIcon, roles: ['chairperson', 'treasurer', 'secretary'] },
  { name: 'Messages', id: 'messages', icon: ChatBubbleLeftRightIcon, roles: ['chairperson', 'secretary'] },
  { name: 'Notifications', id: 'notifications', icon: BellIcon, roles: ['chairperson', 'treasurer', 'secretary'] },
  { name: 'Audit Logs', id: 'audit', icon: ShieldCheckIcon, roles: ['chairperson'] },
  { name: 'Settings', id: 'settings', icon: Cog6ToothIcon, roles: ['chairperson'] },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { authUser, isAdmin, signOut } = useAuth();
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = React.useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = React.useState(false);
  
  // Filter navigation based on user role - show all items when no auth
  const navigation = !authUser 
    ? allNavigation 
    : allNavigation.filter(item => authUser?.role && item.roles.includes(authUser.role));

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {authUser?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {authUser ? (authUser?.full_name || `${authUser?.first_name} ${authUser?.last_name}`) : 'Guest User'}
                </p>
                <p className="text-xs text-sidebar-foreground/70 truncate capitalize">
                  {authUser?.role || 'guest'}
                </p>
              </div>
              <ChevronUpIcon className="h-4 w-4 text-sidebar-foreground/50" />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" side="top">
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none">
                {authUser ? (authUser?.full_name || `${authUser?.first_name} ${authUser?.last_name}`) : 'Guest User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {authUser?.email || 'guest@example.com'}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsAccountSettingsOpen(true)}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsPreferencesOpen(true)}>
              <Cog6ToothIcon className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={signOut}>
              <ArrowRightStartOnRectangleIcon className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialogs */}
      <AccountSettingsDialog 
        open={isAccountSettingsOpen} 
        onClose={() => setIsAccountSettingsOpen(false)} 
      />
      <PreferencesDialog 
        open={isPreferencesOpen} 
        onClose={() => setIsPreferencesOpen(false)} 
      />
    </motion.div>
  );
}