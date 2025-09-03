export interface DomainParamConfig {
  domains: string[];
  params: string[];
}

export interface StorageData {
  customParams?: string[];
  whitelist?: string[];
  darkMode?: boolean;
  amazonAssociateId?: string;
  disabledDefaultParams?: string[];
  domainParams?: DomainParamConfig[];
}

export interface CleanUrlResult {
  cleanUrl: string;
  removedParams: string[];
  error: string | null;
}
