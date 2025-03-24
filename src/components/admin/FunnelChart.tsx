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

// Definindo gradientes para o funil para um visual mais moderno
const GRADIENTS = [
  {
    id: 'gradient1',
    colors: ['#0284c7', '#0ea5e9']
  },
  {
    id: 'gradient2',
    colors: ['#0ea5e9', '#38bdf8']
  },
  {
    id: 'gradient3',
    colors: ['#38bdf8', '#7dd3fc']
  },
  {
    id: 'gradient4',
    colors: ['#7dd3fc', '#bae6fd']
  }
];

// Custom tooltip que mostra dados do usuário no hover
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-800/95 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-xl text-white transition-all duration-300 scale-100 transform">
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
        
        {/* Indicador de taxa de conversão em relação à primeira etapa */}
        {data.stepName !== 'Tela Inicial' && (
          <div className="mt-3 pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-400">Taxa de conversão total:</p>
            <p className="text-cyan-400 font-medium">
              {((data.totalUsers / payload[0].payload.data[0].totalUsers) * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

const CustomLabel = (props: any) => {
  const { x, y, width, height, value, name, index } = props;
  
  return (
    <g>
      <text
        x={x + (width / 2)}
        y={y + (height / 2) - 12}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white font-medium text-sm"
      >
        {name}
      </text>
      <text
        x={x + (width / 2)}
        y={y + (height / 2) + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-gray-300 font-medium text-sm"
      >
        {value.toLocaleString('pt-BR')}
      </text>
    </g>
  );
};

export function FunnelChart({ data }: FunnelChartProps) {
  // Formata os dados para criar o gráfico de funil
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((step, index) => ({
      ...step,
      data: data, // Incluir o dataset completo para referência
      fill: `url(#funnel-gradient-${index})`,
      name: step.stepName,
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
          <defs>
            {GRADIENTS.map((gradient, index) => (
              <linearGradient
                key={index}
                id={`funnel-gradient-${index}`}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor={gradient.colors[0]} stopOpacity={0.9} />
                <stop offset="100%" stopColor={gradient.colors[1]} stopOpacity={0.9} />
              </linearGradient>
            ))}
          </defs>
          <Tooltip 
            content={<CustomTooltip />} 
            animationDuration={300} 
            animationEasing="ease-out"
          />
          <Funnel
            dataKey="value"
            data={formattedData}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
            labelLine={false}
            nameKey="name"
          >
            <LabelList
              position="inside"
              content={<CustomLabel />}
            />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
      
      {/* Legenda da visualização */}
      <div className="absolute bottom-2 right-3 text-xs text-gray-400 bg-gray-800/70 px-2 py-1 rounded-md backdrop-blur-sm">
        Usuários por etapa do funil
      </div>
    </div>
  );
} 