'use client';

import { useState } from 'react';
import { FaCalendar, FaChevronDown } from 'react-icons/fa';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

interface DateFilterProps {
  onDateChange: (dateRange: DateRange) => void;
}

export function DateFilter({ onDateChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<string>('last7days');
  
  // Data mínima para seleção: 24/03/2025 11:24 (horário de Brasília)
  const dataMinima = new Date('2025-03-24T14:24:00.000Z'); // 11:24 BRT convertido para UTC
  const dataHoje = new Date();
  
  // Inicializar datas respeitando a data mínima
  const initialStartDate = new Date(Math.max(dataHoje.getTime() - 7 * 24 * 60 * 60 * 1000, dataMinima.getTime()));
  
  const [customStartDate, setCustomStartDate] = useState<string>(
    initialStartDate.toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    dataHoje.toISOString().split('T')[0]
  );

  // Formato da data para o input HTML
  const dataMinimaFormatada = dataMinima.toISOString().split('T')[0];

  const predefinedRanges = [
    { id: 'today', label: 'Hoje' },
    { id: 'yesterday', label: 'Ontem' },
    { id: 'last7days', label: 'Últimos 7 dias' },
    { id: 'last30days', label: 'Últimos 30 dias' },
    { id: 'thisMonth', label: 'Este mês' },
    { id: 'lastMonth', label: 'Mês anterior' },
    { id: 'custom', label: 'Período personalizado' },
  ];

  const calculateDateRange = (rangeId: string): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Início do dia
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // Fim do dia

    // Função auxiliar para garantir que nenhuma data seja anterior à data mínima
    const garantirDataMinima = (data: Date): Date => {
      return new Date(Math.max(data.getTime(), dataMinima.getTime()));
    };

    switch (rangeId) {
      case 'today':
        return {
          startDate: garantirDataMinima(today),
          endDate: endOfDay,
          label: 'Hoje'
        };
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);
        return {
          startDate: garantirDataMinima(yesterday),
          endDate: yesterdayEnd,
          label: 'Ontem'
        };
      }
      case 'last7days': {
        const last7days = new Date(today);
        last7days.setDate(last7days.getDate() - 6); // 7 dias incluindo hoje
        return {
          startDate: garantirDataMinima(last7days),
          endDate: endOfDay,
          label: 'Últimos 7 dias'
        };
      }
      case 'last30days': {
        const last30days = new Date(today);
        last30days.setDate(last30days.getDate() - 29); // 30 dias incluindo hoje
        return {
          startDate: garantirDataMinima(last30days),
          endDate: endOfDay,
          label: 'Últimos 30 dias'
        };
      }
      case 'thisMonth': {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          startDate: garantirDataMinima(firstDayOfMonth),
          endDate: endOfDay,
          label: 'Este mês'
        };
      }
      case 'lastMonth': {
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        return {
          startDate: garantirDataMinima(firstDayOfLastMonth),
          endDate: lastDayOfLastMonth,
          label: 'Mês anterior'
        };
      }
      case 'custom': {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return {
          startDate: garantirDataMinima(start),
          endDate: end,
          label: `${garantirDataMinima(start).toLocaleDateString('pt-BR')} até ${end.toLocaleDateString('pt-BR')}`
        };
      }
      default:
        return {
          startDate: garantirDataMinima(new Date(today.setDate(today.getDate() - 6))),
          endDate: endOfDay,
          label: 'Últimos 7 dias'
        };
    }
  };

  const handleRangeSelection = (rangeId: string) => {
    setSelectedRange(rangeId);
    
    // Se não for período customizado, fecha o dropdown e emite evento
    if (rangeId !== 'custom') {
      setIsOpen(false);
      onDateChange(calculateDateRange(rangeId));
    }
  };

  const handleCustomDateApply = () => {
    setIsOpen(false);
    onDateChange(calculateDateRange('custom'));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-gray-700 text-gray-200 rounded-md px-4 py-2 text-sm"
      >
        <div className="flex items-center">
          <FaCalendar className="mr-2 text-emerald-400" />
          <span>
            {predefinedRanges.find(r => r.id === selectedRange)?.label === 'Período personalizado'
              ? `${new Date(customStartDate).toLocaleDateString('pt-BR')} até ${new Date(customEndDate).toLocaleDateString('pt-BR')}`
              : predefinedRanges.find(r => r.id === selectedRange)?.label}
          </span>
        </div>
        <FaChevronDown className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
          <div className="p-2">
            {predefinedRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => handleRangeSelection(range.id)}
                className={`w-full text-left px-3 py-2 rounded-md mb-1 text-sm ${
                  selectedRange === range.id
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'hover:bg-gray-700 text-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}

            {selectedRange === 'custom' && (
              <div className="mt-3 p-2 border-t border-gray-700">
                <div className="mb-2">
                  <label className="block text-sm text-gray-400 mb-1">Data inicial</label>
                  <input
                    type="date"
                    value={customStartDate}
                    min={dataMinimaFormatada}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                  />
                  <p className="text-xs text-amber-400 mt-1">
                    Data mínima: 24/03/2025
                  </p>
                </div>
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Data final</label>
                  <input
                    type="date"
                    value={customEndDate}
                    min={customStartDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white"
                  />
                </div>
                <button
                  onClick={handleCustomDateApply}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md text-sm transition"
                >
                  Aplicar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 