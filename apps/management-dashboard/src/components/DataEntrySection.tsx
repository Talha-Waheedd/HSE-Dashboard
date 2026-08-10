import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from './Layout';
import { FilterBar } from './FilterBar';
import { ContextHeader } from './ContextHeader';
import { StatusBadge } from './StatusBadge';
import { SlideOverPanel } from './SlideOverPanel';
import { CenterModal } from './CenterModal';
import type { SectionConfig, ColumnSchema } from '../config/sectionSchemas';
import { usePermissions, useAuth } from '@cbl/auth';
import { useModuleData } from '../hooks/useModuleData';
import { useFilters } from '../context/FilterContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Save, Trash2, Download, Edit2, X, History, ArrowUpDown,
  ArrowRight, User, AlertTriangle, Search, ChevronLeft, ChevronRight,
  CheckCircle2, LayoutGrid, Filter, PanelRightOpen,
  Upload, Paperclip, FileText, Eye, CalendarDays, Clock,
} from 'lucide-react';
import { LinkedSourceBadge } from './LinkedSourceBadge';
import { AvatarInitials } from './AvatarInitials';
import { DepartmentStatusBar } from './DepartmentStatusBar';
import { MyPendingWidget } from './MyPendingWidget';
import { uploadClient } from '../../../../packages/api/src/uploadClient';
import { apiClient } from '@cbl/api';

interface DataEntrySectionProps {
  schema: SectionConfig;
}

const FIELD_BASE =
  'w-full min-h-9 px-3 py-2 text-[13px] border border-[#DEDEDE] rounded-md bg-white text-[#1A1818] ' +
  'focus:outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/15 ' +
  'disabled:bg-[#F5F5F5] disabled:text-[#9CA3AF] disabled:cursor-not-allowed';

const TEXTAREA_BASE =
  'w-full min-h-[92px] px-3 py-2 text-[13px] border border-[#DEDEDE] rounded-md bg-white text-[#1A1818] ' +
  'focus:outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/15';

const CARD =
  'bg-white border border-[#E0E0E0] rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)]';

const STATUS_COLUMNS = new Set(['status_id', 'risk_rating_id', 'investigation_required']);
const MAX_INCIDENT_ACTIONS = 15;

type IncidentAction = {
  action: string;
  responsible_person: string;
  responsible_department: string;
  timeline: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Planned' | 'Closed';
  legacy?: boolean;
};

const createIncidentAction = (): IncidentAction => ({
  action: '',
  responsible_person: '',
  responsible_department: '',
  timeline: '',
  severity: 'Medium',
  status: 'Open',
});

const normalizeIncidentAction = (value: any): IncidentAction => ({
  action: String(value?.action ?? value?.action_description ?? '').trim(),
  responsible_person: String(value?.responsible_person ?? value?.responsiblePerson ?? value?.responsibility ?? value?.responsible ?? '').trim(),
  responsible_department: String(value?.responsible_department ?? value?.responsibleDepartment ?? '').trim(),
  timeline: String(value?.timeline ?? value?.deadline ?? value?.timeline_deadline ?? '').trim(),
  severity: ['Low', 'Medium', 'High'].includes(value?.severity) ? value.severity : 'Medium',
  status: ['Open', 'Planned', 'Closed'].includes(value?.status) ? value.status : 'Open',
  legacy: value?.legacy === true || (!value?.responsible_person && !value?.responsiblePerson && !value?.responsible_department && !value?.responsibleDepartment),
});

const DatePickerField = ({
  value,
  onChange,
  label,
  required,
  disabled,
}: {
  value?: string;
  onChange: (nextValue: string) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const openPicker = () => inputRef.current?.showPicker?.();

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="date"
        aria-label={label}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        onClick={openPicker}
        onFocus={openPicker}
        onKeyDown={e => {
          const allowed = [
            'Tab', 'Shift', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Home', 'End', 'PageUp', 'PageDown', 'Enter', 'Escape'
          ];
          if (!allowed.includes(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
          }
        }}
        inputMode="none"
        className={`${FIELD_BASE} pr-10 appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full`}
        required={required}
        disabled={disabled}
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
    </div>
  );
};

const TimePickerField = ({
  value,
  onChange,
  label,
  required,
  disabled,
}: {
  value?: string;
  onChange: (nextValue: string) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const openPicker = () => inputRef.current?.showPicker?.();

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="time"
        aria-label={label}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        onClick={openPicker}
        onFocus={openPicker}
        onKeyDown={e => {
          const allowed = [
            'Tab', 'Shift', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Home', 'End', 'PageUp', 'PageDown', 'Enter', 'Escape'
          ];
          if (!allowed.includes(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
          }
        }}
        inputMode="none"
        className={`${FIELD_BASE} pr-10 appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full`}
        required={required}
        disabled={disabled}
      />
      <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
    </div>
  );
};

const moduleSections = (schema: SectionConfig) => {
  const sections = new Map<string, ColumnSchema[]>();
  schema.columns.filter(c => !c.hideFromForm).forEach(col => {
    const section = col.section || 'General';
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section)!.push(col);
  });
  return Array.from(sections.entries()).map(([title, columns]) => ({ title, columns }));
};

const shouldShowConditionalField = (schemaId: string, key: string, formData: any) => {
  if (schemaId === 'hazard-reporting') {
    if (['person_name', 'person_category'].includes(key)) {
      return formData.unsafe_type === 'Unsafe Act';
    }
  }
  if (schemaId === 'near-miss') {
    if (['root_cause_analysis', 'investigation_notes', 'investigation_officer', 'reported_in_hazard'].includes(key)) {
      return formData.investigation_required === 'Yes';
    }
  }
  return true;
};

const ActionTrackerWorkspace = ({
  schema,
}: {
  schema: SectionConfig;
}) => {
  const { data: cards, loading, fetchAll, createRecord, updateStatus, deleteRecord } = useModuleData(schema.id);
  const [showAddCard, setShowAddCard] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const saveAction = async () => {
    const result = await createRecord(formData);
    if (result.success) {
      setFormData({});
      setShowAddCard(false);
      await fetchAll();
    }
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <Layout>
      <ContextHeader
        title={schema.title}
        breadcrumbs={[schema.title]}
        subtitle="Live Action Tracker connected to enterprise backend"
        actions={[
          {
            label: 'New Action',
            icon: <Plus />,
            onClick: () => setShowAddCard(true),
            variant: 'primary'
          }
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[12px] text-[#6B7280]">
            <Filter className="h-3.5 w-3.5" />
            Enterprise filters are available from the shared toolbar.
          </div>
        </div>
      </ContextHeader>

      <div className="p-6 flex flex-col xl:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full xl:w-[280px] shrink-0 space-y-4">
          <div className={`${CARD} p-4 space-y-4`}>
            <h3 className="text-[12px] font-bold text-[#374151] uppercase tracking-wide border-b border-[#F0F0F0] pb-2">Department Status</h3>
            <div className="space-y-4">
              <DepartmentStatusBar name="Operations" openCount={14} maxCount={25} color="#7B1010" />
              <DepartmentStatusBar name="Maintenance" openCount={8} maxCount={25} color="#D97706" />
              <DepartmentStatusBar name="Engineering" openCount={3} maxCount={25} color="#16A34A" />
            </div>
          </div>
          
          <MyPendingWidget actions={cards.filter((card: any) => card.status_id !== 'Closed').map((card: any) => ({
            id: String(card.id ?? card.corrective_action_id),
            title: card.action || card.action_description || 'Corrective action',
            dueDate: card.due_date || card.target_date || '',
            isOverdue: Boolean(card.due_date && card.due_date < new Date().toISOString().slice(0, 10)),
            sourceId: card.linked_id || String(card.id ?? card.corrective_action_id),
          }))} />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <p className="text-[13px] text-[#9CA3AF]">Loading records...</p>
          ) : cards.length === 0 ? (
            <p className="text-[13px] text-[#9CA3AF]">No action records found.</p>
          ) : cards.map(card => (
            <div
              key={card.id}
              className={`${CARD} p-5 transition-all hover:shadow-[0_3px_14px_rgba(0,0,0,0.10)] ${
                activeCardId === card.id ? 'ring-2 ring-[#CB0017]/20 border-[#CB0017]/30' : ''
              }`}
              onClick={() => setActiveCardId(card.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <LinkedSourceBadge id={card.linked_id || `CAPA-${card.id}`} />
                  <h3 className="text-[15px] font-semibold text-[#1A1818] mt-2">{card.action}</h3>
                </div>
                <StatusBadge status={card.status_id} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF] font-semibold mb-1.5">Responsible Person</p>
                  <div className="flex items-center gap-2">
                    <AvatarInitials name={card.assigned_to || 'Unassigned'} size="xs" />
                    <p className="text-[13px] text-[#1A1818] font-medium">{card.assigned_to}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF] font-semibold">Due Date</p>
                  <p className="text-[13px] text-[#1A1818] mt-1">{card.due_date}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF] font-semibold">Completion Date</p>
                  <p className="text-[13px] text-[#1A1818] mt-1">{card.completion_date || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF] font-semibold">Remarks</p>
                  <p className="text-[13px] text-[#1A1818] mt-1">{card.remarks}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <button onClick={() => updateStatus(String(card.id), 'closed')} className="h-8 px-3 text-[12px] font-medium rounded-md bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] hover:bg-[#D1FAE5] transition-colors">
                  Complete
                </button>
                <button onClick={() => updateStatus(String(card.id), 'cancelled')} className="h-8 px-3 text-[12px] font-medium rounded-md bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] hover:bg-[#FEE2E2] transition-colors">
                  Cancel
                </button>
                <button onClick={() => deleteRecord(String(card.id))} className="h-8 px-3 text-[12px] font-medium rounded-md bg-white text-[#6B7280] border border-[#DEDEDE] hover:bg-[#F5F5F5] transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={`${CARD} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-[#CB0017]" />
            <h2 className="text-[12px] font-bold text-[#374151] uppercase tracking-wider">Action Summary</h2>
          </div>
          <p className="text-[13px] text-[#6B7280]">
            {cards.length} action records currently loaded from the enterprise backend.
          </p>
        </div>
      </div>

      </div>

      <CenterModal
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        title="New Action Card"
        description="Create a corrective action in the enterprise action register."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schema.columns.filter(c => !c.hideFromForm).map(col => (
            <div key={col.key} className={col.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                {col.label}
              </label>
              <input className={FIELD_BASE} value={formData[col.key] ?? ''} onChange={e => setFormData((prev: any) => ({ ...prev, [col.key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="h-9 px-4 text-[13px] font-medium rounded-md border border-[#DEDEDE] text-[#374151] hover:bg-[#F5F5F5]" onClick={() => setShowAddCard(false)}>
            Cancel
          </button>
          <button onClick={saveAction} className="h-9 px-4 text-[13px] font-medium rounded-md bg-[#CB0017] text-white hover:bg-[#A8001A]">
            Save Action
          </button>
        </div>
      </CenterModal>
    </Layout>
  );
};

const ActionTrackerRoute = ({ schema }: { schema: SectionConfig }) => {
  return <ActionTrackerWorkspace schema={schema} />;
};

export const DataEntrySection: React.FC<DataEntrySectionProps> = ({ schema }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: entries, loading, fetchAll, createRecord, updateRecord, deleteRecord } = useModuleData(schema.id);
  const { user } = useAuth();
  const permissions = usePermissions();
  const { filters } = useFilters();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [statusHistoryModal, setStatusHistoryModal] = useState<{ isOpen: boolean; record: any | null }>({ isOpen: false, record: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable');
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [showCloseHazard, setShowCloseHazard] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [closeHazardData, setCloseHazardData] = useState({ closingProof: '', closingRemarks: '' });
  const [reviewData, setReviewData] = useState({ remarks: '', reason: '' });
  const PAGE_SIZE = 15;

  const { canAddData, canEditData, canDeleteData, canExportCSV } = permissions;
  const routeCategory = schema.id === 'incident-log' ? searchParams.get('category') : null;

  useEffect(() => { fetchAll(filters as unknown as Record<string, unknown>); }, [schema.id, fetchAll, filters]);
  useEffect(() => { setCurrentPage(1); }, [filters, searchQuery, schema.id]);
  useEffect(() => {
    if (schema.id === 'incident-log' && routeCategory) setSearchQuery(routeCategory);
  }, [schema.id, routeCategory]);

  const applyComputes = (data: any, currentSchema: SectionConfig, allEntries: any[]) => {
    const nextData = { ...data };
    currentSchema.columns.forEach(col => {
      if (col.compute) nextData[col.key] = col.compute(nextData, allEntries);
    });
    return nextData;
  };

  const validateFormData = (data: any): string | null => {
    // Check required fields dynamically
    for (const col of schema.columns) {
      if (col.required && !col.hideFromForm) {
        if (!shouldShowConditionalField(schema.id, col.key, data)) continue;
        
        const val = data[col.key];
        if (val === undefined || val === null || String(val).trim() === '') {
          return `${col.label} is required.`;
        }
      }
    }

    const today = new Date().toISOString().split('T')[0];
    if (['incident-log', 'hazard-reporting', 'near-miss'].includes(schema.id) && data.date && data.date > today) {
      return 'Report date cannot be in the future.';
    }
    if (schema.id === 'action-tracker') {
      if (data.completion_date && data.completion_date > today) return 'Completion date cannot be in the future.';
      if (data.status_id === 'Closed' && !data.completion_date) return 'A completion date is required to close a CAPA.';
    }
    if (schema.id === 'incident-log' && Array.isArray(data.actions)) {
      for (let index = 0; index < data.actions.length; index += 1) {
        const action = normalizeIncidentAction(data.actions[index]);
        if (!String(action?.action ?? '').trim()) return `Action ${index + 1} text is required.`;
        if (!action.legacy && !action.responsible_person) return `Responsible Person for action ${index + 1} is required.`;
        if (!action.legacy && !action.responsible_department) return `Responsible Department for action ${index + 1} is required.`;
        if (!action.legacy && !action.timeline) return `Timeline / Deadline for action ${index + 1} is required.`;
        if (action.timeline && action.timeline > today) return `Action ${index + 1} deadline cannot be in the future.`;
      }
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, isEdit = false) => {
    const { name, value, type } = e.target as any;
    let finalValue: any = type === 'number' ? (value === '' ? '' : Number(value)) : value;
    if (isEdit) {
      setEditFormData((prev: any) => applyComputes({ ...prev, [name]: finalValue }, schema, entries));
    } else {
      setFormData((prev: any) => applyComputes({ ...prev, [name]: finalValue }, schema, entries));
    }
  };

  useEffect(() => {
    const empId = formData.emp_id;
    if (empId && empId.length >= 3) {
      const timeoutId = setTimeout(async () => {
        try {
          const response = await apiClient.get(`/employees/lookup/${empId}`);
          if (response.data && response.data.success && response.data.data) {
              const emp = response.data.data;
              
              setFormData((prev: any) => {
                let mappedDept = prev.department_id;
                const deptName = emp.department?.name || '';
                if (deptName) {
                  if (deptName.includes('Production')) mappedDept = 'PRD';
                  else if (deptName.includes('HSE')) mappedDept = 'HSE';
                  else if (deptName.includes('Maintenance')) mappedDept = 'ESD';
                  else mappedDept = 'Others';
                }
                
                return {
                  ...prev,
                  originator: emp.user?.firstName ? `${emp.user.firstName} ${emp.user.lastName}` : prev.originator,
                  reported_by: emp.user?.firstName ? `${emp.user.firstName} ${emp.user.lastName}` : prev.reported_by,
                  person_name: emp.user?.firstName ? `${emp.user.firstName} ${emp.user.lastName}` : prev.person_name,
                  department_id: mappedDept,
                  designation: emp.designation || prev.designation,
                  gender: emp.user?.gender || emp.gender || prev.gender,
                };
              });
          }
        } catch (error) {
          // Ignore lookup errors silently (e.g., typing incomplete ID)
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.emp_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const dataToSave = applyComputes(formData, schema, entries);
    const err = validateFormData(dataToSave);
    if (err) {
      setValidationError(err);
      document.getElementById('modal-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const result = await createRecord(dataToSave);
    if (result.success) {
      setFormData({});
      setIsAddModalOpen(false);
      window.dispatchEvent(new CustomEvent('dashboard-refresh'));
    } else {
      setValidationError(result.message || 'Failed to save record. Please check your data.');
      document.getElementById('modal-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) await deleteRecord(id);
  };

  const startEdit = (entry: any) => {
    setEditingId(entry.id);
    setEditFormData({ ...entry, actions: Array.isArray(entry.actions) ? entry.actions.map(normalizeIncidentAction) : [] });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const originalRecord = entries.find(e => e.id === editingId);
    const updatedData = applyComputes(editFormData, schema, entries);
    const err = validateFormData(updatedData);
    if (err) {
      setValidationError(err);
      return;
    }
    if (originalRecord && originalRecord.status_id !== updatedData.status_id) {
      updatedData.statusHistory = [
        ...(originalRecord.statusHistory ?? []),
        { user: user?.name ?? 'System', oldStatus: originalRecord.status_id ?? 'None', newStatus: updatedData.status_id, timestamp: new Date().toISOString() }
      ];
    }
    const result = await updateRecord(editingId, updatedData);
    if (result.success) {
      setEditingId(null);
    } else {
      setValidationError(result.message || 'Failed to update record.');
    }
  };

  const handleReviewAction = async (action: 'Approved' | 'Rejected' | 'Open') => {
    const selectedIds = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (selectedIds.length === 0) {
      alert('Please select at least one record from the table first.');
      return;
    }
    
    for (const id of selectedIds) {
      const originalRecord = entries.find(e => e.id === id);
      if (!originalRecord) continue;
      
      const updatedData = { ...originalRecord, status_id: action, status: action, reviewRemarks: reviewData.remarks, reviewReason: reviewData.reason };
      updatedData.statusHistory = [
        ...(originalRecord.statusHistory ?? []),
        { user: user?.name ?? 'System', oldStatus: originalRecord.status_id ?? originalRecord.status ?? 'None', newStatus: action, timestamp: new Date().toISOString() }
      ];
      
      await updateRecord(id, updatedData);
    }
    
    setSelectedRows({});
    setReviewData({ remarks: '', reason: '' });
    setShowReviewPanel(false);
  };

  const filteredEntries = useMemo(() => entries.filter(entry => {
    if (filters.department && filters.department !== 'All' && entry.department_id !== filters.department) return false;
    if (filters.status && filters.status !== 'All' && entry.status_id !== filters.status) return false;
    const recordDate = entry.date || entry.target_date || entry.due_date;
    if (filters.year && filters.year !== 'All' && recordDate && !recordDate.startsWith(filters.year)) return false;
    if (filters.fromDate && recordDate && recordDate < filters.fromDate) return false;
    if (filters.toDate && recordDate && recordDate > filters.toDate) return false;
    if (routeCategory) {
      const normalize = (value: unknown) => String(value || '').toLowerCase().replaceAll('_', ' ').trim();
      const category = entry.incident_category_id || entry.incidentType || entry.category;
      if (normalize(category) !== normalize(routeCategory)) return false;
    }
    return true;
  }), [entries, filters, routeCategory]);

  const searchedEntries = useMemo(() => {
    if (!searchQuery.trim()) return filteredEntries;
    const q = searchQuery.toLowerCase();
    return filteredEntries.filter(entry => JSON.stringify(entry).toLowerCase().includes(q));
  }, [filteredEntries, searchQuery, schema.columns]);

  const sortedEntries = useMemo(() => {
    if (!sortConfig) return searchedEntries;
    const valueForSort = (entry: any) => {
      const values: Record<string, unknown> = {
        incidentNumber: entry.incidentNumber || entry.incident_number || entry.id,
        date: entry.date || entry.incidentDate || entry.incident_date || entry.createdAt,
        description: entry.description,
        emp_id: entry.emp_id,
        department_id: entry.department_id || entry.departmentId,
        incident_category_id: entry.incident_category_id || entry.incidentType,
        location: entry.location,
        risk_rating_id: entry.risk_rating_id || entry.severityLevel,
        status_id: entry.status_id || entry.status,
      };
      return String(values[sortConfig.key] ?? '').toLowerCase();
    };
    return [...searchedEntries].sort((left, right) => {
      const comparison = valueForSort(left).localeCompare(valueForSort(right), undefined, { numeric: true, sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [searchedEntries, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / PAGE_SIZE));
  const pagedEntries = sortedEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const startRecord = sortedEntries.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(currentPage * PAGE_SIZE, sortedEntries.length);
  const visibleColumns = schema.columns.filter(col => !col.hideFromForm && col.type !== 'file');
  const sectionGroups = moduleSections(schema);
  const exportCSV = async () => {
    try {
      const cols = schema.columns.filter(c => !c.hideFromForm);
      const headers = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
      const rows = searchedEntries.map(entry => {
        return cols.map(c => {
          let val = entry[c.key] ?? '';
          if (typeof val === 'object') val = JSON.stringify(val);
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
      });
      const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `${schema.id}_${new Date().toISOString().split('T')[0]}.csv`, style: { display: 'none' } });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export Failed:', e);
    }
  };

  const renderField = (col: ColumnSchema, value: any, isEdit = false) => {
    if (col.type === 'file') {
      return (
        <label className="block rounded-lg border border-dashed border-[#D6D6D6] bg-[#FAFAFA] p-4 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white border border-[#E0E0E0] flex items-center justify-center text-[#9CA3AF]">
              <Upload className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#1A1818]">{col.label}</p>
              <p className="text-[11px] text-[#9CA3AF]">Select a file to upload it through the enterprise attachment service.</p>
            </div>
          </div>
          <input type="file" className="sr-only" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadClient.upload(file, { module: schema.id, recordId: selectedRecordId || '' })
              .catch((error: unknown) => console.error('Attachment upload failed', error));
          }} />
        </label>
      );
    }

    if (col.type === 'select') {
      return (
        <div className="space-y-2">
          <select name={col.key} value={value ?? ''} onChange={e => handleInputChange(e, isEdit)} className={FIELD_BASE} required={col.required} disabled={col.readonly}>
            <option value="">Select...</option>
            {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {(value === 'Others' || value === 'Other') && (
            <input
              type="text"
              name={`${col.key}_other`}
              value={(isEdit ? editFormData : formData)[`${col.key}_other`] ?? ''}
              onChange={e => handleInputChange(e, isEdit)}
              placeholder={`Specify ${col.label}`}
              className={FIELD_BASE}
              required
            />
          )}
        </div>
      );
    }

    if (col.type === 'textarea') {
      return (
        <textarea name={col.key} value={value ?? ''} onChange={e => handleInputChange(e, isEdit)} className={TEXTAREA_BASE} rows={4} required={col.required} readOnly={col.readonly} />
      );
    }

    if (col.type === 'date') {
      return (
        <DatePickerField
          label={col.label}
          value={value ?? ''}
          required={col.required}
          disabled={col.readonly}
          onChange={nextValue => handleInputChange({
            target: { name: col.key, value: nextValue, type: 'date' }
          } as React.ChangeEvent<HTMLInputElement>, isEdit)}
        />
      );
    }

    if (col.type === 'datetime') {
      return <input type="datetime-local" name={col.key} value={value ?? ''} onChange={e => handleInputChange(e, isEdit)} className={FIELD_BASE} required={col.required} readOnly={col.readonly} />;
    }

    if (col.type === 'time') {
      return (
        <TimePickerField
          label={col.label}
          value={value ?? ''}
          onChange={v => handleInputChange({ target: { name: col.key, value: v } } as any, isEdit)}
          required={col.required}
          disabled={col.readonly}
        />
      );
    }

    return (
      <input
        type={col.type === 'number' ? 'number' : 'text'}
        name={col.key}
        value={value ?? ''}
        onChange={e => handleInputChange(e, isEdit)}
        className={FIELD_BASE}
        required={col.required}
        readOnly={col.readonly}
        placeholder={col.placeholder}
      />
    );
  };

  const renderFormSection = (sectionTitle: string, columns: ColumnSchema[]) => {
    const visible = columns.filter(col => shouldShowConditionalField(schema.id, col.key, isAddModalOpen ? formData : editFormData));
    if (schema.id === 'near-miss' && sectionTitle === 'Investigation' && formData.investigation_required !== 'Yes' && editFormData.investigation_required !== 'Yes') {
      return null;
    }
    if (schema.id === 'incident-log' && sectionTitle === 'Actions') {
      const isEdit = Boolean(editingId);
      const source = isEdit ? editFormData : formData;
      const actions: IncidentAction[] = Array.isArray(source.actions) ? source.actions.map(normalizeIncidentAction) : [];
      const setActions = (nextActions: IncidentAction[]) => {
        if (isEdit) setEditFormData((previous: any) => ({ ...previous, actions: nextActions }));
        else setFormData((previous: any) => ({ ...previous, actions: nextActions }));
      };
      const updateAction = (index: number, key: keyof IncidentAction, value: string) => {
        setActions(actions.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
      };

      return (
        <div key={sectionTitle} className="rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-[#CB0017]" />
              <div>
                <h3 className="text-[14px] font-semibold text-[#1A1818]">Actions</h3>
                <div className="mt-2 h-px w-24 bg-[#F0F0F0]" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActions([...actions, createIncidentAction()])}
              disabled={actions.length >= MAX_INCIDENT_ACTIONS}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#CB0017] px-3 py-1.5 text-[12px] font-semibold text-[#CB0017] hover:bg-[#FFF5F6] disabled:cursor-not-allowed disabled:border-[#D1D5DB] disabled:text-[#9CA3AF] disabled:hover:bg-transparent"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Action
            </button>
          </div>
          <p className="mt-3 text-[12px] text-[#6B7280]">Track corrective and preventive work against this incident.</p>
          {actions.length >= MAX_INCIDENT_ACTIONS && <p className="mt-2 text-[12px] font-semibold text-[#CB0017]">Maximum limit of 15 actions reached.</p>}
          <div className="mt-4 space-y-3">
            {actions.length === 0 && <div className="rounded-lg border border-dashed border-[#D9D9D9] px-4 py-5 text-center text-[12px] text-[#9CA3AF]">No actions added yet.</div>}
            {actions.map((row, index) => (
              <div key={`incident-action-${index}`} className="grid grid-cols-1 items-end gap-2 rounded-lg border border-[#EEEEEE] bg-[#FCFCFC] p-3 md:grid-cols-[minmax(0,1.5fr)_minmax(130px,.8fr)_minmax(130px,.8fr)_145px_110px_110px_auto]">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Action</label>
                  <input className={FIELD_BASE} value={row.action} onChange={event => updateAction(index, 'action', event.target.value)} placeholder="Describe the action" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Responsible Person</label>
                  <input className={FIELD_BASE} value={row.responsible_person} onChange={event => updateAction(index, 'responsible_person', event.target.value)} placeholder="Person" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Responsible Department</label>
                  <input className={FIELD_BASE} value={row.responsible_department} onChange={event => updateAction(index, 'responsible_department', event.target.value)} placeholder="Department" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Timeline / Deadline</label>
                  <DatePickerField label="Timeline / Deadline" value={row.timeline} onChange={value => updateAction(index, 'timeline', value)} />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Severity</label>
                  <select className={FIELD_BASE} value={row.severity} onChange={event => updateAction(index, 'severity', event.target.value)}>
                    {['Low', 'Medium', 'High'].map(option => <option key={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Status</label>
                  <select className={FIELD_BASE} value={row.status} onChange={event => updateAction(index, 'status', event.target.value)}>
                    {['Open', 'Planned', 'Closed'].map(option => <option key={option}>{option}</option>)}
                  </select>
                </div>
                <button type="button" aria-label={`Remove action ${index + 1}`} onClick={() => setActions(actions.filter((_, rowIndex) => rowIndex !== index))} className="inline-flex h-9 items-center justify-center rounded-md border border-[#F1C5C9] px-2 text-[#CB0017] hover:bg-[#FFF5F6]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div key={sectionTitle} className="rounded-2xl border border-[#EAEAEA] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-[#CB0017]" />
          <div>
            <h3 className="text-[14px] font-semibold text-[#1A1818]">{sectionTitle}</h3>
            <div className="mt-2 h-px w-24 bg-[#F0F0F0]" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(col => (
            <div key={col.key} className={col.type === 'textarea' || col.type === 'file' ? 'md:col-span-2 xl:col-span-3' : ''}>
              <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                {col.label}
                {col.required && <span className="text-[#CB0017] ml-1">*</span>}
              </label>
              {renderField(col, (isAddModalOpen ? formData : editFormData)[col.key], !!editingId)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAddEditModal = () => {
    const formSource = editingId ? editFormData : formData;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
        <div className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl bg-[#F5F5F5] border border-[#E0E0E0] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col">
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#E0E0E0] bg-white">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                {editingId ? 'Edit Record' : 'Create Record'}
              </p>
              <h2 className="text-[18px] font-bold text-[#1A1818] mt-1">{schema.title}</h2>
              <p className="text-[12px] text-[#6B7280] mt-1">Scrollable enterprise form with section cards and future-ready placeholders.</p>
            </div>
            <button
              onClick={() => { setIsAddModalOpen(false); setEditingId(null); setValidationError(null); setFormData({}); setEditFormData({}); }}
              className="w-8 h-8 rounded-md text-[#9CA3AF] hover:text-[#1A1818] hover:bg-[#F5F5F5] transition-colors"
            >
              <X className="h-4 w-4 mx-auto" />
            </button>
          </div>

          <div id="modal-scroll-area" className="flex-1 overflow-y-auto p-6 space-y-5">
            {validationError && (
              <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-[#DC2626]" />
                <div>
                  <p className="text-[13px] font-semibold text-[#991B1B]">Validation Error</p>
                  <p className="text-[12px] text-[#B91C1C] mt-0.5">{validationError}</p>
                </div>
              </div>
            )}

            {schema.id === 'hazard-reporting' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Open', color: '#92400E', bg: '#FEF9EC' },
                  { title: 'Assigned', color: '#1D4ED8', bg: '#EFF6FF' },
                  { title: 'Submitted for Review', color: '#6D28D9', bg: '#F5F3FF' },
                ].map(card => (
                  <div key={card.title} className="rounded-xl border border-[#EDEDED] bg-white p-4">
                    <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">{card.title}</p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold" style={{ backgroundColor: card.bg, color: card.color }}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      Mock status
                    </div>
                  </div>
                ))}
              </div>
            )}

            {schema.id === 'hazard-reporting' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  { title: 'High Risk Hazard Assigned', detail: 'Assigned to Responsible Person queue.' },
                  { title: 'Hazard Closed', detail: 'Review proof before closing.' },
                  { title: 'Hazard Approved', detail: 'Approval badge is ready for the next workflow step.' },
                ].map(card => (
                  <button
                    key={card.title}
                    onClick={() => setSelectedRecordId(card.title)}
                    className={`text-left rounded-xl border p-4 transition-colors ${selectedRecordId === card.title ? 'border-[#CB0017] bg-[#FFF7F7]' : 'border-[#EDEDED] bg-white hover:bg-[#FAFAFA]'}`}
                  >
                    <p className="text-[13px] font-semibold text-[#1A1818]">{card.title}</p>
                    <p className="text-[12px] text-[#6B7280] mt-1">{card.detail}</p>
                  </button>
                ))}
              </div>
            )}

            <form id="module-form" onSubmit={handleSubmit} className="space-y-5">
              {sectionGroups.map(section => {
                if (schema.id === 'near-miss' && section.title === 'Investigation' && (formSource.investigation_required ?? 'No') !== 'Yes') {
                  return null;
                }
                return renderFormSection(section.title, section.columns);
              })}
            </form>
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-[#E0E0E0] bg-white px-6 py-4">
            <div className="text-[11px] text-[#9CA3AF]">
              Fields marked with <span className="text-[#CB0017]">*</span> are required
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingId(null);
                  setValidationError(null);
                  setFormData({});
                  setEditFormData({});
                }}
                className="h-9 px-4 text-[13px] font-medium rounded-md border border-[#DEDEDE] text-[#374151] hover:bg-[#F5F5F5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="module-form"
                className="h-9 px-5 text-[13px] font-medium rounded-md bg-[#CB0017] text-white hover:bg-[#A8001A] inline-flex items-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {editingId ? 'Save Changes' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const entityName = schema.title.replace('Reporting', '').trim();

  const renderHazardWorkspace = () => (
    <Layout>
      <ContextHeader
        title={schema.title}
        breadcrumbs={[schema.title]}
        subtitle={`${filteredEntries.length} records available`}
        actions={[
          ...(canExportCSV() ? [{
            label: 'Export CSV',
            icon: <Download />,
            onClick: exportCSV,
            variant: 'outlined' as const,
          }] : []),
          ...(canAddData() ? [{
            label: `Add ${entityName}`,
            icon: <Plus />,
            onClick: () => setIsAddModalOpen(true),
            variant: 'primary' as const,
          }] : []),
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <FilterBar />
          <button onClick={() => setShowReviewPanel(true)} className="h-8 px-3 text-[12px] font-medium rounded-md border border-[#DEDEDE] bg-white text-[#374151] hover:bg-[#F5F5F5] inline-flex items-center gap-1.5">
            <PanelRightOpen className="h-3.5 w-3.5" /> HSE Review
          </button>
          <button onClick={() => setShowCloseHazard(true)} className="h-8 px-3 text-[12px] font-medium rounded-md border border-[#CB0017]/30 bg-[#FFF7F7] text-[#CB0017] hover:bg-[#FDECEC] inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Close {entityName}
          </button>
          <button onClick={() => setShowMobileFilters(true)} className="md:hidden h-8 px-3 text-[12px] font-medium rounded-md border border-[#DEDEDE] bg-white text-[#374151] inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
        </div>
      </ContextHeader>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { title: `${entityName} Assigned`, value: '12', tone: 'warning' },
            { title: 'Submitted for Review', value: '4', tone: 'neutral' },
            { title: 'Closed This Month', value: '9', tone: 'success' },
          ].map(card => (
            <div key={card.title} className={`${CARD} p-4`}>
              <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">{card.title}</p>
              <p className="text-[24px] font-bold text-[#1A1818] mt-2">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { title: `High Risk ${entityName} Assigned`, detail: 'Click to highlight the corresponding record.' },
            { title: `${entityName} Closed`, detail: 'Closing proof will be reviewed in the confirmation dialog.' },
            { title: `${entityName} Approved`, detail: 'Mock approval workflow entry.' },
          ].map(card => (
            <button
              key={card.title}
              onClick={() => setSelectedRecordId(card.title)}
              className={`text-left ${CARD} p-4 transition-all hover:shadow-[0_3px_14px_rgba(0,0,0,0.10)] ${selectedRecordId === card.title ? 'ring-2 ring-[#CB0017]/20 border-[#CB0017]/30' : ''}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-[#1A1818]">{card.title}</p>
                  <p className="text-[12px] text-[#6B7280] mt-1">{card.detail}</p>
                </div>
                <Eye className="h-4 w-4 text-[#9CA3AF]" />
              </div>
            </button>
          ))}
        </div>

        <div className={CARD}>
          <div className="flex items-center justify-between gap-3 border-b border-[#F0F0F0] px-4 py-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-[#CB0017]" />
              <h3 className="text-[12px] font-bold text-[#374151] uppercase tracking-wider">{entityName} Register</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDensity('compact')} className={`h-8 px-3 text-[12px] rounded-md border ${density === 'compact' ? 'bg-[#CB0017] text-white border-[#CB0017]' : 'bg-white text-[#374151] border-[#DEDEDE]'}`}>Compact</button>
              <button onClick={() => setDensity('comfortable')} className={`h-8 px-3 text-[12px] rounded-md border ${density === 'comfortable' ? 'bg-[#CB0017] text-white border-[#CB0017]' : 'bg-white text-[#374151] border-[#DEDEDE]'}`}>Comfortable</button>
              <button onClick={() => setDensity('spacious')} className={`h-8 px-3 text-[12px] rounded-md border ${density === 'spacious' ? 'bg-[#CB0017] text-white border-[#CB0017]' : 'bg-white text-[#374151] border-[#DEDEDE]'}`}>Spacious</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full enterprise-table">
              <thead>
                <tr>
                  <th className="w-10"><input type="checkbox" className="rounded border-[#D1D5DB]" /></th>
                  {visibleColumns.map(col => <th key={col.key}>{col.label}</th>)}
                  <th className="text-center">Audit</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && pagedEntries.length === 0 ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td />
                    {visibleColumns.map(col => <td key={col.key}><div className="h-3.5 bg-[#F0F0F0] rounded animate-pulse w-[70%]" /></td>)}
                    <td /><td />
                  </tr>
                )) : pagedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 3}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="h-12 w-12 mb-3 text-[#E0E0E0]" />
                        <p className="text-[14px] font-semibold text-[#374151]">No records found</p>
                        <p className="text-[12px] text-[#9CA3AF] mt-1">Use the filters or add a new hazard record.</p>
                      </div>
                    </td>
                  </tr>
                ) : pagedEntries.map((entry, rowIdx) => {
                  const isSelected = selectedRecordId === entry.id;
                  const rowClass = `${rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'} ${isSelected ? '!bg-[#FFF7F7]' : ''}`;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr className={rowClass} onClick={() => setSelectedRecordId(entry.id)}>
                        <td>
                          <input
                            type="checkbox"
                            checked={!!selectedRows[entry.id]}
                            onChange={e => setSelectedRows(prev => ({ ...prev, [entry.id]: e.target.checked }))}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        {visibleColumns.map(col => (
                          <td key={col.key} style={{ paddingTop: density === 'compact' ? 8 : density === 'spacious' ? 16 : 10, paddingBottom: density === 'compact' ? 8 : density === 'spacious' ? 16 : 10 }}>
                            {editingId === entry.id ? renderField(col, editFormData[col.key], true) : STATUS_COLUMNS.has(col.key) && entry[col.key] ? <StatusBadge status={entry[col.key]} size="sm" /> : <span className="text-[13px] text-[#1A1818]">{entry[col.key] ? String(entry[col.key]) : <span className="text-[#CCCCCC]">—</span>}</span>}
                          </td>
                        ))}
                        <td className="text-center">
                          <button onClick={e => { e.stopPropagation(); setStatusHistoryModal({ isOpen: true, record: entry }); }} className="inline-flex items-center justify-center w-7 h-7 rounded text-[#9CA3AF] hover:text-[#CB0017] hover:bg-[#FFF7F7]">
                            <History className="h-3.5 w-3.5" />
                          </button>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {editingId === entry.id ? (
                              <>
                                <button onClick={e => { e.stopPropagation(); saveEdit(); }} className="h-7 px-2 rounded text-[12px] font-medium bg-[#CB0017] text-white hover:bg-[#A8001A]">
                                  Save
                                </button>
                                <button onClick={e => { e.stopPropagation(); setEditingId(null); setEditFormData({}); }} className="h-7 px-2 rounded text-[12px] font-medium border border-[#DEDEDE] text-[#374151] hover:bg-[#F5F5F5]">
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                {canEditData() && (
                                  <button onClick={e => { e.stopPropagation(); startEdit(entry); }} className="w-7 h-7 rounded text-[#6B7280] hover:text-[#CB0017] hover:bg-[#FFF7F7]">
                                    <Edit2 className="h-3.5 w-3.5 mx-auto" />
                                  </button>
                                )}
                                {canDeleteData() && (
                                  <button onClick={e => { e.stopPropagation(); handleDelete(entry.id); }} className="w-7 h-7 rounded text-[#6B7280] hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-3.5 w-3.5 mx-auto" />
                                  </button>
                                )}
                              </>
                            )}
                            <button onClick={e => { e.stopPropagation(); setExpandedRows(prev => ({ ...prev, [entry.id]: !prev[entry.id] })); }} className="w-7 h-7 rounded text-[#6B7280] hover:text-[#1A1818] hover:bg-[#F5F5F5]">
                              <ChevronRight className={`h-3.5 w-3.5 mx-auto transition-transform ${expandedRows[entry.id] ? 'rotate-90' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[entry.id] && (
                        <tr className="bg-[#FAFAFA]">
                          <td />
                          <td colSpan={visibleColumns.length + 2}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                              <div className="rounded-lg border border-[#EDEDED] bg-white p-4">
                                <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Expansion Summary</p>
                                <p className="text-[13px] text-[#374151] mt-2">Additional row details can be wired to a future detail drawer.</p>
                              </div>
                              <div className="rounded-lg border border-[#EDEDED] bg-white p-4">
                                <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Selected By</p>
                                <p className="text-[13px] text-[#374151] mt-2">{user?.name ?? 'System'}</p>
                              </div>
                              <div className="rounded-lg border border-[#EDEDED] bg-white p-4">
                                <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Workflow</p>
                                <p className="text-[13px] text-[#374151] mt-2">Mock row expansion for enterprise detail review.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {searchedEntries.length > 0 && (
            <div className="flex items-center justify-between gap-4 border-t border-[#F0F0F0] bg-[#FAFAFA] px-4 py-3">
              <p className="text-[12px] text-[#6B7280]">
                Showing <span className="font-semibold text-[#374151]">{startRecord}-{endRecord}</span> of{' '}
                <span className="font-semibold text-[#374151]">{searchedEntries.length}</span> records
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded border border-[#DEDEDE] bg-white disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4 mx-auto" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = totalPages <= 5 ? i + 1 : Math.max(1, currentPage - 2) + i;
                  if (page > totalPages) return null;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded border text-[13px] font-medium ${page === currentPage ? 'bg-[#CB0017] text-white border-[#CB0017]' : 'bg-white text-[#374151] border-[#DEDEDE]'}`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded border border-[#DEDEDE] bg-white disabled:opacity-40">
                  <ChevronRight className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && renderAddEditModal()}
      {editingId && renderAddEditModal()}

      {statusHistoryModal.isOpen && statusHistoryModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-lg rounded-lg overflow-hidden flex flex-col border border-[#E0E0E0] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0] bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#CB0017]" />
                <h2 className="text-[14px] font-bold text-[#1A1818]">Status Audit Log</h2>
              </div>
              <button onClick={() => setStatusHistoryModal({ isOpen: false, record: null })} className="w-7 h-7 rounded text-[#9CA3AF] hover:bg-[#F5F5F5]">
                <X className="h-4 w-4 mx-auto" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {(!statusHistoryModal.record.statusHistory || statusHistoryModal.record.statusHistory.length === 0) ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-[#E0E0E0]" />
                  <p className="text-[13px] text-[#9CA3AF]">No status changes recorded</p>
                </div>
              ) : (
                <div className="relative space-y-4 pl-10">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-[#E0E0E0]" />
                  {statusHistoryModal.record.statusHistory.map((h: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[30px] w-4 h-4 rounded-full border-2 border-white bg-[#CB0017]" />
                      <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1A1818]">
                            <User className="h-3 w-3 text-[#9CA3AF]" /> {h.user}
                          </div>
                          <span className="text-[11px] text-[#9CA3AF]">{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded line-through">{h.oldStatus}</span>
                          <ArrowRight className="h-3 w-3 text-[#9CA3AF]" />
                          <span className="px-2 py-0.5 rounded font-medium bg-[#FFF7F7] text-[#CB0017] border border-[#CB0017]/20">{h.newStatus}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SlideOverPanel isOpen={showReviewPanel} onClose={() => setShowReviewPanel(false)} title="HSE Review" description="Mock review drawer for approvals, rejections, and reopen actions.">
        <div className="space-y-5">
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">Remarks</label>
            <textarea 
              className={TEXTAREA_BASE} 
              rows={4} 
              placeholder="Enter review remarks..." 
              value={reviewData.remarks}
              onChange={e => setReviewData({ ...reviewData, remarks: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">Reason</label>
            <textarea 
              className={TEXTAREA_BASE} 
              rows={4} 
              placeholder="Enter review reason..." 
              value={reviewData.reason}
              onChange={e => setReviewData({ ...reviewData, reason: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => handleReviewAction('Approved')} className="h-9 px-4 text-[13px] font-medium rounded-md bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">Approve</button>
            <button onClick={() => handleReviewAction('Rejected')} className="h-9 px-4 text-[13px] font-medium rounded-md bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">Reject</button>
            <button onClick={() => handleReviewAction('Open')} className="h-9 px-4 text-[13px] font-medium rounded-md bg-white text-[#374151] border border-[#DEDEDE]">Reopen</button>
          </div>
        </div>
      </SlideOverPanel>

      <CenterModal
        isOpen={showCloseHazard}
        onClose={() => setShowCloseHazard(false)}
        title="Close Hazard"
        description="Submit closing proof for review. No permanent close action is performed."
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-dashed border-[#D6D6D6] bg-[#FAFAFA] p-4">
            <p className="text-[13px] font-semibold text-[#1A1818]">Upload Closing Proof</p>
            <p className="text-[12px] text-[#9CA3AF] mt-1">Files are uploaded through the enterprise attachment service.</p>
            <div className="mt-3 h-28 rounded-lg border border-[#E0E0E0] bg-white flex items-center justify-center text-[#9CA3AF]">
              <Paperclip className="h-4 w-4 mr-2" /> Drag or choose a file
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">Closing Remarks</label>
            <textarea className={TEXTAREA_BASE} rows={4} value={closeHazardData.closingRemarks} onChange={e => setCloseHazardData(prev => ({ ...prev, closingRemarks: e.target.value }))} placeholder="Enter closing remarks..." />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button className="h-9 px-4 text-[13px] font-medium rounded-md border border-[#DEDEDE] text-[#374151] hover:bg-[#F5F5F5]" onClick={() => setShowCloseHazard(false)}>Cancel</button>
            <button className="h-9 px-4 text-[13px] font-medium rounded-md bg-[#CB0017] text-white hover:bg-[#A8001A]">Submit for Review</button>
          </div>
        </div>
      </CenterModal>

      <SlideOverPanel isOpen={showMobileFilters} onClose={() => setShowMobileFilters(false)} title="Filters" description="Mobile filter drawer for enterprise modules.">
        <FilterBar className="flex-col items-stretch" />
      </SlideOverPanel>
    </Layout>
  );

  const renderGenericWorkspace = () => (
    <Layout>
      <ContextHeader
        title={schema.title}
        breadcrumbs={[schema.title]}
        subtitle={`${filteredEntries.length} records${searchQuery ? ` filtered by "${searchQuery}"` : ''}`}
        actions={[
          ...(canExportCSV() ? [{
            label: 'Export CSV',
            icon: <Download />,
            onClick: exportCSV,
            variant: 'outlined' as const,
          }] : []),
          ...(canAddData() ? [{
            label: `Add ${schema.title.replace(/s$/, '')}`,
            icon: <Plus />,
            onClick: () => setIsAddModalOpen(true),
            variant: 'primary' as const,
          }] : []),
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <FilterBar />
          <button onClick={() => setShowMobileFilters(true)} className="md:hidden h-8 px-3 text-[12px] font-medium rounded-md border border-[#DEDEDE] bg-white text-[#374151] inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
        </div>
      </ContextHeader>

      <div className="p-6 space-y-5">
        {schema.id === 'training-records' && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total Trainings', value: entries.length },
              { label: 'Training Hours', value: Math.round(entries.reduce((sum, item) => sum + (Number(item.manhours) || 0), 0)) },
              { label: 'Attendance %', value: '94%' },
              { label: 'Pending Trainings', value: entries.filter(item => item.status_id !== 'Closed').length },
            ].map(card => (
              <div key={card.label} className={`${CARD} p-4`}>
                <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">{card.label}</p>
                <p className="text-[24px] font-bold text-[#1A1818] mt-2">{card.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className={`${CARD} overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 border-b border-[#F0F0F0] px-4 py-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <input
                type="search"
                placeholder={`Search ${schema.title.toLowerCase()}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-[13px] border border-[#DEDEDE] rounded-md bg-white focus:outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/15"
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDensity('compact')} className={`h-8 px-3 text-[12px] rounded-md border ${density === 'compact' ? 'bg-[#CB0017] text-white border-[#CB0017]' : 'bg-white text-[#374151] border-[#DEDEDE]'}`}>Compact</button>
              <button onClick={() => setDensity('comfortable')} className={`h-8 px-3 text-[12px] rounded-md border ${density === 'comfortable' ? 'bg-[#CB0017] text-white border-[#CB0017]' : 'bg-white text-[#374151] border-[#DEDEDE]'}`}>Comfortable</button>
              <button onClick={exportCSV} className="h-8 px-3 text-[12px] font-medium rounded-md border border-[#DEDEDE] bg-white text-[#374151] hover:bg-[#F5F5F5] inline-flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full enterprise-table">
              <thead>
                <tr>
                  <th className="w-10"><input type="checkbox" className="rounded border-[#D1D5DB]" /></th>
                  {visibleColumns.map(col => <th key={col.key}>{col.label}</th>)}
                  <th className="text-center">Audit</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && pagedEntries.length === 0 ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td />
                    {visibleColumns.map(col => <td key={col.key}><div className="h-3.5 bg-[#F0F0F0] rounded animate-pulse w-[70%]" /></td>)}
                    <td /><td />
                  </tr>
                )) : pagedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 3}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="h-12 w-12 mb-3 text-[#E0E0E0]" />
                        <p className="text-[14px] font-semibold text-[#374151]">{searchQuery ? 'No matching records' : 'No records found'}</p>
                        <p className="text-[12px] text-[#9CA3AF] mt-1">
                          {searchQuery ? `No results for "${searchQuery}".` : 'No records match the active filters.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : pagedEntries.map((entry, rowIdx) => {
                  const isSelected = selectedRecordId === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr className={`${rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'} ${isSelected ? '!bg-[#FFF7F7]' : ''}`} onClick={() => setSelectedRecordId(entry.id)}>
                        <td>
                          <input
                            type="checkbox"
                            checked={!!selectedRows[entry.id]}
                            onChange={e => setSelectedRows(prev => ({ ...prev, [entry.id]: e.target.checked }))}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        {visibleColumns.map(col => (
                          <td key={col.key}>
                            {editingId === entry.id ? renderField(col, editFormData[col.key], true) : STATUS_COLUMNS.has(col.key) && entry[col.key] ? <StatusBadge status={entry[col.key]} size="sm" /> : <span className="text-[13px] text-[#1A1818]">{entry[col.key] ? String(entry[col.key]) : <span className="text-[#CCCCCC]">—</span>}</span>}
                          </td>
                        ))}
                        <td className="text-center">
                          <button onClick={e => { e.stopPropagation(); setStatusHistoryModal({ isOpen: true, record: entry }); }} className="inline-flex items-center justify-center w-7 h-7 rounded text-[#9CA3AF] hover:text-[#CB0017] hover:bg-[#FFF7F7]">
                            <History className="h-3.5 w-3.5" />
                          </button>
                        </td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {canEditData() && editingId !== entry.id && (
                              <button onClick={e => { e.stopPropagation(); startEdit(entry); }} className="w-7 h-7 rounded text-[#6B7280] hover:text-[#CB0017] hover:bg-[#FFF7F7]">
                                <Edit2 className="h-3.5 w-3.5 mx-auto" />
                              </button>
                            )}
                            {canDeleteData() && (
                              <button onClick={e => { e.stopPropagation(); handleDelete(entry.id); }} className="w-7 h-7 rounded text-[#6B7280] hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="h-3.5 w-3.5 mx-auto" />
                              </button>
                            )}
                            <button onClick={e => { e.stopPropagation(); setExpandedRows(prev => ({ ...prev, [entry.id]: !prev[entry.id] })); }} className="w-7 h-7 rounded text-[#6B7280] hover:text-[#1A1818] hover:bg-[#F5F5F5]">
                              <ChevronRight className={`h-3.5 w-3.5 mx-auto transition-transform ${expandedRows[entry.id] ? 'rotate-90' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[entry.id] && (
                        <tr className="bg-[#FAFAFA]">
                          <td />
                          <td colSpan={visibleColumns.length + 2}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                              <div className="rounded-lg border border-[#EDEDED] bg-white p-4">
                                <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Detail Preview</p>
                                <p className="text-[13px] text-[#374151] mt-2">Expandable row content reserved for future backend integration.</p>
                              </div>
                              <div className="rounded-lg border border-[#EDEDED] bg-white p-4">
                                <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Updated By</p>
                                <p className="text-[13px] text-[#374151] mt-2">{user?.name ?? 'System'}</p>
                              </div>
                              <div className="rounded-lg border border-[#EDEDED] bg-white p-4">
                                <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">Workflow Notes</p>
                                <p className="text-[13px] text-[#374151] mt-2">Mock expansion UI for enterprise detail review.</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {searchedEntries.length > 0 && (
            <div className="flex items-center justify-between gap-4 border-t border-[#F0F0F0] bg-[#FAFAFA] px-4 py-3">
              <p className="text-[12px] text-[#6B7280]">
                Showing <span className="font-semibold text-[#374151]">{startRecord}-{endRecord}</span> of{' '}
                <span className="font-semibold text-[#374151]">{searchedEntries.length}</span> records
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded border border-[#DEDEDE] bg-white disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4 mx-auto" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = totalPages <= 5 ? i + 1 : Math.max(1, currentPage - 2) + i;
                  if (page > totalPages) return null;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded border text-[13px] font-medium ${page === currentPage ? 'bg-[#CB0017] text-white border-[#CB0017]' : 'bg-white text-[#374151] border-[#DEDEDE]'}`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded border border-[#DEDEDE] bg-white disabled:opacity-40">
                  <ChevronRight className="h-4 w-4 mx-auto" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && renderAddEditModal()}
      {editingId && renderAddEditModal()}

      {statusHistoryModal.isOpen && statusHistoryModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-lg rounded-lg overflow-hidden flex flex-col border border-[#E0E0E0] shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0E0] bg-[#FAFAFA]">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#CB0017]" />
                <h2 className="text-[14px] font-bold text-[#1A1818]">Status Audit Log</h2>
              </div>
              <button onClick={() => setStatusHistoryModal({ isOpen: false, record: null })} className="w-7 h-7 rounded text-[#9CA3AF] hover:bg-[#F5F5F5]">
                <X className="h-4 w-4 mx-auto" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {(!statusHistoryModal.record.statusHistory || statusHistoryModal.record.statusHistory.length === 0) ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-[#E0E0E0]" />
                  <p className="text-[13px] text-[#9CA3AF]">No status changes recorded</p>
                </div>
              ) : (
                <div className="relative space-y-4 pl-10">
                  <div className="absolute left-4 top-2 bottom-2 w-px bg-[#E0E0E0]" />
                  {statusHistoryModal.record.statusHistory.map((h: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[30px] w-4 h-4 rounded-full border-2 border-white bg-[#CB0017]" />
                      <div className="bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1A1818]">
                            <User className="h-3 w-3 text-[#9CA3AF]" /> {h.user}
                          </div>
                          <span className="text-[11px] text-[#9CA3AF]">{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px]">
                          <span className="px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded line-through">{h.oldStatus}</span>
                          <ArrowRight className="h-3 w-3 text-[#9CA3AF]" />
                          <span className="px-2 py-0.5 rounded font-medium bg-[#FFF7F7] text-[#CB0017] border border-[#CB0017]/20">{h.newStatus}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SlideOverPanel isOpen={showReviewPanel} onClose={() => setShowReviewPanel(false)} title="HSE Review" description="Mock review drawer for approvals, rejections, and reopen actions.">
        <div className="space-y-5">
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">Remarks</label>
            <textarea className={TEXTAREA_BASE} rows={4} placeholder="Enter review remarks..." />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">Reason</label>
            <textarea className={TEXTAREA_BASE} rows={4} placeholder="Enter review reason..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button className="h-9 px-4 text-[13px] font-medium rounded-md bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">Approve</button>
            <button className="h-9 px-4 text-[13px] font-medium rounded-md bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">Reject</button>
            <button className="h-9 px-4 text-[13px] font-medium rounded-md bg-white text-[#374151] border border-[#DEDEDE]">Reopen</button>
          </div>
        </div>
      </SlideOverPanel>

      <CenterModal
        isOpen={showCloseHazard}
        onClose={() => setShowCloseHazard(false)}
        title="Close Hazard"
        description="Submit closing proof for review. No permanent close action is performed."
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-dashed border-[#D6D6D6] bg-[#FAFAFA] p-4">
            <p className="text-[13px] font-semibold text-[#1A1818]">Upload Closing Proof</p>
            <p className="text-[12px] text-[#9CA3AF] mt-1">Files are uploaded through the enterprise attachment service.</p>
            <div className="mt-3 h-28 rounded-lg border border-[#E0E0E0] bg-white flex items-center justify-center text-[#9CA3AF]">
              <Paperclip className="h-4 w-4 mr-2" /> Drag or choose a file
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">Closing Remarks</label>
            <textarea className={TEXTAREA_BASE} rows={4} value={closeHazardData.closingRemarks} onChange={e => setCloseHazardData(prev => ({ ...prev, closingRemarks: e.target.value }))} placeholder="Enter closing remarks..." />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button className="h-9 px-4 text-[13px] font-medium rounded-md border border-[#DEDEDE] text-[#374151] hover:bg-[#F5F5F5]" onClick={() => setShowCloseHazard(false)}>Cancel</button>
            <button className="h-9 px-4 text-[13px] font-medium rounded-md bg-[#CB0017] text-white hover:bg-[#A8001A]">Submit for Review</button>
          </div>
        </div>
      </CenterModal>

      <SlideOverPanel isOpen={showMobileFilters} onClose={() => setShowMobileFilters(false)} title="Filters" description="Mobile filter drawer for enterprise modules.">
        <FilterBar className="flex-col items-stretch" />
      </SlideOverPanel>
    </Layout>
  );

  const renderIncidentWorkspace = () => (
    <Layout>
      <ContextHeader
        title={schema.title}
        breadcrumbs={[schema.title]}
        subtitle="Log, track, and investigate safety incidents"
        actions={[
          ...(canExportCSV() ? [{ label: 'Export CSV', icon: <Download />, onClick: exportCSV, variant: 'outlined' as const }] : []),
          { label: 'Report Incident', icon: <Plus />, onClick: () => setIsAddModalOpen(true), variant: 'primary' }
        ]}
      >
        <FilterBar variant="incident" />
      </ContextHeader>

      <div className="p-6 space-y-5">
        <div className={`${CARD} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0F0F0] px-4 py-3">
            <div>
              <h2 className="text-[14px] font-bold text-[#1C1C1E]">Incident Records</h2>
              <p className="mt-0.5 text-[12px] text-[#6B7280]">{searchedEntries.length} records from the latest backend data</p>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF]" />
              <input
                type="search"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-[13px] border border-[#DEDEDE] rounded-md bg-white focus:outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/15"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] enterprise-table">
              <thead>
                <tr>
                  {[
                    ['incidentNumber', 'Incident No.'], ['date', 'Date'], ['description', 'Description'],
                    ['emp_id', 'Emp ID'], ['department_id', 'Department'], ['incident_category_id', 'Category'],
                    ['location', 'Location'], ['risk_rating_id', 'Severity'], ['status_id', 'Status']
                  ].map(([key, label]) => (
                    <th key={key}>
                      <button
                        type="button"
                        onClick={() => setSortConfig(current => current?.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' })}
                        className="inline-flex items-center gap-1.5 text-left"
                      >
                        {label}
                        <ArrowUpDown className={`h-3.5 w-3.5 ${sortConfig?.key === key ? 'text-[#CB0017]' : 'text-[#9CA3AF]'}`} />
                      </button>
                    </th>
                  ))}
                  <th className="text-center">View Details</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && pagedEntries.length === 0 ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`incident-loading-${index}`}>
                    {Array.from({ length: 11 }).map((__, cellIndex) => <td key={cellIndex}><div className="h-3.5 w-[70%] rounded bg-[#F0F0F0] animate-pulse" /></td>)}
                  </tr>
                )) : pagedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FileText className="mb-3 h-12 w-12 text-[#E0E0E0]" />
                        <p className="text-[14px] font-semibold text-[#374151]">{searchQuery ? 'No matching incidents' : 'No incident records found'}</p>
                        <p className="mt-1 text-[12px] text-[#9CA3AF]">Try changing the search or active filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : pagedEntries.map((incident: any, rowIndex: number) => {
                  const incidentNumber = incident.incidentNumber || incident.incident_number || incident.id;
                  const date = incident.date || incident.incidentDate || incident.incident_date;
                  const department = incident.department_id || incident.departmentId || '—';
                  const category = incident.incident_category_id || incident.incidentType || '—';
                  const severity = incident.risk_rating_id || incident.severityLevel || '—';
                  const status = incident.status_id || incident.status || '—';
                  return (
                    <tr key={incident.id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                      <td className="font-semibold text-[#2C1810]">{incidentNumber}</td>
                      <td>{date ? String(date).slice(0, 10) : '—'}</td>
                      <td className="max-w-[260px] truncate" title={incident.description || ''}>{incident.description || '—'}</td>
                      <td>{incident.emp_id || '—'}</td>
                      <td>{department}</td>
                      <td>{category}</td>
                      <td>{incident.location || '—'}</td>
                      <td>{severity !== '—' ? <StatusBadge status={severity} size="sm" /> : '—'}</td>
                      <td>{status !== '—' ? <StatusBadge status={status} size="sm" /> : '—'}</td>
                      <td className="text-center">
                        <button type="button" onClick={() => navigate(`/incident-log/${incident.id}`)} className="text-[12px] font-semibold text-[#CB0017] hover:underline">
                          View Details <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                        </button>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canEditData() && <button type="button" aria-label="Edit incident" onClick={() => startEdit(incident)} className="h-7 w-7 rounded text-[#6B7280] hover:bg-[#FFF7F7] hover:text-[#CB0017]"><Edit2 className="mx-auto h-3.5 w-3.5" /></button>}
                          {canDeleteData() && <button type="button" aria-label="Delete incident" onClick={() => handleDelete(incident.id)} className="h-7 w-7 rounded text-[#6B7280] hover:bg-red-50 hover:text-red-600"><Trash2 className="mx-auto h-3.5 w-3.5" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedEntries.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#F0F0F0] bg-[#FAFAFA] px-4 py-3">
              <p className="text-[12px] text-[#6B7280]">Showing <span className="font-semibold text-[#374151]">{startRecord}-{endRecord}</span> of <span className="font-semibold text-[#374151]">{sortedEntries.length}</span> records</p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1} className="h-8 w-8 rounded border border-[#DEDEDE] bg-white disabled:opacity-40"><ChevronLeft className="mx-auto h-4 w-4" /></button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                  const page = totalPages <= 5 ? index + 1 : Math.min(totalPages - 4, Math.max(1, currentPage - 2)) + index;
                  return <button type="button" key={page} onClick={() => setCurrentPage(page)} className={`h-8 w-8 rounded border text-[13px] font-medium ${page === currentPage ? 'border-[#CB0017] bg-[#CB0017] text-white' : 'border-[#DEDEDE] bg-white text-[#374151]'}`}>{page}</button>;
                })}
                <button type="button" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="h-8 w-8 rounded border border-[#DEDEDE] bg-white disabled:opacity-40"><ChevronRight className="mx-auto h-4 w-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
      {isAddModalOpen && renderAddEditModal()}
      {editingId && renderAddEditModal()}
    </Layout>
  );

  if (schema.id === 'action-tracker') return <ActionTrackerRoute schema={schema} />;
  if (schema.id === 'hazard-reporting') return renderHazardWorkspace();
  if (schema.id === 'incident-log') return renderIncidentWorkspace();
  return renderGenericWorkspace();
};

export default DataEntrySection;
