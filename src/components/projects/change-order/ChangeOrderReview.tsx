
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

// Using the imported formatCurrency from lib/utils

const ChangeOrderReview = ({ formData, project }: ChangeOrderReviewProps) => {
  // Calculate the new project value
  const originalValue = Number(project.value) || 0;
  const changeAmount = Number(formData.amount) || 0;
  const newProjectValue = originalValue + changeAmount;
  
  // Calculate total of milestone dollar amounts
  const totalMilestoneAmount = formData.milestones.reduce(
    (sum, m) => sum + (typeof m.amount === 'number' ? m.amount : Number(m.amount) || 0), 
    0
  );
  
  // For backward compatibility, still calculate the percentage
  const totalMilestonePercentage = formData.milestones.reduce(
    (sum, m) => sum + (m.percentage || 0), 
    0
  );
  
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
            <p className="text-muted-foreground italic">No milestones defined.</p>
          ) : (
            <>
              <div className="mb-4">
                <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground mb-2">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Percentage</div>
                  <div className="col-span-3">Amount</div>
                  <div className="col-span-2">Status</div>
                </div>
                
                {/* Display completed milestones first */}
                {formData.milestones.filter(m => m.status === 'completed').length > 0 && (
                  <>
                    <p className="text-sm font-medium mb-2">Completed Milestones</p>
                    <div className="space-y-2 mb-4">
                      {formData.milestones
                        .filter(milestone => milestone.status === 'completed')
                        .map((milestone, index) => (
                          <div key={`completed-${index}`} className="grid grid-cols-12 gap-4 py-2 border-b bg-gray-50">
                            <div className="col-span-5">
                              {milestone.name}
                              {milestone.description && (
                                <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                              )}
                            </div>
                            <div className="col-span-2">{milestone.percentage}%</div>
                            <div className="col-span-3">{formatCurrency(milestone.amount)}</div>
                            <div className="col-span-2 capitalize text-green-600">{milestone.status}</div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
                
                {/* Display pending milestones */}
                {formData.milestones.filter(m => m.status === 'pending').length > 0 && (
                  <>
                    <p className="text-sm font-medium mb-2">Pending Milestones</p>
                    <div className="space-y-2">
                      {formData.milestones
                        .filter(milestone => milestone.status === 'pending')
                        .map((milestone, index) => (
                          <div key={`pending-${index}`} className="grid grid-cols-12 gap-4 py-2 border-b">
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
                  </>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-2 font-medium">
                <span>Total Milestone Amount:</span>
                <span className={Math.abs(totalMilestoneAmount - newProjectValue) <= 0.01 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(totalMilestoneAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>New Project Value:</span>
                <span>
                  {formatCurrency(newProjectValue)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Warning if total amount does not match new project value */}
      {Math.abs(totalMilestoneAmount - newProjectValue) > 0.01 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 font-medium">Warning</p>
          <p className="text-sm text-red-600">
            The total milestone amount ({formatCurrency(totalMilestoneAmount)}) must equal the new project value ({formatCurrency(newProjectValue)}).
            Please go back and adjust your milestones to reach the correct total.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChangeOrderReview;
