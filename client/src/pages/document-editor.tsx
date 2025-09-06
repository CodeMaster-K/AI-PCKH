import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDocumentSchema } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Sparkles, Tags as TagsIcon, FileText } from "lucide-react";
import { z } from "zod";

const documentFormSchema = insertDocumentSchema.extend({
  tags: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

export default function DocumentEditor() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/document/edit/:id");
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  const isEditing = !!params?.id;
  const documentId = params?.id;

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      tags: "",
    },
  });

  // Fetch document for editing
  const { data: document, isLoading } = useQuery({
    queryKey: ["/api/documents", documentId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/documents/${documentId}`, undefined, token);
      return await response.json();
    },
    enabled: isEditing && !!documentId && !!token,
  });

  // Update form when document loads
  useEffect(() => {
    if (document) {
      form.reset({
        title: document.title,
        content: document.content,
        summary: document.summary || "",
        tags: document.tags?.join(", ") || "",
      });
    }
  }, [document, form]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
      };

      if (isEditing) {
        const response = await apiRequest("PUT", `/api/documents/${documentId}`, payload, token);
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/documents", payload, token);
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: isEditing ? "Document updated" : "Document created",
        description: isEditing ? "Your document has been successfully updated." : "Your document has been successfully created.",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // AI Summary generation
  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const title = form.getValues("title");
      const content = form.getValues("content");
      
      if (!title || !content) {
        throw new Error("Please provide both title and content before generating summary");
      }

      const response = await apiRequest("POST", "/api/ai/summarize", { title, content }, token);
      return await response.json();
    },
    onSuccess: (data) => {
      form.setValue("summary", data.summary);
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

  // AI Tags generation
  const generateTagsMutation = useMutation({
    mutationFn: async () => {
      const title = form.getValues("title");
      const content = form.getValues("content");
      
      if (!title || !content) {
        throw new Error("Please provide both title and content before generating tags");
      }

      const response = await apiRequest("POST", "/api/ai/generate-tags", { title, content }, token);
      return await response.json();
    },
    onSuccess: (data) => {
      form.setValue("tags", data.tags.join(", "));
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

  const onSubmit = (data: DocumentFormData) => {
    saveMutation.mutate(data);
  };

  const handleGenerateSummary = () => {
    setIsGeneratingSummary(true);
    generateSummaryMutation.mutate();
  };

  const handleGenerateTags = () => {
    setIsGeneratingTags(true);
    generateTagsMutation.mutate();
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
        </header>
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="h-10 bg-muted rounded animate-pulse"></div>
                <div className="h-64 bg-muted rounded animate-pulse"></div>
                <div className="h-10 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" data-testid="document-editor">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {isEditing ? "Edit Document" : "Create New Document"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Update your document" : "Add knowledge to your team's repository"}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Document Form */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter document title"
                    {...form.register("title")}
                    data-testid="input-title"
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    rows={12}
                    placeholder="Write your document content here..."
                    {...form.register("content")}
                    data-testid="textarea-content"
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Summary (optional)</Label>
                  <Textarea
                    id="summary"
                    rows={3}
                    placeholder="Document summary (can be generated by AI)"
                    {...form.register("summary")}
                    data-testid="textarea-summary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (optional)</Label>
                  <Input
                    id="tags"
                    placeholder="Add tags separated by commas"
                    {...form.register("tags")}
                    data-testid="input-tags"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can also use AI to generate tags automatically
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <span>AI Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto p-4 bg-gradient-to-r from-accent to-primary text-white border-0 hover:opacity-90"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    data-testid="button-generate-summary"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <FileText className="h-6 w-6" />
                      <span className="font-medium">
                        {isGeneratingSummary ? "Generating..." : "Generate Summary"}
                      </span>
                      <span className="text-xs opacity-90">Create an AI-powered summary</span>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto p-4 bg-gradient-to-r from-accent to-primary text-white border-0 hover:opacity-90"
                    onClick={handleGenerateTags}
                    disabled={isGeneratingTags}
                    data-testid="button-generate-tags"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <TagsIcon className="h-6 w-6" />
                      <span className="font-medium">
                        {isGeneratingTags ? "Generating..." : "Generate Tags"}
                      </span>
                      <span className="text-xs opacity-90">Auto-generate relevant tags</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>

              <div className="flex items-center space-x-3">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  data-testid="button-save"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : (isEditing ? "Update Document" : "Create Document")}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
