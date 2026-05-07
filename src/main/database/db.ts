import path from 'path';
import os from 'os';
import fs from 'fs';
import CryptoJS from 'crypto-js';
import type { SSHProfile, AuditLogEntry } from '../../types/ipc.js';

export class DatabaseManager {
  private dataPath: string;
  private profilesPath: string;
  private auditPath: string;
  private encryptionKey: string;

  private profiles: Map<string, SSHProfile> = new Map();
  private auditLog: AuditLogEntry[] = [];

  constructor(dataDir?: string) {
    this.dataPath = dataDir || path.join(os.homedir(), '.procurve-manager');
    this.profilesPath = path.join(this.dataPath, 'profiles.json');
    this.auditPath = path.join(this.dataPath, 'audit.json');
    this.encryptionKey = process.env.PROCURVE_ENCRYPTION_KEY || 'procurve-default-key-change-in-production';
    this.ensureDirectory();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  initialize(): void {
    try {
      this.loadProfiles();
      this.loadAuditLog();
      console.log(`Database initialized at ${this.dataPath}`);
    } catch (err) {
      console.error('Failed to initialize database:', err);
      throw err;
    }
  }

  private loadProfiles(): void {
    if (fs.existsSync(this.profilesPath)) {
      try {
        const data = fs.readFileSync(this.profilesPath, 'utf-8');
        const profiles: any[] = JSON.parse(data);
        profiles.forEach((p) => {
          this.profiles.set(p.id, {
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          });
        });
      } catch (err) {
        console.error('Failed to load profiles:', err);
      }
    }
  }

  private saveProfiles(): void {
    const data = Array.from(this.profiles.values());
    fs.writeFileSync(this.profilesPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private loadAuditLog(): void {
    if (fs.existsSync(this.auditPath)) {
      try {
        const data = fs.readFileSync(this.auditPath, 'utf-8');
        this.auditLog = JSON.parse(data).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
      } catch (err) {
        console.error('Failed to load audit log:', err);
      }
    }
  }

  private saveAuditLog(): void {
    fs.writeFileSync(this.auditPath, JSON.stringify(this.auditLog, null, 2), 'utf-8');
  }

  // ============ PROFILE OPERATIONS ============

  saveProfile(profile: SSHProfile): SSHProfile {
    const id = profile.id || this.generateId();
    const now = new Date();
    let passwordEncrypted: string | undefined = undefined;

    if (profile.savePassword && profile.password) {
      passwordEncrypted = this.encrypt(profile.password);
    }

    const savedProfile: SSHProfile = {
      ...profile,
      id,
      password: undefined,
      passwordEncrypted: passwordEncrypted ? '***' : undefined,
      createdAt: profile.createdAt || now,
      updatedAt: now,
    };

    this.profiles.set(id, {
      ...savedProfile,
      passwordEncrypted,
    });
    this.saveProfiles();

    return savedProfile;
  }

  getProfile(id: string): SSHProfile | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;

    return {
      ...profile,
      password: undefined,
      passwordEncrypted: profile.passwordEncrypted ? '***' : undefined,
    };
  }

  listProfiles(): SSHProfile[] {
    return Array.from(this.profiles.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((p) => ({
        ...p,
        password: undefined,
        passwordEncrypted: p.passwordEncrypted ? '***' : undefined,
      }));
  }

  deleteProfile(id: string): void {
    this.profiles.delete(id);
    this.saveProfiles();
  }

  getDecryptedPassword(profileId: string): string | null {
    const profile = this.profiles.get(profileId);
    if (!profile || !profile.passwordEncrypted) return null;

    return this.decrypt(profile.passwordEncrypted);
  }

  // ============ AUDIT LOG OPERATIONS ============

  addAuditEntry(
    profileId: string,
    command: string,
    result: string,
    success: boolean = true,
    details?: Record<string, unknown>
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: this.auditLog.length + 1,
      profileId,
      command,
      result: result.substring(0, 1000), // Limit result size
      success,
      timestamp: new Date(),
      details,
    };

    this.auditLog.push(entry);
    // Keep only last 10000 entries to prevent file from growing too large
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
    this.saveAuditLog();

    return entry;
  }

  getAuditLog(
    profileId?: string,
    limit: number = 1000,
    offset: number = 0
  ): AuditLogEntry[] {
    let logs = this.auditLog;

    if (profileId) {
      logs = logs.filter((l) => l.profileId === profileId);
    }

    logs = logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return logs.slice(offset, offset + limit);
  }

  clearAuditLog(profileId?: string): void {
    if (profileId) {
      this.auditLog = this.auditLog.filter((l) => l.profileId !== profileId);
    } else {
      this.auditLog = [];
    }
    this.saveAuditLog();
  }

  // ============ ENCRYPTION ============

  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
  }

  private decrypt(encryptedText: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || '';
    } catch (err) {
      console.error('Decryption failed:', err);
      return '';
    }
  }

  // ============ UTILITIES ============

  private generateId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  close(): void {
    // No-op for file-based storage
  }
}

export default DatabaseManager;
