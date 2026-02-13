import { CosmosClient, Container, Database } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import {
  BrainstormSession,
  BmadStep,
} from './types';

export class SessionStoreError extends Error {
  constructor(
    message: string,
    public readonly code: 'CONFLICT' | 'PRECONDITION_FAILED' | 'NOT_FOUND',
  ) {
    super(message);
    this.name = 'SessionStoreError';
  }
}

export class SessionStore {
  private client: CosmosClient | null = null;
  private database!: Database;
  private container!: Container;
  private readonly isInMemory: boolean;

  // In-memory store
  private memoryStore = new Map<string, BrainstormSession & { _etagCounter: number }>();

  constructor() {
    this.isInMemory = !config.cosmosEndpoint;
    if (!this.isInMemory) {
      this.client = new CosmosClient({
        endpoint: config.cosmosEndpoint,
        key: config.cosmosKey,
      });
    }
  }

  async initialize(): Promise<void> {
    if (this.isInMemory) {
      return;
    }

    const { database } = await this.client!.databases.createIfNotExists({
      id: config.cosmosDatabase,
    });
    this.database = database;

    const { container } = await this.database.containers.createIfNotExists({
      id: config.cosmosContainer,
      partitionKey: { paths: ['/tenantId'] },
    });
    this.container = container;
  }

  // --- CRUD Methods ---

  async createSession(session: BrainstormSession): Promise<BrainstormSession> {
    if (this.isInMemory) {
      if (this.memoryStore.has(session.id)) {
        throw new SessionStoreError(
          'Session already exists',
          'CONFLICT',
        );
      }
      const etagCounter = 1;
      const stored = { ...session, _etag: String(etagCounter), _etagCounter: etagCounter };
      this.memoryStore.set(session.id, stored);
      const { _etagCounter: _, ...result } = stored;
      return result as BrainstormSession;
    }

    try {
      const { resource } = await this.container.items.create(session);
      return resource as BrainstormSession;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 409) {
        throw new SessionStoreError('Session already exists', 'CONFLICT');
      }
      throw err;
    }
  }

  async getSession(id: string): Promise<BrainstormSession | null> {
    if (this.isInMemory) {
      const stored = this.memoryStore.get(id);
      if (!stored) return null;
      const { _etagCounter: _, ...result } = stored;
      return result as BrainstormSession;
    }

    try {
      const { resources } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.id = @id',
          parameters: [{ name: '@id', value: id }],
        })
        .fetchAll();
      return (resources[0] as BrainstormSession) ?? null;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 404) {
        return null;
      }
      throw err;
    }
  }

  async updateSession(session: BrainstormSession): Promise<BrainstormSession> {
    const updatedSession = { ...session, updatedAt: new Date() };

    if (this.isInMemory) {
      const stored = this.memoryStore.get(session.id);
      if (!stored) {
        throw new SessionStoreError('Session not found', 'NOT_FOUND');
      }
      if (session._etag && session._etag !== stored._etag) {
        throw new SessionStoreError(
          'Session was modified by another process',
          'PRECONDITION_FAILED',
        );
      }
      const newCounter = stored._etagCounter + 1;
      const newStored = {
        ...updatedSession,
        _etag: String(newCounter),
        _etagCounter: newCounter,
      };
      this.memoryStore.set(session.id, newStored);
      const { _etagCounter: _, ...result } = newStored;
      return result as BrainstormSession;
    }

    try {
      const { resource } = await this.container
        .item(session.id, session.tenantId)
        .replace(updatedSession, {
          accessCondition: session._etag
            ? { type: 'IfMatch', condition: session._etag }
            : undefined,
        });
      return resource as BrainstormSession;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: number }).code;
        if (code === 412) {
          throw new SessionStoreError(
            'Session was modified by another process',
            'PRECONDITION_FAILED',
          );
        }
        if (code === 404) {
          throw new SessionStoreError('Session not found', 'NOT_FOUND');
        }
      }
      throw err;
    }
  }

  async deleteSession(id: string, tenantId: string): Promise<void> {
    if (this.isInMemory) {
      if (!this.memoryStore.has(id)) {
        throw new SessionStoreError('Session not found', 'NOT_FOUND');
      }
      this.memoryStore.delete(id);
      return;
    }

    try {
      await this.container.item(id, tenantId).delete();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 404) {
        throw new SessionStoreError('Session not found', 'NOT_FOUND');
      }
      throw err;
    }
  }

  // --- Query Methods ---

  async getSessionByMeetingId(meetingId: string): Promise<BrainstormSession | null> {
    if (this.isInMemory) {
      for (const stored of this.memoryStore.values()) {
        if (stored.meetingId === meetingId) {
          const { _etagCounter: _, ...result } = stored;
          return result as BrainstormSession;
        }
      }
      return null;
    }

    const { resources } = await this.container.items
      .query({
        query: 'SELECT * FROM c WHERE c.meetingId = @meetingId',
        parameters: [{ name: '@meetingId', value: meetingId }],
      })
      .fetchAll();
    return (resources[0] as BrainstormSession) ?? null;
  }

  async getActiveSessions(tenantId: string): Promise<BrainstormSession[]> {
    if (this.isInMemory) {
      const results: BrainstormSession[] = [];
      for (const stored of this.memoryStore.values()) {
        if (stored.tenantId === tenantId && stored.status === 'active') {
          const { _etagCounter: _, ...result } = stored;
          results.push(result as BrainstormSession);
        }
      }
      return results;
    }

    const { resources } = await this.container.items
      .query(
        {
          query: 'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = @status',
          parameters: [
            { name: '@tenantId', value: tenantId },
            { name: '@status', value: 'active' },
          ],
        },
        { partitionKey: tenantId },
      )
      .fetchAll();
    return resources as BrainstormSession[];
  }

  async getSessionByConversationId(conversationId: string): Promise<BrainstormSession | null> {
    if (this.isInMemory) {
      for (const stored of this.memoryStore.values()) {
        if (stored.conversationId === conversationId && stored.status !== 'completed') {
          const { _etagCounter: _, ...result } = stored;
          return result as BrainstormSession;
        }
      }
      return null;
    }

    const { resources } = await this.container.items
      .query({
        query: 'SELECT TOP 1 * FROM c WHERE c.conversationId = @conversationId AND c.status != @completedStatus ORDER BY c.createdAt DESC',
        parameters: [
          { name: '@conversationId', value: conversationId },
          { name: '@completedStatus', value: 'completed' },
        ],
      })
      .fetchAll();
    return (resources[0] as BrainstormSession) ?? null;
  }

  // --- Helper ---

  createNewSession(
    meetingId: string,
    conversationId: string,
    tenantId: string,
  ): BrainstormSession {
    const now = new Date();
    return {
      id: uuidv4(),
      meetingId,
      conversationId,
      tenantId,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      currentStep: BmadStep.IDLE,
      completedSteps: [],
      objective: null,
      selectedTechniques: [],
      techniqueRecommendations: '',
      techniqueResults: {},
      organizedIdeas: null,
      insights: [],
      outputUrl: null,
      meetings: [],
      openQuestions: [],
      participants: [],
      conversationReference: null,
    };
  }
}

export const sessionStore = new SessionStore();
