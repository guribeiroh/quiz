'use client';

import { useMemo } from 'react';
import { FunnelChart as RechartsFunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts';
import { FunnelData } from './AdminDashboard';

interface FunnelChartProps {
  data: FunnelData[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: FunnelData & {
      fill: string;
    };
  }>;
}

// Cores para o funil
const COLORS = ['#0284c7', '#0369a1', '#075985', '#0c4a6e'];

// Custom tooltip que mostra dados do usuário no hover
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-800/95 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-xl text-white">
        <h3 className="text-lg font-medium mb-2 text-cyan-400">{data.stepName}</h3>
        <p className="text-white font-semibold text-xl">
          {data.totalUsers.toLocaleString('pt-BR')} <span className="text-sm text-gray-300">usuários</span>
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="bg-emerald-900/30 rounded-md p-1.5 text-center">
            <span className="text-emerald-400 font-medium">{data.retentionRate.toFixed(1)}%</span>
            <p className="text-gray-300 text-xs">retenção</p>
          </div>
          <div className="bg-rose-900/30 rounded-md p-1.5 text-center">
            <span className="text-rose-400 font-medium">{data.dropoffRate.toFixed(1)}%</span>
            <p className="text-gray-300 text-xs">abandono</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export function FunnelChart({ data }: FunnelChartProps) {
  // Formata os dados para criar o gráfico de funil
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((step, index) => ({
      ...step,
      fill: COLORS[index % COLORS.length],
      value: step.totalUsers
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-xl border border-gray-700">
        <p className="text-gray-400">Nenhum dado disponível para exibição</p>
      </div>
    );
  }

  return (
    <div className="relative h-64 md:h-80 w-full bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl overflow-hidden p-2">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsFunnelChart
          width={730}
          height={250}
        >
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="value"
            data={formattedData}
            isAnimationActive
            labelLine={false}
          >
            <LabelList
              position="right"
              fill="#ffffff"
              stroke="none"
              dataKey="stepName"
              className="text-sm"
            />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
    </div>
  );
} 