import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Github, Linkedin, Globe } from "lucide-react";

export default function Support() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Support & Contact</h1>
          <p className="text-lg text-muted-foreground">
            Need help? Get in touch with our development team for support and assistance.
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Developer Contact */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Developer Contact
              </CardTitle>
              <CardDescription>
                Reach out to the development team for technical support and inquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">+91 6383296799</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <div>D Block, KK Nagar</div>
                    <div>Chennai, Tamil Nadu</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href="mailto:nithinshiyam9696@gmail.com" 
                    className="text-sm text-primary hover:underline"
                  >
                    nithinshiyam9696@gmail.com
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Connect with us:</p>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://www.linkedin.com/in/96sam" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  </Button>
                  
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://github.com/CodeMaster-K/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                  
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://sam-portfoli.web.app/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Portfolio
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Information */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Support Information</CardTitle>
              <CardDescription>
                Information about getting help and support for the Knowledge Hub
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Technical Support</h4>
                  <p className="text-sm text-muted-foreground">
                    For technical issues, bugs, or feature requests, please contact our development team.
                  </p>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-1">AI Features</h4>
                  <p className="text-sm text-muted-foreground">
                    Need help with AI summarization, tagging, or Q&A features? We're here to assist.
                  </p>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Account Issues</h4>
                  <p className="text-sm text-muted-foreground">
                    Problems with login, registration, or account management? Get in touch.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full" asChild>
                  <a href="mailto:nithinshiyam9696@gmail.com">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support Team
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Help */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Help</CardTitle>
            <CardDescription>
              Common questions and quick solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Getting Started</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Create your first document and explore AI features
                </p>
                <Button variant="outline" size="sm">Learn More</Button>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">AI Features</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Discover auto-summarization and intelligent tagging
                </p>
                <Button variant="outline" size="sm">Explore AI</Button>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Team Collaboration</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Learn about sharing documents and team features
                </p>
                <Button variant="outline" size="sm">Team Guide</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer Credits */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                AI-Powered Collaborative Knowledge Hub
              </p>
              <p className="text-sm">
                Developed with ❤️ in Tamil Nadu by{" "}
                <a 
                  href="https://www.linkedin.com/in/96sam" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Shiyam K
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}