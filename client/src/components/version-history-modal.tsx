import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, RotateCcw } from "lucide-react";

interface VersionHistoryModalProps {
  documentId: string;
  onClose: () => void;
}

export default function VersionHistoryModal({ documentId, onClose }: VersionHistoryModalProps) {
  const { token } = useAuth();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["/api/documents", documentId, "versions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/documents/${documentId}/versions`, undefined, token);
      return await response.json();
    },
    enabled: !!documentId && !!token,
  });

  const { data: document } = useQuery({
    queryKey: ["/api/documents", documentId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/documents/${documentId}`, undefined, token);
      return await response.json();
    },
    enabled: !!documentId && !!token,
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRestore = (versionId: string) => {
    // TODO: Implement version restoration
    console.log("Restore version:", versionId);
  };

  return (
    <Dialog open={!!documentId} onOpenChange={() => onClose()} data-testid="version-history-modal">
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Version History</span>
            {document && <span className="text-muted-foreground">- {document.title}</span>}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96 pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg animate-pulse">
                  <div className="h-8 w-16 bg-muted rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version: any) => (
                <div 
                  key={version.id} 
                  className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`version-${version.version}`}
                >
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    v{version.version}
                  </Badge>
                  
                  <div className="flex-1">
                    <p className="text-foreground font-medium">
                      {version.changeDescription || `Version ${version.version}`}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {getInitials(version.createdBy?.name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {version.createdBy?.name || "Unknown"} • {formatDate(version.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(version.id)}
                    className="flex items-center space-x-1"
                    data-testid={`restore-version-${version.version}`}
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore</span>
                  </Button>
                </div>
              ))}
              
              {versions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No version history available
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
