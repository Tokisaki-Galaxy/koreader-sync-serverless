export interface Env {
  DB: D1Database;
  PASSWORD_PEPPER: string;
  DEBUG?: string;
  SESSION_TTL_HOURS?: string;
  PBKDF2_ITERATIONS?: string;
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

export interface StatisticsPageStatRow {
  page: number | null;
  start_time: number;
  duration: number;
  total_pages: number;
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
}

export interface StatisticsSnapshot {
  books: StatisticsBookRow[];
}
