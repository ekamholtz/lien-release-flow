import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationsSettings } from "./IntegrationsSettings";
import { AccountSettings } from "./AccountSettings";
import { NotificationsSettings } from "./NotificationsSettings";
import { SecuritySettings } from "./SecuritySettings";
import { PermissionsSettings } from "./PermissionsSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { useCompany } from "@/contexts/CompanyContext";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function SettingsTabs() {
  const { currentCompany } = useCompany();
  const { isCompanyOwner, loading } = usePermissions(currentCompany?.id);
  const [showPermissions, setShowPermissions] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const connected = params.get("connected");
  const error = params.get("error");
  const message = params.get("message");

  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    if (!loading) {
      setShowPermissions(isCompanyOwner);
    }
  }, [isCompanyOwner, loading]);

  useEffect(() => {
    if (connected === "qbo") {
      toast.success("QuickBooks connected successfully!");
      setActiveTab("integrations");
      // navigate("/settings", { replace: true }); // remove query params
    } else if (error === "qbo") {
      toast.error(message || "QuickBooks connection failed");
      setActiveTab("integrations");
      // navigate("/settings", { replace: true });
    }
  }, [connected, error, message, navigate]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
