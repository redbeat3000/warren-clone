import { motion } from "framer-motion";
import { Bell, Settings, User, LogOut, Check, Clock, AlertCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";


interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { authUser, signOut, isAdmin, getProfilePicture } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSettingsClick = () => {
    window.dispatchEvent(new CustomEvent('navigate-to-section', { detail: 'settings' }));
  };

  // Sample notifications data with state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'contribution',
      message: 'Alice Wanjiku made a contribution of KES 5,000',
      time: '2 minutes ago',
      read: false,
      icon: Check
    },
    {
      id: 2,
      type: 'loan',
      message: 'John Kamau requested a loan of KES 20,000',
      time: '1 hour ago',
      read: false,
      icon: Clock
    },
    {
      id: 3,
      type: 'overdue',
      message: 'Mary Njoki has an overdue loan payment',
      time: '3 hours ago',
      read: true,
      icon: AlertCircle
    },
    {
      id: 4,
      type: 'contribution',
      message: 'Peter Mwangi made a contribution of KES 3,000',
      time: '1 day ago',
      read: true,
      icon: Check
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-6 bg-background border-b border-border"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive rounded-full text-xs text-destructive-foreground flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </motion.button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 border-b">
              <h4 className="font-semibold">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                You have {unreadCount} unread notifications
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-muted/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${
                      notification.type === 'contribution' ? 'bg-success/20' :
                      notification.type === 'loan' ? 'bg-primary/20' :
                      'bg-destructive/20'
                    }`}>
                      <notification.icon className={`h-4 w-4 ${
                        notification.type === 'contribution' ? 'text-success' :
                        notification.type === 'loan' ? 'text-primary' :
                        'text-destructive'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t">
              <Button 
                variant="ghost" 
                className="w-full text-sm" 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSettingsClick}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="h-5 w-5" />
        </motion.button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={getProfilePicture()} alt={authUser?.full_name || 'User'} />
                <AvatarFallback className={isAdmin() ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}>
                  {isAdmin() ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>
              {isAdmin() && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none">
                {authUser?.full_name || `${authUser?.first_name} ${authUser?.last_name}`}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {authUser?.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground capitalize">
                {authUser?.role} {isAdmin() && '• Admin'}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}