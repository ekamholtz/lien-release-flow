
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface Milestone {
  id?: string;
  name: string;
  percentage: number;
  amount: number;
  description?: string;
  status: 'pending' | 'completed';
}

interface ChangeOrderReviewProps {
  formData: {
    description: string;
    amount: number;
    milestones: Milestone[];
  };
  project: any;
}

const ChangeOrderReview = ({ formData, project }: ChangeOrderReviewProps) => {
  const newProjectValue = project.value + formData.amount;
  const totalMilestonePercentage = formData.milestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Review Change Order</h2>
      <p className="text-muted-foreground">
        Please review the details of your change order before submitting.
      </p>
      
      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <div className="col-span-2">
              <dt className="text-sm font-medium text-muted-foreground">Project Name</dt>
              <dd className="mt-1">{project.name}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Original Value</dt>
              <dd className="mt-1">{formatCurrency(project.value)}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Current Status</dt>
              <dd className="mt-1 capitalize">{project.status.replace(/_/g, ' ')}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      {/* Change Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Change Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
            <div className="col-span-2">
              <dt className="text-sm font-medium text-muted-foreground">Description</dt>
              <dd className="mt-1">{formData.description || 'No description provided'}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Change Amount</dt>
              <dd className="mt-1">
                <span className={formData.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formData.amount >= 0 ? '+' : ''}{formatCurrency(formData.amount)}
                </span>
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-muted-foreground">New Project Value</dt>
              <dd className="mt-1 font-bold">{formatCurrency(newProjectValue)}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Date</dt>
              <dd className="mt-1">{format(new Date(), 'PPP')}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      {/* Milestone Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle>Milestone Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          {formData.milestones.length === 0 ? (
            <p className="text-muted-foreground italic">No pending milestones defined.</p>
          ) : (
            <>
              <div className="mb-4">
                <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground mb-2">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Percentage</div>
                  <div className="col-span-3">Amount</div>
                  <div className="col-span-2">Status</div>
                </div>
                
                <div className="space-y-2">
                  {formData.milestones.map((milestone, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 py-2 border-b">
                      <div className="col-span-5">
                        {milestone.name}
                        {milestone.description && (
                          <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                      </div>
                      <div className="col-span-2">{milestone.percentage}%</div>
                      <div className="col-span-3">{formatCurrency(milestone.amount)}</div>
                      <div className="col-span-2 capitalize">{milestone.status}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 font-medium">
                <span>Total Percentage:</span>
                <span className={totalMilestonePercentage === 100 ? 'text-green-600' : 'text-red-600'}>
                  {totalMilestonePercentage}%
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Warning if total percentage is not 100% */}
      {totalMilestonePercentage !== 100 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 font-medium">Warning</p>
          <p className="text-sm text-red-600">
            The total milestone percentage must equal 100% before you can submit this change order.
            Please go back and adjust your milestones.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChangeOrderReview;
