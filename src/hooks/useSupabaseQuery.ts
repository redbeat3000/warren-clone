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
  
  const stats = {
    totalMembers: users.length,
    activeLoans: loans.filter((loan: any) => loan.status === 'active').length,
    totalContributions: contributions.reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0),
    availableCash: 245000 // This would be calculated from contributions - loans - expenses
  };

  return stats;
}