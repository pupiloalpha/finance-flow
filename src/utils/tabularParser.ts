import { ExtractedTransaction, RuleGroup, TransactionType } from '../types';

export interface ParseResult {
  transactions: ExtractedTransaction[];
  totalLines: number;
  parsedCount: number;
  skippedHeader: boolean;
  warnings: string[];
}

/**
 * Intelligent parser for tabulated financial data copied and pasted from Excel, Google Sheets,
 * bank statements, CSV, TSV or text tables.
 */
export function parseTabularData(
  rawText: string,
  defaultMonth: string,
  existingCategoryNames: string[] = []
): ParseResult {
  const result: ParseResult = {
    transactions: [],
    totalLines: 0,
    parsedCount: 0,
    skippedHeader: false,
    warnings: [],
  };

  if (!rawText || !rawText.trim()) {
    return result;
  }

  // 1. Split into individual rows
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  result.totalLines = lines.length;
  if (lines.length === 0) return result;

  // 2. Detect column delimiter (Tab is default for Excel/Sheets copy-paste)
  const sampleLine = lines[0];
  let delimiter = '\t';
  if (sampleLine.includes('\t')) {
    delimiter = '\t';
  } else if (sampleLine.includes(';') && (sampleLine.match(/;/g)?.length ?? 0) >= 1) {
    delimiter = ';';
  } else if (sampleLine.includes('|') && (sampleLine.match(/\|/g)?.length ?? 0) >= 1) {
    delimiter = '|';
  } else if (sampleLine.includes(',') && (sampleLine.match(/,/g)?.length ?? 0) >= 2) {
    delimiter = ',';
  }

  // Helper to split a line safely
  const splitLine = (line: string): string[] => {
    return line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
  };

  // 3. Inspect the first line to detect if it's a header
  const firstRowCols = splitLine(lines[0]);
  const isHeaderRow = firstRowCols.some((col) => {
    const c = col.toLowerCase();
    return (
      c.includes('data') ||
      c.includes('date') ||
      c.includes('descri') ||
      c.includes('hist') ||
      c.includes('lanç') ||
      c.includes('lanc') ||
      c.includes('valor') ||
      c.includes('quantia') ||
      c.includes('amount') ||
      c.includes('categoria') ||
      c.includes('category') ||
      c.includes('tipo') ||
      c.includes('forma') ||
      c.includes('pagamento')
    );
  });

  let dataLines = lines;
  let headerMap: {
    dateIdx?: number;
    descIdx?: number;
    amountIdx?: number;
    categoryIdx?: number;
    typeIdx?: number;
    paymentMethodIdx?: number;
  } = {};

  if (isHeaderRow) {
    result.skippedHeader = true;
    firstRowCols.forEach((col, idx) => {
      const c = col.toLowerCase();
      if (headerMap.dateIdx === undefined && (c.includes('data') || c.includes('date'))) {
        headerMap.dateIdx = idx;
      } else if (
        headerMap.descIdx === undefined &&
        (c.includes('descri') || c.includes('hist') || c.includes('lanç') || c.includes('lanc') || c.includes('item') || c.includes('nome'))
      ) {
        headerMap.descIdx = idx;
      } else if (
        headerMap.amountIdx === undefined &&
        (c.includes('valor') || c.includes('amount') || c.includes('quantia') || c.includes('preço') || c.includes('preco'))
      ) {
        headerMap.amountIdx = idx;
      } else if (
        headerMap.categoryIdx === undefined &&
        (c.includes('categor') || c.includes('classif'))
      ) {
        headerMap.categoryIdx = idx;
      } else if (
        headerMap.typeIdx === undefined &&
        (c.includes('tipo') || c.includes('natureza') || c.includes('oper'))
      ) {
        headerMap.typeIdx = idx;
      } else if (
        headerMap.paymentMethodIdx === undefined &&
        (c.includes('pagamento') || c.includes('forma') || c.includes('conta') || c.includes('meio'))
      ) {
        headerMap.paymentMethodIdx = idx;
      }
    });
    dataLines = lines.slice(1);
  }

  // 4. Parse each data line
  for (let i = 0; i < dataLines.length; i++) {
    const rawLine = dataLines[i];
    const cols = splitLine(rawLine);
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

    let parsedDate = '';
    let parsedDesc = '';
    let parsedAmount = 0;
    let isNegativeAmount = false;
    let parsedType: TransactionType | null = null;
    let parsedCategory = '';
    let parsedPaymentMethod = 'Pix';

    // If we have explicit header indices:
    if (headerMap.dateIdx !== undefined && cols[headerMap.dateIdx]) {
      parsedDate = cleanDate(cols[headerMap.dateIdx], defaultMonth);
    }
    if (headerMap.descIdx !== undefined && cols[headerMap.descIdx]) {
      parsedDesc = cols[headerMap.descIdx];
    }
    if (headerMap.amountIdx !== undefined && cols[headerMap.amountIdx]) {
      const { amount, isNegative } = cleanAmount(cols[headerMap.amountIdx]);
      parsedAmount = amount;
      isNegativeAmount = isNegative;
    }
    if (headerMap.categoryIdx !== undefined && cols[headerMap.categoryIdx]) {
      parsedCategory = cols[headerMap.categoryIdx];
    }
    if (headerMap.typeIdx !== undefined && cols[headerMap.typeIdx]) {
      const t = cols[headerMap.typeIdx].toLowerCase();
      if (t.includes('rec') || t.includes('entr') || t.includes('créd') || t.includes('cred')) {
        parsedType = 'receita';
      } else if (t.includes('desp') || t.includes('saíd') || t.includes('said') || t.includes('déb') || t.includes('deb')) {
        parsedType = 'despesa';
      }
    }
    if (headerMap.paymentMethodIdx !== undefined && cols[headerMap.paymentMethodIdx]) {
      parsedPaymentMethod = cols[headerMap.paymentMethodIdx];
    }

    // Heuristic fallback if header mapping didn't find all key fields:
    if (!parsedDate || !parsedDesc || parsedAmount === 0) {
      for (let cIdx = 0; cIdx < cols.length; cIdx++) {
        const val = cols[cIdx];
        if (!val) continue;

        // Try date if not found
        if (!parsedDate && isDateString(val)) {
          parsedDate = cleanDate(val, defaultMonth);
          continue;
        }

        // Try amount if not found
        if (parsedAmount === 0 && isAmountString(val)) {
          const { amount, isNegative } = cleanAmount(val);
          if (amount > 0) {
            parsedAmount = amount;
            isNegativeAmount = isNegative;
            continue;
          }
        }

        // Try description if not found and long enough
        if (!parsedDesc && val.length > 2 && isNaN(Number(val.replace(',', '.')))) {
          parsedDesc = val;
          continue;
        }

        // Check for category if category is empty
        if (!parsedCategory && existingCategoryNames.some((cat) => cat.toLowerCase() === val.toLowerCase())) {
          parsedCategory = val;
          continue;
        }
      }
    }

    // Positional standard 3-column fallback: [0: Data, 1: Descrição, 2: Valor]
    if (!parsedDesc && cols.length >= 2) {
      if (cols[0] && cols[1]) {
        parsedDesc = cols[1];
        if (cols[2] && parsedAmount === 0) {
          const { amount, isNegative } = cleanAmount(cols[2]);
          parsedAmount = amount;
          isNegativeAmount = isNegative;
        }
      }
    }

    // Default fallbacks
    if (!parsedDate) {
      parsedDate = `${defaultMonth}-01`;
    }
    if (!parsedDesc) {
      parsedDesc = `Lançamento ${i + 1}`;
    }

    // If amount is 0, we can still accept or skip
    if (parsedAmount <= 0) {
      result.warnings.push(`Linha ${i + 1}: Valor zerado ou não identificado em "${rawLine.slice(0, 30)}..."`);
      continue;
    }

    // Deduce type
    if (!parsedType) {
      if (isNegativeAmount) {
        parsedType = 'despesa';
      } else {
        // Infer from description or category
        const lowerDesc = parsedDesc.toLowerCase();
        if (
          lowerDesc.includes('salário') ||
          lowerDesc.includes('salario') ||
          lowerDesc.includes('pró-labore') ||
          lowerDesc.includes('pro-labore') ||
          lowerDesc.includes('rendimento') ||
          lowerDesc.includes('adiantamento') ||
          lowerDesc.includes('dividendo') ||
          lowerDesc.includes('pix recebido') ||
          lowerDesc.includes('venda')
        ) {
          parsedType = 'receita';
        } else {
          parsedType = 'despesa';
        }
      }
    }

    // Deduce Category & Rule Group
    const { category, ruleGroup } = deduceCategoryAndRule(parsedDesc, parsedType, parsedCategory, existingCategoryNames);

    result.transactions.push({
      date: parsedDate,
      description: parsedDesc,
      amount: parsedAmount,
      type: parsedType,
      category,
      ruleGroup,
      paymentMethod: parsedPaymentMethod,
      confidence: 'tabulado',
    });
  }

  result.parsedCount = result.transactions.length;
  return result;
}

/** Check if a string looks like a date */
function isDateString(str: string): boolean {
  const trimmed = str.trim();
  // e.g. 15/11/2026, 15-11-2026, 2026-11-15, 15/11
  return (
    /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(trimmed) ||
    /^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/.test(trimmed) ||
    /^\d{1,2}[\/\-\.]\d{1,2}$/.test(trimmed)
  );
}

/** Standardize date string to YYYY-MM-DD */
function cleanDate(str: string, defaultMonth: string): string {
  const trimmed = str.trim();
  const [defYear, defMonth] = defaultMonth.split('-');

  // Format YYYY-MM-DD
  if (/^\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-\.]/);
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Format DD/MM/YYYY or DD/MM/YY
  if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-\.]/);
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    let y = parts[2];
    if (y.length === 2) {
      y = `20${y}`;
    }
    return `${y}-${m}-${d}`;
  }

  // Format DD/MM
  if (/^\d{1,2}[\/\-\.]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\-\.]/);
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    return `${defYear}-${m}-${d}`;
  }

  return `${defaultMonth}-01`;
}

/** Check if string contains currency or number */
export function isAmountString(str: string): boolean {
  const cleaned = str.replace(/[R$\s()D\-+]/gi, '').trim();
  if (!cleaned) return false;
  // Matches 2.517, 2.517,00, 150,00, 150.00, 10.000, 2517
  return (
    /^\d+(?:[.,]\d+)?$/.test(cleaned) ||
    /^\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?$/.test(cleaned) ||
    /^\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?$/.test(cleaned)
  );
}

/** Parse numeric amount safely from brazilian or standard currency text */
export function cleanAmount(str: string): { amount: number; isNegative: boolean } {
  let cleaned = str.trim();
  let isNegative = false;

  if (
    cleaned.startsWith('-') ||
    cleaned.endsWith('-') ||
    (cleaned.startsWith('(') && cleaned.endsWith(')')) ||
    /débito|debito/i.test(cleaned) ||
    /\s+D$/i.test(cleaned) ||
    /-\s*R\$/i.test(cleaned)
  ) {
    isNegative = true;
  }

  // Remove currency signs, parens, letters, spaces
  cleaned = cleaned.replace(/[R$\s()D\-+]/gi, '').trim();

  // If both dots and commas exist:
  // e.g. 1.234,56 (BR format) or 1,234.56 (US format)
  if (cleaned.includes('.') && cleaned.includes(',')) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastComma > lastDot) {
      // BR format: 1.234,56 -> dots are thousands, comma is decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,234.56 -> commas are thousands
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.')) {
    // String contains only dot(s):
    // e.g. 2.517 or 10.000 or 1.250.000 or 150.50
    const dotMatches = cleaned.match(/\./g);
    if (dotMatches && dotMatches.length > 1) {
      // Multiple dots: e.g. 1.250.000 -> all thousands separators in pt-BR
      cleaned = cleaned.replace(/\./g, '');
    } else {
      // Single dot: e.g. 2.517 vs 150.50
      const parts = cleaned.split('.');
      if (parts[1].length === 3) {
        // Exactly 3 digits after dot (e.g. 2.517, 10.000, 1.500):
        // In Brazilian Portuguese / currency, this is a thousands separator!
        cleaned = cleaned.replace('.', '');
      } else {
        // 1 or 2 digits after dot, or >3 digits: keep as decimal point (e.g. 150.50)
      }
    }
  } else if (cleaned.includes(',')) {
    // String contains only comma(s):
    // e.g. 2517,00 or 389,50
    const commaMatches = cleaned.match(/,/g);
    if (commaMatches && commaMatches.length > 1) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
  }

  const num = parseFloat(cleaned);
  return {
    amount: isNaN(num) ? 0 : Math.abs(num),
    isNegative,
  };
}

/** Categorize transaction automatically based on description and type */
function deduceCategoryAndRule(
  description: string,
  type: TransactionType,
  existingCategory: string,
  existingCategoryNames: string[]
): { category: string; ruleGroup: RuleGroup } {
  // If a valid category was matched directly
  if (existingCategory) {
    const exact = existingCategoryNames.find((c) => c.toLowerCase() === existingCategory.toLowerCase());
    if (exact) {
      return {
        category: exact,
        ruleGroup: guessRuleGroupForCategory(exact, type),
      };
    }
  }

  const d = description.toLowerCase();

  if (type === 'receita') {
    if (d.includes('salário') || d.includes('salario') || d.includes('pró-labore') || d.includes('pro-labore')) {
      return { category: 'Salário', ruleGroup: 'receitas' };
    }
    if (d.includes('rendimento') || d.includes('dividendo') || d.includes('investimento')) {
      return { category: 'Rendimentos', ruleGroup: 'receitas' };
    }
    if (d.includes('freelance') || d.includes('extra') || d.includes('venda')) {
      return { category: 'Renda Extra', ruleGroup: 'receitas' };
    }
    return { category: 'Outras Receitas', ruleGroup: 'receitas' };
  }

  // Despesas
  if (d.includes('mercado') || d.includes('supermercado') || d.includes('feira') || d.includes('açougue') || d.includes('padaria') || d.includes('hortifruti')) {
    return { category: 'Alimentação', ruleGroup: 'necessidades' };
  }
  if (d.includes('aluguel') || d.includes('condomínio') || d.includes('condominio') || d.includes('enel') || d.includes('luz') || d.includes('água') || d.includes('agua') || d.includes('gás') || d.includes('gas') || d.includes('iptu')) {
    return { category: 'Moradia', ruleGroup: 'necessidades' };
  }
  if (d.includes('uber') || d.includes('99') || d.includes('gasolina') || d.includes('posto') || d.includes('combustível') || d.includes('estacionamento') || d.includes('pedágio') || d.includes('ipva') || d.includes('metrô') || d.includes('onibus')) {
    return { category: 'Transporte', ruleGroup: 'necessidades' };
  }
  if (d.includes('farmácia') || d.includes('farmacia') || d.includes('drogaria') || d.includes('médico') || d.includes('medico') || d.includes('hospital') || d.includes('dentista') || d.includes('exame') || d.includes('consulta') || d.includes('unimed')) {
    return { category: 'Saúde', ruleGroup: 'necessidades' };
  }
  if (d.includes('escola') || d.includes('colégio') || d.includes('faculdade') || d.includes('curso') || d.includes('livro') || d.includes('mensalidade')) {
    return { category: 'Educação', ruleGroup: 'necessidades' };
  }
  if (d.includes('restaurante') || d.includes('ifood') || d.includes('lanchonete') || d.includes('lanche') || d.includes('café') || d.includes('bar') || d.includes('cinema') || d.includes('netflix') || d.includes('spotify') || d.includes('jogo') || d.includes('steam') || d.includes('viagem') || d.includes('hotel') || d.includes('shopping')) {
    return { category: 'Lazer', ruleGroup: 'desejos' };
  }
  if (d.includes('poupança') || d.includes('investimento') || d.includes('cdb') || d.includes('tesouro') || d.includes('ações') || d.includes('fundo') || d.includes('reserva')) {
    return { category: 'Investimentos', ruleGroup: 'investimentos' };
  }

  // Default despesa
  return { category: 'Outros', ruleGroup: 'necessidades' };
}

function guessRuleGroupForCategory(category: string, type: TransactionType): RuleGroup {
  if (type === 'receita') return 'receitas';
  const c = category.toLowerCase();
  if (c.includes('invest') || c.includes('poup')) return 'investimentos';
  if (c.includes('lazer') || c.includes('restaurante') || c.includes('vestuário') || c.includes('viagem')) return 'desejos';
  return 'necessidades';
}
