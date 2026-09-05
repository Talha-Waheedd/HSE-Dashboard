import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { ContextHeader } from '../components/ContextHeader';
import { AuditLogPrint } from '../components/AuditLogPrint';
import { departmentLabel, useDepartments } from '../hooks/useDepartments';
import { auditService, auditStatusLabel, type AuditItem, type AuditLog, type AuditStatus } from '../services/api/auditService';

const fieldClass = 'h-10 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-[13px] text-[#374151] outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/10';
const areaClass = 'w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-[13px] text-[#374151] outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/10';
const readOnlyClass = 'min-h-10 whitespace-pre-wrap rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-[13px] font-normal text-[#475569]';

const emptyItem = (sortOrder: number): AuditItem => ({
  standardReference: '',
  description: '',
  standardLimitRequirement: '',
  score: null,
  recommendation: '',
  targetDate: '',
  responsibility: '',
  responsibleDepartmentId: '',
  status: 'open',
  sortOrder,
});

const hasContent = (item: AuditItem) => Boolean(
  item.standardReference || item.description || item.standardLimitRequirement || item.score || item.recommendation || item.targetDate || item.responsibility || item.responsibleDepartmentId,
);

const ReadOnlyField = ({ label, value }: { label: string; value?: unknown }) => <label className="block"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">{label}</span><div className={readOnlyClass}>{value === null || value === undefined || value === '' ? '—' : String(value)}</div></label>;

export const AuditLogDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { departments } = useDepartments();
  const isNew = id === 'new';
  const [audit, setAudit] = useState<AuditLog | null>(null);
  const [manualFields, setManualFields] = useState({
    title: '',
    areaOwner: '',
    auditObjective: '',
    riskRating: '',
    frequency: '',
    scheduledDate: '',
    departmentId: '',
    auditType: 'internal' as 'internal' | 'external' | 'regulatory',
  });
  const [auditors, setAuditors] = useState('');
  const [personsInterviewed, setPersonsInterviewed] = useState('');
  const [status, setStatus] = useState<AuditStatus>('planned');
  const [items, setItems] = useState<AuditItem[]>([emptyItem(0)]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(() => {
    const state = location.state as { message?: string } | null;
    return state?.message || '';
  });

  const departmentNames = useMemo(() => Object.fromEntries(departments.map(department => [department.id, departmentLabel(department)])), [departments]);

  const load = useCallback(async () => {
    if (!id || isNew) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await auditService.getLog(id);
      setAudit(data);
      setManualFields({
        title: data.title || '',
        areaOwner: data.areaOwner || '',
        auditObjective: data.auditObjective || '',
        riskRating: data.riskRating || '',
        frequency: data.frequency || '',
        scheduledDate: String(data.scheduledDate || '').slice(0, 10),
        departmentId: data.departmentId || '',
        auditType: data.auditType || 'internal',
      });
      setAuditors(data.auditors || '');
      setPersonsInterviewed(data.personsInterviewed || '');
      setStatus(['planned', 'in_progress', 'completed'].includes(data.status) ? data.status : 'planned');
      const findings = Array.isArray(data.findings) ? data.findings.map((item, index) => ({
        ...emptyItem(index),
        ...item,
        standardReference: item.standardReference || '',
        description: item.description || '',
        standardLimitRequirement: item.standardLimitRequirement || '',
        recommendation: item.recommendation || '',
        targetDate: item.targetDate ? String(item.targetDate).slice(0, 10) : '',
        responsibility: item.responsibility || '',
        responsibleDepartmentId: item.responsibleDepartmentId || '',
        score: item.score ? Number(item.score) : null,
      })) : [];
      setItems(findings.length ? findings : [emptyItem(0)]);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load this Audit Log.');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => document.body.classList.remove('printing-audit-log'), []);

  const updateItem = (index: number, changes: Partial<AuditItem>) => setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  const scoredItems = items.filter(item => Number.isInteger(item.score) && Number(item.score) >= 1 && Number(item.score) <= 4);
  const pointsScored = scoredItems.reduce((sum, item) => sum + Number(item.score), 0);
  const pointsAvailable = scoredItems.length * 4;
  const compliance = pointsAvailable ? (pointsScored / pointsAvailable) * 100 : 0;
  const isManual = isNew || audit?.source === 'manual' || audit?.source === 'audit-management' || !audit?.criticalAuditPlanId;
  const updateManualField = (key: keyof typeof manualFields, value: string) => setManualFields(current => ({ ...current, [key]: value }));

  const save = async () => {
    if (!id) return;
    const meaningfulItems = items.filter(hasContent);
    if (isManual && !manualFields.title.trim()) {
      setError('Area / Audit Title is required.');
      return;
    }
    if (isManual && !manualFields.scheduledDate) {
      setError('Audit Date is required.');
      return;
    }
    if (meaningfulItems.some(item => !item.description.trim())) {
      setError('Audit Point is required for every populated Audit Item row.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        ...(isManual ? {
          title: manualFields.title.trim(),
          areaOwner: manualFields.areaOwner.trim() || null,
          auditObjective: manualFields.auditObjective.trim() || null,
          riskRating: manualFields.riskRating || null,
          frequency: manualFields.frequency.trim() || null,
          scheduledDate: manualFields.scheduledDate,
          departmentId: manualFields.departmentId || null,
          auditType: manualFields.auditType,
          source: 'manual',
        } : {}),
        auditors: auditors.trim() || null,
        personsInterviewed: personsInterviewed.trim() || null,
        status,
        findings: meaningfulItems.map((item, index) => ({
          ...(item.id ? { id: item.id } : {}),
          standardReference: item.standardReference.trim() || null,
          description: item.description.trim(),
          standardLimitRequirement: item.standardLimitRequirement.trim() || null,
          score: item.score,
          recommendation: item.recommendation.trim() || null,
          targetDate: item.targetDate || null,
          responsibility: item.responsibility.trim() || null,
          responsibleDepartmentId: item.responsibleDepartmentId || null,
          status: item.status,
          sortOrder: index,
        })),
      };
      if (isNew) {
        const created = await auditService.createLog(payload);
        setMessage('Audit Log created and saved successfully.');
        navigate(`/audit-management/${created.id}`, {
          replace: true,
          state: { message: 'Audit Log created and saved successfully.' },
        });
        return;
      }
      await auditService.updateLog(id, payload);
      await load();
      setMessage('Audit Log saved successfully.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.response?.data?.errors?.[0]?.message || 'Unable to save the Audit Log.');
    } finally {
      setSaving(false);
    }
  };

  const print = () => {
    document.body.classList.add('printing-audit-log');
    const cleanup = () => document.body.classList.remove('printing-audit-log');
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
  };

  return <Layout>
    <ContextHeader
      title={isNew ? 'Add Audit' : 'Audit Log'}
      breadcrumbs={['Leading Indicators', 'Audit Logs', isNew ? 'Add' : 'View']}
      subtitle={isNew ? 'Create a manual audit in the consolidated Audit Log' : 'Perform, review, and update this audit'}
      actions={[
        ...(!isNew ? [{ label: 'Print', icon: <Printer />, onClick: print, variant: 'outlined' as const, disabled: !audit }] : []),
        { label: 'Back to Audit Logs', icon: <ArrowLeft />, onClick: () => navigate('/audit-management'), variant: 'outlined' },
      ]}
    />
    <main className="mx-auto max-w-[1600px] space-y-5 bg-[#F7F7F5] p-5 sm:p-6">
      {loading && <div className="rounded-xl border bg-white p-10 text-center text-sm text-[#6B7280]">Loading Audit Log...</div>}
      {error && <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]" role="alert">{error}</div>}
      {message && <div className="rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]" role="status">{message}</div>}
      {!loading && (audit || isNew) && <>
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Audit Log ID</p><h2 className="text-xl font-bold text-[#2C1810]">{audit?.auditNumber || (isNew ? 'Assigned after save' : audit?.id)}</h2></div><div className="flex items-center gap-2"><span className="rounded bg-[#F3F4F6] px-3 py-1.5 text-xs font-bold">{isManual ? 'Manual' : 'Critical Audit Plan'}</span><span className="rounded bg-[#F3F4F6] px-3 py-1.5 text-xs font-bold">{auditStatusLabel(status)}</span></div></div>
          {isManual ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Area / Audit Title *</span><input value={manualFields.title} onChange={event => updateManualField('title', event.target.value)} className={fieldClass} /></label>
              <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Area Owner</span><input value={manualFields.areaOwner} onChange={event => updateManualField('areaOwner', event.target.value)} className={fieldClass} /></label>
              <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Audit Date *</span><input type="date" value={manualFields.scheduledDate} onChange={event => updateManualField('scheduledDate', event.target.value)} className={fieldClass} /></label>
              <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Risk Rating</span><select value={manualFields.riskRating} onChange={event => updateManualField('riskRating', event.target.value)} className={fieldClass}><option value="">Select risk rating...</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></label>
              <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Department</span><select value={manualFields.departmentId} onChange={event => updateManualField('departmentId', event.target.value)} className={fieldClass}><option value="">Select department...</option>{manualFields.departmentId && !departments.some(department => department.id === manualFields.departmentId) && <option value={manualFields.departmentId}>Historical department</option>}{departments.map(department => <option key={department.id} value={department.id}>{departmentLabel(department)}</option>)}</select></label>
              <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Audit Type</span><select value={manualFields.auditType} onChange={event => updateManualField('auditType', event.target.value)} className={fieldClass}><option value="internal">Internal</option><option value="external">External</option><option value="regulatory">Regulatory</option></select></label>
              <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Frequency</span><input value={manualFields.frequency} onChange={event => updateManualField('frequency', event.target.value)} placeholder="Ad hoc, monthly, annual..." className={fieldClass} /></label>
              <label className="md:col-span-2 xl:col-span-4"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Audit Objective</span><textarea rows={3} value={manualFields.auditObjective} onChange={event => updateManualField('auditObjective', event.target.value)} className={areaClass} /></label>
            </div>
          ) : audit ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ReadOnlyField label="Area / Audit Title" value={audit.title} />
              <ReadOnlyField label="Area Owner" value={audit.areaOwner || audit.criticalAuditPlan?.areaOwners} />
              <ReadOnlyField label="Scheduled Date" value={String(audit.scheduledDate || '').slice(0, 10)} />
              <ReadOnlyField label="Risk Rating" value={audit.riskRating || audit.criticalAuditPlan?.riskRating} />
              <ReadOnlyField label="Frequency" value={audit.frequency || audit.criticalAuditPlan?.frequency} />
              <div className="md:col-span-2 xl:col-span-3"><ReadOnlyField label="Audit Objective" value={audit.auditObjective || audit.criticalAuditPlan?.auditObjective} /></div>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#374151]">Audit Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Audit Conducted By</span><input value={auditors} onChange={event => setAuditors(event.target.value)} className={fieldClass} /></label>
            <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Persons Interviewed</span><input value={personsInterviewed} onChange={event => setPersonsInterviewed(event.target.value)} className={fieldClass} /></label>
            <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Audit Log Status</span><select value={status} onChange={event => setStatus(event.target.value as AuditStatus)} className={fieldClass}><option value="planned">Pending</option><option value="in_progress">WIP</option><option value="completed">Done</option></select></label>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4"><div><h2 className="text-sm font-bold uppercase tracking-wider text-[#374151]">Audit Detail Items</h2><p className="mt-1 text-xs text-[#6B7280]">Scoring accepts only 1, 2, 3, or 4. Item closure is independent from the Audit Log status.</p></div><button type="button" onClick={() => setItems(current => [...current, emptyItem(current.length)])} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#CB0017] px-3 text-[12px] font-bold text-[#CB0017]"><Plus className="h-4 w-4" />Add Audit Point</button></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1650px] border-collapse text-left">
              <thead><tr className="border-b bg-[#F8FAFC]">{['Sr. #', 'Standard Reference', 'Audit Point', 'Standard Limit / Requirement', 'Score (1–4)', 'Actions / Recommendations', 'Target Date', 'Responsibility', 'Responsible Department', 'Closure Status', ''].map((label, index) => <th key={`${label}-${index}`} className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">{label}</th>)}</tr></thead>
              <tbody>{items.map((item, index) => <tr key={item.id || `new-${index}`} className="border-b align-top">
                <td className="px-3 py-3 font-semibold">{index + 1}</td>
                <td className="w-48 px-2 py-2"><input value={item.standardReference} onChange={event => updateItem(index, { standardReference: event.target.value })} className={fieldClass} /></td>
                <td className="w-56 px-2 py-2"><textarea rows={2} value={item.description} onChange={event => updateItem(index, { description: event.target.value })} className={areaClass} /></td>
                <td className="w-64 px-2 py-2"><textarea rows={2} value={item.standardLimitRequirement} onChange={event => updateItem(index, { standardLimitRequirement: event.target.value })} className={areaClass} /></td>
                <td className="w-28 px-2 py-2"><select value={item.score ?? ''} onChange={event => updateItem(index, { score: event.target.value ? Number(event.target.value) : null })} className={fieldClass}><option value="">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></td>
                <td className="w-64 px-2 py-2"><textarea rows={2} value={item.recommendation} onChange={event => updateItem(index, { recommendation: event.target.value })} className={areaClass} /></td>
                <td className="w-40 px-2 py-2"><input type="date" value={item.targetDate} onChange={event => updateItem(index, { targetDate: event.target.value })} className={fieldClass} /></td>
                <td className="w-52 px-2 py-2"><input value={item.responsibility} onChange={event => updateItem(index, { responsibility: event.target.value })} className={fieldClass} /></td>
                <td className="w-52 px-2 py-2"><select value={item.responsibleDepartmentId} onChange={event => updateItem(index, { responsibleDepartmentId: event.target.value })} className={fieldClass}><option value="">Select department...</option>{item.responsibleDepartmentId && !departments.some(department => department.id === item.responsibleDepartmentId) && <option value={item.responsibleDepartmentId}>{item.responsibleDepartment?.code || item.responsibleDepartment?.name || 'Historical department'}</option>}{departments.map(department => <option key={department.id} value={department.id}>{departmentLabel(department)}</option>)}</select></td>
                <td className="w-36 px-2 py-2"><select value={item.status} onChange={event => updateItem(index, { status: event.target.value as 'open' | 'closed' })} className={fieldClass}><option value="open">Open</option><option value="closed">Closed</option></select></td>
                <td className="px-2 py-2"><button aria-label={`Remove Audit Point ${index + 1}`} type="button" onClick={() => setItems(current => current.length === 1 ? [emptyItem(0)] : current.filter((_, itemIndex) => itemIndex !== index).map((entry, itemIndex) => ({ ...entry, sortOrder: itemIndex })))} className="rounded p-2 text-[#B91C1C] hover:bg-[#FEF2F2]"><Trash2 className="h-4 w-4" /></button></td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:grid-cols-3">
          <ReadOnlyField label="Points Scored" value={pointsScored} />
          <ReadOnlyField label="Points Available" value={pointsAvailable} />
          <ReadOnlyField label="Overall % Compliance" value={`${compliance.toFixed(2)}%`} />
        </section>
        <div className="flex justify-end"><button type="button" disabled={saving} onClick={() => void save()} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#CB0017] px-5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving...' : isNew ? 'Create Audit' : 'Save Audit Log'}</button></div>
        {audit && <AuditLogPrint audit={audit} items={items} auditors={auditors} personsInterviewed={personsInterviewed} departmentNames={departmentNames} />}
      </>}
    </main>
  </Layout>;
};
