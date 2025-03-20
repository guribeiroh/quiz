"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaBook, FaGraduationCap } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  college: z.string().optional(),
  semester: z.string().optional(),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: 'Você precisa concordar com os termos'
  })
});

type FormData = z.infer<typeof formSchema>;

export function LeadCapture() {
  const { quizResult, saveUserData } = useQuiz();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agreedToTerms: false
    }
  });
  
  const onSubmit = (data: FormData) => {
    saveUserData(data);
  };
  
  if (!quizResult) return null;
  
  const scorePercentage = quizResult.score;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700"
        >
          <div className="bg-emerald-700 p-6 text-white text-center">
            <h2 className="text-3xl font-bold mb-3">Parabéns! Você concluiu o quiz!</h2>
            <p className="text-xl">Sua pontuação: {scorePercentage.toFixed(0)}%</p>
          </div>
          
          <div className="p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="border-4 border-emerald-500 rounded-full p-3">
                <FaBook className="text-5xl text-emerald-500" />
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Receba seu e-book gratuito e relatório detalhado
              </h3>
              
              <p className="text-gray-300">
                Preencha o formulário abaixo para receber seu e-book exclusivo &quot;Guia Definitivo para Estudar Anatomia&quot; 
                e um relatório detalhado do seu desempenho com dicas personalizadas.
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="name">
                  Nome completo*
                </label>
                <input
                  id="name"
                  type="text"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-gray-700 text-white
                    ${errors.name ? 'border-red-500' : 'border-gray-600'}`}
                  placeholder="Seu nome completo"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="email">
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-gray-700 text-white
                    ${errors.email ? 'border-red-500' : 'border-gray-600'}`}
                  placeholder="seu.email@exemplo.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="phone">
                  Telefone (opcional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="w-full p-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-gray-700 text-white"
                  placeholder="(00) 00000-0000"
                  {...register('phone')}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="college">
                    Faculdade/Universidade (opcional)
                  </label>
                  <input
                    id="college"
                    type="text"
                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-gray-700 text-white"
                    placeholder="Nome da instituição"
                    {...register('college')}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="semester">
                    Período/Semestre (opcional)
                  </label>
                  <input
                    id="semester"
                    type="text"
                    className="w-full p-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-gray-700 text-white"
                    placeholder="Ex: 3º semestre"
                    {...register('semester')}
                  />
                </div>
              </div>
              
              <div className="flex items-start mt-6">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    className="w-5 h-5 accent-emerald-600 rounded bg-gray-700 border-gray-600"
                    {...register('agreedToTerms')}
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="terms" className={`text-sm ${errors.agreedToTerms ? 'text-red-500' : 'text-gray-400'}`}>
                    Concordo em receber conteúdos educacionais por email e aceito os termos de uso e política de privacidade.*
                  </label>
                  {errors.agreedToTerms && (
                    <p className="text-red-500 text-sm mt-1">{errors.agreedToTerms.message}</p>
                  )}
                </div>
              </div>
              
              <div className="text-center mt-8">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg disabled:opacity-70 flex items-center justify-center mx-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaGraduationCap className="mr-2" />
                  {isSubmitting ? 'Enviando...' : 'Receber meu e-book gratuito'}
                </motion.button>
              </div>
            </form>
            
            <div className="mt-8 flex items-start p-4 bg-emerald-900/20 rounded-lg border border-emerald-800">
              <FaCheckCircle className="text-emerald-500 text-xl flex-shrink-0 mt-0.5 mr-3" />
              <p className="text-sm text-gray-300">
                Mais de 5.000 estudantes já baixaram nosso e-book e melhoraram significativamente seus estudos de anatomia. 
                Junte-se a eles e transforme sua forma de estudar!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 