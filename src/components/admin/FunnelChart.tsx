'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FunnelData } from './AdminDashboard';

interface FunnelChartProps {
  data: FunnelData[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      name: string;
      retentionRate: number;
      dropoffRate: number;
    };
  }>;
  label?: string;
}

// Custom tooltip que mostra dados do usuário no hover
const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/95 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-xl text-white">
        <h3 className="text-lg font-medium mb-2 text-cyan-400">{label}</h3>
        <p className="text-white font-semibold text-xl">
          {payload[0].value.toLocaleString('pt-BR')} <span className="text-sm text-gray-300">usuários</span>
        </p>
        {payload[0].payload.retentionRate !== undefined && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="bg-emerald-900/30 rounded-md p-1.5 text-center">
              <span className="text-emerald-400 font-medium">{payload[0].payload.retentionRate}%</span>
              <p className="text-gray-300 text-xs">retenção</p>
            </div>
            <div className="bg-rose-900/30 rounded-md p-1.5 text-center">
              <span className="text-rose-400 font-medium">{payload[0].payload.dropoffRate}%</span>
              <p className="text-gray-300 text-xs">abandono</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

interface CustomLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
  index?: number;
  data: FunnelData[];
}

// Custom label para cada step do funil
const CustomLabel = ({ x, y, width, height, value, index, data }: CustomLabelProps) => {
  if (!width || width < 20 || index === undefined || value === undefined) return null; // Não exibir label se o bloco for muito pequeno
  
  return (
    <g>
      <text
        x={x ? x + width / 2 : 0}
        y={y ? y + (height ? height / 2 - 10 : 0) : 0}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white font-medium"
      >
        {data[index].stepName}
      </text>
      <text
        x={x ? x + width / 2 : 0}
        y={y ? y + (height ? height / 2 + 10 : 0) : 0}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-gray-300 text-sm"
      >
        {value.toLocaleString('pt-BR')}
      </text>
    </g>
  );
};

// Renderiza os gradientes definidos para o funil
const renderGradients = () => {
  const gradients = [
    { id: 'step0', startColor: '#06b6d4', endColor: '#0ea5e9' }, // cyan -> sky
    { id: 'step1', startColor: '#0ea5e9', endColor: '#3b82f6' }, // sky -> blue
    { id: 'step2', startColor: '#3b82f6', endColor: '#6366f1' }, // blue -> indigo
    { id: 'step3', startColor: '#6366f1', endColor: '#8b5cf6' }, // indigo -> violet
    { id: 'step4', startColor: '#8b5cf6', endColor: '#d946ef' }, // violet -> fuchsia
  ];

  return (
    <defs>
      {gradients.map((gradient) => (
        <linearGradient
          key={gradient.id}
          id={gradient.id}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="5%" stopColor={gradient.startColor} stopOpacity={0.9} />
          <stop offset="95%" stopColor={gradient.endColor} stopOpacity={0.7} />
        </linearGradient>
      ))}
    </defs>
  );
};

export function FunnelChart({ data }: FunnelChartProps) {
  // Formata os dados para criar o gráfico de funil
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((step, index) => ({
      ...step,
      name: step.stepName,
      value: step.totalUsers,
      fill: `url(#step${index})`,
      retentionRate: step.retentionRate,
      dropoffRate: step.dropoffRate
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
        <AreaChart
          data={formattedData}
          margin={{
            top: 10,
            right: 0,
            left: 0,
            bottom: 10,
          }}
        >
          {renderGradients()}
          <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.2} />
          <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#4b5563' }} tickLine={{ stroke: '#4b5563' }} />
          <YAxis tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#4b5563' }} tickLine={{ stroke: '#4b5563' }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
            label={<CustomLabel data={formattedData} />}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
} 