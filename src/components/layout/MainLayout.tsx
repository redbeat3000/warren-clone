import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardOverview from '../dashboard/DashboardOverview';
import MembersList from '../members/MembersList';
import ContributionsView from '../contributions/ContributionsView';
import LoansView from '../loans/LoansView';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';

import FinesView from '../fines/FinesView';
import ExpensesView from '../expenses/ExpensesView';
import DividendsView from '../dividends/DividendsView';
import ReportsView from '../reports/ReportsView';
import MessagesView from '../messages/MessagesView';
import SettingsView from '../settings/SettingsView';

// Role-based component rendering
const sectionComponents = {
  dashboard: DashboardOverview,
  members: MembersList,
  contributions: ContributionsView,
  loans: LoansView,
  fines: FinesView,
  expenses: ExpensesView,
  dividends: DividendsView,
  reports: ReportsView,
  messages: MessagesView,
  settings: SettingsView,
};

const sectionTitles = {
  dashboard: 'Dashboard',
  members: 'Members',
  contributions: 'Contributions',
  loans: 'Loans',
  fines: 'Fines',
  expenses: 'Expenses',
  dividends: 'Dividends',
  reports: 'Reports',
  messages: 'Messages',
  settings: 'Settings',
};

export default function MainLayout() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { authUser, isAdmin } = useAuth();

  // Check if current user has access to active section - allow all access when no auth
  const hasAccess = !authUser || (authUser?.role && ['chairperson', 'treasurer', 'secretary', 'member', 'viewer'].includes(authUser.role));

  useEffect(() => {
    if (authUser) {
      console.log('Auth user loaded:', authUser);
    }

    // Listen for navigation events from dashboard buttons
    const handleNavigation = (event: CustomEvent) => {
      setActiveSection(event.detail);
    };

    window.addEventListener('navigate-to-section', handleNavigation as EventListener);
    
    return () => {
      window.removeEventListener('navigate-to-section', handleNavigation as EventListener);
    };
  }, [authUser]);

  const ActiveComponent = sectionComponents[activeSection as keyof typeof sectionComponents];

  // Show access denied if user doesn't have permission for this section
  if (authUser && !hasAccess) {
    return (
      <div className="h-screen bg-background overflow-hidden">
        <div className="flex h-full">
          <div className="hidden lg:block">
            <Sidebar activeSection="dashboard" onSectionChange={setActiveSection} />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <Header title="Access Denied" subtitle="Chama Management System" />
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                  <p className="text-muted-foreground">You don't have permission to access this page.</p>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="flex h-full">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        </div>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="relative"
              >
                <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-4 right-4 p-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            title={sectionTitles[activeSection as keyof typeof sectionTitles]}
            subtitle="Chama Management System"
          />
          
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ActiveComponent />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 btn-primary rounded-full p-4 shadow-lg"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}