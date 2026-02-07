export interface TrusteeInfo {
  name: string;
  en: string;
  zh: string;
}

export interface SchemeInfo {
  name: string;
  en: string;
  zh: string;
}

export interface UnitPriceEntry {
  month: string;
  price: number | null;
}

export interface FundEntry {
  fund: string;
  zh?: string;
  /** Single number (legacy) or list of { month, price } for past N months */
  unitPrice: number | UnitPriceEntry[];
  notes?: string;
}

export interface FundPriceSchemeEntry {
  trustee: TrusteeInfo;
  scheme: SchemeInfo;
  funds: FundEntry[];
}

export interface FundPriceSchemeData {
  source: string;
  exportedAt: string;
  /** Month keys used in unitPrice list (e.g. ["2025-09", "2025-11", "2025-12"]) */
  months?: string[];
  count: number;
  data: FundPriceSchemeEntry[];
}
