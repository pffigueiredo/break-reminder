
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  BreakReminderConfig, 
  BreakNotification,
  CreateBreakReminderConfigInput,
  UpdateBreakReminderConfigInput
} from '../../server/src/schema';

function App() {
  // STUB NOTE: Using hardcoded user_id since no authentication system is implemented
  const currentUserId = 'user123';
  
  const [config, setConfig] = useState<BreakReminderConfig | null>(null);
  const [notifications, setNotifications] = useState<BreakNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  
  // Form state for configuration
  const [formData, setFormData] = useState<{
    interval_minutes: number;
    is_active: boolean;
  }>({
    interval_minutes: 60,
    is_active: true
  });

  // Timer reference for break reminders - using number type for browser compatibility
  const timerRef = useRef<number | null>(null);
  const lastNotificationTime = useRef<Date | null>(null);

  // Load user configuration
  const loadConfig = useCallback(async () => {
    try {
      const result = await trpc.getUserConfig.query({ user_id: currentUserId });
      setConfig(result);
      if (result) {
        setFormData({
          interval_minutes: result.interval_minutes,
          is_active: result.is_active
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setIsConfigLoading(false);
    }
  }, []);

  // Load user notifications
  const loadNotifications = useCallback(async () => {
    try {
      const result = await trpc.getUserNotifications.query({ 
        user_id: currentUserId,
        include_dismissed: false // Only show active notifications
      });
      setNotifications(result);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  // Create break notification
  const createNotification = useCallback(async () => {
    try {
      const notification = await trpc.createBreakNotification.mutate({
        user_id: currentUserId,
        message: '🎯 Time for a break! Step away from your screen and recharge.'
      });
      setNotifications(prev => [...prev, notification]);
      lastNotificationTime.current = new Date();
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }, []);

  // Dismiss notification
  const dismissNotification = async (notificationId: number) => {
    try {
      await trpc.dismissNotification.mutate({ id: notificationId });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  // Setup break reminder timer
  const setupTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    if (config && config.is_active) {
      const intervalMs = config.interval_minutes * 60 * 1000;
      
      timerRef.current = window.setInterval(() => {
        createNotification();
      }, intervalMs);
    }
  }, [config, createNotification]);

  // Initialize data loading
  useEffect(() => {
    loadConfig();
    loadNotifications();
  }, [loadConfig, loadNotifications]);

  // Setup timer when config changes
  useEffect(() => {
    setupTimer();
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [setupTimer]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (config) {
        // Update existing config
        const updateData: UpdateBreakReminderConfigInput = {
          id: config.id,
          interval_minutes: formData.interval_minutes,
          is_active: formData.is_active
        };
        const updatedConfig = await trpc.updateBreakReminderConfig.mutate(updateData);
        setConfig(updatedConfig);
      } else {
        // Create new config
        const createData: CreateBreakReminderConfigInput = {
          user_id: currentUserId,
          interval_minutes: formData.interval_minutes,
          is_active: formData.is_active
        };
        const newConfig = await trpc.createBreakReminderConfig.mutate(createData);
        setConfig(newConfig);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get next break time
  const getNextBreakTime = () => {
    if (!config || !config.is_active) return null;
    
    const baseTime = lastNotificationTime.current || new Date();
    const nextBreak = new Date(baseTime.getTime() + (config.interval_minutes * 60 * 1000));
    return nextBreak;
  };

  const nextBreakTime = getNextBreakTime();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎯 Break Reminder
          </h1>
          <p className="text-gray-600 text-lg">
            Stay healthy and productive with regular break reminders
          </p>
        </div>

        {/* Active Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {notifications.map((notification: BreakNotification) => (
              <Alert key={notification.id} className="border-orange-200 bg-orange-50">
                <div className="flex items-center justify-between">
                  <div>
                    <AlertTitle className="text-orange-800">Break Time! 🎉</AlertTitle>
                    <AlertDescription className="text-orange-700">
                      {notification.message}
                    </AlertDescription>
                    <p className="text-xs text-orange-600 mt-1">
                      {notification.created_at.toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => dismissNotification(notification.id)}
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Dismiss
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Configuration Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚙️ Break Settings
              </CardTitle>
              <CardDescription>
                Configure your break reminder preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isConfigLoading ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">Loading configuration...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="interval">Break Interval (minutes)</Label>
                    <Input
                      id="interval"
                      type="number"
                      min="1"
                      max="1440"
                      value={formData.interval_minutes}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData(prev => ({ 
                          ...prev, 
                          interval_minutes: parseInt(e.target.value) || 60 
                        }))
                      }
                      className="text-lg"
                      required
                    />
                    <p className="text-sm text-gray-500">
                      How often you want to be reminded (1-1440 minutes)
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="active">Enable Reminders</Label>
                      <p className="text-sm text-gray-500">
                        Turn break reminders on or off
                      </p>
                    </div>
                    <Switch
                      id="active"
                      checked={formData.is_active}
                      onCheckedChange={(checked: boolean) =>
                        setFormData(prev => ({ ...prev, is_active: checked }))
                      }
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? 'Saving...' : (config ? 'Update Settings' : 'Create Settings')}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Current Status
              </CardTitle>
              <CardDescription>
                Your break reminder status and schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!config ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">🚫 No configuration found</p>
                  <p className="text-sm text-gray-400">
                    Create your break reminder settings to get started
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? "🟢 Active" : "🔴 Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Interval:</span>
                    <span className="text-sm text-gray-600">
                      {config.interval_minutes} minutes
                    </span>
                  </div>

                  <Separator />

                  {config.is_active && nextBreakTime ? (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        ⏰ Next Break:
                      </p>
                      <p className="text-blue-700">
                        {nextBreakTime.toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {nextBreakTime.toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        ⏸️ No breaks scheduled
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Created: {config.created_at.toLocaleDateString()}</p>
                    <p>Updated: {config.updated_at.toLocaleDateString()}</p>
                  </div>
                </>
              )}
            </CardContent>
            {config && (
              <CardFooter>
                <Button
                  onClick={createNotification}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  🧪 Test Reminder
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Tips Section */}
        <Card className="mt-6 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              💡 Break Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-green-700">
              <div className="space-y-2">
                <p>• 👀 Look away from your screen</p>
                <p>• 🚶 Take a short walk</p>
                <p>• 💧 Drink some water</p>
              </div>
              <div className="space-y-2">
                <p>• 🧘 Do some stretches</p>
                <p>• 👁️ Practice the 20-20-20 rule</p>
                <p>• 🌿 Get some fresh air</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* STUB Notice */}
        <Card className="mt-4 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <p className="text-xs text-yellow-700">
              <strong>Note:</strong> This application uses stub backend implementations. 
              Notifications are simulated and won't persist between sessions. 
              User authentication is mocked with a hardcoded user ID.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
