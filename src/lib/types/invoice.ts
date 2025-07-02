
export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  status: string;
  client_name: string;
  client_email: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_street_address?: string;
  customer_city?: string;
  customer_state?: string;
  created_at: string;
  company_id?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  category_name?: string;
  cost?: number;
  markup_percentage?: number;
  price?: number;
}
