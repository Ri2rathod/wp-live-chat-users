import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Separator } from "./components/ui/separator";
import { 
  Settings, 
  Database, 
  Key, 
  Server, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Users,
  MessageSquare,
  Wifi,
  Loader2
} from "lucide-react";
import { toast, Toaster } from "sonner";

interface ServerStatus {
  status: 'checking' | 'online' | 'offline' | null;
  connections?: number;
  activeUsers?: number;
  timestamp?: string;
}

interface Migration {
  plugin: string;
  name: string;
  status: 'pending' | 'completed' | 'failed';
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface Settings {
  socketUrl: string;
  typingIndicators: boolean;
  readReceipts: boolean;
  presenceStatus: boolean;
  apiKey: string;
  apiEnabled: boolean;
  apiUser: string;
}

export default function AdminSettings() {
  // State
  const [settings, setSettings] = useState<Settings>({
    socketUrl: "http://localhost:3001",
    typingIndicators: true,
    readReceipts: true,
    presenceStatus: true,
    apiKey: "",
    apiEnabled: true,
    apiUser: "1"
  });
  
  const [serverStatus, setServerStatus] = useState<ServerStatus>({ status: null });
  const [showApiKey, setShowApiKey] = useState(false);
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helper to make API requests
  const makeApiRequest = async (endpoint: string, method = 'GET', data?: any) => {
    const url = `${(window as any).wpApiSettings.root}chatpulse-chat/v1/${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': (window as any).wpApiSettings.nonce
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadUsers();
    loadMigrations();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await makeApiRequest('admin/settings');
      setSettings({
        socketUrl: data.socketUrl || "http://localhost:3001",
        typingIndicators: data.typingIndicators !== false,
        readReceipts: data.readReceipts !== false,
        presenceStatus: data.presenceStatus !== false,
        apiKey: data.apiKey || "",
        apiEnabled: data.apiEnabled !== false,
        apiUser: data.apiUser || "1"
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await makeApiRequest('users?per_page=100&role=administrator');
      setUsers(data.map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email
      })));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadMigrations = async () => {
    try {
      const data = await makeApiRequest('admin/migrations');
      setMigrations(data.migrations || []);
    } catch (error) {
      console.error('Failed to load migrations:', error);
    }
  };

  const checkServerStatus = async () => {
    setServerStatus({ status: 'checking' });
    
    try {
      const response = await fetch(`${settings.socketUrl}/health`);
      const data = await response.json();
      
      setServerStatus({
        status: 'online',
        connections: data.connections || 0,
        activeUsers: data.activeUsers || 0,
        timestamp: new Date().toLocaleString()
      });
      toast.success("Server is online and responding");
    } catch (error) {
      setServerStatus({ status: 'offline' });
      toast.error("Server is not accessible");
    }
  };

  const generateApiKey = async () => {
    try {
      const data = await makeApiRequest('admin/api-key/generate', 'POST');
      setSettings({ ...settings, apiKey: data.apiKey });
      toast.success("New API key generated successfully");
    } catch (error) {
      toast.error("Failed to generate API key");
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(settings.apiKey);
    toast.success("API key copied to clipboard");
  };

  const runMigrations = async () => {
    try {
      setLoading(true);
      await makeApiRequest('admin/migrations/run', 'POST');
      await loadMigrations();
      toast.success("Migrations completed successfully!");
    } catch (error) {
      toast.error("Failed to run migrations");
    } finally {
      setLoading(false);
    }
  };

  const rollbackMigrations = async () => {
    try {
      setLoading(true);
      await makeApiRequest('admin/migrations/rollback', 'POST');
      await loadMigrations();
      toast.success("Migrations rolled back successfully!");
    } catch (error) {
      toast.error("Failed to rollback migrations");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await makeApiRequest('admin/settings', 'POST', settings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings.apiKey) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            WP Live Chat Settings
          </h1>
          <p className="text-muted-foreground">
            Configure your live chat system, manage database migrations, and API settings
          </p>
        </div>

        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Chat Settings
            </TabsTrigger>
            <TabsTrigger value="migrations" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Settings
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Server Status
            </TabsTrigger>
          </TabsList>

          {/* Chat Settings Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Chat Settings</CardTitle>
                <CardDescription>
                  Configure the basic settings for your live chat system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="socket-url">Socket Server URL</Label>
                  <Input
                    id="socket-url"
                    value={settings.socketUrl}
                    onChange={(e) => setSettings({ ...settings, socketUrl: e.target.value })}
                    placeholder="http://localhost:3001"
                  />
                  <p className="text-sm text-muted-foreground">
                    URL of the Socket.IO server for real-time communication
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Chat Features</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Typing Indicators</Label>
                      <p className="text-sm text-muted-foreground">
                        Show when users are typing messages
                      </p>
                    </div>
                    <Switch
                      checked={settings.typingIndicators}
                      onCheckedChange={(checked) => setSettings({ ...settings, typingIndicators: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Read Receipts</Label>
                      <p className="text-sm text-muted-foreground">
                        Show read receipts for messages
                      </p>
                    </div>
                    <Switch
                      checked={settings.readReceipts}
                      onCheckedChange={(checked) => setSettings({ ...settings, readReceipts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Presence Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Show user online/offline status
                      </p>
                    </div>
                    <Switch
                      checked={settings.presenceStatus}
                      onCheckedChange={(checked) => setSettings({ ...settings, presenceStatus: checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Migrations Tab */}
          <TabsContent value="migrations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Migration Actions</CardTitle>
                  <CardDescription>
                    Manage your database migrations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full" 
                    onClick={runMigrations}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
                    Run Migrations
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={rollbackMigrations}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Rollback Migrations
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Tables</CardTitle>
                  <CardDescription>
                    Tables that will be created
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>• <code className="text-xs">wp_chatpulse_message_threads</code> - Chat threads</div>
                    <div>• <code className="text-xs">wp_chatpulse_messages</code> - Individual messages</div>
                    <div>• <code className="text-xs">wp_chatpulse_message_attachments</code> - File attachments</div>
                    <div>• <code className="text-xs">wp_chatpulse_message_read_receipts</code> - Read receipts</div>
                    <div>• <code className="text-xs">wp_chatpulse_message_participants</code> - Thread participants</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Migration Status</CardTitle>
                <CardDescription>
                  Current status of database migrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {migrations.length > 0 ? migrations.map((migration, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm font-medium">{migration.plugin}</div>
                        <code className="text-xs text-muted-foreground">{migration.name}</code>
                      </div>
                      <Badge variant={migration.status === 'completed' ? 'default' : migration.status === 'failed' ? 'destructive' : 'outline'}>
                        {migration.status}
                      </Badge>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No migrations found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Manage API access and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable API Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow external API access (required for Socket.IO server)
                    </p>
                  </div>
                  <Switch
                    checked={settings.apiEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, apiEnabled: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-user">API User</Label>
                  <Select value={settings.apiUser} onValueChange={(value) => setSettings({ ...settings, apiUser: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {user.name} ({user.email})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    User account for API access (should have admin privileges)
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">API Key Management</h3>
                    <Button onClick={generateApiKey} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate New Key
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Current API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={showApiKey ? settings.apiKey : "•".repeat(settings.apiKey.length)}
                        className="font-mono text-sm"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={copyApiKey}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Instructions</CardTitle>
                <CardDescription>
                  How to use the API key in your integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    <strong>API Endpoint:</strong> {(window as any).wpApiSettings.root}chatpulse-chat/v1/
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-semibold">Authentication Methods:</h4>
                  <div className="space-y-2 text-sm">
                    <div>• <strong>Header:</strong> <code className="text-xs">X-Chatpulse-API-Key: YOUR_API_KEY</code></div>
                    <div>• <strong>Query Parameter:</strong> <code className="text-xs">?api_key=YOUR_API_KEY</code></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Socket.IO Server Environment Variables:</h4>
                  <div className="bg-muted p-3 rounded-lg font-mono text-xs overflow-x-auto">
                    <div>WP_API_KEY={settings.apiKey}</div>
                    <div>WP_BASE_URL={(window as any).wpApiSettings.root.replace('/wp-json/', '')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Server Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Server Status
                </CardTitle>
                <CardDescription>
                  Monitor your Socket.IO server health and connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={checkServerStatus}
                    disabled={serverStatus.status === 'checking'}
                  >
                    {serverStatus.status === 'checking' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4 mr-2" />
                    )}
                    Check Server Status
                  </Button>
                </div>

                {serverStatus.status && (
                  <Card>
                    <CardContent className="pt-6">
                      {serverStatus.status === 'checking' && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Checking server status...
                        </div>
                      )}

                      {serverStatus.status === 'online' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            Server is online and responding
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Connections</div>
                              <div className="text-2xl font-bold">{serverStatus.connections}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Active Users</div>
                              <div className="text-2xl font-bold">{serverStatus.activeUsers}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Last Check</div>
                              <div className="text-sm">{serverStatus.timestamp}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {serverStatus.status === 'offline' && (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-5 w-5" />
                          Server is not accessible
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Alert>
                  <Server className="h-4 w-4" />
                  <AlertDescription>
                    Make sure your Socket.IO server is running on <strong>{settings.socketUrl}</strong> and accessible from this domain.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
