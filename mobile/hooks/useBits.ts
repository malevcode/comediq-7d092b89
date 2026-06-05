import { useState, useCallback } from "react";
import { api } from "../services/api";

export type Bit = {
  id: string;
  name: string;
  notes: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
  performance_count: number;
  avg_rating: number | null;
  last_performed: string | null;
  trend: "up" | "down" | "flat";
};

export type BitDetail = Bit & {
  history: BitPerformance[];
};

export type BitPerformance = {
  rating: number | null;
  notes: string | null;
  performed_at: string;
  venue: string | null;
  set_id: string;
};

export type CreateBitInput = {
  name: string;
  notes?: string;
  tags?: string[];
};

export function useBits() {
  const [bits, setBits] = useState<Bit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Bit[]>("/bits");
      setBits(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBit = useCallback(async (input: CreateBitInput) => {
    const bit = await api.post<Bit>("/bits", input);
    setBits((prev) => [...prev, bit].sort((a, b) => a.name.localeCompare(b.name)));
    return bit;
  }, []);

  const updateBit = useCallback(
    async (id: string, input: Partial<CreateBitInput>) => {
      const bit = await api.put<Bit>(`/bits/${id}`, input);
      setBits((prev) => prev.map((b) => (b.id === id ? { ...b, ...bit } : b)));
      return bit;
    },
    []
  );

  const deleteBit = useCallback(async (id: string) => {
    await api.delete(`/bits/${id}`);
    setBits((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const getBit = useCallback(async (id: string) => {
    return api.get<BitDetail>(`/bits/${id}`);
  }, []);

  return { bits, loading, error, fetchBits, createBit, updateBit, deleteBit, getBit };
}
