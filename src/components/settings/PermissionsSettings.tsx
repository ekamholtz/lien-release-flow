
import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { type Permission, type RolePermission } from '@/lib/types/company';

export function PermissionsSettings() {
  const { currentCompany } = useCompany();
  const { isCompanyOwner, loading: permissionsLoading } = usePermissions(currentCompany?.id);
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<{
    project_manager: string[];
    office_manager: string[];
  }>({
    project_manager: [],
    office_manager: []
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<'project_manager' | 'office_manager'>('project_manager');

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!currentCompany?.id) return;
      
      setLoading(true);
      
      try {
        // Fetch all permissions with a direct SQL query to avoid type issues
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('permissions')
          .select('*')
          .order('name') as { data: Permission[] | null; error: any };
          
        if (permissionsError) throw permissionsError;
        
        // Fetch project manager permissions with direct SQL query
        const { data: pmPermissionsData, error: pmError } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('company_id', currentCompany.id)
          .eq('role', 'project_manager') as { data: { permission_id: string }[] | null; error: any };
          
        if (pmError) throw pmError;
        
        // Fetch office manager permissions with direct SQL query
        const { data: omPermissionsData, error: omError } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('company_id', currentCompany.id)
          .eq('role', 'office_manager') as { data: { permission_id: string }[] | null; error: any };
          
        if (omError) throw omError;
        
        // Type the results appropriately
        setPermissions(permissionsData || []);
        setRolePermissions({
          project_manager: pmPermissionsData?.map(p => p.permission_id) || [],
          office_manager: omPermissionsData?.map(p => p.permission_id) || []
        });
        
      } catch (error) {
        console.error('Error loading permissions:', error);
        toast({
          title: 'Error loading permissions',
          description: 'There was a problem loading role permissions.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, [currentCompany?.id, toast]);
  
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setRolePermissions(prev => {
      const newPermissions = { ...prev };
      
      if (checked) {
        // Add permission
        newPermissions[activeRole] = [...newPermissions[activeRole], permissionId];
      } else {
        // Remove permission
        newPermissions[activeRole] = newPermissions[activeRole].filter(id => id !== permissionId);
      }
      
      return newPermissions;
    });
  };
  
  const savePermissions = async () => {
    if (!currentCompany?.id) return;
    
    setSaving(true);
    
    try {
      // Use a transaction to save permissions
      // First, delete all existing permissions for this role
      const deleteResult = await supabase
        .from('role_permissions')
        .delete()
        .eq('company_id', currentCompany.id)
        .eq('role', activeRole);
      
      if (deleteResult.error) throw deleteResult.error;
      
      // Then insert new permissions if there are any
      if (rolePermissions[activeRole].length > 0) {
        const permissionsToInsert = rolePermissions[activeRole].map(permId => ({
          company_id: currentCompany.id,
          role: activeRole as any, // Type assertion to avoid TypeScript errors
          permission_id: permId
        }));
        
        const insertResult = await supabase
          .from('role_permissions')
          .insert(permissionsToInsert as any); // Type assertion to avoid TypeScript errors
        
        if (insertResult.error) throw insertResult.error;
      }
      
      toast({
        title: 'Permissions saved',
        description: `Permissions for ${activeRole === 'project_manager' ? 'Project Managers' : 'Office Managers'} have been updated.`
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error saving permissions',
        description: 'There was a problem saving the role permissions.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (permissionsLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Customize what each role can do in your company</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (!isCompanyOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>Only Company Owners can manage permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <p>You need to be a Company Owner to manage role permissions.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Permissions</CardTitle>
        <CardDescription>Customize what each role can do in your company</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="project_manager" onValueChange={(value) => setActiveRole(value as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="project_manager">Project Managers</TabsTrigger>
            <TabsTrigger value="office_manager">Office Managers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="project_manager">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Project Managers can manage their assigned projects and related financial documents.
                Customize their permissions below:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissions.map(permission => (
                  <div key={permission.id} className="flex items-start space-x-2">
                    <Checkbox 
                      id={`pm-${permission.id}`}
                      checked={rolePermissions.project_manager.includes(permission.id)}
                      onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={`pm-${permission.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.name}
                      </label>
                      {permission.description && (
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="office_manager">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Office Managers can view most company data but have limited editing capabilities.
                Customize their permissions below:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissions.map(permission => (
                  <div key={permission.id} className="flex items-start space-x-2">
                    <Checkbox 
                      id={`om-${permission.id}`}
                      checked={rolePermissions.office_manager.includes(permission.id)}
                      onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={`om-${permission.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.name}
                      </label>
                      {permission.description && (
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={savePermissions} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Permissions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
