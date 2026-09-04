import { Save } from 'lucide-react';
import {
  CLC_PRIMARY_SECTIONS,
  CLC_ROOT_SECTIONS,
  clcCauseToken,
  type ClcAnalysis,
  type ClcCauseGroup,
  type ClcCauseSection,
} from '../config/clcChart';

interface ClcChartProps {
  value: ClcAnalysis;
  onChange: (value: ClcAnalysis) => void;
  onSave: () => void;
  saving: boolean;
}

const checkboxClass = 'mt-0.5 h-4 w-4 shrink-0 accent-[#CB0017]';

const CauseGroup = ({
  section,
  group,
  value,
  onChange,
}: {
  section: ClcCauseSection;
  group: ClcCauseGroup;
  value: ClcAnalysis;
  onChange: (value: ClcAnalysis) => void;
}) => {
  const selection = value[section.id];
  const groupSelected = selection.selected_groups.includes(group.id);

  const updateSection = (
    selectedGroups: string[],
    selectedCauses: string[],
    otherDetails: Record<string, string>,
  ) => onChange({
    ...value,
    [section.id]: {
      selected_groups: selectedGroups,
      selected_causes: selectedCauses,
      other_details: otherDetails,
    },
  });

  const toggleGroup = () => {
    if (groupSelected) {
      const groupTokens = new Set(group.options.map(item => clcCauseToken(group.id, item.id)));
      const detailKeys = new Set([
        ...(group.otherKey ? [group.otherKey] : []),
        ...group.options.flatMap(item => item.otherKey ? [item.otherKey] : []),
      ]);
      updateSection(
        selection.selected_groups.filter(id => id !== group.id),
        selection.selected_causes.filter(id => !groupTokens.has(id)),
        Object.fromEntries(Object.entries(selection.other_details).filter(([key]) => !detailKeys.has(key))),
      );
      return;
    }
    updateSection(
      [...selection.selected_groups, group.id],
      selection.selected_causes,
      selection.other_details,
    );
  };

  const toggleCause = (causeId: string, otherKey?: string) => {
    const token = clcCauseToken(group.id, causeId);
    const isSelected = selection.selected_causes.includes(token);
    const otherDetails = { ...selection.other_details };
    if (isSelected && otherKey) delete otherDetails[otherKey];
    updateSection(
      isSelected || groupSelected ? selection.selected_groups : [...selection.selected_groups, group.id],
      isSelected
        ? selection.selected_causes.filter(id => id !== token)
        : [...selection.selected_causes, token],
      otherDetails,
    );
  };

  const updateOther = (key: string, detail: string) => updateSection(
    selection.selected_groups,
    selection.selected_causes,
    { ...selection.other_details, [key]: detail },
  );

  return (
    <section className="rounded-lg border border-[#D9E1EC] bg-white p-4">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={groupSelected}
          onChange={toggleGroup}
          className={checkboxClass}
        />
        <span className="text-sm font-bold text-[#374151]">{group.label}</span>
      </label>

      {group.options.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-[#EEF1F5] pt-3">
          {group.options.map(item => {
            const token = clcCauseToken(group.id, item.id);
            const selected = selection.selected_causes.includes(token);
            return (
              <div key={token}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-1 py-1 hover:bg-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleCause(item.id, item.otherKey)}
                    className={checkboxClass}
                  />
                  <span className="min-w-5 text-xs font-semibold text-[#64748B]">{item.number}</span>
                  <span className="text-sm font-normal leading-5 text-[#475569]">{item.label}</span>
                </label>
                {item.otherKey && selected && (
                  <textarea
                    value={selection.other_details[item.otherKey] || ''}
                    onChange={event => updateOther(item.otherKey!, event.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder="Specify other cause"
                    aria-label={`${group.label} ${item.label}`}
                    className="ml-14 mt-1 block w-[calc(100%-3.5rem)] resize-y rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-sm font-normal text-[#374151] outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/10"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {group.otherKey && groupSelected && (
        <textarea
          value={selection.other_details[group.otherKey] || ''}
          onChange={event => updateOther(group.otherKey!, event.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Specify other cause"
          aria-label={group.label}
          className="mt-3 block w-full resize-y rounded-md border border-[#D9E1EC] bg-white px-3 py-2 text-sm font-normal text-[#374151] outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/10"
        />
      )}
    </section>
  );
};

const CauseSection = ({
  section,
  value,
  onChange,
}: {
  section: ClcCauseSection;
  value: ClcAnalysis;
  onChange: (value: ClcAnalysis) => void;
}) => {
  const selectedCount = value[section.id].selected_causes.length;
  const selectedGroups = value[section.id].selected_groups.length;
  return (
    <section className="overflow-hidden rounded-xl border border-[#D9E1EC] bg-[#F8FAFC]">
      <header className="border-b border-[#D9E1EC] bg-[#EEF2F7] px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-sm font-bold text-[#26364A]">
            {section.code && <span className="mr-1 text-[#CB0017]">{section.code} —</span>}
            {section.title}
          </h4>
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#64748B]">
            {selectedCount} causes / {selectedGroups} groups
          </span>
        </div>
      </header>
      <div className="space-y-3 p-3">
        {section.groups.map(group => (
          <CauseGroup key={group.id} section={section} group={group} value={value} onChange={onChange} />
        ))}
      </div>
    </section>
  );
};

const SectionGrid = ({
  title,
  description,
  sections,
  value,
  onChange,
}: {
  title: string;
  description: string;
  sections: ClcCauseSection[];
  value: ClcAnalysis;
  onChange: (value: ClcAnalysis) => void;
}) => (
  <section>
    <div className="mb-3">
      <h3 className="text-base font-bold uppercase tracking-wide text-[#2C1810]">{title}</h3>
      <p className="mt-1 text-xs font-normal text-[#64748B]">{description}</p>
    </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {sections.map(section => (
        <CauseSection key={section.id} section={section} value={value} onChange={onChange} />
      ))}
    </div>
  </section>
);

export const ClcChart = ({ value, onChange, onSave, saving }: ClcChartProps) => (
  <section id="clc-chart" className="overflow-hidden rounded-xl border border-[#D9E1EC] bg-white shadow-sm">
    <header className="border-b border-[#E5E7EB] bg-[#F8FAFC] px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="h-5 w-1 rounded-full bg-[#CB0017]" />
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider text-[#374151]">CLC Chart</h2>
          <p className="mt-0.5 text-xs font-normal text-[#64748B]">Immediate, Primary &amp; Root Causes Analysis</p>
        </div>
      </div>
    </header>

    <div className="space-y-7 p-5">
      <SectionGrid
        title="Primary Causes"
        description="Select all acts, failures to act, or conditions that contributed directly to the incident."
        sections={CLC_PRIMARY_SECTIONS}
        value={value}
        onChange={onChange}
      />
      <SectionGrid
        title="Root Causes"
        description="Select each applicable factor category and all detailed causes within it."
        sections={CLC_ROOT_SECTIONS}
        value={value}
        onChange={onChange}
      />
      <div className="flex justify-end border-t border-[#E5E7EB] pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-[#CB0017] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#A30012] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save CLC Analysis'}
        </button>
      </div>
    </div>
  </section>
);

export default ClcChart;
