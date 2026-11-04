export interface Env {
  DB?: D1Database;
  PASSWORD_PEPPER: string;
  RUNTIME_TARGET?: string;
  DB_DRIVER?: string;
  SQLITE_PATH?: string;
  DEBUG?: string;
  SESSION_TTL_HOURS?: string;
  SESSION_RENEW_WINDOW_HOURS?: string;
  PBKDF2_ITERATIONS?: string;
  ADMIN_TOKEN?: string;
  ENABLE_USER_REGISTRATION?: string;
  MCP_TOKEN_TTL_HOURS?: string;
  MCP_TOKEN_RENEW_WINDOW_HOURS?: string;
  MCP_ALLOWED_ORIGINS?: string;
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
  metadata?: string | null;
  document?: string;
}

export interface UserDeviceRow {
  id: number;
  user_id: number;
  device_key: string;
  device: string;
  device_id: string;
  alias: string | null;
  hidden: number;
  first_seen_at: number;
  last_seen_at: number;
}

export interface DeviceUsage {
  id: number;
  deviceKey: string;
  device: string;
  deviceId: string;
  alias: string | null;
  hidden: boolean;
  firstSeenAt: number;
  lastSeenAt: number;
  records: number;
  count: number;
  averageProgress: number | null;
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
  metadata?: unknown;
}

export interface StatisticsPageStatRow {
  page: number | null;
  start_time: number;
  duration: number;
  total_pages: number;
  [key: string]: unknown;
}

export interface StatisticsBookRow {
  md5: string;
  title: string;
  authors: string;
  notes: number;
  last_open: number;
  highlights: number;
  pages: number;
  series: string;
  language: string;
  total_read_time: number;
  total_read_pages: number;
  page_stat_data: StatisticsPageStatRow[];
  [key: string]: unknown;
}

export interface StatisticsSnapshot {
  books: StatisticsBookRow[];
}
