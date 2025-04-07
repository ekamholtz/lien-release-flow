
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSettings } from "./AccountSettings";
import { NotificationsSettings } from "./NotificationsSettings";
import { SecuritySettings } from "./SecuritySettings";
import { IntegrationsSettings } from "./IntegrationsSettings";
import { DocumentsTab } from "../documents/DocumentsTab";

export function SettingsTabs() {
  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-8">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      
      <TabsContent value="account">
        <AccountSettings />
      </TabsContent>
      
      <TabsContent value="security">
        <SecuritySettings />
      </TabsContent>
      
      <TabsContent value="notifications">
        <NotificationsSettings />
      </TabsContent>
      
      <TabsContent value="integrations">
        <IntegrationsSettings />
      </TabsContent>
      
      <TabsContent value="documents">
        <DocumentsTab />
      </TabsContent>
    </Tabs>
  );
}
