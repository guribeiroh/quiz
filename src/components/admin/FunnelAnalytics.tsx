'use client';

import { FaUserPlus, FaPercentage, FaRegChartBar, FaFlag } from 'react-icons/fa';
import { FunnelData } from './AdminDashboard';

interface FunnelAnalyticsProps {
  data: FunnelData[];
}

export function FunnelAnalytics({ data }: FunnelAnalyticsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-gray-400 text-center p-4">
        Nenhum dado disponível para análise
      </div>
    );
  }
  
  // Calcular total de acessos (primeira etapa)
  const totalVisits = data[0]?.totalUsers || 0;
  
  // Calcular total de conversões (última etapa)
  const totalConversions = data[data.length - 1]?.totalUsers || 0;
  
  // Calcular taxa de conversão total
  const conversionRate = totalVisits > 0 
    ? ((totalConversions / totalVisits) * 100).toFixed(2) 
    : '0';
  
  // Encontrar o gargalo (etapa com maior taxa de abandono)
  const bottleneck = [...data].sort((a, b) => b.dropoffRate - a.dropoffRate)[0];
  
  // Encontrar a etapa com melhor taxa de retenção
  const bestRetention = [...data].sort((a, b) => b.retentionRate - a.retentionRate)[0];
  
  return (
    <div className="space-y-4">
      {/* Total de Acessos */}
      <div className="bg-gray-700 p-3 rounded-lg">
        <div className="flex items-center">
          <div className="bg-blue-900/30 text-blue-400 rounded-full w-10 h-10 flex items-center justify-center mr-3">
            <FaUserPlus />
          </div>
          <div>
            <div className="text-sm text-gray-400">Total de Acessos</div>
            <div className="text-xl font-semibold text-white">
              {totalVisits.toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>
      
      {/* Taxa de Conversão */}
      <div className="bg-gray-700 p-3 rounded-lg">
        <div className="flex items-center">
          <div className="bg-emerald-900/30 text-emerald-400 rounded-full w-10 h-10 flex items-center justify-center mr-3">
            <FaPercentage />
          </div>
          <div>
            <div className="text-sm text-gray-400">Taxa de Conversão</div>
            <div className="text-xl font-semibold text-white">
              {conversionRate}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Gargalo Principal */}
      <div className="bg-gray-700 p-3 rounded-lg">
        <div className="flex items-center">
          <div className="bg-red-900/30 text-red-400 rounded-full w-10 h-10 flex items-center justify-center mr-3">
            <FaRegChartBar />
          </div>
          <div>
            <div className="text-sm text-gray-400">Maior Abandono</div>
            <div className="text-white font-medium">{bottleneck?.stepName}</div>
            <div className="text-sm text-red-400 font-medium">
              {bottleneck?.dropoffRate}% de abandono
            </div>
          </div>
        </div>
      </div>
      
      {/* Melhor Retenção */}
      <div className="bg-gray-700 p-3 rounded-lg">
        <div className="flex items-center">
          <div className="bg-green-900/30 text-green-400 rounded-full w-10 h-10 flex items-center justify-center mr-3">
            <FaFlag />
          </div>
          <div>
            <div className="text-sm text-gray-400">Melhor Retenção</div>
            <div className="text-white font-medium">{bestRetention?.stepName}</div>
            <div className="text-sm text-green-400 font-medium">
              {bestRetention?.retentionRate}% de retenção
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 