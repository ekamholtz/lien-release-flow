
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function usePermissions(companyId?: string) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [permissionCache, setPermissionCache] = useState<Record<string, boolean>>({});

  // Fetch the user's role in the company
  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user?.id || !companyId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('company_members')
          .select('role')
          .eq('company_id', companyId)
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
        } else {
          setRole(data?.role || null);
        }
      } catch (error) {
        console.error('Error checking role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [session, companyId]);

  // Check if the user has a specific permission using direct SQL query
  const checkPermission = useCallback(async (permissionCode: string): Promise<boolean> => {
    // If no user or company, deny permission
    if (!session?.user?.id || !companyId) {
      return false;
    }

    // If permission is already in cache, return it
    const cacheKey = `${companyId}:${permissionCode}`;
    if (permissionCache[cacheKey] !== undefined) {
      return permissionCache[cacheKey];
    }

    // Company owners have all permissions
    if (role === 'company_owner') {
      setPermissionCache(prev => ({ ...prev, [cacheKey]: true }));
      return true;
    }

    try {
      // Use a direct SQL query with type assertion to bypass TypeScript error
      const { data, error } = await supabase.rpc(
        'check_user_permission' as any, 
        {
          p_company_id: companyId,
          p_permission_code: permissionCode,
          p_user_id: session.user.id
        }
      );

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      // Cache the result
      const hasPermission = !!data;
      setPermissionCache(prev => ({ ...prev, [cacheKey]: hasPermission }));
      return hasPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }, [session, companyId, role, permissionCache]);

  // Convenience methods for common permissions
  const can = {
    manageUsers: useCallback(async () => {
      return await checkPermission('manage_users');
    }, [checkPermission]),
    
    manageIntegrations: useCallback(async () => {
      return await checkPermission('manage_integrations');
    }, [checkPermission]),
    
    viewAllProjects: useCallback(async () => {
      return await checkPermission('view_all_projects');
    }, [checkPermission]),
    
    manageAllProjects: useCallback(async () => {
      return await checkPermission('manage_all_projects');
    }, [checkPermission]),
    
    manageAssignedProjects: useCallback(async () => {
      return await checkPermission('manage_assigned_projects');
    }, [checkPermission]),
    
    createInvoices: useCallback(async () => {
      return await checkPermission('create_invoices');
    }, [checkPermission]),
    
    manageAllInvoices: useCallback(async () => {
      return await checkPermission('manage_all_invoices');
    }, [checkPermission]),
    
    createBills: useCallback(async () => {
      return await checkPermission('create_bills');
    }, [checkPermission]),
    
    manageAllBills: useCallback(async () => {
      return await checkPermission('manage_all_bills');
    }, [checkPermission]),
    
    manageCompanySettings: useCallback(async () => {
      return await checkPermission('manage_company_settings');
    }, [checkPermission]),
  };

  return {
    loading,
    role,
    checkPermission,
    isCompanyOwner: role === 'company_owner',
    isProjectManager: role === 'project_manager',
    isOfficeManager: role === 'office_manager',
    can
  };
}
