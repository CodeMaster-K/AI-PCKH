import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit3, 
  Trash2, 
  History, 
  Sparkles, 
  Tags as TagsIcon,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentCardProps {
  document: any;
  currentUser: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShowVersions: (id: string) => void;
}

export default function DocumentCard({ document, currentUser, onEdit, onDelete, onShowVersions }: DocumentCardProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const canEdit = document.createdBy.id === currentUser.id || currentUser.role === "admin";

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/summarize", {
        title: document.title,
        content: document.content,
      }, token);
      return await response.json();
    },
    onSuccess: (data) => {
      // Update document with new summary
      queryClient.setQueryData(["/api/documents"], (old: any[]) => 
        old?.map(doc => 
          doc.id === document.id 
            ? { ...doc, summary: data.summary }
            : doc
        )
      );
      toast({
        title: "Summary generated",
        description: "AI summary has been generated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate summary",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGeneratingSummary(false);
    },
  });

  const generateTagsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/generate-tags", {
        title: document.title,
        content: document.content,
      }, token);
      return await response.json();
    },
    onSuccess: (data) => {
      // Update document with new tags
      queryClient.setQueryData(["/api/documents"], (old: any[]) => 
        old?.map(doc => 
          doc.id === document.id 
            ? { ...doc, tags: data.tags }
            : doc
        )
      );
      toast({
        title: "Tags generated",
        description: "AI tags have been generated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate tags",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGeneratingTags(false);
    },
  });

  const handleGenerateSummary = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGeneratingSummary(true);
    generateSummaryMutation.mutate();
  };

  const handleGenerateTags = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGeneratingTags(true);
    generateTagsMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const docDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - docDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return docDate.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`document-card-${document.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 
            className="text-lg font-semibold text-foreground line-clamp-2 flex-1 mr-2"
            onClick={() => onEdit(document.id)}
            data-testid={`document-title-${document.id}`}
          >
            {document.title}
          </h3>
          
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`document-menu-${document.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(document.id)} data-testid={`document-edit-${document.id}`}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(document.id)} 
                  className="text-destructive"
                  data-testid={`document-delete-${document.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-3" data-testid={`document-summary-${document.id}`}>
          {document.summary || document.content.substring(0, 150) + "..."}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4" data-testid={`document-tags-${document.id}`}>
          {document.tags?.slice(0, 3).map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {document.tags?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{document.tags.length - 3} more
            </Badge>
          )}
        </div>

        {/* Author & Version Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {getInitials(document.createdBy.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground" data-testid={`document-author-${document.id}`}>
              {document.createdBy.name} • {formatDate(document.updatedAt)}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs" data-testid={`document-version-${document.id}`}>
              v{document.version}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onShowVersions(document.id);
              }}
              data-testid={`document-history-${document.id}`}
            >
              <History className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* AI Actions */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-gradient-to-r from-accent to-primary text-white border-0 hover:opacity-90"
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              data-testid={`document-summarize-${document.id}`}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {isGeneratingSummary ? "Generating..." : "AI Summary"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-gradient-to-r from-accent to-primary text-white border-0 hover:opacity-90"
              onClick={handleGenerateTags}
              disabled={isGeneratingTags}
              data-testid={`document-generate-tags-${document.id}`}
            >
              <TagsIcon className="h-3 w-3 mr-1" />
              {isGeneratingTags ? "Generating..." : "Generate Tags"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
