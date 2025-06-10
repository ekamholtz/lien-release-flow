
export type PaymentMethod = 'credit_card' | 'ach' | 'check' | 'bank_transfer' | 'cash';

export type PaymentProvider = 'rainforestpay' | 'manual';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

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
}

export interface PaymentProcessingOptions {
  method: PaymentMethod;
  provider?: PaymentProvider;
  amount: number;
  description?: string;
  metadata?: Record<string, any>;
}
