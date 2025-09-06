import { type User, type InsertUser, type Document, type InsertDocument, type DocumentVersion, type InsertDocumentVersion, type Activity, type InsertActivity, type DocumentWithUser, type DocumentWithDetails } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocuments(): Promise<DocumentWithUser[]>;
  getDocument(id: string): Promise<DocumentWithDetails | undefined>;
  createDocument(document: InsertDocument, createdBy: string): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>, updatedBy: string): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  searchDocuments(query: string): Promise<DocumentWithUser[]>;
  
  // Document version methods
  getDocumentVersions(documentId: string): Promise<DocumentVersion[]>;
  createDocumentVersion(version: InsertDocumentVersion): Promise<DocumentVersion>;
  
  // Activity methods
  getRecentActivities(limit?: number): Promise<(Activity & { user: User; document?: Document })[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private documents: Map<string, Document>;
  private documentVersions: Map<string, DocumentVersion>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.documentVersions = new Map();
    this.activities = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser,
      role: insertUser.role || "user",
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  async getDocuments(): Promise<DocumentWithUser[]> {
    const docs: DocumentWithUser[] = [];
    for (const doc of Array.from(this.documents.values())) {
      const user = await this.getUser(doc.createdBy);
      if (user) {
        docs.push({ ...doc, createdBy: user });
      }
    }
    return docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getDocument(id: string): Promise<DocumentWithDetails | undefined> {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    const user = await this.getUser(doc.createdBy);
    if (!user) return undefined;
    
    const versions = await this.getDocumentVersions(id);
    return { ...doc, createdBy: user, versions };
  }

  async createDocument(insertDocument: InsertDocument, createdBy: string): Promise<Document> {
    const id = randomUUID();
    const now = new Date();
    const document: Document = {
      ...insertDocument,
      summary: insertDocument.summary || null,
      tags: insertDocument.tags || [],
      id,
      createdBy,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
    this.documents.set(id, document);
    
    // Create initial version
    await this.createDocumentVersion({
      documentId: id,
      title: document.title,
      content: document.content,
      summary: document.summary,
      tags: document.tags,
      version: 1,
      createdBy,
      changeDescription: "Initial version",
    });
    
    // Create activity
    await this.createActivity({
      type: "created",
      documentId: id,
      userId: createdBy,
      description: `Created document "${document.title}"`,
    });
    
    return document;
  }

  async updateDocument(id: string, updates: Partial<InsertDocument>, updatedBy: string): Promise<Document | undefined> {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    
    const now = new Date();
    const newVersion = doc.version + 1;
    const updatedDocument: Document = {
      ...doc,
      ...updates,
      updatedAt: now,
      version: newVersion,
    };
    
    this.documents.set(id, updatedDocument);
    
    // Create new version
    await this.createDocumentVersion({
      documentId: id,
      title: updatedDocument.title,
      content: updatedDocument.content,
      summary: updatedDocument.summary,
      tags: updatedDocument.tags,
      version: newVersion,
      createdBy: updatedBy,
      changeDescription: "Document updated",
    });
    
    // Create activity
    await this.createActivity({
      type: "updated",
      documentId: id,
      userId: updatedBy,
      description: `Updated document "${updatedDocument.title}"`,
    });
    
    return updatedDocument;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;
    
    // Delete document versions
    for (const [versionId, version] of Array.from(this.documentVersions.entries())) {
      if (version.documentId === id) {
        this.documentVersions.delete(versionId);
      }
    }
    
    // Delete activities
    for (const [activityId, activity] of Array.from(this.activities.entries())) {
      if (activity.documentId === id) {
        this.activities.delete(activityId);
      }
    }
    
    this.documents.delete(id);
    return true;
  }

  async searchDocuments(query: string): Promise<DocumentWithUser[]> {
    const allDocs = await this.getDocuments();
    const lowerQuery = query.toLowerCase();
    
    return allDocs.filter(doc => 
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.content.toLowerCase().includes(lowerQuery) ||
      (doc.summary && doc.summary.toLowerCase().includes(lowerQuery)) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }

  async getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
    return Array.from(this.documentVersions.values())
      .filter(version => version.documentId === documentId)
      .sort((a, b) => b.version - a.version);
  }

  async createDocumentVersion(insertVersion: InsertDocumentVersion): Promise<DocumentVersion> {
    const id = randomUUID();
    const now = new Date();
    const version: DocumentVersion = {
      ...insertVersion,
      summary: insertVersion.summary || null,
      tags: insertVersion.tags || [],
      changeDescription: insertVersion.changeDescription || null,
      id,
      createdAt: now,
    };
    this.documentVersions.set(id, version);
    return version;
  }

  async getRecentActivities(limit = 10): Promise<(Activity & { user: User; document?: Document })[]> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    const result = [];
    for (const activity of activities) {
      const user = await this.getUser(activity.userId);
      const document = activity.documentId ? this.documents.get(activity.documentId) : undefined;
      if (user) {
        result.push({ ...activity, user, document });
      }
    }
    return result;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const now = new Date();
    const activity: Activity = {
      ...insertActivity,
      documentId: insertActivity.documentId || null,
      id,
      createdAt: now,
    };
    this.activities.set(id, activity);
    return activity;
  }
}

export const storage = new MemStorage();
