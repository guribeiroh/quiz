'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, Funnel, FunnelChart as RechartsFunnelChart, Tooltip, LabelList, Cell } from 'recharts';
import { FunnelData } from './AdminDashboard';

interface FunnelChartProps {
  data: FunnelData[];
}

// Cores para os blocos do funil
const colors = ['#10b981', '#22c55e', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];

// Definindo a interface para os dados dos rótulos personalizados
interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  name: string;
  value: number;
}

export function FunnelChart({ data }: FunnelChartProps) {
  // Formatar dados para o gráfico
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      name: item.stepName,
      value: item.totalUsers,
      users: item.totalUsers.toLocaleString('pt-BR'),
      retention: `${item.retentionRate}%`,
      fill: colors[index % colors.length]
    }));
  }, [data]);
  
  // Customização do tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-lg text-sm">
          <div className="font-medium text-white mb-1">{data.name}</div>
          <div className="text-gray-300">Usuários: <span className="text-emerald-400 font-medium">{data.users}</span></div>
          <div className="text-gray-300">Retenção: <span className="text-emerald-400 font-medium">{data.retention}</span></div>
        </div>
      );
    }
    return null;
  };
  
  // Função para renderizar rótulos personalizados
  const renderCustomizedLabel = (props: LabelProps) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    
    // Calcular a posição do texto
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const x = cx + (outerRadius + 30) * cos;
    const y = cy + (outerRadius + 30) * sin;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    
    return (
      <text 
        x={x} 
        y={y} 
        textAnchor={textAnchor} 
        fill="#fff" 
        fontSize={12}
        dominantBaseline="central"
      >
        {`${name}: ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Nenhum dado disponível para exibir
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsFunnelChart>
        <Tooltip content={<CustomTooltip />} />
        <Funnel
          dataKey="value"
          data={chartData}
          isAnimationActive
          labelLine={false}
        >
          <LabelList
            position="center"
            content={renderCustomizedLabel}
          />
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Funnel>
      </RechartsFunnelChart>
    </ResponsiveContainer>
  );
} 