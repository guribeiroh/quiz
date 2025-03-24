'use client';

import { FaUserFriends, FaLongArrowAltRight, FaUserSlash } from 'react-icons/fa';
import { FunnelData } from './AdminDashboard';

interface FunnelStepProps {
  step: FunnelData;
  index: number;
  isLastStep: boolean;
}

// Função para obter a cor baseada na taxa de retenção
const getRetentionColor = (rate: number) => {
  if (rate >= 90) return 'bg-emerald-500';
  if (rate >= 70) return 'bg-green-500';
  if (rate >= 50) return 'bg-yellow-500';
  if (rate >= 30) return 'bg-orange-500';
  return 'bg-red-500';
};

// Função para obter a cor baseada na taxa de abandono
const getDropoffColor = (rate: number) => {
  if (rate <= 10) return 'bg-emerald-500';
  if (rate <= 30) return 'bg-green-500';
  if (rate <= 50) return 'bg-yellow-500';
  if (rate <= 70) return 'bg-orange-500';
  return 'bg-red-500';
};

export function FunnelStep({ step, index, isLastStep }: FunnelStepProps) {
  const retentionColor = getRetentionColor(step.retentionRate);
  const dropoffColor = getDropoffColor(step.dropoffRate);
  
  return (
    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Informações da etapa */}
        <div className="flex items-center">
          <div className="bg-emerald-900/30 text-emerald-500 rounded-full w-10 h-10 flex items-center justify-center mr-3">
            <span className="font-bold">{index + 1}</span>
          </div>
          <div>
            <h4 className="text-lg font-medium text-white">{step.stepName}</h4>
            <div className="flex items-center text-gray-400 text-sm mt-1">
              <FaUserFriends className="mr-1" />
              <span>{step.totalUsers.toLocaleString('pt-BR')} usuários</span>
            </div>
          </div>
        </div>
        
        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto">
          {/* Taxa de retenção */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">Taxa de Retenção</div>
              <div className="flex items-center">
                <FaLongArrowAltRight className="text-emerald-400 mr-1" />
                <span className="text-emerald-400 font-medium">{step.retentionRate}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${retentionColor}`} 
                style={{ width: `${step.retentionRate}%` }}
              />
            </div>
          </div>
          
          {/* Taxa de abandono */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400">Taxa de Abandono</div>
              <div className="flex items-center">
                <FaUserSlash className="text-red-400 mr-1" />
                <span className="text-red-400 font-medium">{step.dropoffRate}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${dropoffColor}`} 
                style={{ width: `${step.dropoffRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Seta conectando ao próximo passo */}
      {!isLastStep && (
        <div className="flex justify-center mt-4 md:mt-2">
          <div className="w-0 h-8 border-l-2 border-dashed border-gray-600"></div>
        </div>
      )}
    </div>
  );
} 