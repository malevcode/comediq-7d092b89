import { useState, useCallback } from "react";
import { api } from "../services/api";

export type ComedySet = {
  id: string;
  user_id: string;
  venue: string | null;
  performed_at: string;
  stage_time_minutes: number | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
};

export type SetWithBits = ComedySet & {
  bits: SetBit[];
};

export type SetBit = {
  id: string;
  bit_id: string;
  name: string;
  tags: string | null;
  rating: number | null;
  notes: string | null;
  order_in_set: number | null;
};

export type CreateSetInput = {
  venue?: string;
  performed_at: string;
  stage_time_minutes?: number;
  rating?: number;
  notes?: string;
};

export function useSets() {
  const [sets, setSets] = useState<ComedySet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ComedySet[]>("/sets");
      setSets(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSet = useCallback(async (input: CreateSetInput) => {
    const set = await api.post<ComedySet>("/sets", input);
    setSets((prev) => [set, ...prev]);
    return set;
  }, []);

  const updateSet = useCallback(
    async (id: string, input: Partial<CreateSetInput>) => {
      const set = await api.put<ComedySet>(`/sets/${id}`, input);
      setSets((prev) => prev.map((s) => (s.id === id ? set : s)));
      return set;
    },
    []
  );

  const deleteSet = useCallback(async (id: string) => {
    await api.delete(`/sets/${id}`);
    setSets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getSet = useCallback(async (id: string) => {
    return api.get<SetWithBits>(`/sets/${id}`);
  }, []);

  const linkBit = useCallback(
    async (setId: string, bitId: string, rating?: number, notes?: string, order?: number) => {
      await api.post(`/sets/${setId}/bits`, {
        bit_id: bitId,
        rating,
        notes,
        order_in_set: order,
      });
    },
    []
  );

  const unlinkBit = useCallback(async (setId: string, bitId: string) => {
    await api.delete(`/sets/${setId}/bits/${bitId}`);
  }, []);

  return {
    sets,
    loading,
    error,
    fetchSets,
    createSet,
    updateSet,
    deleteSet,
    getSet,
    linkBit,
    unlinkBit,
  };
}
