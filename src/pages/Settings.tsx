import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Building2, Wallet, ScrollText, Link, MessageCircle } from 'lucide-react';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { DepartmentSettings } from '@/components/settings/DepartmentSettings';
import { CostCenterSettings } from '@/components/settings/CostCenterSettings';
import { AuditLogs } from '@/components/settings/AuditLogs';
import { PublicFormLinks } from '@/components/settings/PublicFormLinks';
import { TelegramLinkSection } from '@/components/settings/TelegramLinkSection';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure system preferences and master data
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2">
              <Building2 className="h-4 w-4" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="cost-centers" className="gap-2">
              <Wallet className="h-4 w-4" />
              Cost Centers
            </TabsTrigger>
            <TabsTrigger value="form-links" className="gap-2">
              <Link className="h-4 w-4" />
              Form Links
            </TabsTrigger>
            <TabsTrigger value="telegram" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Telegram
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <ScrollText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>

          <TabsContent value="departments">
            <DepartmentSettings />
          </TabsContent>

          <TabsContent value="cost-centers">
            <CostCenterSettings />
          </TabsContent>

          <TabsContent value="form-links">
            <PublicFormLinks />
          </TabsContent>

          <TabsContent value="telegram">
            <TelegramLinkSection />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
