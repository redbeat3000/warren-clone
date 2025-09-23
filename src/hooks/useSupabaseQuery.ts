import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSupabaseQuery<T = any>(
  table: string,
  query?: string,
  deps: any[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error: queryError } = await (supabase as any)
        .from(table)
        .select(query || '*');
      
      if (queryError) throw queryError;
      
      setData(result || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Supabase query error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, deps);

  return { data, loading, error, refetch: fetchData };
}

export function useSupabaseStats() {
  const { data: users } = useSupabaseQuery('users', '*', []);
  const { data: loans } = useSupabaseQuery('loans', '*', []);
  const { data: contributions } = useSupabaseQuery('contributions', 'amount', []);
  
  // Use sample data when database is empty
  const hasData = users.length > 0 || loans.length > 0 || contributions.length > 0;
  
  const stats = {
    totalMembers: hasData ? users.length : 5,
    activeLoans: hasData ? loans.filter((loan: any) => loan.status === 'active').length : 2,
    totalContributions: hasData ? contributions.reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0) : 135000,
    availableCash: hasData ? 245000 : 85000 // This would be calculated from contributions - loans - expenses
  };

  return stats;
}