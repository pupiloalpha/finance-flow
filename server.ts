import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

process.env.DISABLE_HMR = 'true';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Body parsers with generous limit for file uploads (PDFs, images, CSVs up to 25MB)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Shared Gemini AI client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint 1: Gemini Financial Health Diagnostics
app.post('/api/gemini/analyze-health', async (req, res) => {
  try {
    const {
      month,
      totalExpensesPlanned,
      totalExpensesActual,
      totalIncomesPlanned,
      totalIncomesActual,
      saldoMensal,
      saldoHoje,
      saldoProjetado,
      fiftyThirtyTwenty,
      categoriesOverLimit,
      topExpenses,
    } = req.body;

    const prompt = `
Você é um Consultor Financeiro Pessoal sênior especialista em finanças comportamentais e metodologia 50-30-20.
Analise a saúde financeira do usuário para o mês de referência: ${month}.

DADOS FINANCEIROS ATUAIS:
- Receitas: Planejado R$ ${totalIncomesPlanned?.toLocaleString('pt-BR')} | Realizado R$ ${totalIncomesActual?.toLocaleString('pt-BR')}
- Despesas: Planejado (Teto) R$ ${totalExpensesPlanned?.toLocaleString('pt-BR')} | Realizado R$ ${totalExpensesActual?.toLocaleString('pt-BR')}
- Saldo Mensal restante: R$ ${saldoMensal?.toLocaleString('pt-BR')}
- Saldo Hoje disponível: R$ ${saldoHoje?.toLocaleString('pt-BR')}
- Saldo Projetado: R$ ${saldoProjetado?.toLocaleString('pt-BR')}

METODOLOGIA 50-30-20:
- Necessidades (Meta 50%): Realizado R$ ${fiftyThirtyTwenty?.necessidades?.actual} (${fiftyThirtyTwenty?.necessidades?.percentageOfPlannedExpenses}% de 50%). Diferença: R$ ${fiftyThirtyTwenty?.necessidades?.difference}.
- Desejos & Estilo de Vida (Meta 30%): Realizado R$ ${fiftyThirtyTwenty?.desejos?.actual} (${fiftyThirtyTwenty?.desejos?.percentageOfPlannedExpenses}% de 30% - ${fiftyThirtyTwenty?.desejos?.isOverBudget ? 'ESTOUROU A META!' : 'Dentro da meta'}). Diferença: R$ ${fiftyThirtyTwenty?.desejos?.difference}.
- Investimentos (Meta 20%): Realizado R$ ${fiftyThirtyTwenty?.investimentos?.actual} (${fiftyThirtyTwenty?.investimentos?.percentageOfPlannedExpenses}% de 20%). Meta a aportar: R$ ${fiftyThirtyTwenty?.investimentos?.difference}.

CATEGORIAS QUE EXCEDERAM O TETO ORÇAMENTÁRIO:
${JSON.stringify(categoriesOverLimit || [])}

PRINCIPAIS GASTOS REGISTRADOS:
${JSON.stringify(topExpenses || [])}

MISSÃO:
Gere um diagnóstico profundo, honesto e motivador em língua portuguesa do Brasil.
Forneça:
1. Score de saúde financeira de 0 a 100 com o rótulo correspondente ('Excelente', 'Bom', 'Atenção' ou 'Crítico').
2. Resumo executivo da situação financeira.
3. Diagnóstico específico da regra 50-30-20 (com ênfase no desvio de Desejos e nos Investimentos).
4. Pontos fortes identificados.
5. Críticas e riscos iminentes (atenção ao cartão de crédito e juros).
6. 3 a 5 recomendações práticas com título, descrição, impacto estimado em R$ e prioridade ('alta', 'media', 'baixa').
7. Um plano de ação imediato em tópicos (passo 1, passo 2, passo 3).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Você é um consultor financeiro de elite. Seja preciso com cálculos, amigável, direto ao ponto e focado na prosperidade do usuário.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: 'Score de 0 a 100' },
            scoreLabel: {
              type: Type.STRING,
              enum: ['Excelente', 'Bom', 'Atenção', 'Crítico'],
            },
            summary: { type: Type.STRING },
            diagnostico503020: {
              type: Type.OBJECT,
              properties: {
                necessidadesObs: { type: Type.STRING },
                desejosObs: { type: Type.STRING },
                investimentosObs: { type: Type.STRING },
              },
            },
            criticas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            pontosFortes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recomendacoes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  titulo: { type: Type.STRING },
                  descricao: { type: Type.STRING },
                  impactoEstimado: { type: Type.STRING },
                  prioridade: {
                    type: Type.STRING,
                    enum: ['alta', 'media', 'baixa'],
                  },
                },
              },
            },
            planoAcao: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'score',
            'scoreLabel',
            'summary',
            'diagnostico503020',
            'criticas',
            'pontosFortes',
            'recomendacoes',
            'planoAcao',
          ],
        },
      },
    });

    const text = response.text || '{}';
    res.json(JSON.parse(text));
  } catch (error) {
    console.error('Error generating financial health analysis:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Falha ao processar análise do Gemini',
    });
  }
});

// Endpoint 2: Gemini File Upload Extraction (PDF, CSV, OFX, XLS, Imagens de boletos/faturas)
app.post('/api/gemini/extract-transactions', async (req, res) => {
  try {
    const { fileName, fileContentBase64, textContent, mimeType, currentCategories, selectedMonth } =
      req.body;

    const categoriesList =
      currentCategories || [
        'Alimentação',
        'Supermercado',
        'Moradia',
        'Educação',
        'Saúde',
        'Transporte',
        'Cartão de Crédito',
        'Outros',
        'Investimentos | Reserva',
        'Pagamento',
        'Reserva de emergência',
        'Rendimentos',
      ];

    const instruction = `
Você é um sistema especialista em processamento e OCR de faturas de cartão de crédito, extratos bancários, comprovantes Pix, boletos e planilhas financeiras (CSV, XLS, PDF, imagens).
Seu objetivo é extrair todas as transações financeiras (despesas e receitas) presentes no documento fornecido.

Categorias disponíveis no aplicativo do usuário:
${JSON.stringify(categoriesList)}

Regras de Mapeamento:
1. Data: Converta para o formato AAAA-MM-DD (ex: 2026-11-05). Se o documento omitir o ano, assuma o ano e mês base: ${selectedMonth}.
2. Descrição: Nome claro do estabelecimento ou transação (ex: "Posto Ipiranga", "Supermercado Carrefour", "Fatura Nubank", "Salário Mensal").
3. Valor: Número positivo em reais (float).
4. Tipo: "despesa" para pagamentos, compras, saques, débitos e faturas. "receita" para salários, transferências recebidas, estornos e rendimentos.
5. Categoria: Escolha a categoria mais apropriada dentre as categorias disponíveis informadas.
6. Grupo 50-30-20:
   - Se for despesa essencial (alimentação, moradia, luz, água, saúde, transporte básico, escola): "necessidades"
   - Se for despesa de estilo de vida, compras, restaurantes, assinaturas, cartão: "desejos"
   - Se for poupança, tesouro, CDB, ações ou reserva: "investimentos"
   - Se for receita: "receitas"
7. Forma de Pagamento: "Cartão de Crédito", "Pix", "Boleto", "Cartão de Débito" ou "Transferência Bancária".

Extraia todas as transações encontradas com alta fidelidade.
`;

    let contentsPayload: any;

    if (fileContentBase64 && mimeType) {
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType,
              data: fileContentBase64,
            },
          },
          {
            text: `${instruction}\nArquivo: ${fileName}`,
          },
        ],
      };
    } else {
      contentsPayload = `${instruction}\nConteúdo do arquivo ${fileName}:\n${textContent || ''}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPayload,
      config: {
        systemInstruction:
          'Extraia dados de transações financeiras com precisão absoluta. Retorne um array JSON com as transações.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: 'AAAA-MM-DD' },
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER, description: 'Valor positivo' },
              type: {
                type: Type.STRING,
                enum: ['despesa', 'receita'],
              },
              category: { type: Type.STRING },
              ruleGroup: {
                type: Type.STRING,
                enum: ['necessidades', 'desejos', 'investimentos', 'receitas'],
              },
              paymentMethod: { type: Type.STRING },
              confidence: { type: Type.STRING, description: 'alta, media ou baixa' },
            },
            required: ['date', 'description', 'amount', 'type', 'category', 'ruleGroup', 'paymentMethod'],
          },
        },
      },
    });

    const text = response.text || '[]';
    res.json(JSON.parse(text));
  } catch (error) {
    console.error('Error extracting transactions with Gemini:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Falha ao extrair transações do arquivo',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
