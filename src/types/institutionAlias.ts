// ===== Institution Alias =====

export interface InstitutionAliasRequest {
  alias: string;
  normalizedName: string;
}

export interface InstitutionAliasResponse {
  id: string;
  alias: string;
  normalizedName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
