import React from 'react';

const FIELD_BASE = 'w-full h-9 px-3 text-[13px] border border-[#DEDEDE] rounded-md bg-white text-[#1A1818] focus:outline-none focus:border-[#CB0017] focus:ring-2 focus:ring-[#CB0017]/15';

interface Props {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  disabled?: boolean;
}

export const IncidentTypeSelect: React.FC<Props> = ({ value, onChange, label = 'Incident Type', disabled }) => (
  <div>
    {label && <label className="block text-[12px] font-bold text-[#374151] mb-1">{label}</label>}
    <select disabled={disabled} className={FIELD_BASE} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Select Type...</option>
      <option value="Slip, Trip, Fall">Slip, Trip, Fall</option>
      <option value="Collision">Collision</option>
      <option value="Fire">Fire</option>
      <option value="Electrical">Electrical</option>
      <option value="Chemical">Chemical</option>
      <option value="Ergonomic">Ergonomic</option>
      <option value="Other">Other</option>
    </select>
  </div>
);

export const LocationConditionSelect: React.FC<Props> = ({ value, onChange, label = 'Location Condition', disabled }) => (
  <div>
    {label && <label className="block text-[12px] font-bold text-[#374151] mb-1">{label}</label>}
    <select disabled={disabled} className={FIELD_BASE} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Select Condition...</option>
      <option value="Slippery Road">Slippery Road</option>
      <option value="Wet Floor">Wet Floor</option>
      <option value="Stairs">Stairs</option>
      <option value="Uneven Surface">Uneven Surface</option>
      <option value="Workplace Equipment">Workplace Equipment</option>
      <option value="Other">Other</option>
    </select>
  </div>
);

export const InjuryTypeSelect: React.FC<Props> = ({ value, onChange, label = 'Injury Type', disabled }) => (
  <div>
    {label && <label className="block text-[12px] font-bold text-[#374151] mb-1">{label}</label>}
    <select disabled={disabled} className={FIELD_BASE} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Select Injury Type...</option>
      <option value="Fracture">Fracture</option>
      <option value="Cut/Laceration">Cut/Laceration</option>
      <option value="Bruise">Bruise</option>
      <option value="Burn">Burn</option>
      <option value="Sprain">Sprain</option>
      <option value="Strain">Strain</option>
      <option value="Dislocation">Dislocation</option>
      <option value="Other">Other</option>
    </select>
  </div>
);

export const BodyPartGroupSelect: React.FC<Props> = ({ value, onChange, label = 'Body Part Group', disabled }) => (
  <div>
    {label && <label className="block text-[12px] font-bold text-[#374151] mb-1">{label}</label>}
    <select disabled={disabled} className={FIELD_BASE} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Select Body Part Group...</option>
      <option value="Head">Head</option>
      <option value="Face/Eye">Face/Eye</option>
      <option value="Neck">Neck</option>
      <option value="Torso">Torso (Chest/Back)</option>
      <option value="Arm/Shoulder">Arm/Shoulder</option>
      <option value="Hand/Finger">Hand/Finger</option>
      <option value="Leg/Knee">Leg/Knee</option>
      <option value="Foot/Toe">Foot/Toe</option>
      <option value="Multiple">Multiple</option>
      <option value="Other">Other</option>
    </select>
  </div>
);
