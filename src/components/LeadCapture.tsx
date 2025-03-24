"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaBook, FaGraduationCap, FaSpinner, FaLink, FaUser, FaEnvelope, FaPhone, FaUniversity, FaBookReader } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';
import { Footer } from './Footer';
import { getReferralCodeOwner } from '../lib/supabase';
import { trackStepView, FunnelStep } from '../lib/analytics';
import { generateSessionId } from '../lib/sessionUtils';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  occupation: z.enum(['estudante_medicina', 'estudante_saude', 'profissional_saude', 'medico'], {
    errorMap: () => ({ message: 'Selecione uma opção' })
  }),
  referralCode: z.string().optional(),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: 'Você precisa concordar com os termos'
  })
});

type FormData = z.infer<typeof formSchema>;

export function LeadCapture() {
  const { quizResult, saveUserData } = useQuiz();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [autoAppliedCode, setAutoAppliedCode] = useState<string | null>(null);
  const [referralOwnerName, setReferralOwnerName] = useState<string | null>(null);
  const [isLoadingOwner, setIsLoadingOwner] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agreedToTerms: false
    }
  });
  
  // Verificar se existe um código de referência salvo
  useEffect(() => {
    const savedCode = typeof window !== 'undefined' ? localStorage.getItem('usedReferralCode') : null;
    
    if (savedCode) {
      console.log('Código de referência encontrado:', savedCode);
      setValue('referralCode', savedCode);
      setAutoAppliedCode(savedCode);
      
      // Buscar informações do dono do código
      const fetchOwnerInfo = async () => {
        setIsLoadingOwner(true);
        try {
          const result = await getReferralCodeOwner(savedCode);
          if (result.success && result.data && result.data.firstName) {
            setReferralOwnerName(result.data.firstName);
          }
        } catch (error) {
          console.error('Erro ao buscar informações do dono do código:', error);
        } finally {
          setIsLoadingOwner(false);
        }
      };
      
      fetchOwnerInfo();
    }
  }, [setValue]);
  
  // Rastrear visualização da página de captura de leads
  useEffect(() => {
    // Garantir que há um ID de sessão
    const sessionId = generateSessionId();
    
    // Rastrear o evento de visualização
    trackStepView(FunnelStep.LEAD_CAPTURE, sessionId)
      .catch(error => console.error('Erro ao rastrear visualização:', error));
    
    // Verificar se há código de referência usado
    if (typeof window !== 'undefined') {
      const usedReferralCode = localStorage.getItem('usedReferralCode');
      if (usedReferralCode) {
        setAutoAppliedCode(usedReferralCode);
      }
    }
      
    // Registrar evento de pageview
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'page_view', {
        page_title: 'Lead Capture',
        page_location: window.location.href,
        page_path: window.location.pathname,
      });
    }
  }, []);
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Rastrear evento de envio de formulário
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'lead_capture', {
          occupation: data.occupation,
          has_phone: Boolean(data.phone),
          is_student: Boolean(data.college && data.semester),
          used_referral: Boolean(data.referralCode)
        });
      }
      
      await saveUserData(data);
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      
      // Verificar se é o erro de usuário já existente usando verificação de tipo segura
      if (typeof error === 'object' && error !== null) {
        // Usar type assertion para informar ao TypeScript sobre a possível propriedade code
        const errorWithCode = error as { code?: string; message?: string; status?: number };
        
        // Usar o status HTTP ou o código para determinar o tipo de erro
        if (errorWithCode.status === 409 || errorWithCode.code === 'USER_ALREADY_EXISTS') {
          setSubmitError('Você já participou deste quiz anteriormente. Cada pessoa só pode participar uma vez.');
        } else if (errorWithCode.status === 500 || errorWithCode.code === 'DB_CONFIG_ERROR') {
          setSubmitError('Nosso sistema está temporariamente indisponível devido a uma manutenção. Por favor, tente novamente mais tarde.');
        } else if (errorWithCode.status === 503 || errorWithCode.code === 'SERVER_ERROR') {
          setSubmitError('Servidor temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.');
        } else if (errorWithCode.message && typeof errorWithCode.message === 'string') {
          // Se temos uma mensagem de erro, usá-la diretamente
          if (errorWithCode.message.includes('já completou o quiz') || 
              errorWithCode.message.includes('já existe um registro')) {
            setSubmitError('Você já participou deste quiz anteriormente. Cada pessoa só pode participar uma vez.');
          } else {
            setSubmitError(`Erro: ${errorWithCode.message}`);
          }
        } else {
          setSubmitError('Ocorreu um erro ao enviar seus dados. Por favor, tente novamente.');
        }
      } else if (typeof error === 'string' && error.includes('já completou o quiz')) {
        setSubmitError('Você já participou deste quiz anteriormente. Cada pessoa só pode participar uma vez.');
      } else {
        setSubmitError('Ocorreu um erro ao enviar seus dados. Por favor, tente novamente.');
      }
      
      setIsSubmitting(false);
    }
  };
  
  if (!quizResult) return null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 px-4 py-6 sm:py-12 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700"
        >
          <div className="bg-emerald-700 p-4 sm:p-6 text-white text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Parabéns! Você concluiu o quiz!</h2>
          </div>
          
          <div className="p-5 sm:p-8">
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <div className="border-4 border-emerald-500 rounded-full p-3">
                <FaBook className="text-4xl sm:text-5xl text-emerald-500" />
              </div>
            </div>
            
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                Receba seu e-book gratuito e relatório detalhado
              </h3>
              
              <p className="text-gray-300 text-sm sm:text-base">
                Preencha o formulário abaixo para receber seu e-book exclusivo &quot;Guia Definitivo para Estudar Anatomia&quot; 
                e um relatório detalhado do seu desempenho com dicas personalizadas.
              </p>
            </div>
            
            {submitError && (
              <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded-lg mb-4 text-sm">
                {submitError}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base" htmlFor="name">
                  Nome completo*
                </label>
                <input
                  id="name"
                  type="text"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-gray-700 text-white text-sm sm:text-base
                    ${errors.name ? 'border-red-500' : 'border-gray-600'}`}
                  placeholder="Seu nome completo"
                  disabled={isSubmitting}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base" htmlFor="email">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-gray-700 text-white text-sm sm:text-base
                    ${errors.email ? 'border-red-500' : 'border-gray-600'}`}
                  placeholder="seu.email@exemplo.com"
                  disabled={isSubmitting}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base" htmlFor="phone">
                  Telefone*
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-gray-700 text-white text-sm sm:text-base
                    ${errors.phone ? 'border-red-500' : 'border-gray-600'}`}
                  placeholder="(00) 00000-0000"
                  disabled={isSubmitting}
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base" htmlFor="occupation">
                  Profissão/Ocupação*
                </label>
                <select
                  id="occupation"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-gray-700 text-white text-sm sm:text-base
                    ${errors.occupation ? 'border-red-500' : 'border-gray-600'}`}
                  disabled={isSubmitting}
                  {...register('occupation')}
                >
                  <option value="" disabled selected>Selecione uma opção</option>
                  <option value="estudante_medicina">Estudante de Medicina</option>
                  <option value="estudante_saude">Estudante Área da Saúde</option>
                  <option value="profissional_saude">Profissional da Saúde</option>
                  <option value="medico">Médico(a)</option>
                </select>
                {errors.occupation && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.occupation.message}</p>
                )}
              </div>
              
              <div className="mt-4">
                <label className="block text-gray-300 mb-1 sm:mb-2 text-sm sm:text-base" htmlFor="referralCode">
                  Código de indicação {autoAppliedCode ? '(aplicado automaticamente)' : '(opcional)'}
                </label>
                <div className="relative">
                  <input
                    id="referralCode"
                    type="text"
                    className={`w-full p-3 ${autoAppliedCode ? 'pr-10 bg-emerald-900/30 border-emerald-600' : 'border-gray-600'} border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-gray-700 text-white text-sm sm:text-base`}
                    placeholder="Código de indicação se você foi convidado"
                    disabled={isSubmitting || !!autoAppliedCode}
                    {...register('referralCode')}
                  />
                  {autoAppliedCode && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-400">
                      <FaLink className="text-lg" />
                    </div>
                  )}
                </div>
                {autoAppliedCode ? (
                  <div className="text-emerald-400 text-xs sm:text-sm mt-1">
                    {isLoadingOwner ? (
                      <div className="flex items-center">
                        <FaSpinner className="animate-spin mr-1" /> 
                        Verificando código de referência...
                      </div>
                    ) : referralOwnerName ? (
                      <div className="flex items-center">
                        <FaCheckCircle className="mr-1" /> 
                        <span>Você foi convidado por <span className="font-bold">{referralOwnerName}</span>! Código aplicado automaticamente.</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <FaCheckCircle className="mr-1" /> 
                        Código de referência aplicado automaticamente!
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    Se um amigo indicou você, insira o código dele aqui. Você receberá pontos extras!
                  </p>
                )}
              </div>
              
              <div className="flex items-start mt-4 sm:mt-6">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    className="w-5 h-5 accent-emerald-600 rounded bg-gray-700 border-gray-600"
                    disabled={isSubmitting}
                    {...register('agreedToTerms')}
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="terms" className={`text-xs sm:text-sm ${errors.agreedToTerms ? 'text-red-500' : 'text-gray-400'}`}>
                    Concordo em receber conteúdos educacionais por email e aceito os termos de uso e política de privacidade.*
                  </label>
                  {errors.agreedToTerms && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.agreedToTerms.message}</p>
                  )}
                </div>
              </div>
              
              <div className="text-center mt-6 sm:mt-8">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-full text-sm sm:text-lg shadow-lg disabled:opacity-70 flex items-center justify-center mx-auto"
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Enviando dados...
                    </>
                  ) : (
                    <>
                      <FaGraduationCap className="mr-2" />
                      Receber meu e-book gratuito
                    </>
                  )}
                </motion.button>
              </div>
            </form>
            
            <div className="mt-6 sm:mt-8 flex items-start p-4 bg-emerald-900/20 rounded-lg border border-emerald-800">
              <FaCheckCircle className="text-emerald-500 text-lg flex-shrink-0 mt-0.5 mr-3" />
              <p className="text-xs sm:text-sm text-gray-300">
                Mais de 5.000 estudantes já baixaram nosso e-book e melhoraram significativamente seus estudos de anatomia. 
                Junte-se a eles e transforme sua forma de estudar!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
} 