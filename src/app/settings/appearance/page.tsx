"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor,
  Eye,
  Layout,
  Type,
  Image,
  Save,
  RefreshCw,
  Download,
  Upload,
  RotateCcw
} from "lucide-react";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  layout: 'compact' | 'comfortable' | 'spacious';
  sidebarCollapsed: boolean;
  showAnimations: boolean;
  customLogo: string | null;
  customFavicon: string | null;
}

export default function AppearancePage() {
  const { user, isSuperAdmin, isAdmin, loading } = useUser();
  const router = useRouter();
  
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'system',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    fontFamily: 'Inter',
    fontSize: 'medium',
    layout: 'comfortable',
    sidebarCollapsed: false,
    showAnimations: true,
    customLogo: null,
    customFavicon: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!isSuperAdmin && !isAdmin) {
      toast.error("You don't have permission to access this page");
      router.push('/dashboard');
      return;
    }
    
    fetchAppearanceSettings();
  }, [loading, user, router]);

  const fetchAppearanceSettings = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement real API call
      // const response = await fetch('/api/settings/appearance');
      // const data = await response.json();
      // setSettings(data);
      
      // Mock data for now
      toast.success('Appearance settings loaded');
      
    } catch (error) {
      console.error('Error fetching appearance settings:', error);
      toast.error('Failed to load appearance settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      // TODO: Implement real API call
      // await fetch('/api/settings/appearance', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings)
      // });
      
      setHasUnsavedChanges(false);
      toast.success('Appearance settings saved successfully');
      
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      toast.error('Failed to save appearance settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      theme: 'system',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      fontSize: 'medium',
      layout: 'comfortable',
      sidebarCollapsed: false,
      showAnimations: true,
      customLogo: null,
      customFavicon: null
    });
    setHasUnsavedChanges(true);
    toast.info('Settings reset to defaults');
  };

  const updateSettings = (updates: Partial<AppearanceSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="px-6 py-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="px-6 py-4">
        <PageHeader
          title="Appearance Settings"
          subtitle="Customize the look and feel of the system"
          breadcrumbs={[
            { label: "Settings", href: "/settings" },
            { label: "Appearance" }
          ]}
        />
      </div>

      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Palette className="text-blue-500 w-5 h-5" />}
            label="Current Theme"
            value={settings.theme === 'system' ? 'System' : settings.theme === 'light' ? 'Light' : 'Dark'}
            valueClassName="text-blue-900"
            sublabel="Active theme"
          />
          <SummaryCard
            icon={<Type className="text-green-500 w-5 h-5" />}
            label="Font Family"
            value={settings.fontFamily}
            valueClassName="text-green-900"
            sublabel="Typography"
          />
          <SummaryCard
            icon={<Layout className="text-purple-500 w-5 h-5" />}
            label="Layout"
            value={settings.layout.charAt(0).toUpperCase() + settings.layout.slice(1)}
            valueClassName="text-purple-900"
            sublabel="Interface layout"
          />
          <SummaryCard
            icon={<Eye className="text-orange-500 w-5 h-5" />}
            label="Animations"
            value={settings.showAnimations ? 'Enabled' : 'Disabled'}
            valueClassName="text-orange-900"
            sublabel="Visual effects"
          />
        </div>

        {/* Quick Actions */}
        <QuickActionsPanel
          variant="premium"
          title="Appearance Actions"
          subtitle="Manage system appearance and themes"
          icon={<Palette className="w-6 h-6 text-white" />}
          actionCards={[
            {
              id: 'save-settings',
              label: 'Save Settings',
              description: 'Save current appearance settings',
              icon: <Save className="w-5 h-5 text-white" />,
              onClick: handleSaveSettings,
              disabled: !hasUnsavedChanges || isSaving,
              loading: isSaving
            },
            {
              id: 'reset-settings',
              label: 'Reset to Defaults',
              description: 'Restore default appearance',
              icon: <RotateCcw className="w-5 h-5 text-white" />,
              onClick: handleResetSettings
            },
            {
              id: 'export-theme',
              label: 'Export Theme',
              description: 'Download theme configuration',
              icon: <Download className="w-5 h-5 text-white" />,
              onClick: () => toast.info('Export theme functionality coming soon')
            },
            {
              id: 'import-theme',
              label: 'Import Theme',
              description: 'Upload theme configuration',
              icon: <Upload className="w-5 h-5 text-white" />,
              onClick: () => toast.info('Import theme functionality coming soon')
            }
          ]}
          lastActionTime="5 minutes ago"
          onLastActionTimeChange={() => {}}
          collapsible={true}
          defaultCollapsed={true}
        />

        {/* Main Settings */}
        <Card className="shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardTitle>Appearance Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="theme" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="theme">Theme</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="typography">Typography</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="theme" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme Mode</Label>
                    <Select value={settings.theme} onValueChange={(value) => updateSettings({ theme: value as any })}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            Dark
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            System
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="animations">Show Animations</Label>
                      <p className="text-sm text-gray-600">Enable smooth transitions and animations</p>
                    </div>
                    <Switch
                      id="animations"
                      checked={settings.showAnimations}
                      onCheckedChange={(checked) => updateSettings({ showAnimations: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sidebar">Collapse Sidebar by Default</Label>
                      <p className="text-sm text-gray-600">Start with sidebar collapsed</p>
                    </div>
                    <Switch
                      id="sidebar"
                      checked={settings.sidebarCollapsed}
                      onCheckedChange={(checked) => updateSettings({ sidebarCollapsed: checked })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="colors" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="primary">Primary Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="primary"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary">Secondary Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="secondary"
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={settings.secondaryColor}
                        onChange={(e) => updateSettings({ secondaryColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accent">Accent Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="accent"
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => updateSettings({ accentColor: e.target.value })}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={settings.accentColor}
                        onChange={(e) => updateSettings({ accentColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Color Preview</h4>
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: settings.primaryColor }}
                      title="Primary"
                    ></div>
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: settings.secondaryColor }}
                      title="Secondary"
                    ></div>
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: settings.accentColor }}
                      title="Accent"
                    ></div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="typography" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fontFamily">Font Family</Label>
                    <Select value={settings.fontFamily} onValueChange={(value) => updateSettings({ fontFamily: value })}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select value={settings.fontSize} onValueChange={(value) => updateSettings({ fontSize: value as any })}>
                      <SelectTrigger className="w-full mt-2">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Typography Preview</h4>
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold" style={{ fontFamily: settings.fontFamily }}>
                      Heading 1 - The quick brown fox
                    </h1>
                    <h2 className="text-xl font-semibold" style={{ fontFamily: settings.fontFamily }}>
                      Heading 2 - The quick brown fox
                    </h2>
                    <p className="text-base" style={{ fontFamily: settings.fontFamily }}>
                      Body text - The quick brown fox jumps over the lazy dog
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: settings.fontFamily }}>
                      Small text - The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-6 mt-6">
                <div>
                  <Label htmlFor="layout">Layout Density</Label>
                  <Select value={settings.layout} onValueChange={(value) => updateSettings({ layout: value as any })}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Select layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">
                    {settings.layout === 'compact' && 'Tighter spacing for more content'}
                    {settings.layout === 'comfortable' && 'Balanced spacing for optimal readability'}
                    {settings.layout === 'spacious' && 'Larger spacing for better accessibility'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Layout Preview</h4>
                  <div className={`space-y-2 ${settings.layout === 'compact' ? 'space-y-1' : settings.layout === 'spacious' ? 'space-y-4' : 'space-y-2'}`}>
                    <div className="p-2 bg-white rounded border">Compact item</div>
                    <div className="p-2 bg-white rounded border">Another item</div>
                    <div className="p-2 bg-white rounded border">Third item</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span>Unsaved changes</span>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleResetSettings}
                  disabled={isSaving}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={isSaving || !hasUnsavedChanges}
                  className={hasUnsavedChanges ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
