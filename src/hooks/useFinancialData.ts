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

export interface FundBalance {
  fundType: string;
  totalBalance: number;
  memberCount: number;
}

export interface FinancialSummary {
  totalContributions: number;
  totalLoans: number;
  totalExpenses: number;
  totalFines: number;
  totalDividends: number;
  availableCash: number;
  memberBalances: MemberBalance[];
  fundBalances: FundBalance[];
  dividendsFund: number;
  registrationFees: number;
  loanInterest: number;
  investmentProfits: number;
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
        { data: dividendAllocations },
        { data: repayments },
        { data: users },
        { data: investmentProfits },
        { data: dividendCalculations }
      ] = await Promise.all([
        supabase.from('contributions').select('amount, member_id, contribution_type, is_dividend_eligible'),
        supabase.from('loans').select('principal, member_id, total_interest_calculated, interest_paid'),
        supabase.from('expenses').select('amount, affects_dividends'),
        supabase.from('fines').select('amount, member_id, paid_amount, status'),
        supabase.from('dividend_allocations').select('allocated_amount, member_id, payout_status'),
        supabase.from('loan_repayments').select('amount, member_id, interest_portion'),
        supabase.from('users').select('id, first_name, last_name, full_name, member_no').eq('status', 'active'),
        supabase.from('investment_profits').select('amount'),
        supabase.from('dividends_fund_calculations').select('*').order('fiscal_year', { ascending: false }).limit(1)
      ]);

      // Calculate totals
      const totalContributions = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const totalLoans = loans?.reduce((sum, l) => sum + Number(l.principal), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalFines = fines?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const finesCollected = fines?.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0) || 0;
      const totalDividends = dividendAllocations?.filter(d => d.payout_status === 'paid')
        .reduce((sum, d) => sum + Number(d.allocated_amount || 0), 0) || 0;
      const totalRepayments = repayments?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      
      // Calculate registration fees (dividend-eligible contributions)
      const registrationFees = contributions?.filter(c => c.is_dividend_eligible)
        .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      
      // Calculate loan interest collected
      const loanInterest = repayments?.reduce((sum, r) => sum + Number(r.interest_portion || 0), 0) || 0;
      
      // Calculate investment profits
      const investmentProfitsTotal = investmentProfits?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      // Calculate dividends fund
      const dividendExpenses = expenses?.filter(e => e.affects_dividends)
        .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const dividendsFund = registrationFees + finesCollected + loanInterest + investmentProfitsTotal - dividendExpenses;
      
      // Calculate fund balances
      const fundBalances: FundBalance[] = [
        { fundType: 'Regular Savings', totalBalance: contributions?.filter(c => c.contribution_type === 'regular').reduce((sum, c) => sum + Number(c.amount), 0) || 0, memberCount: 0 },
        { fundType: 'Xmas Savings', totalBalance: contributions?.filter(c => c.contribution_type === 'xmas_savings').reduce((sum, c) => sum + Number(c.amount), 0) || 0, memberCount: 0 },
        { fundType: 'Land Fund', totalBalance: contributions?.filter(c => c.contribution_type === 'land_fund').reduce((sum, c) => sum + Number(c.amount), 0) || 0, memberCount: 0 },
        { fundType: 'Security Fund', totalBalance: contributions?.filter(c => c.contribution_type === 'security_fund').reduce((sum, c) => sum + Number(c.amount), 0) || 0, memberCount: 0 },
        { fundType: 'Registration Fees', totalBalance: registrationFees, memberCount: 0 }
      ];

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
          
        const memberDividends = dividendAllocations?.filter(d => d.member_id === user.id && d.payout_status === 'paid')
          .reduce((sum, d) => sum + Number(d.allocated_amount || 0), 0) || 0;

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
        memberBalances,
        fundBalances,
        dividendsFund,
        registrationFees,
        loanInterest,
        investmentProfits: investmentProfitsTotal
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
    
    // Import and use PDF generator instead of CSV
    import('@/utils/pdfGenerator').then(({ generateFinancialSummaryPDF }) => {
      generateFinancialSummaryPDF(data, filename.replace(/[-_]/g, ' ').toUpperCase(), filename);
    });
  };

  return {
    summary,
    loading,
    refetch: fetchFinancialData,
    generateReport,
    exportToPDF: exportToCSV
  };
}