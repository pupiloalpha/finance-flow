import React from 'react';
import { FinancialHealthAnalysis } from '../types';
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Target,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

interface AIHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: FinancialHealthAnalysis | null;
  isLoading: boolean;
  onReanalyze: () => void;
}

export const AIHealthModal: React.FC<AIHealthModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
  onReanalyze,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!analysis) return;
    const text = `DIAGNÓSTICO FINANCEIRO COM GEMINI AI
Score: ${analysis.score}/100 (${analysis.scoreLabel})

RESUMO:
${analysis.summary}

REGRA 50-30-20:
- Necessidades: ${analysis.diagnostico503020.necessidadesObs}
- Desejos: ${analysis.diagnostico503020.desejosObs}
- Investimentos: ${analysis.diagnostico503020.investimentosObs}

RECOMENDAÇÕES:
${analysis.recomendacoes.map((r) => `• [${r.prioridade.toUpperCase()}] ${r.titulo}: ${r.descricao} (Impacto: ${r.impactoEstimado})`).join('\n')}

PLANO DE AÇÃO:
${analysis.planoAcao.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40';
    if (score >= 60) return 'text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40';
    return 'text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-800 dark:text-slate-100 my-8 max-h-[90vh] overflow-y-auto transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Diagnóstico de Saúde Financeira
                <span className="text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Gemini 3.8 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Avaliação detalhada com metodologia 50-30-20 e plano prático
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onReanalyze}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
              title="Recalcular análise com dados atualizados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-16 text-center space-y-4">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <Sparkles className="w-7 h-7 text-emerald-500 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                O Gemini está analisando suas finanças...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Avaliando distribuição da regra 50-30-20, despesas acima do limite, receitas e gerando recomendações personalizadas.
              </p>
            </div>
          </div>
        ) : !analysis ? (
          <div className="py-12 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhuma análise disponível. Clique em atualizar para gerar.
            </p>
            <button
              onClick={onReanalyze}
              className="mt-3 px-4 py-2 bg-emerald-600 rounded-xl text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
            >
              Gerar Análise Agora
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            
            {/* Score & Summary Banner */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div
                className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 shadow-md ${getScoreColor(
                  analysis.score
                )}`}
              >
                <span className="text-3xl font-black font-['JetBrains_Mono']">
                  {analysis.score}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  {analysis.scoreLabel}
                </span>
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Visão Geral do Consultor
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            </div>

            {/* Diagnóstico 50-30-20 */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Diagnóstico da Metodologia 50 - 30 - 20
              </h4>
              
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                    Necessidades (50%):
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                    {analysis.diagnostico503020.necessidadesObs}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20">
                  <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">
                    Desejos & Estilo de Vida (30%):
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                    {analysis.diagnostico503020.desejosObs}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-500/20">
                  <span className="font-bold text-teal-800 dark:text-teal-300 block mb-0.5">
                    Investimentos & Futuro (20%):
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 text-[11px]">
                    {analysis.diagnostico503020.investimentosObs}
                  </span>
                </div>
              </div>
            </div>

            {/* Pontos Fortes & Críticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Pontos Fortes
                </h5>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                  {analysis.pontosFortes.map((p, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <h5 className="font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Alertas Críticos
                </h5>
                <ul className="space-y-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                  {analysis.criticas.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-600 dark:text-rose-400">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recomendações Práticas */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Recomendações Práticas com Estimativa de Economia
              </h4>
              <div className="space-y-2">
                {analysis.recomendacoes.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            rec.prioridade === 'alta'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                          }`}
                        >
                          {rec.prioridade} prioridade
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {rec.titulo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        {rec.descricao}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block">Impacto estimado</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-['JetBrains_Mono']">
                        {rec.impactoEstimado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plano de Ação em Passos */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Plano de Ação Imediato
              </h4>
              <ol className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {analysis.planoAcao.map((passo, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-bold text-teal-600 dark:text-teal-400 font-['JetBrains_Mono'] shrink-0">
                      {i + 1}.
                    </span>
                    <span className="text-[11px]">{passo}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Diagnóstico'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

