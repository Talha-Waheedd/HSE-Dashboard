import {
  CLC_PRIMARY_SECTIONS,
  CLC_ROOT_SECTIONS,
  clcCauseToken,
  type ClcAnalysis,
  type ClcCauseGroup,
  type ClcCauseSection,
} from '../config/clcChart';

const PrintCheck = ({ selected }: { selected: boolean }) => (
  <span className={`clc-print-checkbox${selected ? ' is-selected' : ''}`} aria-hidden="true">
    {selected ? '✓' : ''}
  </span>
);

const PrintGroup = ({ section, group, analysis }: {
  section: ClcCauseSection;
  group: ClcCauseGroup;
  analysis: ClcAnalysis;
}) => {
  const selection = analysis[section.id];
  const groupSelected = selection.selected_groups.includes(group.id);
  return (
    <section className="clc-print-group">
      <h4><PrintCheck selected={groupSelected} />{group.label}</h4>
      {group.options.map(item => {
        const selected = selection.selected_causes.includes(clcCauseToken(group.id, item.id));
        const otherDetail = item.otherKey ? selection.other_details[item.otherKey] : '';
        return (
          <div className="clc-print-cause" key={`${group.id}:${item.id}`}>
            <PrintCheck selected={selected} />
            <span className="clc-print-number">{item.number}</span>
            <span>{item.label}</span>
            {selected && otherDetail && (
              <div className="clc-print-other"><strong>Specify:</strong> <span>{otherDetail}</span></div>
            )}
          </div>
        );
      })}
      {group.otherKey && groupSelected && (
        <div className="clc-print-other clc-print-group-other">
          <strong>Specify:</strong> <span>{selection.other_details[group.otherKey] || ''}</span>
        </div>
      )}
    </section>
  );
};

const PrintCauseSection = ({ section, analysis }: { section: ClcCauseSection; analysis: ClcAnalysis }) => (
  <section className="clc-print-cause-section">
    <h3>
      {section.code && <span>{section.code} — </span>}
      {section.title}
    </h3>
    <div className="clc-print-groups">
      {section.groups.map(group => (
        <PrintGroup key={group.id} section={section} group={group} analysis={analysis} />
      ))}
    </div>
  </section>
);

const PrintSectionSet = ({
  title,
  instruction,
  sections,
  analysis,
}: {
  title: string;
  instruction: string;
  sections: ClcCauseSection[];
  analysis: ClcAnalysis;
}) => (
  <section className="clc-print-set">
    <header><strong>{title}</strong><span>{instruction}</span></header>
    {sections.map(section => (
      <PrintCauseSection key={section.id} section={section} analysis={analysis} />
    ))}
  </section>
);

export const ClcChartPrint = ({ analysis }: { analysis: ClcAnalysis }) => (
  <section className="clc-print-root">
    <header className="clc-print-header">
      <h2>CLC CHART</h2>
      <p>Immediate, Primary &amp; Root Causes Analysis</p>
    </header>
    <PrintSectionSet
      title="PRIMARY CAUSES"
      instruction="Select the most appropriate point(s): acts, failures to act, or conditions that contributed directly to the incident."
      sections={CLC_PRIMARY_SECTIONS}
      analysis={analysis}
    />
    <PrintSectionSet
      title="ROOT CAUSES"
      instruction="Select the factor box and the most appropriate detailed point(s) below."
      sections={CLC_ROOT_SECTIONS}
      analysis={analysis}
    />
    <div className="clc-print-end">--------- End of Investigation Report ---------</div>
  </section>
);

export default ClcChartPrint;
