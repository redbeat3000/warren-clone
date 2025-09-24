import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MoonIcon, 
  SunIcon, 
  ComputerDesktopIcon,
  BellIcon,
  LanguageIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface PreferencesDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function PreferencesDialog({ open, onClose }: PreferencesDialogProps) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = React.useState({
    language: 'en',
    timezone: 'Africa/Nairobi',
    notifications: true,
    emailNotifications: true,
    soundEffects: true,
    autoSave: true,
    compactMode: false,
  });

  const handleSavePreferences = () => {
    // Save preferences to localStorage or backend
    localStorage.setItem('preferences', JSON.stringify(preferences));
    
    toast({
      title: "Success",
      description: "Preferences saved successfully",
    });
    
    onClose();
  };

  // Load preferences on mount
  React.useEffect(() => {
    const savedPrefs = localStorage.getItem('preferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preferences</DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Theme Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center">
              <SunIcon className="h-4 w-4 mr-2" />
              Appearance
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Theme</label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center space-x-2">
                        <SunIcon className="h-4 w-4" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center space-x-2">
                        <MoonIcon className="h-4 w-4" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Compact Mode</label>
                  <p className="text-xs text-muted-foreground">Use smaller spacing and elements</p>
                </div>
                <Switch 
                  checked={preferences.compactMode}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, compactMode: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Language & Region */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center">
              <LanguageIcon className="h-4 w-4 mr-2" />
              Language & Region
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Language</label>
                <Select 
                  value={preferences.language} 
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Timezone</label>
                <Select 
                  value={preferences.timezone} 
                  onValueChange={(value) => 
                    setPreferences(prev => ({ ...prev, timezone: value }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Nairobi">Nairobi (GMT+3)</SelectItem>
                    <SelectItem value="Africa/Lagos">Lagos (GMT+1)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center">
              <BellIcon className="h-4 w-4 mr-2" />
              Notifications
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Push Notifications</label>
                  <p className="text-xs text-muted-foreground">Receive notifications in the app</p>
                </div>
                <Switch 
                  checked={preferences.notifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, notifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Email Notifications</label>
                  <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch 
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Sound Effects</label>
                  <p className="text-xs text-muted-foreground">Play sounds for actions</p>
                </div>
                <Switch 
                  checked={preferences.soundEffects}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, soundEffects: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* App Behavior */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center">
              <ClockIcon className="h-4 w-4 mr-2" />
              App Behavior
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto Save</label>
                  <p className="text-xs text-muted-foreground">Automatically save form data</p>
                </div>
                <Switch 
                  checked={preferences.autoSave}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, autoSave: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}