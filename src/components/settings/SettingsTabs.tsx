
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationsSettings } from "./IntegrationsSettings";
import { AccountSettings } from "./AccountSettings";
import { NotificationsSettings } from "./NotificationsSettings";
import { SecuritySettings } from "./SecuritySettings";
import { PermissionsSettings } from "./PermissionsSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompany } from "@/contexts/CompanyContext";
import { useState, useEffect } from "react";

export function SettingsTabs() {
  const { currentCompany } = useCompany();
  const { isCompanyOwner, loading } = usePermissions(currentCompany?.id);
  const [showPermissions, setShowPermissions] = useState(false);
  
  useEffect(() => {
    if (!loading) {
      setShowPermissions(isCompanyOwner);
    }
  }, [isCompanyOwner, loading]);

  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full grid-cols-4 md:grid-cols-5 mb-8">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        {showPermissions && (
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="account">
        <AccountSettings />
      </TabsContent>
      <TabsContent value="integrations">
        <IntegrationsSettings />
      </TabsContent>
      <TabsContent value="notifications">
        <NotificationsSettings />
      </TabsContent>
      <TabsContent value="security">
        <SecuritySettings />
      </TabsContent>
      {showPermissions && (
        <TabsContent value="permissions">
          <PermissionsSettings />
        </TabsContent>
      )}
    </Tabs>
  );
}
