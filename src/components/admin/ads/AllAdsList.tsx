import { useState } from 'react';
import { useAllBannerAds, useAdClickCounts, useAdClickDetails, type BannerAd } from '@/hooks/useBannerAds';
import { useAdContacts } from '@/hooks/useAdContacts';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, ExternalLink, MousePointerClick, Loader2, ChevronDown, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
const EMPTY_AD = {
  label: '', href: '', external: true, position: 'top' as string,
  sort_order: 0, is_active: true, icon_url: '', client_name: '',
  amount_paid: '' as any, payment_method: '', start_date: '', end_date: '',
  contact_id: '',
};

export function AllAdsList() {
  const { data: ads, isLoading } = useAllBannerAds();
  const { data: clickCounts } = useAdClickCounts();
  const { data: clickDetails } = useAdClickDetails();
  const { data: contacts } = useAdContacts();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [adding, setAdding] = useState(false);
  const [newAd, setNewAd] = useState({ ...EMPTY_AD });
  const [saving, setSaving] = useState(false);
  const [expandedClickId, setExpandedClickId] = useState<string | null>(null);

  const clickMap = Object.fromEntries((clickCounts ?? []).map(c => [c.ad_id, c.click_count]));
  const getAdClicks = (adId: string) => (clickDetails ?? []).filter(c => c.ad_id === adId);
  const isAdActive = (ad: BannerAd) => {
    if (!ad.is_active) return false;
    const today = new Date().toISOString().split('T')[0];
    if (ad.start_date && ad.start_date > today) return false;
    if (ad.end_date && ad.end_date < today) return false;
    return true;
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['banner-ads'] });
    queryClient.invalidateQueries({ queryKey: ['banner-ads-all'] });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { id, created_at, updated_at, ...rest } = editData;
    const payload = {
      ...rest,
      amount_paid: rest.amount_paid === '' ? null : Number(rest.amount_paid),
      start_date: rest.start_date || null,
      end_date: rest.end_date || null,
      icon_url: rest.icon_url || null,
      client_name: rest.client_name || null,
      payment_method: rest.payment_method || null,
      contact_id: rest.contact_id || null,
    };
    const { error } = await supabase.from('banner_ads').update(payload).eq('id', editingId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Saved' }); invalidate(); }
    setEditingId(null);
    setSaving(false);
  };

  const addAd = async () => {
    setSaving(true);
    const payload = {
      ...newAd,
      amount_paid: newAd.amount_paid === '' ? null : Number(newAd.amount_paid),
      start_date: newAd.start_date || null,
      end_date: newAd.end_date || null,
      icon_url: newAd.icon_url || null,
      client_name: newAd.client_name || null,
      payment_method: newAd.payment_method || null,
      contact_id: newAd.contact_id || null,
    };
    const { error } = await supabase.from('banner_ads').insert(payload);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ad added' }); invalidate(); setNewAd({ ...EMPTY_AD }); setAdding(false); }
    setSaving(false);
  };

  const deleteAd = async (id: string) => {
    const { error } = await supabase.from('banner_ads').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted' }); invalidate(); }
  };

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-orange-400" /></div>;

  const renderField = (label: string, value: any, onChange: (v: any) => void, type = 'text') => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {type === 'select-position' ? (
        <select value={value} onChange={e => onChange(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
      ) : type === 'checkbox' ? (
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} className="w-4 h-4" />
      ) : type === 'select-contact' ? (
        <select value={value ?? ''} onChange={e => onChange(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">No contact</option>
          {(contacts ?? []).map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
        </select>
      ) : (
        <Input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} className="h-9 text-sm" />
      )}
    </div>
  );

  const renderAdForm = (data: any, setData: (d: any) => void) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
      {renderField('Label', data.label, v => setData({ ...data, label: v }))}
      {renderField('Link (href)', data.href, v => setData({ ...data, href: v }))}
      {renderField('Icon URL', data.icon_url, v => setData({ ...data, icon_url: v }))}
      {renderField('Position', data.position, v => setData({ ...data, position: v }), 'select-position')}
      {renderField('Sort Order', data.sort_order, v => setData({ ...data, sort_order: Number(v) }), 'number')}
      {renderField('Client Name', data.client_name, v => setData({ ...data, client_name: v }))}
      {renderField('Amount Paid ($)', data.amount_paid, v => setData({ ...data, amount_paid: v }), 'number')}
      {renderField('Payment Method', data.payment_method, v => setData({ ...data, payment_method: v }))}
      {renderField('Start Date', data.start_date, v => setData({ ...data, start_date: v }), 'date')}
      {renderField('End Date', data.end_date, v => setData({ ...data, end_date: v }), 'date')}
      {renderField('Advertiser', data.contact_id, v => setData({ ...data, contact_id: v }), 'select-contact')}
      {renderField('External Link', data.external, v => setData({ ...data, external: v }), 'checkbox')}
      {renderField('Active', data.is_active, v => setData({ ...data, is_active: v }), 'checkbox')}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">All Banner Ads</h3>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="w-4 h-4 mr-1" /> Add Ad
        </Button>
      </div>

      {adding && (
        <Card>
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-3">New Ad</h3>
            {renderAdForm(newAd, setNewAd)}
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={addAd} disabled={saving || !newAd.label || !newAd.href}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(ads ?? []).map(ad => {
          const active = isAdActive(ad);
          const isEditing = editingId === ad.id;
          return (
            <Card key={ad.id} className={`border-l-4 ${active ? 'border-l-green-500' : 'border-l-red-400'}`}>
              <CardContent className="p-4">
                {isEditing ? (
                  <>
                    {renderAdForm(editData, setEditData)}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={saveEdit} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {ad.icon_url && <img src={ad.icon_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{ad.label}</span>
                          <Badge variant={ad.position === 'top' ? 'default' : 'secondary'} className="text-[10px]">{ad.position}</Badge>
                          {ad.external && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                          {!active && <Badge variant="destructive" className="text-[10px]">Inactive</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{ad.href}</div>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          {ad.client_name && <span>Client: {ad.client_name}</span>}
                          {ad.amount_paid != null && <span>${Number(ad.amount_paid).toFixed(2)}</span>}
                          {ad.payment_method && <span>via {ad.payment_method}</span>}
                          {ad.start_date && <span>From: {ad.start_date}</span>}
                          {ad.end_date && <span>To: {ad.end_date}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MousePointerClick className="w-3.5 h-3.5" />
                        {clickMap[ad.id] ?? 0}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(ad.id); setEditData({ ...ad, amount_paid: ad.amount_paid ?? '' }); }} className="h-7 text-xs">
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{ad.label}"?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove this ad and all its click data.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAd(ad.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
