
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

export interface PaymentTransaction {
  id: string;
  entity_type: 'invoice' | 'bill';
  entity_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_provider?: PaymentProvider;
  provider_transaction_id?: string;
  status: PaymentStatus;
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
