
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaymentTransaction } from '@/lib/payments/types';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, FileText, Banknote, Building2 } from 'lucide-react';

interface PaymentHistoryProps {
  payments: PaymentTransaction[];
  totalPaid: number;
  remainingBalance: number;
  invoiceAmount: number;
}

export function PaymentHistory({ payments, totalPaid, remainingBalance, invoiceAmount }: PaymentHistoryProps) {
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'check':
        return <FileText className="h-4 w-4" />;
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'wire_transfer':
        return <Building2 className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'ach':
        return 'ACH Transfer';
      case 'check':
        return 'Check';
      case 'cash':
        return 'Cash';
      case 'wire_transfer':
        return 'Wire Transfer';
      default:
        return method;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Invoice Amount</p>
            <p className="text-lg font-semibold">{formatCurrency(invoiceAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold text-orange-600">{formatCurrency(remainingBalance)}</p>
          </div>
        </div>

        {/* Payment Status Badge */}
        <div className="flex justify-center">
          {remainingBalance === 0 && totalPaid > 0 ? (
            <Badge className="bg-green-100 text-green-800">Fully Paid</Badge>
          ) : totalPaid > 0 ? (
            <Badge className="bg-orange-100 text-orange-800">Partially Paid</Badge>
          ) : (
            <Badge variant="outline">Unpaid</Badge>
          )}
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Payment History</h4>
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    {getPaymentIcon(payment.payment_method)}
                    <div>
                      <p className="font-medium">{getPaymentMethodName(payment.payment_method)}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.payor_name}
                        {payment.payor_company && ` (${payment.payor_company})`}
                      </p>
                      {payment.payment_details && (
                        <p className="text-xs text-muted-foreground">{payment.payment_details}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(payment.amount))}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.payment_date || payment.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
