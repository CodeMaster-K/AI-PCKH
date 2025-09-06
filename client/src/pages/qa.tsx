import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Sparkles, FileText } from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  sources?: string[];
}

export default function QAPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Fetch documents for context (optional - to show available knowledge)
  const { data: documents = [] } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/documents", undefined, token);
      return await response.json();
    },
    enabled: !!token,
  });

  const askQuestionMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/ai/qa", { question }, token);
      return await response.json();
    },
    onSuccess: (data, question) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString() + "-user",
        type: "user",
        content: question,
        timestamp: new Date(),
      };

      const aiMessage: ChatMessage = {
        id: Date.now().toString() + "-ai",
        type: "ai",
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
      setQuestion("");
    },
    onError: (error) => {
      toast({
        title: "Failed to get answer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    askQuestionMutation.mutate(question.trim());
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex-1 overflow-auto" data-testid="qa-page">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
            <Bot className="h-5 w-5 text-accent" />
            <span>AI Q&A Assistant</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions about your team's knowledge base
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" onClick={clearChat} data-testid="button-clear-chat">
            Clear Chat
          </Button>
        )}
      </header>

      {/* Main Content */}
      <main className="p-6 flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          {/* Knowledge Base Info */}
          {documents.length > 0 && messages.length === 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Knowledge Base Ready</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  I have access to {documents.length} document{documents.length !== 1 ? 's' : ''} in your knowledge base. 
                  Ask me anything about your team's documentation!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Chat Interface */}
          <Card className="flex-1 flex flex-col min-h-[500px]">
            {/* Chat Messages */}
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-6" data-testid="chat-messages">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                      <Bot className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to AI Q&A</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Ask me questions about your documents and I'll provide answers based on your knowledge base.
                    </p>
                    <div className="text-left space-y-2 text-sm text-muted-foreground">
                      <p><strong>Example questions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>How do I optimize React performance?</li>
                        <li>What are our API documentation standards?</li>
                        <li>Summarize the latest project guidelines</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className="flex items-start space-x-3"
                        data-testid={`message-${message.type}-${message.id}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback 
                            className={
                              message.type === "user" 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-accent text-accent-foreground"
                            }
                          >
                            {message.type === "user" ? (
                              getInitials(user?.name || "You")
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-foreground">
                              {message.type === "user" ? user?.name || "You" : "AI Assistant"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          
                          {message.type === "ai" ? (
                            <div className="bg-muted rounded-lg p-4">
                              <div className="prose prose-sm max-w-none text-foreground">
                                {message.content.split('\n').map((paragraph, index) => (
                                  <p key={index} className={index > 0 ? "mt-2" : ""}>
                                    {paragraph}
                                  </p>
                                ))}
                              </div>
                              {message.sources && message.sources.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <p className="text-xs text-muted-foreground">
                                    Sources: {message.sources.join(", ")}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-foreground">{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {askQuestionMutation.isPending && (
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-accent text-accent-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-foreground">AI Assistant</span>
                            <span className="text-xs text-muted-foreground">thinking...</span>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                              <span className="text-sm text-muted-foreground">Analyzing your question...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Input */}
            <div className="border-t border-border p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Ask a question about your team's knowledge..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="flex-1"
                  disabled={askQuestionMutation.isPending}
                  data-testid="input-question"
                />
                <Button
                  type="submit"
                  disabled={!question.trim() || askQuestionMutation.isPending}
                  className="bg-gradient-to-r from-accent to-primary text-white border-0 hover:opacity-90"
                  data-testid="button-send-question"
                >
                  {askQuestionMutation.isPending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              
              <div className="flex items-center justify-center mt-2">
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>Powered by AI • Answers based on your knowledge base</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
