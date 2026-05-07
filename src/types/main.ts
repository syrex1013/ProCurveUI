// Main process event types

export interface MainProcessEvent {
  type: string;
  payload?: unknown;
}

export interface ConnectionState {
  isConnected: boolean;
  currentProfileId?: string;
  lastError?: string;
  connectedAt?: Date;
}

export interface DatabaseInitOptions {
  dbPath?: string;
}
