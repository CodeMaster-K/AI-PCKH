import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, requireAdmin, AuthRequest, generateToken, hashPassword, comparePassword } from "./services/auth";
import { summarizeDocument, generateTags, performSemanticSearch, answerQuestion } from "./services/gemini";
import { loginSchema, registerSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });
      
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValidPassword = await comparePassword(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  // Document routes
  app.get("/api/documents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(data, req.user!.id);
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.put("/api/documents/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check permissions - users can only edit their own docs, admins can edit any
      if (document.createdBy.id !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const data = insertDocumentSchema.partial().parse(req.body);
      const updatedDocument = await storage.updateDocument(req.params.id, data, req.user!.id);
      res.json(updatedDocument);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check permissions - users can only delete their own docs, admins can delete any
      if (document.createdBy.id !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Permission denied" });
      }
      
      const success = await storage.deleteDocument(req.params.id);
      if (success) {
        res.json({ message: "Document deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete document" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Document versions
  app.get("/api/documents/:id/versions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const versions = await storage.getDocumentVersions(req.params.id);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document versions" });
    }
  });

  // Search routes
  app.get("/api/search", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q: query, type = "text" } = req.query;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Query parameter required" });
      }
      
      let results;
      if (type === "semantic") {
        const allDocuments = await storage.getDocuments();
        results = await performSemanticSearch(query, allDocuments);
      } else {
        results = await storage.searchDocuments(query);
      }
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // AI routes
  app.post("/api/ai/summarize", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content required" });
      }
      
      const summary = await summarizeDocument(title, content);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  app.post("/api/ai/generate-tags", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content required" });
      }
      
      const tags = await generateTags(title, content);
      res.json({ tags });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate tags" });
    }
  });

  app.post("/api/ai/qa", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question required" });
      }
      
      const documents = await storage.getDocuments();
      const answer = await answerQuestion(question, documents);
      res.json({ answer });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate answer" });
    }
  });

  // Activity routes
  app.get("/api/activities", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const activities = await storage.getRecentActivities(10);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
