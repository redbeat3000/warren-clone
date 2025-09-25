import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MemberBalance {
  memberId: string;
  memberName: string;
  memberNo: string;
  totalContributions: number;
  totalLoans: number;
  totalRepayments: number;
  outstandingBalance: number;
  dividends: number;
  fines: number;
  netBalance: number;
}

export interface FinancialSummary {
  totalContributions: number;
  totalLoans: number;
  totalExpenses: number;
  totalFines: number;
  totalDividends: number;
  availableCash: number;
  memberBalances: MemberBalance[];
}

export function useFinancialData() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      // Fetch all financial data
      const [
        { data: contributions },
        { data: loans },
        { data: expenses },
        { data: fines },
        { data: dividends },
        { data: repayments },
        { data: users }
      ] = await Promise.all([
        supabase.from('contributions').select('amount, member_id'),
        supabase.from('loans').select('principal, member_id'),
        supabase.from('expenses').select('amount'),
        supabase.from('fines').select('amount, member_id'),
        supabase.from('dividends').select('allocation_amount, member_id'),
        supabase.from('loan_repayments').select('amount, member_id'),
        supabase.from('users').select('id, first_name, last_name, full_name, member_no').eq('status', 'active')
      ]);

      // Calculate totals
      const totalContributions = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const totalLoans = loans?.reduce((sum, l) => sum + Number(l.principal), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalFines = fines?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const totalDividends = dividends?.reduce((sum, d) => sum + Number(d.allocation_amount), 0) || 0;
      const totalRepayments = repayments?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      // Calculate member balances
      const memberBalances: MemberBalance[] = (users || []).map(user => {
        const memberContributions = contributions?.filter(c => c.member_id === user.id)
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        
        const memberLoans = loans?.filter(l => l.member_id === user.id)
          .reduce((sum, l) => sum + Number(l.principal), 0) || 0;
          
        const memberRepayments = repayments?.filter(r => r.member_id === user.id)
          .reduce((sum, r) => sum + Number(r.amount), 0) || 0;
          
        const memberFines = fines?.filter(f => f.member_id === user.id)
          .reduce((sum, f) => sum + Number(f.amount), 0) || 0;
          
        const memberDividends = dividends?.filter(d => d.member_id === user.id)
          .reduce((sum, d) => sum + Number(d.allocation_amount), 0) || 0;

        const outstandingBalance = memberLoans - memberRepayments;
        const netBalance = memberContributions + memberDividends - memberFines - outstandingBalance;

        return {
          memberId: user.id,
          memberName: user.full_name || `${user.first_name} ${user.last_name}`,
          memberNo: user.member_no || '',
          totalContributions: memberContributions,
          totalLoans: memberLoans,
          totalRepayments: memberRepayments,
          outstandingBalance,
          dividends: memberDividends,
          fines: memberFines,
          netBalance
        };
      });

      // Calculate available cash
      const availableCash = totalContributions - totalLoans - totalExpenses + totalRepayments + totalFines - totalDividends;

      setSummary({
        totalContributions,
        totalLoans,
        totalExpenses,
        totalFines,
        totalDividends,
        availableCash,
        memberBalances
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    // This would generate actual reports
    console.log(`Generating ${reportType} report...`);
    return summary;
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' ? `"${row[header]}"` : row[header]
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    summary,
    loading,
    refetch: fetchFinancialData,
    generateReport,
    exportToCSV
  };
}