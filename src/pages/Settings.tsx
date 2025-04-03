
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

const Settings = () => {
  return (
    <AppLayout>
      <div className="w-full p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="space-y-6 pb-10 max-w-5xl">
          <SettingsTabs />
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
