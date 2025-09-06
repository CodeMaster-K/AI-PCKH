import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Search, 
  Plus, 
  Bot, 
  HeadphonesIcon,
  LogOut,
  Brain,
  Bell,
  Settings
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout, token } = useAuth();

  const { data: activities } = useQuery({
    queryKey: ["/api/activities"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/activities", undefined, token!);
      return await response.json();
    },
    enabled: !!token,
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Knowledge Hub</h1>
            <p className="text-xs text-muted-foreground">AI-Powered</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Link href="/" data-testid="nav-dashboard">
          <Button
            variant={isActive("/") ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Home className="h-4 w-4 mr-3" />
            Dashboard
          </Button>
        </Link>
        
        <Link href="/search" data-testid="nav-search">
          <Button
            variant={isActive("/search") ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Search className="h-4 w-4 mr-3" />
            Search
          </Button>
        </Link>
        
        <Link href="/document/new" data-testid="nav-new-document">
          <Button
            variant={isActive("/document/new") ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Plus className="h-4 w-4 mr-3" />
            New Document
          </Button>
        </Link>
        
        <Link href="/qa" data-testid="nav-qa">
          <Button
            variant={isActive("/qa") ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Bot className="h-4 w-4 mr-3" />
            AI Q&A
          </Button>
        </Link>
        
        <Link href="/support" data-testid="nav-support">
          <Button
            variant={isActive("/support") ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <HeadphonesIcon className="h-4 w-4 mr-3" />
            Support
          </Button>
        </Link>
      </nav>

      {/* Team Activity Feed */}
      <div className="p-4 border-t border-border">
        <h3 className="text-sm font-medium text-foreground mb-3">Team Activity</h3>
        <ScrollArea className="h-32">
          <div className="space-y-3">
            {activities?.slice(0, 5).map((activity: any) => (
              <div key={activity.id} className="flex items-start space-x-2" data-testid={`activity-${activity.id}`}>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                    {getInitials(activity.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">
                    {activity.user.name} {activity.type} "{activity.document?.title || 'a document'}"
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {(!activities || activities.length === 0) && (
              <p className="text-xs text-muted-foreground">No recent activity</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full"></span>
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-muted-foreground">
              {user ? getInitials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="user-name">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground capitalize" data-testid="user-role">
              {user?.role}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
