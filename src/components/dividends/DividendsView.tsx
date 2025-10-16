import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { 
  PlusIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CalculatorIcon,
  DocumentArrowDownIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function DividendsView() {
  const [activeTab, setActiveTab] = useState('overview');
  const [calculations, setCalculations] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDividendData();
  }, []);

  const fetchDividendData = async () => {
    try {
      setLoading(true);
      
      const [{ data: calcs }, { data: allocs }] = await Promise.all([
        supabase
          .from('dividends_fund_calculations')
          .select('*')
          .order('fiscal_year', { ascending: false }),
        supabase
          .from('dividend_allocations')
          .select('*, users(first_name, last_name, member_no)')
          .order('allocated_amount', { ascending: false })
      ]);

      setCalculations(calcs || []);
      setAllocations(allocs || []);
    } catch (error) {
      console.error('Error fetching dividend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDistributed = calculations
    .filter(c => c.status === 'distributed')
    .reduce((sum, c) => sum + Number(c.total_dividends_fund), 0);
  
  const pendingDistribution = calculations
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.total_dividends_fund), 0);

  const currentYearCalc = calculations.find(c => c.fiscal_year === new Date().getFullYear());
  const currentYearTotal = currentYearCalc?.total_dividends_fund || 0;

  const handleExportDividends = async () => {
    try {
      const { generateDividendsReportPDF } = await import('@/utils/pdfGenerator');
      generateDividendsReportPDF(calculations, allocations);
    } catch (error) {
      console.error('Failed to export dividends report:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dividends</h1>
          <p className="text-muted-foreground mt-1">Calculate and distribute member dividends based on income tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary flex items-center space-x-2"
            onClick={handleExportDividends}
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export PDF</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary flex items-center space-x-2"
          >
            <CalculatorIcon className="h-5 w-5" />
            <span>Calculate Dividends</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Distributed</p>
              <p className="text-2xl font-bold text-foreground mt-2">KES {totalDistributed.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-success" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Distribution</p>
              <p className="text-2xl font-bold text-warning mt-2">KES {pendingDistribution.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-warning" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Year Fund</p>
              <p className="text-2xl font-bold text-primary mt-2">KES {currentYearTotal.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Formula</p>
              <p className="text-sm font-bold text-accent mt-2">Savings × Income</p>
            </div>
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <CalculatorIcon className="h-6 w-6 text-accent" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Rest of the component remains similar but uses real data */}
      {/* ... */}
    </div>
  );
}