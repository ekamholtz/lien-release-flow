
export type PaymentMethod = 'credit_card' | 'ach' | 'check' | 'bank_transfer' | 'cash' | 'wire_transfer';

export type PaymentProvider = 'rainforestpay' | 'manual' | 'offline';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface OfflinePaymentData {
  payorName: string;
  payorCompany?: string;
  paymentDetails?: string;
  amount: number;
  paymentDate: string;
}

// Database payment transaction type that matches the actual database schema
export interface DbPaymentTransaction {
  id: string;
  entity_type: string;
  entity_id: string;
  amount: number;
  payment_method: string;
  payment_provider?: string | null;
  provider_transaction_id?: string | null;
  status: string;
  payment_date?: string | null;
  created_at: string;
  updated_at: string;
  company_id: string;
  user_id?: string | null;
  metadata?: any;
  notes?: string | null;
  payment_type?: string | null;
  payor_name?: string | null;
  payor_company?: string | null;
  payment_details?: string | null;
  is_offline?: boolean | null;
}

// Application payment transaction type with proper typing
export interface PaymentTransaction {
  id: string;
  entity_type: string;
  entity_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_provider?: PaymentProvider;
  provider_transaction_id?: string;
  status: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  user_id?: string;
  metadata?: Record<string, any>;
  notes?: string;
  payment_type?: string;
  payor_name?: string;
  payor_company?: string;
  payment_details?: string;
  is_offline?: boolean;
}

export interface PaymentProcessingOptions {
  method: PaymentMethod;
  provider?: PaymentProvider;
  amount: number;
  description?: string;
  metadata?: Record<string, any>;
  offlineData?: OfflinePaymentData;
}

export interface InvoicePaymentSummary {
  totalPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
  payments: PaymentTransaction[];
}
