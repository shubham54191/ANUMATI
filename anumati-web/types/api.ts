export interface Meta {
  rules_version: string;
  rules_as_of: string;
  engine_version: string;
  generated_at: string;
  approvals_count: number;
  flagged_count: number;
}

export interface Envelope<T> {
  data: T;
  meta: Meta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    detail?: unknown;
    request_id: string;
    docs?: string;
  };
}
