
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedSyncDashboard } from "./EnhancedSyncDashboard";
import { QboSyncStatus } from "@/components/payments/QboSyncStatus";
import { useQboConnectionStatus } from "@/hooks/qbo/useQboConnectionStatus";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function QboSyncDashboard() {
  const { connectionStatus, isLoading: connectionLoading } = useQboConnectionStatus();

  const getConnectionStatusBadge = () => {
    if (connectionLoading) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking...
        </Badge>
      );
    }

    if (connectionStatus.isConnected) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Connected
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Disconnected
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                QuickBooks Online Integration
                {getConnectionStatusBadge()}
              </CardTitle>
              <CardDescription>
                Monitor and manage QBO sync operations for your accounting data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!connectionStatus.isConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">
                  QuickBooks Online connection required
                </p>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Connect your QBO account in Settings → Integrations to enable sync functionality.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <EnhancedSyncDashboard />
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Sync Status</CardTitle>
              <CardDescription>
                Individual entity sync status and manual sync controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QboSyncStatus />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
