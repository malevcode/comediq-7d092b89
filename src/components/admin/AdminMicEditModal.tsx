import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TimePicker from '@/components/ui/TimePicker';
import DayOfWeekPicker from '@/components/ui/DayOfWeekPicker';
import BoroughPicker from '@/components/ui/BoroughPicker';

const OPEN_MIC_FIELDS = [
  'Open Mic', 'Day', 'Start Time', 'Latest End Time', 'Venue Name', 'Borough', 'Neighborhood', 'Location', 'Venue type', 'Cost', 'Stage time', 'Sign-Up Instructions', 'Host(s) / Organizer', 'Changes/updates', 'Last verified', 'Other Rules', 'Help other comics! Leave reviews', 'Formerly verified'
];
const OPTIONAL_FIELDS = ['Other Rules', 'Help other comics! Leave reviews', 'Formerly verified'];
const REQUIRED_FIELDS = OPEN_MIC_FIELDS.filter(f => !OPTIONAL_FIELDS.includes(f));

const normalizeBorough = (b: string) => {
  if (!b) return '';
  const map: Record<string, string> = {
    manhattan: 'Manhattan',
    brooklyn: 'Brooklyn',
    queens: 'Queens',
    bronx: 'Bronx',
    'staten island': 'Staten Island',
    si: 'Staten Island',
  };
  const key = b.trim().toLowerCase();
  return map[key] || b.trim();
};

const AdminMicEditModal = ({ open, onClose, mic, onSave, adminName }: any) => {
  const [formData, setFormData] = React.useState({ ...mic });
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { setFormData({ ...mic }); setErrors({}); }, [mic]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleQuickVerify = () => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    handleChange('Last verified', `Verified ${mm}.${dd} ${adminName}`);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    REQUIRED_FIELDS.forEach(field => {
      if (!formData[field] || !formData[field].trim()) {
        newErrors[field] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Mic</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {OPEN_MIC_FIELDS.map(field => (
            <div key={field} className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 mb-1">
                {field}
                {REQUIRED_FIELDS.includes(field) && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field === 'Day' ? (
                <DayOfWeekPicker value={formData['Day'] || ''} onChange={v => handleChange('Day', v)} />
              ) : field === 'Start Time' ? (
                <TimePicker value={formData['Start Time'] || ''} onChange={v => handleChange('Start Time', v)} />
              ) : field === 'Latest End Time' ? (
                <TimePicker value={formData['Latest End Time'] || ''} onChange={v => handleChange('Latest End Time', v)} />
              ) : field === 'Borough' ? (
                <BoroughPicker value={normalizeBorough(formData['Borough'])} onChange={v => handleChange('Borough', v)} />
              ) : (
                <Input
                  value={formData[field] || ''}
                  onChange={e => handleChange(field, e.target.value)}
                  className={errors[field] ? 'border-red-500' : ''}
                />
              )}
              {errors[field] && <span className="text-red-500 text-xs mt-1">{errors[field]}</span>}
            </div>
          ))}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button type="button" variant="outline" onClick={handleQuickVerify} className="w-full sm:w-auto">Quick Verify</Button>
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <Button type="button" onClick={handleSave} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminMicEditModal; 