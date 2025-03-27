'use client';

import { useMemo } from 'react';
import { FunnelChart as RechartsFunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts';
import { FunnelData } from './AdminDashboard';

// Remover importação não utilizada
// import type { SVGProps } from 'react';

interface FunnelChartProps {
  data: FunnelData[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: FunnelData & {
      fill: string;
      data?: FunnelData[];
    };
  }>;
}

// Paleta de cores harmônica para o funil
const GRADIENTS = [
  {
    id: 'gradient1',
    colors: ['#4facfe', '#00f2fe'],
    angle: 120
  },
  {
    id: 'gradient2',
    colors: ['#43e97b', '#38f9d7'],
    angle: 135
  },
  {
    id: 'gradient3',
    colors: ['#fa709a', '#fee140'],
    angle: 150
  }
];

// Custom tooltip que mostra dados do usuário no hover
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const firstStepUsers = data.data && data.data.length > 0 ? data.data[0].totalUsers : data.totalUsers;
    
    return (
      <div className="bg-gray-800/90 p-4 rounded-lg border border-gray-600 shadow-xl text-white transition-all duration-300">
        <h3 className="text-lg font-medium mb-2 text-cyan-300">{data.stepName}</h3>
        <p className="text-white font-semibold text-xl">
          {data.totalUsers.toLocaleString('pt-BR')} <span className="text-sm text-gray-300">usuários</span>
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="bg-emerald-900/50 rounded-md p-2 text-center">
            <span className="text-emerald-300 font-medium">{data.retentionRate.toFixed(1)}%</span>
            <p className="text-gray-300 text-xs">retenção</p>
          </div>
          <div className="bg-rose-900/50 rounded-md p-2 text-center">
            <span className="text-rose-300 font-medium">{data.dropoffRate.toFixed(1)}%</span>
            <p className="text-gray-300 text-xs">abandono</p>
          </div>
        </div>
        
        {/* Indicador de taxa de conversão em relação à primeira etapa */}
        {data.stepName !== 'Tela Inicial' && data.data && (
          <div className="mt-3 pt-2 border-t border-gray-600">
            <p className="text-xs text-gray-300">Taxa de conversão total:</p>
            <p className="text-cyan-300 font-medium">
              {((data.totalUsers / firstStepUsers) * 100).toFixed(1)}%
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

// Definindo interface para as props do CustomLabel
interface CustomLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
  name?: string;
}

// Componente de rótulos personalizados para o funil
const CustomLabel = (props: CustomLabelProps) => {
  const { x, y, width, height, value, name } = props;
  
  // Calcular posições - remover variável não utilizada
  const centerX = x ? x + (width ? width / 2 : 0) : 0;
  const nameY = y ? y + (height ? height / 2 - 14 : 0) : 0;
  // const valueY = y ? y + (height ? height / 2 + 14 : 0) : 0;
  
  // Criar div estilizado em vez de usar elementos SVG
  return (
    <foreignObject x={centerX - 60} y={nameY - 30} width={120} height={60}>
      <div 
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          pointerEvents: 'none'
        }}
      >
        <div className="font-medium text-sm">{name}</div>
        <div className="font-semibold">{value ? value.toLocaleString('pt-BR') : '0'}</div>
      </div>
    </foreignObject>
  );
};

// Tipagem correta para a função shape
interface ShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: {
    fill: string;
    value: number;
  };
  index: number;
}

export function FunnelChart({ data }: FunnelChartProps) {
  // Formata os dados para criar o gráfico de funil
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((step, index) => ({
      ...step,
      data: data, // Incluir o dataset completo para referência
      fill: `url(#funnel-gradient-${index % GRADIENTS.length})`,
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
    <div className="relative h-64 md:h-80 w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700/30 shadow-xl overflow-hidden p-4">
      {/* Elementos decorativos de fundo simplificados */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-40">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-blue-500/20"></div>
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-purple-500/20"></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-emerald-500/20"></div>
      </div>
      
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
                y2="1"
              >
                <stop offset="0%" stopColor={gradient.colors[0]} />
                <stop offset="100%" stopColor={gradient.colors[1]} />
              </linearGradient>
            ))}
          </defs>
          <Tooltip 
            content={<CustomTooltip />} 
            animationDuration={400} 
            animationEasing="ease-in-out"
          />
          <Funnel
            dataKey="value"
            data={formattedData}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-in-out"
            labelLine={false}
            nameKey="name"
            shape={({ x, y, width, height, payload, index }: ShapeProps) => {
              // Calcula as dimensões
              const adjustedY = y;
              const adjustedHeight = height;
              
              // Cria forma do funil com larguras proporcionais aos valores
              const topWidth = width * (index === 0 ? 1 : 0.9);
              const bottomWidth = width * (index === data.length - 1 ? 0.5 : 0.85);
              
              // Pontos do caminho
              const topLeftX = x + (width - topWidth) / 2;
              const topRightX = topLeftX + topWidth;
              
              const bottomLeftX = x + (width - bottomWidth) / 2;
              const bottomRightX = bottomLeftX + bottomWidth;
              
              // Aproximadamente 20% da altura para a curva
              const curveHeight = adjustedHeight * 0.2;
              
              // Criar caminho SVG com curvas suaves
              const path = `
                M ${topLeftX},${adjustedY}
                L ${topRightX},${adjustedY}
                C ${topRightX},${adjustedY + curveHeight} ${bottomRightX},${adjustedY + adjustedHeight - curveHeight} ${bottomRightX},${adjustedY + adjustedHeight}
                L ${bottomLeftX},${adjustedY + adjustedHeight}
                C ${bottomLeftX},${adjustedY + adjustedHeight - curveHeight} ${topLeftX},${adjustedY + curveHeight} ${topLeftX},${adjustedY}
                Z
              `;
              
              return (
                <>
                  <path 
                    d={path} 
                    fill={payload.fill}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1}
                  />
                </>
              );
            }}
          >
            <LabelList
              position="inside"
              content={<CustomLabel />}
            />
          </Funnel>
        </RechartsFunnelChart>
      </ResponsiveContainer>
      
      {/* Legenda da visualização */}
      <div className="absolute bottom-3 right-4 text-xs bg-gray-800 px-3 py-1.5 rounded-full text-gray-300 border border-gray-700">
        Jornada do usuário
      </div>
    </div>
  );
} 