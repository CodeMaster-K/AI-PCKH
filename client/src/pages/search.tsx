import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, Sparkles, ExternalLink } from "lucide-react";

export default function SearchPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("text");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: results = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/search", query, searchType],
    queryFn: async () => {
      if (!query.trim()) return [];
      const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}&type=${searchType}`, undefined, token);
      return await response.json();
    },
    enabled: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setHasSearched(true);
      refetch();
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const highlightText = (text: string, query: string) => {
    if (!query || searchType === "semantic") return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-xl font-semibold text-foreground">Search Knowledge Base</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Find documents using text search or AI-powered semantic search
        </p>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Search Form */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search documents or ask AI a question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                    data-testid="search-input"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <RadioGroup value={searchType} onValueChange={setSearchType} className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text" id="text-search" data-testid="radio-text-search" />
                      <Label htmlFor="text-search" className="text-sm">Text Search</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="semantic" id="semantic-search" data-testid="radio-semantic-search" />
                      <Label htmlFor="semantic-search" className="text-sm flex items-center space-x-1">
                        <Sparkles className="h-3 w-3" />
                        <span>AI Semantic Search</span>
                      </Label>
                    </div>
                  </RadioGroup>

                  <Button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    data-testid="button-search"
                  >
                    {isLoading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          {hasSearched && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
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
              ) : results.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground" data-testid="search-results-count">
                      Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                    </h3>
                    {searchType === "semantic" && (
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <Sparkles className="h-3 w-3" />
                        <span>AI Search</span>
                      </Badge>
                    )}
                  </div>

                  {results.map((result: any) => (
                    <Card key={result.id} className="hover:shadow-md transition-shadow" data-testid={`search-result-${result.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-lg font-semibold text-foreground hover:text-primary cursor-pointer flex-1">
                            {highlightText(result.title, query)}
                          </h4>
                          <div className="flex items-center space-x-2 ml-4">
                            {result.relevance && (
                              <Badge variant="outline" className="text-xs" data-testid={`relevance-${result.id}`}>
                                {result.relevance}% match
                              </Badge>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4 leading-relaxed" data-testid={`search-snippet-${result.id}`}>
                          {highlightText(
                            result.summary || result.content.substring(0, 200) + "...",
                            query
                          )}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {result.tags?.slice(0, 4).map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {highlightText(tag, query)}
                            </Badge>
                          ))}
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {getInitials(result.createdBy.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground" data-testid={`search-author-${result.id}`}>
                                {result.createdBy.name}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>Updated {formatDate(result.updatedAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      No documents match your search for "{query}". Try different keywords or use semantic search for better results.
                    </p>
                    <Button variant="outline" onClick={() => {
                      setSearchType("semantic");
                      if (query) refetch();
                    }}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Try AI Semantic Search
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!hasSearched && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Search Your Knowledge Base</h3>
                <p className="text-muted-foreground">
                  Enter your search query above to find relevant documents using text matching or AI-powered semantic search.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
