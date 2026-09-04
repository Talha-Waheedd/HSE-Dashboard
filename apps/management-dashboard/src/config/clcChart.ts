export type ClcSectionKey =
  | 'primary_conditions'
  | 'primary_actions'
  | 'personal_factors'
  | 'job_factors';

// Source of truth: "Investigation - CLC Chart.doc". Preserve its displayed
// wording and numbering (including source-specific phrasing and numbering).

export interface ClcCauseOption {
  id: string;
  number: string;
  label: string;
  otherKey?: string;
}

export interface ClcCauseGroup {
  id: string;
  label: string;
  options: ClcCauseOption[];
  otherKey?: string;
}

export interface ClcCauseSection {
  id: ClcSectionKey;
  code?: 'SC' | 'SA';
  title: string;
  groups: ClcCauseGroup[];
}

export interface ClcSectionSelection {
  selected_groups: string[];
  selected_causes: string[];
  other_details: Record<string, string>;
}

export interface ClcAnalysis {
  version: 1;
  primary_conditions: ClcSectionSelection;
  primary_actions: ClcSectionSelection;
  personal_factors: ClcSectionSelection;
  job_factors: ClcSectionSelection;
}

const option = (number: number | string, id: string, label: string, otherKey?: string): ClcCauseOption => ({
  number: String(number), id, label, ...(otherKey ? { otherKey } : {}),
});

export const CLC_PRIMARY_SECTIONS: ClcCauseSection[] = [
  {
    id: 'primary_conditions',
    code: 'SC',
    title: 'Immediate Cause of Incident from Substandard Conditions',
    groups: [
      {
        id: 'environment_human_property',
        label: 'Environment/Human/Property',
        options: [
          option(1, 'inadequate_defective_guards', 'Inadequate or defective guards or protective safety devices'),
          option(2, 'inadequate_workplace_layout', 'Inadequate workplace layout'),
          option(3, 'inadequate_defective_warning_system', 'Inadequate or defective warning system'),
          option(4, 'inadequate_process_equipment_isolation', 'Inadequate isolation of process or equipment'),
          option(5, 'poor_housekeeping_disorder', 'Poor housekeeping / disorder'),
          option(6, 'noise_exposure', 'Exposure to noise (HS)/ consequence of noise (E)'),
          option(7, 'radiation_exposure', 'Exposure to radiation (HS)/ consequence of radiation (E)'),
          option(8, 'temperature_extremes_exposure', 'Exposure to temperature extremes (HS) / consequence of temperature extremes (E)'),
          option(9, 'fire_explosion_exposure', 'Exposure to fire or explosion (HS) / consequence of fire or explosion (E)'),
          option(10, 'hazardous_chemicals_exposure', 'Exposure to hazardous chemicals (HS) /consequence of hazardous chemicals (E)'),
          option(11, 'mechanical_hazards_exposure', 'Exposure to mechanical hazards'),
          option(12, 'energized_electrical_systems_exposure', 'Exposure to energized electrical systems'),
          option(13, 'inadequate_excessive_light', 'Inadequate or excessive light'),
          option(14, 'inadequate_ventilation', 'Inadequate ventilation'),
          option(15, 'uneven_slippery_surface', 'Uneven walking working surface and/or slippery surface'),
          option(16, 'inadequate_defective_ppe', 'Inadequate or defective personal protective equipment'),
          option(17, 'monitoring_equipment_failure', 'Monitoring equipment failure'),
          option(18, 'weather_conditions', 'Weather conditions'),
          option(19, 'other', 'Other', 'conditions_environment_other'),
        ],
      },
      {
        id: 'vehicle',
        label: 'Vehicle',
        options: [
          option(1, 'defective_tools', 'Defective tools'),
          option(2, 'obstruction_view_traffic', 'Obstruction to view/traffic'),
          option(3, 'weather_conditions', 'Weather conditions'),
          option(4, 'road_conditions', 'Road Conditions'),
          option(5, 'mechanical_failure_vehicle', 'Mechanical failure (vehicle)'),
          option(6, 'overloaded_vehicle', 'Overloaded vehicle'),
          option(7, 'other_specify', 'Other (specify)', 'conditions_vehicle_other'),
        ],
      },
    ],
  },
  {
    id: 'primary_actions',
    code: 'SA',
    title: 'Immediate Cause of Incident from Substandard Actions',
    groups: [
      {
        id: 'environment_human_property',
        label: 'Environment/Human/Property',
        options: [
          option(1, 'improper_speed_shortcuts', 'Operating/Driving at improper speed/shortcuts'),
          option(2, 'safety_devices_inoperable', 'Making safety devices inoperable'),
          option(3, 'not_using_controls_guards', 'Not using controls/guards'),
          option(4, 'using_defective_equipment_vehicle_tools', 'Using defective equipment / vehicle/ tools'),
          option(5, 'improper_equipment_placement', 'Improper placement of equipment'),
          option(6, 'improper_lifting', 'Improper lifting'),
          option(7, 'improper_position_posture', 'Improper position or posture for task'),
          option(8, 'servicing_equipment_in_operation', 'Servicing/Maintaining equipment in operation/use'),
          option(9, 'horseplay', 'Horseplay'),
          option(10, 'violence', 'Violence'),
          option(11, 'ppe_not_used_properly', 'Personal Protective equipment not used/used improperly'),
          option(12, 'procedure_not_available_followed', 'Procedure not available/not followed'),
          option(13, 'concentrate', 'Concentrate'),
          option(14, 'lack_of_stretching', 'Lack of stretching'),
          option(15, 'failure_isolate_hazardous_energy', 'Failure to isolate hazardous energy (lock out tag out)'),
          option(16, 'centrifuge_blower_choking', 'Other – Machine tripped due to choking of centrifuge blower.'),
          option(17, 'wrong_personnel_specialized_task', 'Use of wrong personnel for specialized task'),
          option(18, 'improper_use_of_mirrors', 'Improper use of mirrors'),
          option(19, 'distraction_failure_concentrate', 'Distraction/ Failure to concentrate'),
          option(20, 'disregard_traffic_signs', 'Disregard traffic sign/signals'),
          option(21, 'failure_seatbelts_helmets', 'Failure to use seatbelts/helmets'),
          option(22, 'inadequate_car_space_cushion', 'Inadequate car space cushion (1 car space cushion)'),
          option(23, 'failure_double_check_intersections', 'Failure to double check intersections'),
          option(24, 'failure_three_second_pause', 'Failure to follow three second pause'),
          option(25, 'failure_four_second_distance', 'Failure to apply four second following distance'),
          option(26, 'failure_slow_stale_green_light', 'Failure to slow down in Stale Green Light (TEST Drive)'),
          option(27, 'lack_eight_second_eye_lead', 'Lack of eight second eye lead time (TEST Drive)'),
          option(28, 'not_applying_99_rule', 'Not applying 99 rule for backing (TEST Drive)'),
          option(29, 'driving_without_attention', 'Driving without attention (Attention driving - be alert - be seen) (TEST Drive)'),
          option(30, 'make_sure_they_see_you', 'Make sure they see you (TEST Drive)'),
          option(31, 'other', 'Other', 'actions_environment_other'),
        ],
      },
      {
        id: 'vehicle',
        label: 'Vehicle',
        options: [
          option(1, 'operating_without_authority', 'Operating equipment/vehicle without authority'),
          option(2, 'failure_to_warn', 'Failure to warn (or no communication / warning)'),
          option(3, 'failure_to_secure_equipment_materials', 'Failure to secure equipment or materials'),
          option(4, 'improper_speed_shortcuts', 'Operating/Driving at improper speed/shortcuts'),
          option(5, 'using_defective_equipment_vehicle_tools', 'Using defective equipment / vehicle/ tools'),
          option(6, 'using_equipment_vehicle_improperly', 'Using equipment/vehicle improperly'),
          option(7, 'failure_use_ppe_properly', 'Failure to use personal protective equipment properly'),
          option(8, 'servicing_equipment_in_operation', 'Servicing/Maintaining equipment in operation/use'),
          option(9, 'violence', 'Violence'),
          option(10, 'procedure_not_available_understood', 'Procedure not available/understood'),
          option(11, 'under_influence', 'Under influence of alcohol and/or other drugs'),
          option(12, 'improper_backing', 'Improper backing'),
          option(13, 'improper_lane_change', 'Improper lane change'),
          option(14, 'improper_parking', 'Improper parking'),
          option(15, 'improper_passing', 'Improper passing'),
          option(16, 'improper_turning', 'Improper turning'),
        ],
      },
    ],
  },
];

export const CLC_ROOT_SECTIONS: ClcCauseSection[] = [
  {
    id: 'personal_factors',
    title: 'Personal Factors',
    groups: [
      {
        id: 'inadequate_capability',
        label: 'Inadequate capability',
        options: [
          option(1, 'inappropriate_physical_attributes', 'Inappropriate height, weight, size, strength, reach, etc.'),
          option(2, 'sensitivities_allergies', 'Sensitivities to substances, allergies'),
          option(3, 'inability_see_hear', 'Inability to see/hear adequately'),
          option(4, 'physical_disabilities', 'Other permanent / temporary physical disabilities'),
          option(5, 'poor_coordination_reaction', 'Poor co- ordination / reaction'),
        ],
      },
      {
        id: 'lack_skill_experience',
        label: 'Lack of Skill & Experience',
        options: [
          option(1, 'lack_experience', 'Lack of experience'),
          option(2, 'lack_skill', 'Lack of skill'),
          option(3, 'inadequate_practice_performance', 'Inadequate practice\\performance'),
          option(4, 'infrequent_performance', 'Infrequent performance'),
          option(5, 'inadequate_review_instruction', 'Inadequate review instruction'),
          option(6, 'poor_judgement_misunderstanding', 'Poor judgement/misunderstanding'),
          option(7, 'skills_job_demands_mismatch', 'Mismatch between skills and job demands'),
          option(8, 'inadequate_working_process_knowledge', 'Inadequate knowledge of the working process'),
        ],
      },
      {
        id: 'improper_motivation',
        label: 'Improper motivation',
        options: [
          option(1, 'frustration', 'Frustration'),
          option(2, 'aggression', 'Aggression'),
          option(3, 'attempt_save_time_effort', 'Improper attempt to save time or effort'),
          option(4, 'attempt_avoid_discomfort', 'Improper attempt to avoid discomfort'),
          option(5, 'attempt_gain_attention', 'Improper attempt to gain attention'),
          option(6, 'lack_perceived_incentive_discipline', 'Lack of perceived incentive/discipline for actions'),
          option(7, 'peer_pressure', 'Peer pressure'),
          option(8, 'inadequate_behavior_reinforcement', 'Inadequate reinforcement of proper behavior'),
        ],
      },
      {
        id: 'lack_knowledge_transfer_training',
        label: 'Lack of Knowledge/ Knowledge Transfer/ Training',
        options: [
          option(1, 'initial_training_not_provided', 'Initial training not provided'),
          option(2, 'ineffective_initial_training', 'Ineffective initial training'),
          option(3, 'ineffective_refresher_training', 'Ineffective refresher training'),
          option(4, 'training_effort_not_effective', 'Training effort not effective (inadequate training design, inadequate training program goals/objectives, inadequate employee induction, inadequate means to determine if qualified for the job)'),
          option(5, 'knowledge_transfer_not_effective', 'Knowledge Transfer not effective'),
          option(6, 'lack_coaching_instruction', 'Lack of coaching\\instruction'),
        ],
      },
      {
        id: 'stress',
        label: 'Stress',
        options: [
          option(1, 'unqualified_decisions', 'Being asked to make decisions that the individual is not qualified to make'),
          option(2, 'routine_repetitive_inattention', 'Lack of attention due to routine/repetitive task'),
          option(3, 'extreme_concentration', 'Extreme concentration for extended periods of time'),
          option(4, 'conflicting_demands_direction', 'Receiving conflicting demands/direction'),
          option(5, 'inadequate_capability', 'Inadequate capability'),
          option(6, 'fatigue', 'Fatigue'),
          option(7, 'temperature_extremes', 'Exposure to temperature extremes'),
        ],
      },
      {
        id: 'other_specify',
        label: 'Other (specify)',
        options: [],
        otherKey: 'personal_other',
      },
    ],
  },
  {
    id: 'job_factors',
    title: 'Job Factors',
    groups: [
      {
        id: 'inadequate_leadership_management_supervision',
        label: 'Inadequate Leadership / Management/Supervision',
        options: [
          option(1, 'lack_incentive_discipline', 'Lack of incentive/discipline for actions'),
          option(2, 'lack_leadership_engagement', 'Lack of engagement by leadership in EHS initiatives'),
          option(3, 'unclear_responsibilities_authority', 'Unclear/conflicting assignment of responsibilities and/or delegation of authority'),
          option(4, 'leadership_training_not_present', 'Leadership training not present'),
          option(5, 'leadership_training_not_effective', 'Leadership training not effective'),
          option(6, 'insufficient_ehs_resources', 'Insufficient resources for EHS management'),
          option(7, 'lack_demonstrated_leadership_support', 'Lack of demonstrated leadership support for EHS'),
          option(8, 'poor_leadership_risk_understanding', 'Poor leadership understanding of risk / tolerance for risk too high'),
          option(9, 'improper_supervisory_example', 'Improper supervisory example'),
          option(10, 'inadequate_performance_feedback', 'Inadequate performance feedback'),
          option(11, 'lack_regular_ehs_meetings', 'Lack of regular EHS meetings'),
          option(12, 'lack_control_ownership_systems', 'Other - Lack of control / ownership over systems (management failure)'),
        ],
      },
      {
        id: 'work_planning_risk_assessment',
        label: 'Work Planning / Risk Assessment',
        options: [
          option(1, 'inadequate_work_planning_risk_assessment', 'Inadequate work planning\\risk assessment'),
          option(2, 'controls_not_implemented', 'Controls not implemented'),
          option(3, 'no_permit_high_risk', 'No permit to work for high risk activities'),
          option(4, 'specified_controls_not_followed', 'Specified controls not followed'),
          option(5, 'change_job_scope', 'Change in job scope'),
          option(6, 'work_site_not_left_safe', 'Work site not left safe'),
          option(7, 'inadequate_communication', 'Other – Inadequate Communication'),
        ],
      },
      {
        id: 'wear_and_tear',
        label: 'Wear and tear',
        options: [
          option(1, 'inadequate_planning_use', 'Inadequate planning of use'),
          option(2, 'overuse', 'Overuse'),
          option(3, 'unqualified_untrained_use', 'Use by unqualified or untrained people'),
        ],
      },
      {
        id: 'inadequate_work_standards',
        label: 'Inadequate work standards',
        options: [
          option(1, 'inadequate_sop_development', 'Inadequate development of SOP'),
          option(2, 'inadequate_standards_communication', 'Inadequate communication of standards'),
          option(3, 'inadequate_standards_maintenance', 'Inadequate maintenance of standards'),
          option(4, 'inadequate_compliance_monitoring', 'Inadequate monitoring of compliance'),
          option(5, 'inadequate_previous_hazard_correction', 'Inadequate correction of previous hazards/ incidents'),
          option(6, 'inadequate_performance_measurement', 'Inadequate performance measurement and evaluation'),
          option(7, 'inadequate_management_change', 'Inadequate management of change system'),
          option(8, 'inadequate_incident_learning_system', 'Inadequate incident reporting / investigation / lessons learned system'),
          option(9, 'ineffective_ehs_monitoring_auditing', 'Monitoring/ auditing of EHS process not effective'),
        ],
      },
      {
        id: 'inadequate_purchasing_material_handling_control',
        label: 'Inadequate Purchasing, Material Handling & Control',
        options: [
          option(1, 'incorrect_change_order_item', 'Incorrect item specified on change order'),
          option(2, 'inadequate_ordering_procedures', 'Inadequate ordering procedures'),
          option(3, 'unauthorized_order_substitution', 'Unauthorized substitution made while ordering replacement'),
          option(4, 'inadequate_replacement_review', 'Inadequate review prior to accepting replacement (MOC)'),
          option(5, 'improper_handling', 'Improper handling'),
          option(6, 'improper_material_storage', 'Improper storage of materials'),
          option(7, 'improper_hazardous_material_identification', 'Improper identification of hazardous materials / use of safety and health data'),
          option(8, 'improper_waste_disposal', 'Improper waste disposal'),
        ],
      },
      {
        id: 'inadequate_engineering_design',
        label: 'Inadequate engineering/design',
        options: [
          option(1, 'inadequate_human_factors', 'Inadequate consideration of human factors/ergonomics'),
          option(2, 'improper_design_execution', 'Improper execution of design (design inputs/outputs incorrect, no independent design review)'),
          option(3, 'inadequate_design_standards', 'Inadequate standards, specifications and/or design criteria'),
          option(4, 'inadequate_construction_monitoring', 'Inadequate monitoring during construction'),
          option(5, 'inadequate_improper_controls', 'Inadequate or improper controls'),
          option(6, 'inadequate_failure_assessment', 'Inadequate assessment of potential failure'),
        ],
      },
      {
        id: 'inadequate_maintenance',
        label: 'Inadequate maintenance',
        options: [
          option(1, 'no_preventive_maintenance', 'No preventive maintenance program'),
          option(2, 'incorrect_maintenance', 'Incorrect adjustment/ repair / maintenance (incl. records)'),
          option(3, 'testing_not_performed', 'Testing of tools, plant/ equipment not performed'),
          option(4, 'inadequate_inspection_monitoring', 'Inadequate inspection / monitoring,'),
          option(5, 'calibration_not_performed', 'Calibration of tools/equipment not performed'),
          option(6, 'no_corrective_maintenance', 'No corrective maintenance program'),
          option(7, 'support_department_not_called', 'Others - Support dept. not called to address the tripped machine'),
        ],
      },
      {
        id: 'inadequate_tools_equipment',
        label: 'Inadequate tools/ equipment',
        options: [
          option(1, 'inadequate_needs_risks_assessment', 'Inadequate assessment of needs and risks'),
          option(2, 'correct_tools_not_available', 'Correct tools or plant/equipment not available'),
          option(3, 'tools_not_available_when_needed', 'Tools not available when/where needed'),
          option(10, 'ineffective_item_removal_replacement', 'Removal or replacement of items not effective'),
        ],
      },
      {
        id: 'other_specify',
        label: 'Other (specify)',
        options: [],
        otherKey: 'job_other',
      },
    ],
  },
];

export const ALL_CLC_SECTIONS = [...CLC_PRIMARY_SECTIONS, ...CLC_ROOT_SECTIONS];

export const clcCauseToken = (groupId: string, causeId: string) => `${groupId}:${causeId}`;

const emptySelection = (): ClcSectionSelection => ({
  selected_groups: [],
  selected_causes: [],
  other_details: {},
});

export const createEmptyClcAnalysis = (): ClcAnalysis => ({
  version: 1,
  primary_conditions: emptySelection(),
  primary_actions: emptySelection(),
  personal_factors: emptySelection(),
  job_factors: emptySelection(),
});

const cleanStringArray = (value: unknown) => Array.isArray(value)
  ? [...new Set(value.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean))]
  : [];

const cleanDetails = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([, detail]) => typeof detail === 'string')
    .map(([key, detail]) => [key, String(detail).slice(0, 2000)]));
};

const normalizeSection = (value: unknown): ClcSectionSelection => {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Partial<ClcSectionSelection>
    : {};
  return {
    selected_groups: cleanStringArray(candidate.selected_groups),
    selected_causes: cleanStringArray(candidate.selected_causes),
    other_details: cleanDetails(candidate.other_details),
  };
};

export const normalizeClcAnalysis = (value: unknown): ClcAnalysis => {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Partial<ClcAnalysis>
    : {};
  return {
    version: 1,
    primary_conditions: normalizeSection(candidate.primary_conditions),
    primary_actions: normalizeSection(candidate.primary_actions),
    personal_factors: normalizeSection(candidate.personal_factors),
    job_factors: normalizeSection(candidate.job_factors),
  };
};
