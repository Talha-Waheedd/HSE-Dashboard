export interface ResponsibleDepartmentOption {
  id: string;
  name: string;
  code?: string | null;
  isActive?: boolean;
}

export const createNewNearMissFormDefaults = () => ({
  status: 'Open',
  department_id: '',
  responsible_department_id: '',
  responsible_department: '',
  investigation_required: 'No',
  reported_in_hazard: 'No',
});

const normalized = (value: unknown) => String(value ?? '').trim().toLowerCase();

/**
 * Responsible Department uses the shared active department master. The
 * catch-all Other/Others record remains excluded for this assignment field,
 * while newly administered departments become available automatically.
 */
export const nearMissResponsibleDepartmentOptions = (departments: ResponsibleDepartmentOption[]) => (
  departments
    .filter(department => {
      const label = normalized(department.code || department.name);
      return department.isActive !== false
        && Boolean(department.id)
        && label !== 'other'
        && label !== 'others';
    })
    .sort((left, right) => nearMissResponsibleDepartmentLabel(left)
      .localeCompare(nearMissResponsibleDepartmentLabel(right)))
);

export const nearMissResponsibleDepartmentLabel = (department: ResponsibleDepartmentOption) => (
  String(department.code || department.name || '').trim()
);

export const nearMissResponsibleDepartmentFormValues = (
  departments: ResponsibleDepartmentOption[],
  selectedId: unknown,
) => {
  const options = nearMissResponsibleDepartmentOptions(departments);
  const selected = options.find(department => department.id === String(selectedId ?? '').trim());
  return {
    responsible_department_id: selected?.id || '',
    responsible_department: selected ? nearMissResponsibleDepartmentLabel(selected) : '',
  };
};

/**
 * New records accept only an actual selected option ID. Legacy name/code
 * matching is intentionally limited to edit mode so stale text cannot turn
 * ADM (or any first option) into a default selection on a new form.
 */
export const resolveNearMissResponsibleDepartmentValue = ({
  departments,
  value,
  legacyLabel,
  isEdit,
}: {
  departments: ResponsibleDepartmentOption[];
  value: unknown;
  legacyLabel?: unknown;
  isEdit: boolean;
}) => {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return '';

  const directMatch = departments.find(department => department.id === rawValue);
  if (directMatch) return directMatch.id;
  if (!isEdit) return '';

  const legacyValue = normalized(legacyLabel || rawValue);
  const legacyMatch = departments.find(department => (
    normalized(department.code) === legacyValue || normalized(department.name) === legacyValue
  ));
  return legacyMatch?.id || rawValue;
};
