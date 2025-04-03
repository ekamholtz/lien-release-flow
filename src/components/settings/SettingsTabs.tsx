
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IntegrationsSettings } from '@/components/settings/IntegrationsSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { NotificationsSettings } from '@/components/settings/NotificationsSettings';

export const SettingsTabs = () => {
  return (
    <Tabs defaultValue="account" className="w-full">
      <div className="overflow-x-auto">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full mb-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="account" className="space-y-4">
        <AccountSettings />
      </TabsContent>

      <TabsContent value="integrations" className="space-y-4">
        <IntegrationsSettings />
      </TabsContent>

      <TabsContent value="security" className="space-y-4">
        <SecuritySettings />
      </TabsContent>

      <TabsContent value="notifications" className="space-y-4">
        <NotificationsSettings />
      </TabsContent>
    </Tabs>
  );
};
