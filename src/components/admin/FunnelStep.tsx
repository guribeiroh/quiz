'use client';

import { FaUserFriends, FaArrowDown } from 'react-icons/fa';
import { FunnelData } from './AdminDashboard';

interface FunnelStepProps {
  step: FunnelData;
  index: number;
  isLastStep: boolean;
}

// Função para obter a cor baseada na taxa de retenção
const getRetentionColor = (rate: number) => {
  if (rate >= 90) return 'from-emerald-500 to-green-400';
  if (rate >= 70) return 'from-green-500 to-emerald-400';
  if (rate >= 50) return 'from-yellow-500 to-amber-400';
  if (rate >= 30) return 'from-orange-500 to-amber-400';
  return 'from-red-500 to-rose-400';
};

// Função para obter a cor baseada na taxa de abandono
const getDropoffColor = (rate: number) => {
  if (rate <= 10) return 'from-emerald-500 to-green-400';
  if (rate <= 30) return 'from-green-500 to-emerald-400';
  if (rate <= 50) return 'from-yellow-500 to-amber-400';
  if (rate <= 70) return 'from-orange-500 to-amber-400';
  return 'from-red-500 to-rose-400';
};

export function FunnelStep({ step, index, isLastStep }: FunnelStepProps) {
  const retentionGradient = getRetentionColor(step.retentionRate);
  const dropoffGradient = getDropoffColor(step.dropoffRate);
  
  return (
    <div className="relative transition-all duration-300 ease-in-out bg-gray-800/90 backdrop-blur-sm hover:bg-gray-700/90 rounded-xl p-5 border border-gray-700/50 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Informações da etapa */}
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-lg w-12 h-12 flex items-center justify-center mr-4 shadow-md">
            <span className="font-bold text-lg">{index + 1}</span>
          </div>
          <div>
            <h4 className="text-xl font-semibold text-white">{step.stepName}</h4>
            <div className="flex items-center text-gray-300 text-sm mt-1">
              <FaUserFriends className="mr-2 text-cyan-400" />
              <span>{step.totalUsers.toLocaleString('pt-BR')} usuários</span>
            </div>
          </div>
        </div>
        
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto">
          {/* Taxa de retenção */}
          <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-800 transition-all hover:bg-gray-900/90 hover:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-300">Taxa de Retenção</div>
              <div className="flex items-center bg-emerald-900/20 px-2 py-1 rounded-md">
                <span className="text-emerald-400 font-semibold">{step.retentionRate.toFixed(2)}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full bg-gradient-to-r ${retentionGradient} transition-all duration-1000 ease-out`} 
                style={{ width: `${step.retentionRate}%` }}
              />
            </div>
          </div>
          
          {/* Taxa de abandono */}
          <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-800 transition-all hover:bg-gray-900/90 hover:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-300">Taxa de Abandono</div>
              <div className="flex items-center bg-red-900/20 px-2 py-1 rounded-md">
                <span className="text-rose-400 font-semibold">{step.dropoffRate.toFixed(2)}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full bg-gradient-to-r ${dropoffGradient} transition-all duration-1000 ease-out`} 
                style={{ width: `${step.dropoffRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Seta conectando ao próximo passo */}
      {!isLastStep && (
        <div className="flex justify-center my-3">
          <div className="w-10 h-10 rounded-full bg-gray-700/70 flex items-center justify-center text-gray-400 animate-pulse">
            <FaArrowDown />
          </div>
        </div>
      )}
    </div>
  );
} 