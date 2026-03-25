export interface Env {
  DB: D1Database;
  PASSWORD_PEPPER: string;
  DEBUG?: string;
  SESSION_TTL_HOURS?: string;
  ADMIN_TOKEN?: string;
  ENABLE_USER_REGISTRATION?: string;
}

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
}

export interface ProgressRow {
  progress: string;
  percentage: number;
  device: string;
  device_id: string;
  timestamp: number;
  document?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface UserLoginRequest {
  username?: string;
  password?: string;
}

export interface ProgressUpdateRequest {
  document: string;
  progress: string;
  percentage: number;
  device: string;
  device_id?: string;
}
