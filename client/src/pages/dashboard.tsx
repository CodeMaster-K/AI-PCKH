import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import DocumentCard from "@/components/document-card";
import VersionHistoryModal from "@/components/version-history-modal";
import { 
  FileText, 
  Bot, 
  Tags, 
  Users, 
  Plus, 
  Filter,
  X
} from "lucide-react";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recent");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/documents", undefined, token!);
      return await response.json();
    },
    enabled: !!token,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/documents/${id}`, undefined, token!);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get all unique tags from documents
  const allTags = Array.from(new Set(documents.flatMap((doc: any) => doc.tags || [])));

  // Filter and sort documents
  const filteredDocuments = documents
    .filter((doc: any) => {
      if (selectedFilters.length === 0) return true;
      return selectedFilters.some(filter => doc.tags?.includes(filter));
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "author":
          return a.createdBy.name.localeCompare(b.createdBy.name);
        case "recent":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const stats = {
    totalDocs: documents.length,
    aiSummaries: documents.filter((doc: any) => doc.summary).length,
    tagsGenerated: allTags.length,
    teamMembers: new Set(documents.map((doc: any) => doc.createdBy.id)).size,
  };

  const toggleFilter = (tag: string) => {
    setSelectedFilters(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V3h0z" />
              </svg>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-total-docs">
                        {stats.totalDocs}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Bot className="h-6 w-6 text-accent" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">AI Summaries</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-ai-summaries">
                        {stats.aiSummaries}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                      <Tags className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Tags Generated</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-tags-generated">
                        {stats.tagsGenerated}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="stat-team-members">
                        {stats.teamMembers}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Bar */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Filters:</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedFilters.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => toggleFilter(tag)}
                        data-testid={`filter-active-${tag}`}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                    
                    {allTags
                      .filter((tag: string) => !selectedFilters.includes(tag))
                      .slice(0, 5)
                      .map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleFilter(tag)}
                        data-testid={`filter-available-${tag}`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="ml-auto">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40" data-testid="sort-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Recent First</SelectItem>
                        <SelectItem value="title">Title A-Z</SelectItem>
                        <SelectItem value="author">Author</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDocuments.map((document: any) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    currentUser={user!}
                    onEdit={(id) => navigate(`/document/edit/${id}`)}
                    onDelete={handleDelete}
                    onShowVersions={setSelectedDocumentId}
                  />
                ))}

                {/* Add New Document Card */}
                <Card className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
                  <CardContent 
                    className="p-6 flex flex-col items-center justify-center h-full min-h-[200px] text-center"
                    onClick={() => navigate("/document/new")}
                    data-testid="card-add-document"
                  >
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Create New Document</h3>
                    <p className="text-sm text-muted-foreground">Start building your knowledge base</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedDocumentId && (
        <VersionHistoryModal
          documentId={selectedDocumentId}
          onClose={() => setSelectedDocumentId(null)}
        />
      )}
    </>
  );
}
