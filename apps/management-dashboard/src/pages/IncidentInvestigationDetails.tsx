import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Save, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '@cbl/api';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { StatusBadge } from '../components/StatusBadge';

type RecordData = Record<string, any>;
type FormData = Record<string, string>;

const fieldClass = 'mt-1.5 block w-full rounded-md border border-[#D9E1EC] bg-white px-3 py-2.5 text-sm text-[#374151] outline-none transition focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/10';
const readOnlyClass = 'mt-1.5 block w-full rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5 text-sm text-[#475569]';
const valueOrDash = (value: unknown) => value === undefined || value === null || value === '' ? '—' : String(value);
const dateInputValue = (value: unknown) => value ? String(value).slice(0, 10) : '';
const timeInputValue = (value: unknown) => value ? String(value).slice(0, 5) : '';

const InputField = ({ label, value, onChange, type = 'text', readOnly = false }: { label: string; value: string; onChange?: (value: string) => void; type?: string; readOnly?: boolean }) => (
  <label className="block">
    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">{label}</span>
    <input type={type} value={value} readOnly={readOnly} onChange={event => onChange?.(event.target.value)} className={readOnly ? readOnlyClass : fieldClass} />
  </label>
);

const TextAreaField = ({ label, value, onChange, readOnly = false }: { label: string; value: string; onChange?: (value: string) => void; readOnly?: boolean }) => (
  <label className="block">
    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">{label}</span>
    <textarea value={value} readOnly={readOnly} onChange={event => onChange?.(event.target.value)} rows={4} className={`${readOnly ? readOnlyClass : fieldClass} resize-y`} />
  </label>
);

const SelectField = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) => (
  <label className="block">
    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">{label}</span>
    <select value={value} onChange={event => onChange(event.target.value)} className={fieldClass}>
      <option value="">Select...</option>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
);

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="overflow-hidden rounded-xl border border-[#D9E1EC] bg-white shadow-sm">
    <div className="flex items-center gap-2 border-b border-[#E5E7EB] bg-[#F8FAFC] px-5 py-3"><span className="h-4 w-1 rounded-full bg-[#CB0017]" /><h2 className="text-sm font-bold uppercase tracking-wider text-[#374151]">{title}</h2></div>
    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">{children}</div>
  </section>
);

const emptyForm: FormData = {
  shift_manager_incharge: '', shift: '', area_section: '', area_incharge: '', operator: '', production_officer: '', supervisor: '', witnesses: '',
  injury_classification: '', probability_of_occurrence: '', main_causes: '', immediate_action_taken: '', preventive_action_safety_measures: '', responsibility: '', timeline: '', investigation_team: '', capa_verification: '', target_date: '', completion_status: '', completion_date: '', verified_by_icm: '', reviewed_by_fm: '', closed_by_fm: '',
};

export const IncidentInvestigationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<RecordData | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadIncident = useCallback(async () => {
    if (!id) { setError('Investigation ID is missing.'); setLoading(false); return; }
    try {
      const response = await apiClient.get(`/incidents/${id}`);
      const data = response.data?.data ?? response.data;
      const metadata = data?.metadata || {};
      setIncident(data);
      setForm(Object.keys(emptyForm).reduce((values, key) => ({ ...values, [key]: String(metadata[key] ?? '') }), { ...emptyForm }));
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to load this investigation.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadIncident(); }, [loadIncident]);

  const metadata = incident?.metadata || {};
  const department = incident?.department?.code || incident?.department?.name || metadata.department || '—';
  const inherited = {
    title: incident?.title || metadata.title_of_accident || '',
    date: dateInputValue(incident?.incidentDate || metadata.date_of_accident),
    time: timeInputValue(incident?.incidentTime || metadata.time),
    employeeId: metadata.emp_id || '',
    reportedBy: metadata.reported_by || '',
    place: incident?.location || metadata.place_of_accident || '',
    sufferer: incident?.injuredPersonName || metadata.name_of_sufferer || '',
    designation: metadata.designation || '',
    department,
    details: incident?.description || metadata.accident_details || '',
  };

  const updateField = (key: string, value: string) => setForm(previous => ({ ...previous, [key]: value }));

  const save = async () => {
    if (!id) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const immediateAction = form.immediate_action_taken || form.preventive_action_safety_measures || incident?.immediateAction;
      await apiClient.put(`/incidents/${id}`, {
        metadata: { ...metadata, ...form },
        ...(immediateAction ? { immediateAction } : {}),
      });
      await loadIncident();
      setMessage('Investigation details saved successfully.');
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to save this investigation.');
    } finally {
      setSaving(false);
    }
  };

  return <Layout>
    <ContextHeader title="Incident Investigation" breadcrumbs={['Leading Indicators', 'Incident Investigation', 'Details']} subtitle="Complete and review the investigation generated from the Near Miss record." actions={[{ label: 'Back to Investigations', icon: <ArrowLeft />, onClick: () => navigate('/leading-indicators/incident-investigation'), variant: 'outlined' }]} />
    <main className="min-h-full bg-[#F7F7F5] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        {loading && <div className="rounded-xl border border-[#E8E0D2] bg-white p-8 text-center text-sm text-[#8A8F98]">Loading investigation...</div>}
        {!loading && error && <div className="rounded-xl border border-[#FECACA] bg-[#FFF7F7] p-5 text-sm text-[#991B1B]" role="alert">{error}</div>}
        {!loading && !error && incident && <>
          <section className="flex flex-col gap-3 rounded-xl border border-[#D9E1EC] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">Generated from Near Miss</p><h1 className="mt-1 text-xl font-bold text-[#2C1810]">{valueOrDash(incident.incidentNumber || id)}</h1></div><div className="flex gap-2"><StatusBadge status="Significant Near Miss" size="md" /><StatusBadge status={incident.status || 'under_investigation'} size="md" /></div></section>
          {message && <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm font-semibold text-[#166534]" role="status">{message}</div>}
          <Panel title="Accident Investigation Report — Near Miss Information">
            <InputField label="Title of Accident" value={inherited.title} readOnly />
            <InputField label="Date of Accident" value={inherited.date} type="date" readOnly />
            <InputField label="Time" value={inherited.time} type="time" readOnly />
            <InputField label="Employee ID" value={inherited.employeeId} readOnly />
            <InputField label="Reported By" value={inherited.reportedBy} readOnly />
            <InputField label="Place of Accident" value={inherited.place} readOnly />
            <InputField label="Name of Sufferer(s)" value={inherited.sufferer} readOnly />
            <InputField label="Designation" value={inherited.designation} readOnly />
            <InputField label="Department" value={inherited.department} readOnly />
            <TextAreaField label="Accident Details" value={inherited.details} readOnly />
          </Panel>
          <Panel title="Investigation Details">
            <InputField label="Shift Manager / Incharge" value={form.shift_manager_incharge} onChange={value => updateField('shift_manager_incharge', value)} />
            <InputField label="Shift" value={form.shift} onChange={value => updateField('shift', value)} />
            <InputField label="Area / Section" value={form.area_section} onChange={value => updateField('area_section', value)} />
            <InputField label="Area Incharge" value={form.area_incharge} onChange={value => updateField('area_incharge', value)} />
            <InputField label="Operator" value={form.operator} onChange={value => updateField('operator', value)} />
            <InputField label="Production Officer" value={form.production_officer} onChange={value => updateField('production_officer', value)} />
            <InputField label="Supervisor" value={form.supervisor} onChange={value => updateField('supervisor', value)} />
            <InputField label="Witnesses" value={form.witnesses} onChange={value => updateField('witnesses', value)} />
            <SelectField label="Injury Classification" value={form.injury_classification} options={['Fatality', 'LTI', 'RWC', 'MTC', 'FA', 'Property Damage', 'Significant Nearmiss', 'Fire Incident']} onChange={value => updateField('injury_classification', value)} />
            <SelectField label="Probability of Occurrence" value={form.probability_of_occurrence} options={['Frequent', 'Occasional', 'Seldom']} onChange={value => updateField('probability_of_occurrence', value)} />
            <TextAreaField label="Main Causes of Accidents" value={form.main_causes} onChange={value => updateField('main_causes', value)} />
            <TextAreaField label="Immediate Action Taken" value={form.immediate_action_taken} onChange={value => updateField('immediate_action_taken', value)} />
            <TextAreaField label="Preventive Action / Safety Measures" value={form.preventive_action_safety_measures} onChange={value => updateField('preventive_action_safety_measures', value)} />
            <InputField label="Responsibility / Resp" value={form.responsibility} onChange={value => updateField('responsibility', value)} />
            <InputField label="Timeline" value={form.timeline} onChange={value => updateField('timeline', value)} />
          </Panel>
          <Panel title="Closure & Verification">
            <InputField label="Investigation Team / Signatures" value={form.investigation_team} onChange={value => updateField('investigation_team', value)} />
            <InputField label="CAPA Verification" value={form.capa_verification} onChange={value => updateField('capa_verification', value)} />
            <InputField label="Target Date" value={form.target_date} type="date" onChange={value => updateField('target_date', value)} />
            <InputField label="Completion Status" value={form.completion_status} onChange={value => updateField('completion_status', value)} />
            <InputField label="Completion Date" value={form.completion_date} type="date" onChange={value => updateField('completion_date', value)} />
            <InputField label="Verified by ICM" value={form.verified_by_icm} onChange={value => updateField('verified_by_icm', value)} />
            <InputField label="Reviewed by FM" value={form.reviewed_by_fm} onChange={value => updateField('reviewed_by_fm', value)} />
            <InputField label="Closed by FM" value={form.closed_by_fm} onChange={value => updateField('closed_by_fm', value)} />
            <div className="sm:col-span-2 flex items-center gap-2 border-t border-[#F0F0F0] pt-4"><ShieldAlert className="h-4 w-4 text-[#CB0017]" /><p className="text-xs text-[#64748B]">Safety Incident Pictures can be attached through the existing attachment workflow for this Incident Investigation.</p></div>
          </Panel>
          <div className="flex justify-end"><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[#CB0017] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A30012] disabled:cursor-not-allowed disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Investigation'}</button></div>
        </>}
      </div>
    </main>
  </Layout>;
};

export default IncidentInvestigationDetails;
