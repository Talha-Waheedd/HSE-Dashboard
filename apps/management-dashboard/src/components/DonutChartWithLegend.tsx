import React from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export interface ChartDataItem {
  name: string;
  value: number;
}

interface DonutChartWithLegendProps {
  data: ChartDataItem[];
  colors: string[];
  totalLabel?: string;
  size?: 'sm' | 'lg';
  onClick?: () => void;
}

export const DonutChartWithLegend: React.FC<DonutChartWithLegendProps> = ({ data, colors, totalLabel = 'TOTAL', size = 'lg', onClick }) => {
  const isSm = size === 'sm';
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  // Format total to 2 decimals if it's a float, else whole number
  const formattedTotal = total % 1 !== 0 ? total.toFixed(2) : total;

  return (
    <div 
      className={`flex flex-row items-center justify-center h-full w-full ${isSm ? 'gap-4 py-0' : 'gap-12 py-4 flex-col md:flex-row'}`}
      onClick={onClick}
    >
      {/* Chart Section */}
      <div className={`relative flex-shrink-0 ${isSm ? 'w-32 h-32' : 'w-64 h-64'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={isSm ? 45 : 80}
              outerRadius={isSm ? 60 : 115}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <RechartsTooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`font-bold text-foreground ${isSm ? 'text-2xl' : 'text-4xl'}`}>{formattedTotal}</span>
          <span className={`font-semibold text-muted-foreground uppercase tracking-widest ${isSm ? 'text-[9px] mt-0' : 'text-xs mt-1'}`}>{totalLabel}</span>
        </div>
      </div>

      {/* Custom Legend Section */}
      {isSm ? (
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-y-2 gap-x-2 w-full max-w-[180px]">
          {data.map((entry, index) => (
            <React.Fragment key={`legend-${index}`}>
              <div 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <div className="text-muted-foreground text-[11px] sm:text-xs font-medium truncate" title={entry.name}>
                {entry.name}
              </div>
              <div className="font-bold text-foreground text-[11px] sm:text-xs text-right pl-1">
                {entry.value}
              </div>
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 w-full max-w-2xl">
          {data.map((entry, index) => (
            <div key={`legend-${index}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 text-sm group">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <div className="text-muted-foreground group-hover:text-foreground transition-colors font-medium truncate" title={entry.name}>
                {entry.name}
              </div>
              <div className="font-bold text-foreground text-right pl-4">
                {entry.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
