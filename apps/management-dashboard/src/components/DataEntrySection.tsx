import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout } from './Layout';
import { FilterBar } from './FilterBar';
import { ContextHeader } from './ContextHeader';
import { StatusBadge } from './StatusBadge';
import { SlideOverPanel } from './SlideOverPanel';
import { CenterModal } from './CenterModal';
import type { SectionConfig, ColumnSchema } from '../config/sectionSchemas';
import { usePermissions, useAuth } from '@cbl/auth';
import { useModuleData } from '../hooks/useModuleData';
import { useEmployeeLookup } from '../hooks/useEmployeeLookup';
import { moduleService, type DepartmentOption } from '../services/api/moduleService';
import { useFilters } from '../context/FilterContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Save, Trash2, Download, Edit2, X, History, ArrowUpDown,
  ArrowRight, User, AlertTriangle, Search, ChevronRight,
  ChevronDown, ChevronUp,
  CheckCircle2, LayoutGrid, Filter, PanelRightOpen,
  FileText, CalendarDays, Clock, Check,
} from 'lucide-react';
import { LinkedSourceBadge } from './LinkedSourceBadge';
import { AvatarInitials } from './AvatarInitials';
import { DepartmentStatusBar } from './DepartmentStatusBar';
import { MyPendingWidget } from './MyPendingWidget';
import { uploadClient, type AttachmentRecord } from '../../../../packages/api/src/uploadClient';
import { LocationCombobox } from './LocationCombobox';
import { ImageUploadField } from './ImageUploadField';
import { formatDateOnly, formatDateTimeLocal } from '../utils/dateFormat';
import { PaginationControls } from './PaginationControls';
import {
  createNewNearMissFormDefaults,
  nearMissResponsibleDepartmentFormValues,
  nearMissResponsibleDepartmentLabel,
  nearMissResponsibleDepartmentOptions,
  resolveNearMissResponsibleDepartmentValue,
} from '../utils/nearMissResponsibleDepartment';

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

const STATUS_COLUMNS = new Set(['status', 'status_id', 'risk_rating_id']);
const MAX_INCIDENT_ACTIONS = 15;
const bypassHazardValidation = import.meta.env.VITE_BYPASS_HAZARD_VALIDATION === 'true';

const ATTACHMENT_SOURCE_BY_SCHEMA: Record<string, string> = {
  'hazard-reporting': 'hazard',
  'near-miss': 'near_miss',
  'incident-log': 'incident',
  'training-records': 'training',
  'audit-management': 'audit',
  'inspection-records': 'inspection',
  'action-tracker': 'corrective_action',
  'critical-audit-plan': 'audit',
};

const ATTACHMENT_TYPE_BY_FIELD: Record<string, string> = {
  initial_photo: 'INITIAL_PHOTO',
  closing_proof_photo: 'CLOSING_PROOF_PHOTO',
  evidence_upload: 'EVIDENCE_PHOTO',
  pictorial: 'PICTORIAL',
};

const attachmentSourceForSchema = (schemaId: string) => ATTACHMENT_SOURCE_BY_SCHEMA[schemaId];
const attachmentTypeForField = (fieldKey: string) => ATTACHMENT_TYPE_BY_FIELD[fieldKey] || fieldKey.toUpperCase();

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
  autoPopulateOnFocus,
}: {
  value?: string;
  onChange: (nextValue: string) => void;
  label: string;
  required?: boolean;
  disabled?: boolean;
  autoPopulateOnFocus?: boolean;
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const handleInteraction = () => {
    if (!value && autoPopulateOnFocus) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      onChange(`${hours}:${minutes}`);
    }
    inputRef.current?.showPicker?.();
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="time"
        aria-label={label}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        onClick={handleInteraction}
        onFocus={handleInteraction}
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
  return true;
};

const ActionTrackerWorkspace = ({
  schema,
}: {
  schema: SectionConfig;
}) => {
  const { data: cards, loading, fetchAll, createRecord, updateStatus, deleteRecord, pagination } = useModuleData(schema.id);
  const [showAddCard, setShowAddCard] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const saveAction = async () => {
    const result = await createRecord(formData);
    if (result.success) {
      setFormData({});
      setShowAddCard(false);
      setCurrentPage(1);
      await fetchAll({ page: 1, limit: pageSize });
    }
  };

  useEffect(() => {
    fetchAll({ page: currentPage, limit: pageSize });
  }, [currentPage, fetchAll]);

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
          {cards.length > 0 && <PaginationControls currentPage={currentPage} totalPages={pagination.totalPages} totalRecords={pagination.totalRecords || cards.length} pageSize={pageSize} onPageChange={setCurrentPage} disabled={loading} className={`mt-5 ${CARD}`} itemLabel="actions" />}

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
  const { data: entries, loading, fetchAll, createRecord, updateRecord, deleteRecord, pagination } = useModuleData(schema.id);
  const { user } = useAuth();
  const permissions = usePermissions();
  const { filters } = useFilters();
  const { lookupEmployee, error: employeeError, setError: setEmployeeError } = useEmployeeLookup();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState('Validation Error');
  const [isSaving, setIsSaving] = useState(false);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [existingAttachments, setExistingAttachments] = useState<AttachmentRecord[]>([]);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<Record<string, string>>({});
  const attachmentPreviewUrlsRef = useRef<Record<string, string>>({});
  const [hazardCategoryQuery, setHazardCategoryQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [attachmentWarning, setAttachmentWarning] = useState<string | null>(null);
  const [statusHistoryModal, setStatusHistoryModal] = useState<{ isOpen: boolean; record: any | null }>({ isOpen: false, record: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable');
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [hazardSummary, setHazardSummary] = useState({ totalRecords: 0, assigned: 0, submittedForReview: 0, closedThisMonth: 0 });
  const hazardSummaryRequest = useRef(0);
  const [trainingSummary, setTrainingSummary] = useState({ totalRecords: 0, draftRecords: 0, totalManhours: 0, pendingRecords: 0, completedRecords: 0, attendanceRate: null as number | null });
  const trainingSummaryRequest = useRef(0);
  const [trainingDepartments, setTrainingDepartments] = useState<DepartmentOption[]>([]);
  const [trainingDepartmentsLoading, setTrainingDepartmentsLoading] = useState(false);
  const [trainingDepartmentsError, setTrainingDepartmentsError] = useState<string | null>(null);
  const [locationsData, setLocationsData] = useState<any[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [showCloseHazard, setShowCloseHazard] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [closeHazardData, setCloseHazardData] = useState<{ closingProof: File | null; closingRemarks: string }>({ closingProof: null, closingRemarks: '' });
  const [reviewData, setReviewData] = useState({ remarks: '', reason: '' });
  const [hazardStep, setHazardStep] = useState(1);
  const [hazardAutosavedAt, setHazardAutosavedAt] = useState<Date | null>(null);
  const previousListFilterKey = useRef<string | null>(null);
  const previousEmployeeInput = useRef({ form: '', employeeId: '' });
  const employeeLookupRequest = useRef(0);
  const PAGE_SIZE = 15;

  const { canAddData, canEditData, canDeleteData, canExportCSV } = permissions;
  const routeCategory = schema.id === 'incident-log' ? searchParams.get('category') : null;
  const selectedCloseHazardId = schema.id === 'hazard-reporting' && showCloseHazard
    ? Object.keys(selectedRows).find(id => selectedRows[id]) || null
    : null;
  const attachmentRecordId = editingId || selectedCloseHazardId;

  const clearAttachmentPreviews = useCallback(() => {
    Object.values(attachmentPreviewUrlsRef.current).forEach(url => URL.revokeObjectURL(url));
    attachmentPreviewUrlsRef.current = {};
    setAttachmentPreviewUrls({});
  }, []);

  useEffect(() => () => clearAttachmentPreviews(), [clearAttachmentPreviews]);

  useEffect(() => {
    let active = true;
    setExistingAttachments([]);
    clearAttachmentPreviews();
    const sourceType = attachmentSourceForSchema(schema.id);
    if (!attachmentRecordId || !sourceType) return () => { active = false; };

    const loadAttachments = async () => {
      try {
        const response = await uploadClient.getBySource(sourceType, attachmentRecordId);
        const attachments = Array.isArray(response.data) ? response.data : [];
        if (!active) return;
        setExistingAttachments(attachments);
        await Promise.all(attachments.map(async attachment => {
          try {
            const fileResponse = await uploadClient.getFile(attachment.id);
            const previewUrl = URL.createObjectURL(fileResponse.data);
            if (!active) {
              URL.revokeObjectURL(previewUrl);
              return;
            }
            attachmentPreviewUrlsRef.current[attachment.id] = previewUrl;
            setAttachmentPreviewUrls(previous => ({ ...previous, [attachment.id]: previewUrl }));
          } catch (error) {
            console.error(`Unable to load attachment preview ${attachment.id}:`, error);
          }
        }));
      } catch (error) {
        if (active) setAttachmentWarning('Existing image evidence could not be loaded.');
        console.error('Unable to load image evidence:', error);
      }
    };

    void loadAttachments();
    return () => {
      active = false;
      clearAttachmentPreviews();
    };
  }, [attachmentRecordId, clearAttachmentPreviews, schema.id]);

  useEffect(() => {
    if (!activeDropdown) return;
    const handleClickOutside = (event: MouseEvent) => {
      const activeContainer = Array.from(document.querySelectorAll<HTMLElement>('[data-dropdown-container]'))
        .find(container => container.dataset.dropdownContainer === activeDropdown);
      if (!activeContainer?.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  useEffect(() => {
    let active = true;
    const loadDepartments = () => {
      setTrainingDepartmentsLoading(true);
      setTrainingDepartmentsError(null);
      void moduleService.getDepartments()
      .then(response => {
        if (!active) return;
        if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Unable to load departments.');
        setTrainingDepartments(response.data.filter(department => {
          const name = String(department.name || '').trim().toLowerCase();
          const code = String(department.code || '').trim().toLowerCase();
          const excludeOther = schema.id === 'training-records';
          return department.isActive !== false && department.id && (!excludeOther || (!['other', 'others'].includes(name) && !['other', 'others'].includes(code)));
        }));
      })
      .catch(error => {
        if (active) setTrainingDepartmentsError(error instanceof Error ? error.message : 'Unable to load departments.');
      })
      .finally(() => { if (active) setTrainingDepartmentsLoading(false); });
    };
    loadDepartments();
    window.addEventListener('departments-refresh', loadDepartments);
    return () => { active = false; window.removeEventListener('departments-refresh', loadDepartments); };
  }, [schema.id]);

  useEffect(() => {
    let active = true;
    const loadLocations = () => {
      setLocationsLoading(true);
      setLocationsError(null);
      void moduleService.getLocations()
      .then(response => {
        if (!active) return;
        if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Unable to load locations.');
        setLocationsData(response.data.filter(location => {
          const name = String(location.name || '').trim().toLowerCase();
          return location.isActive !== false && location.id && !['other', 'others'].includes(name);
        }));
      })
      .catch(error => {
        if (active) setLocationsError(error instanceof Error ? error.message : 'Unable to load locations.');
      })
      .finally(() => { if (active) setLocationsLoading(false); });
    };
    loadLocations();
    window.addEventListener('locations-refresh', loadLocations);
    return () => { active = false; window.removeEventListener('locations-refresh', loadLocations); };
  }, [schema.id]);

  const listFilters = useMemo(() => {
    const applicableFilters = { ...(filters as unknown as Record<string, unknown>) };
    if (schema.id === 'training-records') {
      delete applicableFilters.status;
      delete applicableFilters.riskRating;
      delete applicableFilters.incidentCategory;
    } else {
      if (!['hazard-reporting', 'near-miss', 'incident-log'].includes(schema.id)) delete applicableFilters.month;
      if (schema.id !== 'hazard-reporting') delete applicableFilters.riskRating;
      if (schema.id !== 'incident-log') delete applicableFilters.incidentCategory;
    }
    return applicableFilters;
  }, [filters, schema.id]);
  const listQuery = useMemo(() => ({
    ...listFilters,
    page: currentPage,
    limit: PAGE_SIZE,
    search: searchQuery || undefined,
    sortBy: sortConfig?.key || 'createdAt',
    sortOrder: sortConfig?.direction || 'desc',
    ...(schema.id === 'incident-log' && routeCategory ? { incidentCategory: routeCategory } : {}),
  }), [listFilters, currentPage, searchQuery, sortConfig, schema.id, routeCategory]);
  const listFilterKey = useMemo(() => JSON.stringify({
    schemaId: schema.id,
    filters: listFilters,
    searchQuery,
    routeCategory,
  }), [schema.id, listFilters, searchQuery, routeCategory]);
  const summaryQuery = useMemo(() => {
    if (!['hazard-reporting', 'training-records'].includes(schema.id)) return null;
    const { page: _page, limit: _limit, sortBy: _sortBy, sortOrder: _sortOrder, ...filtersOnly } = listQuery;
    return filtersOnly;
  }, [schema.id, listQuery]);
  useEffect(() => {
    const filterChanged = previousListFilterKey.current !== listFilterKey;
    previousListFilterKey.current = listFilterKey;
    // The reset effect below owns the transition to page 1. Skip the stale
    // page request when a filter changes while the user is on a later page.
    if (filterChanged && currentPage !== 1) return;
    const requestId = schema.id === 'hazard-reporting' ? ++hazardSummaryRequest.current : ++trainingSummaryRequest.current;
    if (!['hazard-reporting', 'training-records'].includes(schema.id) || !summaryQuery) {
      void fetchAll(listQuery);
      return;
    }
    const summaryRequest = schema.id === 'hazard-reporting' ? moduleService.getHazardSummary(summaryQuery) : moduleService.getTrainingSummary(summaryQuery);
    void Promise.all([fetchAll(listQuery), summaryRequest])
      .then(([, response]) => {
        const current = schema.id === 'hazard-reporting' ? hazardSummaryRequest.current : trainingSummaryRequest.current;
        if (requestId === current && response.success && response.data) {
          if (schema.id === 'hazard-reporting') setHazardSummary(response.data);
          else setTrainingSummary(response.data);
        }
      })
      .catch(() => { /* table error state remains authoritative; retain last summary during transient failures */ });
  }, [schema.id, currentPage, fetchAll, listFilterKey, listQuery, summaryQuery]);
  useEffect(() => {
    const refresh = () => {
      void fetchAll(listQuery);
      if (['hazard-reporting', 'training-records'].includes(schema.id) && summaryQuery) {
        const requestId = schema.id === 'hazard-reporting' ? ++hazardSummaryRequest.current : ++trainingSummaryRequest.current;
        const summaryRequest = schema.id === 'hazard-reporting' ? moduleService.getHazardSummary(summaryQuery) : moduleService.getTrainingSummary(summaryQuery);
        void summaryRequest.then((response) => {
          if (schema.id === 'hazard-reporting' && requestId === hazardSummaryRequest.current && response.success && response.data) setHazardSummary(response.data);
          if (schema.id === 'training-records' && requestId === trainingSummaryRequest.current && response.success && response.data) setTrainingSummary(response.data);
        }).catch(() => undefined);
      }
    };
    window.addEventListener('dashboard-refresh', refresh);
    return () => window.removeEventListener('dashboard-refresh', refresh);
  }, [fetchAll, listQuery, schema.id, summaryQuery]);
  useEffect(() => { setCurrentPage(1); }, [listFilterKey]);
  useEffect(() => {
    if (schema.id === 'incident-log' && routeCategory) setSearchQuery('');
  }, [schema.id, routeCategory]);
  useEffect(() => {
    if (!['hazard-reporting', 'incident-log', 'near-miss'].includes(schema.id) || !isAddModalOpen || editingId || !Object.keys(formData).length) return;
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(`hse-${schema.id}-draft`, JSON.stringify(formData));
        setHazardAutosavedAt(new Date());
      } catch {
        // Draft persistence is an enhancement; it must never interrupt entry.
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [schema.id, isAddModalOpen, editingId, formData]);

  const applyComputes = (data: any, currentSchema: SectionConfig, allEntries: any[]) => {
    const nextData = { ...data };
    currentSchema.columns.forEach(col => {
      if (col.compute) nextData[col.key] = col.compute(nextData, allEntries);
    });
    return nextData;
  };

  const validateFormData = (data: any): string | null => {
    if (schema.id === 'hazard-reporting') {
      const wordCount = (value: unknown) => String(value || '').trim() ? String(value).trim().split(/\s+/).length : 0;
      for (const [key, label] of [['description', 'Hazard Details'], ['corrective_action', 'Corrective Action'], ['remarks', 'Remarks']] as const) {
        const count = wordCount(data[key]);
        if (count > 500) return `${label} cannot exceed 500 words (${count}/500 words).`;
      }
      if (bypassHazardValidation) return null;
    }
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
    if (schema.id === 'training-records') {
      const departmentId = String(data.department_id || '').trim();
      if (data.training_type === 'Other' && !String(data.training_type_other || '').trim()) return 'Other Training Type is required.';
      if (departmentId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(departmentId)) return 'Department must be selected from the active department list.';
      const participants = Number(data.participants);
      const durationMinutes = Number(data.duration_minutes);
      if (data.participants !== '' && (!Number.isInteger(participants) || participants < 1)) return 'Total Participants must be a positive whole number.';
      if (data.duration_minutes !== '' && (!Number.isInteger(durationMinutes) || durationMinutes < 1)) return 'Duration (Min) must be a positive whole number.';
      if (departmentId && trainingDepartments.length > 0 && !trainingDepartments.some(department => department.id === departmentId)) return 'Selected department is not active or no longer exists.';
    }
    if (schema.id === 'near-miss') {
      if (data.investigation_required && !['Yes', 'No'].includes(data.investigation_required)) return 'Further Investigation Required must be Yes or No.';
      if (data.reported_in_hazard && !['Yes', 'No'].includes(data.reported_in_hazard)) return 'Reported in Hazard must be Yes or No.';
      if (data.status && !['Open', 'Close'].includes(data.status)) return 'Status must be Open or Close.';
      if (String(data.remarks || '').trim().split(/\s+/).filter(Boolean).length > 500) return 'Remarks cannot exceed 500 words.';
      const responsibleDepartmentId = String(data.responsible_department_id || '').trim();
      if (responsibleDepartmentId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(responsibleDepartmentId)) {
        return 'Responsible Department must be selected from the active department list.';
      }
      const allowedResponsibleDepartments = nearMissResponsibleDepartmentOptions(trainingDepartments);
      if (responsibleDepartmentId && allowedResponsibleDepartments.length > 0 && !allowedResponsibleDepartments.some(department => department.id === responsibleDepartmentId)) {
        return 'Selected Responsible Department is not active or no longer exists.';
      }
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

  const EMPLOYEE_FIELD_MAP: Record<string, Record<string, string>> = {
    'hazard-reporting': { name: 'originator' }, // Based on the schema
    'near-miss': { name: 'reported_by' },
    'incident-log': { name: 'reported_by' },
    'training-records': { name: 'trainer_name' },
  };

  useEffect(() => {
    const formKey = editingId || 'new';
    const currentEmpId = String(editingId ? editFormData.emp_id : formData.emp_id || '').trim();
    const employeeFields = schema.id === 'hazard-reporting'
      ? ['originator', 'department_id']
      : schema.id === 'near-miss'
        ? ['reported_by', 'designation', 'department_id']
        : [];
    const clearEmployeeFields = () => {
      if (employeeFields.length === 0) return;
      const clear = (previous: any) => {
        const next = { ...previous };
        employeeFields.forEach(field => { next[field] = ''; });
        return next;
      };
      if (editingId) setEditFormData(clear);
      else setFormData(clear);
    };
    const previous = previousEmployeeInput.current;
    const employeeChanged = previous.form === formKey && previous.employeeId !== currentEmpId;
    previousEmployeeInput.current = { form: formKey, employeeId: currentEmpId };
    const requestId = ++employeeLookupRequest.current;

    if (!currentEmpId || currentEmpId.length < 3) {
      // A new form must never retain a department from a previous employee or
      // an autosaved form while the EMP ID is empty/partial. Existing records
      // are allowed to keep their saved values until the user changes EMP ID.
      if (!editingId || employeeChanged) clearEmployeeFields();
      setEmployeeError(null);
      return;
    }
    if (employeeChanged) clearEmployeeFields();

    const timer = setTimeout(async () => {
      const employee = await lookupEmployee(currentEmpId);
      if (requestId !== employeeLookupRequest.current) return;
      if (!employee) {
        clearEmployeeFields();
        return;
      }
      const updateData = (prev: any) => {
        const next = { ...prev };
        const map = EMPLOYEE_FIELD_MAP[schema.id] || {};
        const employeeName = [employee.user?.firstName, employee.user?.lastName].filter(Boolean).join(' ');
        const employeeDepartmentId = employee.departmentId || employee.department?.id || employee.department_id || '';

        if (map.name) next[map.name] = employeeName;
        if (['hazard-reporting', 'near-miss'].includes(schema.id)) next.department_id = employeeDepartmentId;
        if (schema.columns.some(column => column.key === 'gender') && employee.gender) next.gender = employee.gender;
        if (schema.columns.some(column => column.key === 'designation')) next.designation = employee.designation || '';

        return applyComputes(next, schema, entries);
      };

      if (editingId) setEditFormData(updateData);
      else setFormData(updateData);
    }, 500);

    return () => clearTimeout(timer);
  }, [editingId ? editFormData.emp_id : formData.emp_id, schema.id, lookupEmployee, editingId, setEmployeeError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, isEdit = false) => {
    const { name, value, type } = e.target as any;
    let finalValue: any = type === 'number' ? (value === '' ? '' : Number(value)) : value;
    const nearMissResponsibleSelection = schema.id === 'near-miss' && name === 'responsible_department_id'
      ? nearMissResponsibleDepartmentFormValues(trainingDepartments, finalValue)
      : null;
    if (nearMissResponsibleSelection) finalValue = nearMissResponsibleSelection.responsible_department_id;
    const selectedResponsibleDepartment = name === 'responsible_department_id'
      ? trainingDepartments.find(department => department.id === finalValue)
      : null;
    const employeeDerivedFields = schema.id === 'hazard-reporting'
      ? ['originator', 'department_id']
      : schema.id === 'near-miss'
        ? ['reported_by', 'designation', 'department_id']
        : [];
    if (isEdit) {
      setEditFormData((prev: any) => {
        const next = { ...prev, [name]: finalValue };
        if (name === 'responsible_department_id') {
          next.responsible_department = nearMissResponsibleSelection?.responsible_department
            ?? selectedResponsibleDepartment?.code
            ?? selectedResponsibleDepartment?.name
            ?? '';
        }
        if (name === 'emp_id' && employeeDerivedFields.length > 0) {
          employeeDerivedFields.forEach(field => { next[field] = ''; });
        }
        return applyComputes(next, schema, entries);
      });
    } else {
      setFormData((prev: any) => {
        const next = { ...prev, [name]: finalValue };
        if (name === 'responsible_department_id') {
          next.responsible_department = nearMissResponsibleSelection?.responsible_department
            ?? selectedResponsibleDepartment?.code
            ?? selectedResponsibleDepartment?.name
            ?? '';
        }
        if (name === 'emp_id' && employeeDerivedFields.length > 0) {
          employeeDerivedFields.forEach(field => { next[field] = ''; });
        }
        return applyComputes(next, schema, entries);
      });
    }
  };

  const attachmentForField = (fieldKey: string) => {
    const attachmentType = attachmentTypeForField(fieldKey);
    return existingAttachments.find(attachment => attachment.attachmentType === attachmentType) || null;
  };

  const handleImageSelection = (fieldKey: string, file: File | null) => {
    setPendingFiles(previous => {
      const next = { ...previous };
      if (file) next[fieldKey] = file;
      else delete next[fieldKey];
      return next;
    });
  };

  const uploadPendingImages = async (sourceId: string): Promise<string[]> => {
    const pendingEntries = Object.entries(pendingFiles);
    if (pendingEntries.length === 0) return [];
    const sourceType = attachmentSourceForSchema(schema.id);
    if (!sourceType) return pendingEntries.map(([fieldKey]) => fieldKey);
    const results = await Promise.allSettled(pendingEntries.map(([fieldKey, file]) => uploadClient.upload(file, {
      sourceType,
      sourceId,
      attachmentType: attachmentTypeForField(fieldKey),
    })));
    return results.flatMap((result, index) => result.status === 'rejected' ? [pendingEntries[index][0]] : []);
  };

  const handleSubmit = async (e?: React.FormEvent, statusOverride?: string) => {
    e?.preventDefault();
    if (isSaving) return;
    setValidationError(null);
    setErrorTitle('Validation Error');
    const statusKey = schema.id === 'near-miss' ? 'status' : 'status_id';
    const sourceData = editingId ? editFormData : formData;
    const isTrainingDraft = schema.id === 'training-records' && String(sourceData.status_id ?? sourceData.status ?? '').toLowerCase() === 'draft';
    const effectiveStatusOverride = statusOverride || (editingId && isTrainingDraft ? 'Pending' : undefined);
    const dataToSave = applyComputes({ ...sourceData, ...(effectiveStatusOverride ? { [statusKey]: effectiveStatusOverride } : {}) }, schema, entries);
    if (dataToSave.location === 'Other' && dataToSave.location_other) {
      dataToSave.location = dataToSave.location_other;
    }
    const isDraftSave = ['training-records', 'near-miss'].includes(schema.id) && statusOverride === 'Draft';
    const err = isDraftSave ? null : validateFormData(dataToSave);
    if (err) {
      setValidationError(err);
      setErrorTitle('Validation Error');
      document.getElementById('modal-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIsSaving(true);
    const idempotencyKey = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `form-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const result: any = editingId
        ? await updateRecord(editingId, dataToSave)
        : await createRecord({ ...dataToSave, __idempotencyKey: idempotencyKey });
      const savedRecordId = editingId || result.data?.id;
      if (result.success && savedRecordId) {
        const failedUploadKeys = await uploadPendingImages(savedRecordId);
        if (failedUploadKeys.length > 0) {
          const message = `${failedUploadKeys.length} image${failedUploadKeys.length > 1 ? 's' : ''} could not be uploaded. The record was saved.`;
          setErrorTitle('Attachment Error');
          setAttachmentWarning(message);
          setPendingFiles(previous => Object.fromEntries(failedUploadKeys.filter(key => previous[key]).map(key => [key, previous[key]])));
          setEditingId(savedRecordId);
          setEditFormData(dataToSave);
          setFormData({});
          setIsAddModalOpen(false);
          setValidationError(message);
          return;
        }
        // Reload only after the API has confirmed a committed row. The API
        // sorts hazards by createdAt DESC, so the new row is first when the
        // active filters include its date/department.
        setCurrentPage(1);
        await fetchAll({ ...listQuery, page: 1 });
        setFormData({});
        setEditFormData({});
        setEditingId(null);
        setPendingFiles({});
        try { sessionStorage.removeItem(`hse-${schema.id}-draft`); } catch { /* ignore unavailable storage */ }
        setIsAddModalOpen(false);
        setSavedModalOpen(schema.id === 'hazard-reporting');
      } else if (!result.alreadyInProgress) {
        setErrorTitle((result as any).errorTitle || 'Request Failed');
        setValidationError(result.message || 'The server did not confirm that the record was saved.');
        document.getElementById('modal-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) await deleteRecord(id);
  };

  const startEdit = (entry: any) => {
    setValidationError(null);
    setAttachmentWarning(null);
    setPendingFiles({});
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
      setPendingFiles({});
    } else {
      setValidationError(result.message || 'Failed to update record.');
    }
  };

  const submitClosingProof = async () => {
    const selectedIds = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (selectedIds.length !== 1) {
      setAttachmentWarning('Select exactly one hazard before submitting closing proof.');
      return;
    }
    if (!closeHazardData.closingProof) {
      setAttachmentWarning('Select a JPG, JPEG, or PNG closing proof image.');
      return;
    }

    setIsSaving(true);
    setAttachmentWarning(null);
    try {
      await uploadClient.upload(closeHazardData.closingProof, {
        sourceType: 'hazard',
        sourceId: selectedIds[0],
        attachmentType: 'CLOSING_PROOF_PHOTO',
      });
      setShowCloseHazard(false);
      setCloseHazardData({ closingProof: null, closingRemarks: '' });
      await fetchAll(listQuery);
    } catch (error: any) {
      setAttachmentWarning(error?.response?.data?.message || 'Image upload failed. Please try again.');
    } finally {
      setIsSaving(false);
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

  const filteredEntries = useMemo(() => {
    // Hazard and Near Miss filters are applied by MySQL before count/limit/offset. Do not
    // re-filter a server page in React or the displayed page can become sparse.
    if (['hazard-reporting', 'near-miss', 'incident-log'].includes(schema.id)) return entries;
    return entries.filter(entry => {
    const normalizedDepartment = (value: unknown) => String(value || '')
      .trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const selectedDepartment = normalizedDepartment(filters.department);
    const departmentAliases: Record<string, string[]> = {
      adm: ['adm', 'admin'],
      esd: ['esd', 'esdutilities', 'maintenance'],
      hse: ['hse', 'hsedepartment', 'depthse'],
      prd: ['prd', 'production', 'productiondepartment'],
      projects: ['projects', 'project', 'prj'],
      qcfsnpd: ['qcfsnpd', 'qc', 'qcnpdfs'],
      stores: ['stores', 'store'],
    };
    const selectedAliases = departmentAliases[selectedDepartment] || [selectedDepartment];
    const recordDepartments = [entry.department_id, entry.department_name, entry.department_code]
      .map(normalizedDepartment);
    // Forms store a department UUID while the global filter can be a code or
    // label (for example HSE / HSE Department). Match all representations.
    if (filters.department && filters.department !== 'All' && !recordDepartments.some(department =>
      selectedAliases.includes(department) || departmentAliases[department]?.includes(selectedDepartment)
    )) return false;
    if (schema.id !== 'training-records' && filters.status && filters.status !== 'All' && entry.status_id !== filters.status) return false;
    const recordDate = entry.date || entry.target_date || entry.due_date;
    if (schema.id === 'training-records' && filters.month && filters.month !== 'All') {
      if (!recordDate) return false;
      const dateMonth = String(recordDate).match(/^\d{4}-(\d{2})/)?.[1];
      if (Number(dateMonth) !== Number(filters.month)) return false;
    }
    if (filters.year && filters.year !== 'All' && recordDate && !recordDate.startsWith(filters.year)) return false;
    if (filters.fromDate && recordDate && recordDate < filters.fromDate) return false;
    if (filters.toDate && recordDate && recordDate > filters.toDate) return false;
    if (routeCategory) {
      const normalize = (value: unknown) => String(value || '').toLowerCase().replaceAll('_', ' ').trim();
      const category = entry.incident_category_id || entry.incidentType || entry.category;
      if (normalize(category) !== normalize(routeCategory)) return false;
    }
    return true;
    });
  }, [entries, filters, routeCategory, schema.id]);

  const searchedEntries = useMemo(() => {
    if (['hazard-reporting', 'near-miss', 'incident-log'].includes(schema.id)) return filteredEntries;
    if (!searchQuery.trim()) return filteredEntries;
    const q = searchQuery.toLowerCase();
    return filteredEntries.filter(entry => JSON.stringify(entry).toLowerCase().includes(q));
  }, [filteredEntries, searchQuery, schema.id]);

  const sortedEntries = useMemo(() => {
    if (['hazard-reporting', 'near-miss', 'incident-log'].includes(schema.id)) return searchedEntries;
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
  }, [searchedEntries, sortConfig, schema.id]);

  const totalPages = Math.max(1, pagination.totalPages || Math.ceil(sortedEntries.length / PAGE_SIZE));
  const pagedEntries = sortedEntries;
  const visibleEntryIds = pagedEntries.map(entry => String(entry.id)).filter(Boolean);
  const visibleSelectedCount = visibleEntryIds.filter(id => selectedRows[id]).length;
  const selectedCount = Object.values(selectedRows).filter(Boolean).length;
  const allVisibleSelected = visibleEntryIds.length > 0 && visibleSelectedCount === visibleEntryIds.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = visibleSelectedCount > 0 && !allVisibleSelected;
    }
  }, [visibleSelectedCount, allVisibleSelected]);

  useEffect(() => {
    const validIds = new Set(entries.map(entry => String(entry.id)));
    setSelectedRows(previous => {
      const next = Object.fromEntries(Object.entries(previous).filter(([id, selected]) => selected && validIds.has(id)));
      return Object.keys(next).length === Object.keys(previous).length ? previous : next;
    });
  }, [entries]);

  const toggleVisibleSelection = () => {
    setSelectedRows(previous => {
      const next = { ...previous };
      const shouldSelect = !allVisibleSelected;
      visibleEntryIds.forEach(id => {
        if (shouldSelect) next[id] = true;
        else delete next[id];
      });
      return next;
    });
  };
  const visibleColumns = schema.columns.filter(col => !col.hideFromForm && col.type !== 'file');
  const departmentDisplayValue = (value: unknown) => {
    const text = String(value ?? '').trim();
    if (!text) return '';
    const department = trainingDepartments.find(item =>
      item.id === text ||
      String(item.code || '').trim().toLowerCase() === text.toLowerCase() ||
      String(item.name || '').trim().toLowerCase() === text.toLowerCase(),
    );
    if (department) return department.code || department.name || '';
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? '' : text;
  };
  const formatTableValue = (column: ColumnSchema, value: unknown) => {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) return '-';
    if (column.type === 'date') return formatDateOnly(value);
    if (column.type === 'datetime') return formatDateTimeLocal(value);
    return String(value);
  };
  const displayTableValue = (entry: any, column: ColumnSchema) => {
    const departmentLabel = (entry: any) => {
      const candidates = [
        entry.department?.code,
        entry.department?.name,
        entry.department_name,
        entry.departmentName,
        entry.department_code,
        entry.metadata?.department_name,
        entry.metadata?.department_code,
        entry.metadata?.originated_department,
        entry.metadata?.originated_dept,
      ];
      return candidates.find(candidate => {
        const text = String(candidate ?? '').trim();
        return text && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text);
      }) || '';
    };
    const responsibleDepartmentLabel = (entry: any) => {
      const candidates = [
        entry.responsibleDepartment?.code,
        entry.responsibleDepartment?.name,
        entry.responsible_department,
        entry.metadata?.responsible_department,
        entry.metadata?.responsibleDepartment,
        entry.metadata?.resp,
      ];
      return candidates.find(candidate => {
        const text = String(candidate ?? '').trim();
        return text && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text);
      }) || '';
    };
    if (schema.id === 'near-miss') {
      if (column.key === 'department_id') return departmentLabel(entry);
      if (column.key === 'responsible_department_id') return responsibleDepartmentLabel(entry);
      return entry[column.key];
    }
    if (schema.id === 'hazard-reporting' && column.key === 'department_id') return departmentLabel(entry);
    if (schema.id !== 'training-records') return entry[column.key];
    if (column.key === 'department_id') return entry.department_name || entry.departmentName || entry.department_code || entry.department_id || entry.departmentId;
    if (column.key === 'training_type') return entry.training_type_label || entry.trainingTypeLabel || String(entry.training_type || entry.trainingType || '').split('_').map((part: string) => part ? part[0].toUpperCase() + part.slice(1) : '').join(' ');
    if (column.key === 'participants') return entry.participants ?? entry.participantCount ?? entry.participant_count;
    if (column.key === 'duration_minutes') return entry.duration_minutes ?? entry.durationMinutes;
    if (column.key === 'manhours') return entry.manhours;
    return entry[column.key];
  };
  const sectionGroups = moduleSections(schema);
  const exportCSV = async () => {
    try {
      const blob = await moduleService.export(schema.id, {
        ...listFilters,
        search: searchQuery || undefined,
        sortBy: sortConfig?.key || 'createdAt',
        sortOrder: sortConfig?.direction || 'desc',
      });
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
    const isMappedEmployeeField = Object.values(EMPLOYEE_FIELD_MAP[schema.id] || {}).includes(col.key) || ['department_id', 'gender', 'designation'].includes(col.key);
    const effectiveReadonly = col.readonly || (isMappedEmployeeField && col.key !== 'emp_id');

    if (col.type === 'file') {
      const existingAttachment = attachmentForField(col.key);
      const selectedFile = pendingFiles[col.key] || null;
      return (
        <ImageUploadField
          label={col.label}
          file={selectedFile}
          existingAttachment={existingAttachment}
          existingPreviewUrl={existingAttachment ? attachmentPreviewUrls[existingAttachment.id] : null}
          disabled={effectiveReadonly}
           onFileChange={file => handleImageSelection(col.key, file)}
        />
      );
    }

    if (col.key === 'location') {
      const source = isEdit ? editFormData : formData;
      return (
        <div className="space-y-2">
          <LocationCombobox
            name={col.key}
            label={col.label}
            value={value ?? ''}
            onChange={nextValue => handleInputChange({
              target: { name: col.key, value: nextValue },
            } as React.ChangeEvent<HTMLInputElement>, isEdit)}
            required={col.required}
            disabled={col.readonly}
            open={activeDropdown === col.key}
            onOpenChange={(isOpen) => setActiveDropdown(current => {
              if (isOpen) return col.key;
              return current === col.key ? null : current;
            })}
          />
          {value === 'Other' && (
            <input type="text" name={`${col.key}_other`} value={source[`${col.key}_other`] ?? ''} onChange={event => handleInputChange(event, isEdit)} placeholder="Enter custom location" className={FIELD_BASE} required />
          )}
        </div>
      );
    }

    if (schema.id === 'hazard-reporting' && col.key === 'hazard_category_id') {
      const source = isEdit ? editFormData : formData;
      const query = hazardCategoryQuery.trim().toLowerCase();
      const options = (col.options || []).filter(option => option.toLowerCase().includes(query));
      const isOpen = activeDropdown === col.key;
      const choose = (nextValue: string) => {
        handleInputChange({ target: { name: col.key, value: nextValue } } as any, isEdit);
        setHazardCategoryQuery(nextValue === 'Other' ? '' : nextValue);
        setActiveDropdown(null);
      };
      return (
        <div className="relative space-y-2" data-dropdown-container={col.key}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              value={isOpen ? hazardCategoryQuery : (value ?? '')}
              onFocus={() => { if (!isOpen) setActiveDropdown(col.key); }}
              onClick={() => { if (!isOpen) setActiveDropdown(col.key); else setActiveDropdown(null); }}
              onChange={event => {
                setHazardCategoryQuery(event.target.value);
                setActiveDropdown(col.key);
                handleInputChange({ target: { name: col.key, value: '' } } as any, isEdit);
              }}
              placeholder="Select or search hazard category..."
              className={`${FIELD_BASE} pl-9 pr-9 cursor-text`}
              required={col.required && !value}
              aria-expanded={isOpen}
              aria-autocomplete="list"
              onKeyDown={event => {
                if (event.key === 'Escape') setActiveDropdown(null);
              }}
            />
            {isOpen ? <ChevronUp className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" /> : <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />}
          </div>
          {isOpen && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-[#D6D6D6] bg-white py-1 shadow-lg">
              {options.map(option => (
                <button key={option} type="button" onMouseDown={event => event.preventDefault()} onClick={() => choose(option)} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#FFF1F3]">
                  {option}
                </button>
              ))}
              <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => choose('Other')} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#FFF1F3] border-t border-[#F0F0F0]">
                Other
              </button>
            </div>
          )}
          {value === 'Other' && (
            <input type="text" name={`${col.key}_other`} value={source[`${col.key}_other`] ?? ''} onChange={event => handleInputChange(event, isEdit)} placeholder="Enter custom hazard category" className={FIELD_BASE} required />
          )}
        </div>
      );
    }

    if (col.type === 'select') {
      if (schema.id === 'near-miss' && col.key === 'responsible_department_id') {
        const source = isEdit ? editFormData : formData;
        const options = nearMissResponsibleDepartmentOptions(trainingDepartments);
        const selectedValue = resolveNearMissResponsibleDepartmentValue({
          departments: options,
          value,
          legacyLabel: source.responsible_department,
          isEdit,
        });
        const hasUnmappedHistoricalValue = isEdit
          && Boolean(selectedValue)
          && !options.some(department => department.id === selectedValue);

        return (
          <div className="space-y-1">
            <select
              key={`near-miss-responsible-department-${editingId || 'new'}`}
              name={col.key}
              value={selectedValue}
              onChange={event => handleInputChange(event, isEdit)}
              className={FIELD_BASE}
              required={col.required}
              disabled={trainingDepartmentsLoading}
            >
              <option value="">{trainingDepartmentsLoading ? 'Loading departments...' : 'Select department...'}</option>
              {hasUnmappedHistoricalValue && <option value={selectedValue}>Unmapped historical department</option>}
              {options.map(department => (
                <option key={department.id} value={department.id}>
                  {nearMissResponsibleDepartmentLabel(department)}
                </option>
              ))}
            </select>
            {trainingDepartmentsError && <p className="text-[11px] text-[#B91C1C]" role="alert">{trainingDepartmentsError}</p>}
            {!trainingDepartmentsLoading && !trainingDepartmentsError && options.length === 0 && <p className="text-[11px] text-[#B91C1C]" role="alert">No active departments found.</p>}
          </div>
        );
      }

      if (['department_id', 'responsible_department_id', 'responsible_department'].includes(col.key)) {
        const source = isEdit ? editFormData : formData;
        // A new form must be driven only by responsible_department_id. The
        // label is retained only as an edit-mode fallback for legacy rows.
        const displayValue = col.key === 'responsible_department_id' && isEdit ? source.responsible_department : value;
        const normalizedValue = String(value ?? '').trim();
        const legacyDisplayValue = String(displayValue ?? '').trim();
        // `departmentId` belongs to the reporting employee. It must never be
        // used to populate the separate Responsible Department field.
        const historicalCandidates = col.key === 'department_id'
          ? [normalizedValue, String(source.departmentId ?? '').trim()]
          : [normalizedValue];
        const rawHistoricalId = historicalCandidates.find(candidate => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)) || '';
        const selectedDepartment = trainingDepartments.find(department =>
          department.id === normalizedValue ||
          String(department.name || '').trim().toLowerCase() === normalizedValue.toLowerCase() ||
          String(department.code || '').trim().toLowerCase() === normalizedValue.toLowerCase() ||
          (isEdit && String(department.name || '').trim().toLowerCase() === legacyDisplayValue.toLowerCase()) ||
          (isEdit && String(department.code || '').trim().toLowerCase() === legacyDisplayValue.toLowerCase()),
        );
        const isEmployeeReportingDepartment = ['hazard-reporting', 'near-miss'].includes(schema.id) && col.key === 'department_id';
        const currentEmployeeId = String(source.emp_id ?? '').trim();
        const storesDepartmentId = col.key.endsWith('_id');
        const matchedValue = storesDepartmentId
          ? selectedDepartment?.id
          : selectedDepartment ? (selectedDepartment.code || selectedDepartment.name) : '';
        const selectedValue = isEmployeeReportingDepartment && currentEmployeeId.length < 3
          ? ''
          : matchedValue || (isEdit && (rawHistoricalId || legacyDisplayValue) ? (rawHistoricalId || legacyDisplayValue) : '');
        const hasLegacyOption = isEdit && Boolean(legacyDisplayValue || rawHistoricalId) && !selectedDepartment;
        const legacyOptionValue = rawHistoricalId || legacyDisplayValue;
        const legacyOptionLabel = rawHistoricalId && !legacyDisplayValue ? 'Unmapped historical department' : `${legacyDisplayValue} (historical)`;
        const hasKnownLegacyLabel = Boolean(legacyDisplayValue) && trainingDepartments.some(department =>
          String(department.name || '').trim().toLowerCase() === legacyDisplayValue.toLowerCase() ||
          String(department.code || '').trim().toLowerCase() === legacyDisplayValue.toLowerCase(),
        );
        const departmentFieldClass = effectiveReadonly
          ? `${FIELD_BASE} disabled:bg-white disabled:text-[#1A1818] disabled:cursor-default disabled:opacity-100`
          : FIELD_BASE;
        return (
          <div className="space-y-1">
            <select name={col.key} value={selectedValue} onChange={e => handleInputChange(e, isEdit)} className={departmentFieldClass} required={col.required} disabled={effectiveReadonly || trainingDepartmentsLoading}>
              <option value="">{trainingDepartmentsLoading ? 'Loading departments...' : 'Select department...'}</option>
              {hasLegacyOption && !hasKnownLegacyLabel && <option value={legacyOptionValue}>{legacyOptionLabel}</option>}
              {trainingDepartments.map(department => <option key={department.id} value={storesDepartmentId ? department.id : (department.code || department.name)}>{department.code || department.name}</option>)}
            </select>
            {trainingDepartmentsError && <p className="text-[11px] text-[#B91C1C]" role="alert">{trainingDepartmentsError}</p>}
            {!trainingDepartmentsLoading && !trainingDepartmentsError && trainingDepartments.length === 0 && <p className="text-[11px] text-[#B91C1C]" role="alert">No active departments found.</p>}
          </div>
        );
      }
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

    if (col.type === 'location-select') {
      return (
        <div className="space-y-2">
          <select name={col.key} value={value ?? ''} onChange={e => handleInputChange(e, isEdit)} className={FIELD_BASE} required={col.required} disabled={col.readonly || locationsLoading}>
            <option value="">{locationsLoading ? 'Loading locations...' : `Select ${col.label}...`}</option>
            {isEdit && value && !locationsData.some(location => location.name === value) && <option value={value}>{value} (historical)</option>}
            {locationsData.map(loc => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
          </select>
          {locationsError && <p className="text-[11px] text-[#B91C1C]" role="alert">{locationsError}</p>}
          {!locationsLoading && !locationsError && locationsData.length === 0 && <p className="text-[11px] text-[#B91C1C]" role="alert">No active locations found.</p>}
        </div>
      );
    }

    if (col.type === 'textarea') {
      return (
        <div>
          <textarea name={col.key} value={value ?? ''} onChange={e => handleInputChange(e, isEdit)} className={TEXTAREA_BASE} rows={4} required={col.required} readOnly={effectiveReadonly} />
          {schema.id === 'hazard-reporting' && ['description', 'corrective_action', 'remarks'].includes(col.key) && <p className={`mt-1 text-[11px] ${String(value || '').trim().split(/\s+/).filter(Boolean).length > 500 ? 'text-[#B91C1C]' : 'text-[#64748B]'}`}>{String(value || '').trim().split(/\s+/).filter(Boolean).length}/500 words</p>}
        </div>
      );
    }

    if (col.type === 'date') {
      return (
        <DatePickerField
          label={col.label}
          value={value ?? ''}
          required={col.required}
          disabled={effectiveReadonly}
          onChange={nextValue => handleInputChange({
            target: { name: col.key, value: nextValue, type: 'date' }
          } as React.ChangeEvent<HTMLInputElement>, isEdit)}
        />
      );
    }

    if (col.type === 'datetime') {
      return <input type="datetime-local" name={col.key} value={value ?? ''} onChange={e => handleInputChange(e, isEdit)} className={FIELD_BASE} required={col.required} readOnly={effectiveReadonly} />;
    }

    if (col.type === 'time') {
      return (
        <TimePickerField
          label={col.label}
          value={value ?? ''}
          onChange={v => handleInputChange({ target: { name: col.key, value: v } } as any, isEdit)}
          required={col.required}
          disabled={effectiveReadonly}
          autoPopulateOnFocus={schema.id === 'near-miss'}
        />
      );
    }

    return (
      <div className="space-y-1">
        <input
          type={col.type === 'number' ? 'number' : 'text'}
          name={col.key}
          value={value ?? ''}
          onChange={e => handleInputChange(e, isEdit)}
          className={FIELD_BASE}
          required={col.required}
          readOnly={effectiveReadonly}
          placeholder={col.placeholder}
        />
        {col.key === 'emp_id' && employeeError && (
          <p className="text-[11px] text-[#B91C1C]">{employeeError}</p>
        )}
      </div>
    );
  };

  const renderFormSection = (sectionTitle: string, columns: ColumnSchema[]) => {
    const source = editingId ? editFormData : formData;
    const visible = columns.filter(col => shouldShowConditionalField(schema.id, col.key, source));
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
              <div key={`incident-action-${index}`} className="grid grid-cols-1 items-end gap-2 rounded-lg border border-[#EEEEEE] bg-[#FCFCFC] p-3 md:grid-cols-[42px_minmax(0,1.5fr)_minmax(130px,.8fr)_minmax(130px,.8fr)_145px_110px_110px_auto]">
                <div className="flex h-9 items-center justify-center rounded-md bg-[#F7EDEB] text-[13px] font-bold text-[#CB0017]" aria-label={`Action number ${index + 1}`}>
                  {index + 1}
                </div>
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
              {renderField(col, source[col.key], !!editingId)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHazardAddEditModal = () => {
    const formSource = editingId ? editFormData : formData;
    const closeForm = () => {
      setIsAddModalOpen(false); setEditingId(null); setValidationError(null); setAttachmentWarning(null);
      setPendingFiles({}); setFormData({}); setEditFormData({}); setHazardStep(1); setHazardAutosavedAt(null);
      try { sessionStorage.removeItem(`hse-${schema.id}-draft`); } catch { /* ignore unavailable storage */ }
    };
    const steps = [
      { number: 1, label: 'Basic Information', description: 'Who, when and where' },
      { number: 2, label: 'Hazard Details', description: 'Classification and impact' },
      { number: 3, label: 'Corrective Action', description: 'Ownership and follow-up' },
      { number: 4, label: 'Review', description: 'Confirm and submit' },
    ];
    const scrollToStep = (step: number) => {
      setHazardStep(step);
      document.getElementById(`hazard-step-${step}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const status = formSource.status_id || 'Open';

    const isStepCompleted = (stepNumber: number) => {
      if (stepNumber === 4) return false;
      const relevantSections = sectionGroups.filter(s => {
        if (stepNumber === 1) return s.title === 'Basic Information';
        if (stepNumber === 2) return s.title === 'Hazard Details';
        if (stepNumber === 3) return !['Basic Information', 'Hazard Details'].includes(s.title);
        return false;
      });
      const requiredCols = relevantSections.flatMap(s => s.columns).filter(col => col.required && !col.hideFromForm && shouldShowConditionalField(schema.id, col.key, formSource));
      if (requiredCols.length === 0) return false;
      const completedCols = requiredCols.filter(col => String(formSource[col.key] ?? '').trim() !== '');
      return completedCols.length === requiredCols.length;
    };

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F7]" role="dialog" aria-modal="true" aria-labelledby="hazard-form-title">
        <header className="shrink-0 border-b border-[#E5E7EB] bg-white px-5 py-4 sm:px-8">
          <div className="mx-auto flex max-w-[1500px] items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF4D6] sm:flex">
                <img src="/image.png" alt="Continental Biscuits" className="h-9 w-9 object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#64748B]">Leading Indicators <span className="mx-1 text-[#CBD5E1]">/</span> Hazard Reporting</p>
                <h2 id="hazard-form-title" className="mt-1 text-xl font-bold tracking-tight text-[#161616] sm:text-2xl">Report a Hazard</h2>
                <p className="mt-1 text-[13px] text-[#64748B]">Capture, assign and track workplace hazards</p>
              </div>
            </div>
            <div className="flex shrink-0 items-start gap-4">
              <div className="hidden items-center gap-2 text-right sm:flex">
                <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                <div><p className="text-[12px] font-semibold text-[#374151]">Draft autosaved</p><p className="text-[11px] text-[#94A3B8]">{hazardAutosavedAt ? 'Just now' : 'Waiting for changes'}</p></div>
              </div>
              <button type="button" onClick={closeForm} aria-label="Close hazard report" className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#161616] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CB0017]/30"><X className="h-5 w-5" /></button>
            </div>
          </div>
        </header>

        <nav className="shrink-0 overflow-x-auto border-b border-[#E5E7EB] bg-white px-5 py-3 sm:px-8" aria-label="Hazard report steps">
          <div className="mx-auto flex min-w-[650px] max-w-[1200px] items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <button type="button" onClick={() => scrollToStep(step.number)} aria-current={hazardStep === step.number ? 'step' : undefined} className={`flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CB0017]/30 ${hazardStep === step.number || isStepCompleted(step.number) ? 'text-[#CB0017]' : 'text-[#64748B] hover:text-[#374151]'}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${isStepCompleted(step.number) ? 'border-[#CB0017] bg-[#CB0017] text-white' : hazardStep === step.number ? 'border-[#CB0017] bg-[#FFF1F3] text-[#CB0017]' : 'border-[#CBD5E1] bg-white text-[#475569]'}`}>
                    {isStepCompleted(step.number) ? <Check className="h-4 w-4" /> : step.number}
                  </span>
                  <span className="hidden sm:block"><span className="block text-[13px] font-semibold">{step.label}</span><span className="block text-[10px] text-[#94A3B8]">{step.description}</span></span>
                </button>
                {index < steps.length - 1 && <div className="mx-2 h-px min-w-8 flex-1 bg-[#E2E8F0]" />}
              </React.Fragment>
            ))}
          </div>
        </nav>

        <div id="modal-scroll-area" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
          <div className="mx-auto max-w-[1000px] grid grid-cols-1 items-start gap-5">
            <main className="space-y-5">
              {validationError && <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3" role="alert"><AlertTriangle className="mt-0.5 h-4 w-4 text-[#DC2626]" /><div><p className="text-[13px] font-semibold text-[#991B1B]">{errorTitle}</p><p className="mt-0.5 text-[12px] text-[#B91C1C]">{validationError}</p></div></div>}
              {attachmentWarning && <div className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-[12px] text-[#9A3412]" role="status">{attachmentWarning}</div>}
              <form id="hazard-module-form" onSubmit={handleSubmit} className="space-y-5">
                {sectionGroups.map((section, index) => {
                  const step = section.title === 'Basic Information' ? 1 : section.title === 'Hazard Details' ? 2 : 3;
                  const sectionId = section.title === 'Basic Information' || section.title === 'Hazard Details' || (step === 3 && !sectionGroups.slice(0, index).some(item => !['Basic Information', 'Hazard Details'].includes(item.title))) ? `hazard-step-${step}` : `hazard-section-${index}`;
                  return <div id={sectionId} key={section.title} className="scroll-mt-5">{renderFormSection(section.title, section.columns)}</div>;
                })}
              </form>
              <section id="hazard-step-4" className="scroll-mt-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3"><div className="h-5 w-1 rounded-full bg-[#CB0017]" /><div><h3 className="text-[15px] font-semibold text-[#161616]">Review</h3><p className="mt-1 text-[12px] text-[#64748B]">Review the report before saving it to the HSE system.</p></div></div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[['Status', status], ['Department', departmentDisplayValue(formSource.department_id) || 'Not selected'], ['Location', formSource.location || 'Not selected'], ['Hazard Category', formSource.hazard_category_id || 'Not selected'], ['Risk Level', formSource.risk_rating_id || 'Not selected'], ['Evidence', Object.keys(pendingFiles).length ? `${Object.keys(pendingFiles).length} file queued` : 'None attached']].map(([label, value]) => <div key={label} className="rounded-lg bg-[#FAFAFA] px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p><p className="mt-1 truncate text-[13px] font-medium text-[#374151]">{value}</p></div>)}
                </div>
              </section>
            </main>
          </div>
        </div>

        <footer className="shrink-0 border-t border-[#E5E7EB] bg-white px-4 py-3 sm:px-8">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] text-[#64748B]">Fields marked with <span className="font-semibold text-[#CB0017]">*</span> are required</p><div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" onClick={() => handleSubmit(undefined, 'Draft')} disabled={isSaving} className="h-10 rounded-md border border-[#CBD5E1] bg-white px-4 text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"><Save className="mr-2 inline h-4 w-4" />Save as Draft</button><button type="button" onClick={closeForm} className="h-10 rounded-md border border-[#CBD5E1] bg-white px-5 text-[13px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button><button type="submit" form="hazard-module-form" disabled={isSaving} className="h-10 rounded-md bg-[#CB0017] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#A8001A] disabled:cursor-not-allowed disabled:opacity-60"><Save className={`mr-2 inline h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />{isSaving ? 'Saving…' : 'Save & Continue'}<ArrowRight className="ml-2 inline h-4 w-4" /></button></div></div>
        </footer>
      </div>
    );
  };

  const renderWorkflowAddEditModal = () => {
    const formSource = editingId ? editFormData : formData;
    const steps = [
      { number: 1, label: 'Basic Information', match: ['Basic Information'] },
      { number: 2, label: schema.id === 'near-miss' ? 'Near Miss Details' : 'Incident Details', match: schema.id === 'near-miss' ? ['Near Miss Details'] : ['Incident Details'] },
      { number: 3, label: schema.id === 'near-miss' ? 'Corrective Action' : 'Investigation & Actions', match: schema.id === 'near-miss' ? ['Corrective Actions', 'Investigation'] : ['Investigation', 'Actions', 'Assignment'] },
      { number: 4, label: 'Review', match: [] },
    ];
    const closeForm = () => { setIsAddModalOpen(false); setEditingId(null); setValidationError(null); setAttachmentWarning(null); setPendingFiles({}); setFormData({}); setEditFormData({}); setHazardStep(1); setHazardAutosavedAt(null); try { sessionStorage.removeItem(`hse-${schema.id}-draft`); } catch { /* ignore unavailable storage */ } };
    const scrollToStep = (step: number) => { setHazardStep(step); document.getElementById(`${schema.id}-workflow-step-${step}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    const status = formSource.status_id || formSource.status || 'Open';
    const summaryKeys = schema.id === 'near-miss'
      ? ['department_id', 'location', 'reported_by', 'responsible_department_id', 'investigation_required', 'reported_in_hazard', 'remarks']
      : ['department_id', 'location', 'incident_category_id', 'risk_rating_id', 'reported_by', 'emp_id'];
    const summaryFields = schema.columns.filter(col => !col.hideFromForm && summaryKeys.includes(col.key));
    const reviewValue = (field: ColumnSchema) => {
      if (field.key === 'department_id') return departmentDisplayValue(formSource[field.key]);
      if (schema.id === 'near-miss' && field.key === 'responsible_department_id') {
        const selectedDepartment = trainingDepartments.find(department =>
          department.id === formSource[field.key] ||
          String(department.code || '').trim().toLowerCase() === String(formSource[field.key] || '').trim().toLowerCase() ||
          String(department.name || '').trim().toLowerCase() === String(formSource[field.key] || '').trim().toLowerCase(),
        );
        return selectedDepartment?.code || selectedDepartment?.name || formSource.responsible_department || formSource.responsibleDepartment?.name || '';
      }
      return formSource[field.key];
    };

    const isStepCompleted = (stepNumber: number) => {
      if (stepNumber === 4) return false;
      const stepConfig = steps.find(s => s.number === stepNumber);
      if (!stepConfig) return false;
      const relevantSections = sectionGroups.filter(s => stepConfig.match.some(m => s.title.includes(m)));
      const requiredCols = relevantSections.flatMap(s => s.columns).filter(col => col.required && !col.hideFromForm && shouldShowConditionalField(schema.id, col.key, formSource));
      if (requiredCols.length === 0) return false;
      const completedCols = requiredCols.filter(col => String(formSource[col.key] ?? '').trim() !== '');
      return completedCols.length === requiredCols.length;
    };

    return <div className="fixed inset-0 z-50 flex flex-col bg-[#F7F7F7]" role="dialog" aria-modal="true" aria-labelledby={`${schema.id}-workflow-title`}>
      <header className="shrink-0 border-b border-[#E5E7EB] bg-white px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-[1500px] items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-4"><div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF4D6] sm:flex"><img src="/image.png" alt="Continental Biscuits" className="h-9 w-9 object-contain" /></div><div><p className="text-[11px] font-semibold text-[#64748B]">Leading Indicators <span className="mx-1 text-[#CBD5E1]">/</span> {schema.title}</p><h2 id={`${schema.id}-workflow-title`} className="mt-1 text-xl font-bold tracking-tight text-[#161616] sm:text-2xl">{schema.title}</h2><p className="mt-1 text-[13px] text-[#64748B]">Capture, review and track workplace safety records</p></div></div><div className="flex items-start gap-4"><div className="hidden items-center gap-2 text-right sm:flex"><CheckCircle2 className="h-5 w-5 text-[#16A34A]" /><div><p className="text-[12px] font-semibold text-[#374151]">Draft autosaved</p><p className="text-[11px] text-[#94A3B8]">{hazardAutosavedAt ? 'Just now' : 'Waiting for changes'}</p></div></div><button type="button" onClick={closeForm} aria-label={`Close ${schema.title}`} className="rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CB0017]/30"><X className="h-5 w-5" /></button></div></div></header>
      <nav className="shrink-0 overflow-x-auto border-b border-[#E5E7EB] bg-white px-5 py-3 sm:px-8" aria-label={`${schema.title} steps`}><div className="mx-auto flex min-w-[620px] max-w-[1200px] items-center">{steps.map((step, index) => <React.Fragment key={step.number}><button type="button" onClick={() => scrollToStep(step.number)} aria-current={hazardStep === step.number ? 'step' : undefined} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left ${hazardStep === step.number || isStepCompleted(step.number) ? 'text-[#CB0017]' : 'text-[#64748B] hover:text-[#374151]'}`}><span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${isStepCompleted(step.number) ? 'border-[#CB0017] bg-[#CB0017] text-white' : hazardStep === step.number ? 'border-[#CB0017] bg-[#FFF1F3] text-[#CB0017]' : 'border-[#CBD5E1] bg-white text-[#475569]'}`}>{isStepCompleted(step.number) ? <Check className="h-4 w-4" /> : step.number}</span><span className="hidden text-[13px] font-semibold sm:block">{step.label}</span></button>{index < steps.length - 1 && <div className="mx-2 h-px min-w-8 flex-1 bg-[#E2E8F0]" />}</React.Fragment>)}</div></nav>
      <div id="modal-scroll-area" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8"><div className="mx-auto max-w-[1000px] grid grid-cols-1 items-start gap-5"><main className="space-y-5">{validationError && <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3" role="alert"><AlertTriangle className="mt-0.5 h-4 w-4 text-[#DC2626]" /><div><p className="text-[13px] font-semibold text-[#991B1B]">{errorTitle}</p><p className="mt-0.5 text-[12px] text-[#B91C1C]">{validationError}</p></div></div>}{attachmentWarning && <div className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-[12px] text-[#9A3412]" role="status">{attachmentWarning}</div>}<form id={`${schema.id}-workflow-form`} onSubmit={handleSubmit} className="space-y-5">{sectionGroups.map((section, index) => { const step = steps.find(item => item.match.includes(section.title))?.number || 3; const isFirstForStep = !sectionGroups.slice(0, index).some(previous => (steps.find(item => item.match.includes(previous.title))?.number || 3) === step); const sectionId = isFirstForStep ? `${schema.id}-workflow-step-${step}` : `${schema.id}-workflow-section-${index}`; return <div key={section.title} id={sectionId} className="scroll-mt-5">{renderFormSection(section.title, section.columns)}</div>; })}</form><section id={`${schema.id}-workflow-step-4`} className="scroll-mt-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="h-5 w-1 rounded-full bg-[#CB0017]" /><div><h3 className="text-[15px] font-semibold text-[#161616]">Review</h3><p className="mt-1 text-[12px] text-[#64748B]">Confirm the entered record before saving it.</p></div></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"><div className="rounded-lg bg-[#FAFAFA] px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">Status</p><p className="mt-1 text-[13px] font-medium text-[#374151]">{status}</p></div>{summaryFields.map(field => <div key={field.key} className="rounded-lg bg-[#FAFAFA] px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{field.label}</p><p className="mt-1 truncate text-[13px] font-medium text-[#374151]">{reviewValue(field) || 'Not selected'}</p></div>)}</div></section></main></div></div>
      <footer className="shrink-0 border-t border-[#E5E7EB] bg-white px-4 py-3 sm:px-8"><div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] text-[#64748B]">Fields marked with <span className="font-semibold text-[#CB0017]">*</span> are required</p><div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" onClick={() => handleSubmit(undefined, 'Draft')} disabled={isSaving} className="h-10 rounded-md border border-[#CBD5E1] bg-white px-4 text-[13px] font-semibold text-[#475569] disabled:opacity-50"><Save className="mr-2 inline h-4 w-4" />Save as Draft</button><button type="button" onClick={closeForm} className="h-10 rounded-md border border-[#CBD5E1] bg-white px-5 text-[13px] font-semibold text-[#475569]">Cancel</button><button type="submit" form={`${schema.id}-workflow-form`} disabled={isSaving} className="h-10 rounded-md bg-[#CB0017] px-5 text-[13px] font-semibold text-white hover:bg-[#A8001A] disabled:opacity-60"><Save className="mr-2 inline h-4 w-4" />{isSaving ? 'Saving…' : 'Save & Continue'}<ArrowRight className="ml-2 inline h-4 w-4" /></button></div></div></footer>
    </div>;
  };

  const renderAddEditModal = () => {
    if (schema.id === 'hazard-reporting') return renderHazardAddEditModal();
    if (schema.id === 'incident-log' || schema.id === 'near-miss') return renderWorkflowAddEditModal();
    if (schema.id === 'hazard-reporting') return renderHazardAddEditModal();
    const formSource = editingId ? editFormData : formData;
    const isEditingTrainingDraft = schema.id === 'training-records' && String(formSource.status_id ?? formSource.status ?? '').toLowerCase() === 'draft';
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
              onClick={() => { setIsAddModalOpen(false); setEditingId(null); setValidationError(null); setAttachmentWarning(null); setPendingFiles({}); setFormData({}); setEditFormData({}); }}
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
                  <p className="text-[13px] font-semibold text-[#991B1B]">{errorTitle}</p>
                  <p className="text-[12px] text-[#B91C1C] mt-0.5">{validationError}</p>
                </div>
              </div>
            )}
            {attachmentWarning && <div className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-[12px] text-[#9A3412]" role="status">{attachmentWarning}</div>}

            <form id="module-form" onSubmit={handleSubmit} className="space-y-5">
              {sectionGroups.map(section => renderFormSection(section.title, section.columns))}
            </form>
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-[#E0E0E0] bg-white px-6 py-4">
            <div className="text-[11px] text-[#9CA3AF]">
              Fields marked with <span className="text-[#CB0017]">*</span> are required
            </div>
            <div className="flex items-center gap-2">
              {schema.id === 'training-records' && (!editingId || isEditingTrainingDraft) && (
                <button
                  type="button"
                  onClick={() => handleSubmit(undefined, 'Draft')}
                  disabled={isSaving}
                  className="h-9 px-4 text-[13px] font-medium rounded-md border border-[#D7A55A] bg-[#FFF7ED] text-[#9A3412] hover:bg-[#FFEDD5] disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" />
                  {editingId ? 'Update Draft' : 'Save as Draft'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingId(null);
                  setValidationError(null);
                  setPendingFiles({});
                  setAttachmentWarning(null);
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
                disabled={isSaving}
                className="h-9 px-5 text-[13px] font-medium rounded-md bg-[#CB0017] text-white hover:bg-[#A8001A] inline-flex items-center gap-1.5"
              >
                <Save className={`h-3.5 w-3.5 ${isSaving ? 'animate-pulse' : ''}`} />
                {isSaving ? 'Saving…' : isEditingTrainingDraft ? 'Register Training' : editingId ? 'Save Changes' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSavedModal = () => schema.id === 'hazard-reporting' && savedModalOpen ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="saved-title">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
          <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
        </div>
        <h2 id="saved-title" className="mt-4 text-xl font-bold text-[#166534]">Saved</h2>
        <p className="mt-2 text-sm text-[#64748B]">The Hazard Reporting record was saved successfully.</p>
        {attachmentWarning && <p className="mt-3 rounded-md bg-[#FFF7ED] px-3 py-2 text-xs text-[#9A3412]">{attachmentWarning}</p>}
        <button type="button" autoFocus onClick={() => { setSavedModalOpen(false); setAttachmentWarning(null); }} className="mt-6 rounded-md bg-[#CB0017] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#A8001A]">
          Done
        </button>
      </div>
    </div>
  ) : null;

  const entityName = schema.title.replace('Reporting', '').trim();

  const renderHazardWorkspace = () => (
    <Layout>
      <ContextHeader
        title={schema.title}
        breadcrumbs={[schema.title]}
        subtitle={`${pagination.totalRecords.toLocaleString()} records available`}
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
            onClick: () => {
              const defaultForm = schema.id === 'hazard-reporting'
                ? { status_id: 'Open', department_id: '' }
                : schema.id === 'near-miss'
                  ? createNewNearMissFormDefaults()
                  : {};
              let recoveredForm: any = defaultForm;
              try {
                const savedDraft = sessionStorage.getItem(`hse-${schema.id}-draft`);
                if (savedDraft) {
                  recoveredForm = { ...defaultForm, ...JSON.parse(savedDraft) };
                  if (['hazard-reporting', 'near-miss'].includes(schema.id)) recoveredForm.department_id = '';
                  if (schema.id === 'near-miss') {
                    // The browser autosave is not a persisted Near Miss
                    // draft. Do not restore a responsible department from
                    // it, because older versions could save ADM (the first
                    // option) as if it were an intentional selection. A
                    // persisted server draft is reopened through edit mode.
                    recoveredForm.responsible_department_id = '';
                    recoveredForm.responsible_department = '';
                  }
                }
              } catch { /* ignore malformed or unavailable draft storage */ }
              setPendingFiles({});
              setExistingAttachments([]);
              clearAttachmentPreviews();
              setAttachmentWarning(null);
              setFormData(recoveredForm);
              if (schema.id === 'hazard-reporting') {
                setHazardStep(1);
                setHazardAutosavedAt(null);
              }
              if (schema.id === 'incident-log' || schema.id === 'near-miss') {
                setHazardStep(1);
                setHazardAutosavedAt(null);
              }
              setIsAddModalOpen(true);
            },
            variant: 'primary' as const,
          }] : []),
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <FilterBar variant="hazard" />
          <button onClick={() => setShowReviewPanel(true)} disabled={selectedCount === 0} className="h-8 px-3 text-[12px] font-medium rounded-md border border-[#DEDEDE] bg-white text-[#374151] hover:bg-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-40 inline-flex items-center gap-1.5">
            <PanelRightOpen className="h-3.5 w-3.5" /> HSE Review{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </button>
          <button onClick={() => { setAttachmentWarning(null); setCloseHazardData({ closingProof: null, closingRemarks: '' }); setShowCloseHazard(true); }} disabled={selectedCount === 0} className="h-8 px-3 text-[12px] font-medium rounded-md border border-[#CB0017]/30 bg-[#FFF7F7] text-[#CB0017] hover:bg-[#FDECEC] disabled:cursor-not-allowed disabled:opacity-40 inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Close {entityName}{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </button>
          <button onClick={() => setShowMobileFilters(true)} className="md:hidden h-8 px-3 text-[12px] font-medium rounded-md border border-[#DEDEDE] bg-white text-[#374151] inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
        </div>
      </ContextHeader>

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { title: `${entityName} Assigned`, value: hazardSummary.assigned, tone: 'warning' },
            { title: 'Submitted for Review', value: hazardSummary.submittedForReview, tone: 'neutral' },
            { title: 'Closed This Month', value: hazardSummary.closedThisMonth, tone: 'success' },
          ].map(card => (
            <div key={card.title} className={`${CARD} p-4`}>
              <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-semibold">{card.title}</p>
              <p className="text-[24px] font-bold text-[#1A1818] mt-2">{card.value}</p>
            </div>
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
                  <th className="w-10">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisibleSelection}
                      onClick={event => event.stopPropagation()}
                      aria-label="Select all visible hazard records"
                      className="rounded border-[#D1D5DB] focus:ring-2 focus:ring-[#CB0017]/30"
                    />
                  </th>
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
                            onKeyDown={e => e.stopPropagation()}
                            aria-label={`Select hazard record ${entry.id}`}
                            className="rounded border-[#D1D5DB] focus:ring-2 focus:ring-[#CB0017]/30"
                          />
                        </td>
                        {visibleColumns.map(col => (
                          <td key={col.key} style={{ paddingTop: density === 'compact' ? 8 : density === 'spacious' ? 16 : 10, paddingBottom: density === 'compact' ? 8 : density === 'spacious' ? 16 : 10 }}>
                            {editingId === entry.id ? renderField(col, editFormData[col.key], true) : STATUS_COLUMNS.has(col.key) && entry[col.key] ? <StatusBadge status={entry[col.key]} size="sm" /> : <span className={`${col.type === 'date' || col.type === 'datetime' ? 'whitespace-nowrap ' : ''}text-[13px] text-[#1A1818]`}>{formatTableValue(col, displayTableValue(entry, col))}</span>}
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
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={pagination.totalRecords || searchedEntries.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
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

      <SlideOverPanel isOpen={showReviewPanel} onClose={() => setShowReviewPanel(false)} title="HSE Review" description="Review selected hazard records and apply the approved workflow action.">
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
        onClose={() => { setShowCloseHazard(false); setCloseHazardData({ closingProof: null, closingRemarks: '' }); setAttachmentWarning(null); }}
        title="Close Hazard"
        description="Submit closing proof for review. No permanent close action is performed."
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-dashed border-[#D6D6D6] bg-[#FAFAFA] p-4">
            <ImageUploadField
              label="Closing Proof Photo"
              file={closeHazardData.closingProof}
              existingAttachment={existingAttachments.find(attachment => attachment.attachmentType === 'CLOSING_PROOF_PHOTO') || null}
              existingPreviewUrl={existingAttachments.find(attachment => attachment.attachmentType === 'CLOSING_PROOF_PHOTO') ? attachmentPreviewUrls[existingAttachments.find(attachment => attachment.attachmentType === 'CLOSING_PROOF_PHOTO')!.id] : null}
              onFileChange={file => setCloseHazardData(previous => ({ ...previous, closingProof: file }))}
            />
           </div>
           {attachmentWarning && <p className="rounded-md bg-[#FFF7ED] px-3 py-2 text-[12px] text-[#9A3412]" role="alert">{attachmentWarning}</p>}
           <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">Closing Remarks</label>
            <textarea className={TEXTAREA_BASE} rows={4} value={closeHazardData.closingRemarks} onChange={e => setCloseHazardData(prev => ({ ...prev, closingRemarks: e.target.value }))} placeholder="Enter closing remarks..." />
          </div>
          <div className="flex items-center justify-end gap-2">
             <button type="button" className="h-9 px-4 text-[13px] font-medium rounded-md border border-[#DEDEDE] text-[#374151] hover:bg-[#F5F5F5]" onClick={() => { setShowCloseHazard(false); setCloseHazardData({ closingProof: null, closingRemarks: '' }); setAttachmentWarning(null); }}>Cancel</button>
             <button type="button" disabled={isSaving} onClick={submitClosingProof} className="h-9 px-4 text-[13px] font-medium rounded-md bg-[#CB0017] text-white hover:bg-[#A8001A] disabled:opacity-50">{isSaving ? 'Uploading…' : 'Submit for Review'}</button>
          </div>
        </div>
      </CenterModal>

      <SlideOverPanel isOpen={showMobileFilters} onClose={() => setShowMobileFilters(false)} title="Filters" description="Mobile filter drawer for enterprise modules.">
        <FilterBar variant="hazard" className="flex-col items-stretch" />
      </SlideOverPanel>
    </Layout>
  );

  const renderGenericWorkspace = () => (
    <Layout>
      <ContextHeader
        title={schema.title}
        breadcrumbs={[schema.title]}
        subtitle={schema.id === 'training-records'
          ? `${trainingSummary.totalRecords.toLocaleString()} registered trainings${trainingSummary.draftRecords ? ` • ${trainingSummary.draftRecords.toLocaleString()} draft${trainingSummary.draftRecords === 1 ? '' : 's'}` : ''}${searchQuery ? ` filtered by "${searchQuery}"` : ''}`
          : `${pagination.totalRecords.toLocaleString()} records${searchQuery ? ` filtered by "${searchQuery}"` : ''}`}
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
            onClick: () => {
              const defaultForm = schema.id === 'near-miss'
                ? createNewNearMissFormDefaults()
                : {};
              let recoveredForm: any = defaultForm;
              try {
                const savedDraft = sessionStorage.getItem(`hse-${schema.id}-draft`);
                if (savedDraft) {
                  recoveredForm = { ...defaultForm, ...JSON.parse(savedDraft) };
                  if (schema.id === 'near-miss') {
                    // This is a new record. An autosaved form is not a
                    // persisted draft record, so never carry its reporting
                    // department into a new entry. Saved drafts reopened
                    // through the register use edit mode and keep their ID.
                    recoveredForm.department_id = '';
                    recoveredForm.responsible_department_id = '';
                    recoveredForm.responsible_department = '';
                  }
                }
              } catch { /* ignore malformed or unavailable draft storage */ }
              setFormData(recoveredForm);
              setEditFormData({});
              setEditingId(null);
              setValidationError(null);
              setAttachmentWarning(null);
              setHazardStep(1);
              setHazardAutosavedAt(null);
              setIsAddModalOpen(true);
            },
            variant: 'primary' as const,
          }] : []),
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <FilterBar
            showMonthInsteadOfStatus={schema.id === 'training-records'}
            variant={schema.id === 'near-miss' ? 'near-miss' : 'default'}
          />
          <button onClick={() => setShowMobileFilters(true)} className="md:hidden h-8 px-3 text-[12px] font-medium rounded-md border border-[#DEDEDE] bg-white text-[#374151] inline-flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
        </div>
      </ContextHeader>

      <div className="p-6 space-y-5">
        {schema.id === 'training-records' && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total Trainings', value: trainingSummary.totalRecords.toLocaleString() },
              { label: 'Training Hours', value: Math.round(trainingSummary.totalManhours).toLocaleString() },
              { label: 'Attendance %', value: trainingSummary.attendanceRate == null ? '—' : `${trainingSummary.attendanceRate}%` },
              { label: 'Pending Trainings', value: trainingSummary.pendingRecords.toLocaleString() },
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
                  <th className="w-10">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleVisibleSelection}
                      onClick={event => event.stopPropagation()}
                      aria-label={`Select all visible ${schema.title.toLowerCase()}`}
                      className="rounded border-[#D1D5DB] focus:ring-2 focus:ring-[#CB0017]/30"
                    />
                  </th>
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
                  const isTrainingDraft = schema.id === 'training-records' && String(entry.status_id ?? entry.status ?? '').toLowerCase() === 'draft';
                  return (
                    <React.Fragment key={entry.id}>
                      <tr className={`${isTrainingDraft ? 'bg-[#FFF7ED]' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'} ${isSelected ? '!bg-[#FFF7F7]' : ''}`} onClick={() => setSelectedRecordId(entry.id)}>
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
                            {editingId === entry.id ? renderField(col, editFormData[col.key], true) : STATUS_COLUMNS.has(col.key) && entry[col.key] ? <StatusBadge status={entry[col.key]} size="sm" /> : isTrainingDraft && col.key === 'date' ? <div className="flex items-center gap-2 whitespace-nowrap"><span className="text-[13px] text-[#1A1818]">{formatTableValue(col, displayTableValue(entry, col))}</span><StatusBadge status="Draft" size="xs" /></div> : <span className={`${col.type === 'date' || col.type === 'datetime' ? 'whitespace-nowrap ' : ''}text-[13px] text-[#1A1818]`}>{formatTableValue(col, displayTableValue(entry, col))}</span>}
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
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={pagination.totalRecords || searchedEntries.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
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

      <SlideOverPanel isOpen={showReviewPanel} onClose={() => setShowReviewPanel(false)} title="HSE Review" description="Review selected records and apply the approved workflow action.">
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
        onClose={() => { setShowCloseHazard(false); setCloseHazardData({ closingProof: null, closingRemarks: '' }); setAttachmentWarning(null); }}
        title="Close Hazard"
        description="Submit closing proof for review. No permanent close action is performed."
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-dashed border-[#D6D6D6] bg-[#FAFAFA] p-4">
            <ImageUploadField
              label="Closing Proof Photo"
              file={closeHazardData.closingProof}
              existingAttachment={existingAttachments.find(attachment => attachment.attachmentType === 'CLOSING_PROOF_PHOTO') || null}
              existingPreviewUrl={existingAttachments.find(attachment => attachment.attachmentType === 'CLOSING_PROOF_PHOTO') ? attachmentPreviewUrls[existingAttachments.find(attachment => attachment.attachmentType === 'CLOSING_PROOF_PHOTO')!.id] : null}
              onFileChange={file => setCloseHazardData(previous => ({ ...previous, closingProof: file }))}
            />
          </div>
          {attachmentWarning && <p className="rounded-md bg-[#FFF7ED] px-3 py-2 text-[12px] text-[#9A3412]" role="alert">{attachmentWarning}</p>}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">Closing Remarks</label>
            <textarea className={TEXTAREA_BASE} rows={4} value={closeHazardData.closingRemarks} onChange={e => setCloseHazardData(prev => ({ ...prev, closingRemarks: e.target.value }))} placeholder="Enter closing remarks..." />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" className="h-9 px-4 text-[13px] font-medium rounded-md border border-[#DEDEDE] text-[#374151] hover:bg-[#F5F5F5]" onClick={() => { setShowCloseHazard(false); setCloseHazardData({ closingProof: null, closingRemarks: '' }); setAttachmentWarning(null); }}>Cancel</button>
            <button type="button" disabled={isSaving} onClick={submitClosingProof} className="h-9 px-4 text-[13px] font-medium rounded-md bg-[#CB0017] text-white hover:bg-[#A8001A] disabled:opacity-50">{isSaving ? 'Uploading…' : 'Submit for Review'}</button>
          </div>
        </div>
      </CenterModal>

      <SlideOverPanel isOpen={showMobileFilters} onClose={() => setShowMobileFilters(false)} title="Filters" description="Mobile filter drawer for enterprise modules.">
        <FilterBar
          showMonthInsteadOfStatus={schema.id === 'training-records'}
          variant={schema.id === 'near-miss' ? 'near-miss' : 'default'}
          className="flex-col items-stretch"
        />
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
              <p className="mt-0.5 text-[12px] text-[#6B7280]">{pagination.totalRecords} records from the latest backend data</p>
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
                      <td className="whitespace-nowrap">{formatDateOnly(date)}</td>
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
            <PaginationControls currentPage={currentPage} totalPages={totalPages} totalRecords={pagination.totalRecords || sortedEntries.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
          )}
        </div>
      </div>
      {isAddModalOpen && renderAddEditModal()}
      {renderSavedModal()}
      {editingId && renderAddEditModal()}
    </Layout>
  );

  if (schema.id === 'action-tracker') return <ActionTrackerRoute schema={schema} />;
  if (schema.id === 'hazard-reporting') return renderHazardWorkspace();
  if (schema.id === 'incident-log') return renderIncidentWorkspace();
  return renderGenericWorkspace();
};

export default DataEntrySection;
