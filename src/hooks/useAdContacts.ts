import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdContact {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  website: string | null;
  business_type: string | null;
  borough: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdContactNote {
  id: string;
  contact_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface AdOutreach {
  id: string;
  contact_id: string;
  outreach_date: string;
  method: string;
  subject: string | null;
  outcome: string;
  follow_up_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export function useAdContacts() {
  return useQuery({
    queryKey: ['ad-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_contacts')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as AdContact[];
    },
  });
}

export function useAdContactNotes(contactId: string | null) {
  return useQuery({
    queryKey: ['ad-contact-notes', contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_contact_notes')
        .select('*')
        .eq('contact_id', contactId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AdContactNote[];
    },
  });
}

export function useAdOutreach(contactId?: string | null) {
  return useQuery({
    queryKey: ['ad-outreach', contactId ?? 'all'],
    queryFn: async () => {
      let q = supabase.from('ad_outreach').select('*').order('outreach_date', { ascending: false });
      if (contactId) q = q.eq('contact_id', contactId);
      const { data, error } = await q;
      if (error) throw error;
      return data as AdOutreach[];
    },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Partial<AdContact>) => {
      const { data, error } = await supabase.from('ad_contacts').insert(contact as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-contacts'] }),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<AdContact> & { id: string }) => {
      const { error } = await supabase.from('ad_contacts').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-contacts'] }),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ad_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-contacts'] }),
  });
}

export function useCreateContactNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: { contact_id: string; note: string; created_by?: string }) => {
      const { error } = await supabase.from('ad_contact_notes').insert(note);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['ad-contact-notes', vars.contact_id] }),
  });
}

export function useCreateOutreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (outreach: Partial<AdOutreach>) => {
      const { error } = await supabase.from('ad_outreach').insert(outreach as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ad-outreach'] });
    },
  });
}

export function useUpdateOutreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<AdOutreach> & { id: string }) => {
      const { error } = await supabase.from('ad_outreach').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-outreach'] }),
  });
}

export function useDeleteOutreach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ad_outreach').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ad-outreach'] }),
  });
}
