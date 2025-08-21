import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Candidate } from '@/components/CandidateDropdown';

interface UseCandidateDataReturn {
  candidates: Candidate[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1vJNXjaBe6sHo2w1_L7r2-M7iZoD_zdB3sNOrGux2kMA/export?format=csv';

export const useCandidateData = (): UseCandidateDataReturn => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(CSV_URL);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // Clean up header names
          return header.trim();
        },
        transform: (value: string) => {
          // Clean up cell values
          return value.trim();
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          // Filter out completely empty rows
          const validCandidates = results.data.filter((row: any) => {
            return Object.values(row).some(value => 
              value && typeof value === 'string' && value.trim() !== ''
            );
          });

          setCandidates(validCandidates as Candidate[]);
          setLoading(false);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          setError('Failed to parse CSV data');
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    candidates,
    loading,
    error,
    refetch: fetchData
  };
};