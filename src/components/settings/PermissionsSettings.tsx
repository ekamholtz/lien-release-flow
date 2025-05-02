
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
        // Use raw SQL query to fetch permissions since TypeScript doesn't know about this table yet
        const { data: permissionsData, error: permissionsError } = await supabase
          .rpc('get_all_permissions');
          
        if (permissionsError) throw permissionsError;
        
        // Use raw SQL query to fetch project manager permissions
        const { data: pmPermissions, error: pmError } = await supabase
          .rpc('get_role_permissions', { 
            p_company_id: currentCompany.id, 
            p_role: 'project_manager'
          });
          
        if (pmError) throw pmError;
        
        // Use raw SQL query to fetch office manager permissions
        const { data: omPermissions, error: omError } = await supabase
          .rpc('get_role_permissions', { 
            p_company_id: currentCompany.id, 
            p_role: 'office_manager'
          });
          
        if (omError) throw omError;
        
        // Type cast the data
        const typedPermissions = permissionsData as unknown as Permission[];
        const typedPmPermissions = pmPermissions as unknown as { permission_id: string }[];
        const typedOmPermissions = omPermissions as unknown as { permission_id: string }[];
        
        setPermissions(typedPermissions);
        setRolePermissions({
          project_manager: typedPmPermissions?.map(p => p.permission_id) || [],
          office_manager: typedOmPermissions?.map(p => p.permission_id) || []
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
      // Call the RPC function to save role permissions
      const { error } = await supabase.rpc('save_role_permissions', {
        p_company_id: currentCompany.id,
        p_role: activeRole,
        p_permission_ids: rolePermissions[activeRole]
      });
      
      if (error) throw error;
      
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
