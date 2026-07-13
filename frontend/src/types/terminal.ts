export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  traceId: string;
  timestamp: string;
}

export interface TerminalOverviewDto {
  generatedAt: string;
  onlineDevices: number;
  staleDevices: number;
  offlineDevices: number;
  highRiskDevices: number;
  abnormalPasswordModuleDevices: number;
  fingerprintChangedDevices: number;
  pendingClaimDevices: number;
  peripheralAlertCount: number;
  softwareChangeDevices: number;
  sourceCount: number;
}

export interface TerminalSourceDto {
  sourceType: 'EXTERNAL_API' | 'MANUAL_IMPORT' | string;
  sourceSystem: string;
  countryCode?: string | null;
  countryName?: string | null;
  city?: string | null;
  siteCode?: string | null;
  enabled: boolean;
  status: string;
  deviceCount: number;
  lastSeenAt: string | null;
}

export interface TerminalDeviceSummaryDto {
  id: number;
  deviceCode: string;
  displayName: string;
  personName: string | null;
  employeeNo: string | null;
  departmentName: string | null;
  phoneNumberMasked: string | null;
  primaryIp: string | null;
  osVersion: string | null;
  imei: string | null;
  meid: string | null;
  passwordModuleStatus: string | null;
  riskLevel: string;
  status: string;
  ownershipStatus: string;
  trafficUsedBytes: number;
  fingerprintChanged: boolean;
  configModified: boolean;
  lastObservedAt: string;
  sourceType: string;
  sourceSystem: string;
  countryCode?: string | null;
  countryName?: string | null;
  city?: string | null;
  siteCode?: string | null;
}

export interface TerminalDeviceListDto {
  items: TerminalDeviceSummaryDto[];
  page: number;
  size: number;
  total: number;
}

export interface TerminalPersonDto {
  personCode: string;
  fullName: string;
  displayName: string | null;
  employeeNo: string | null;
  departmentName: string | null;
  organizationPath: string | null;
  jobTitle: string | null;
  email: string | null;
  phoneNumberMasked: string | null;
}

export interface TerminalBindingDto {
  sourceSystem: string;
  externalDeviceId: string;
  externalDeviceName: string | null;
  bindingStatus: string;
}

export interface TerminalDeviceInfoDto {
  deviceName: string | null;
  primaryIp: string | null;
  osVersion: string | null;
  imei: string | null;
  meid: string | null;
  plmn: string | null;
  trafficUsedBytes: number;
  countryCode?: string | null;
  countryName?: string | null;
  city?: string | null;
  siteCode?: string | null;
}

export interface TerminalSecurityInfoDto {
  passwordModuleStatus: string | null;
  passwordModuleVersion: string | null;
  passwordSuiteStatus: string | null;
  wrongPasswordCount: number;
  fingerprintChanged: boolean;
  configModified: boolean;
  riskLevel: string;
  riskScore: number | null;
  summary: string | null;
}

export interface TerminalDeviceDetailDto {
  id: number;
  deviceCode: string;
  displayName: string;
  status: string;
  riskLevel: string;
  lastObservedAt: string;
  sourceType: string;
  sourceSystem: string;
  ownershipStatus: string;
  reportedPhoneNumberMasked: string | null;
  person: TerminalPersonDto | null;
  deviceInfo: TerminalDeviceInfoDto;
  latestSecurity: TerminalSecurityInfoDto;
  bindings: TerminalBindingDto[];
}

export interface TerminalEventDto {
  id: number;
  eventCategory: string;
  eventType: string;
  severity: string;
  title: string;
  detail: string | null;
  observedAt: string;
}

export interface TerminalSoftwareChangeDto {
  id: number;
  changeType: string;
  softwareName: string;
  softwareVersion: string | null;
  detail: string | null;
  observedAt: string;
}

export interface TerminalPeripheralEventDto {
  id: number;
  peripheralType: string;
  peripheralName: string | null;
  actionType: string;
  detail: string | null;
  observedAt: string;
}

export interface TerminalTimeseriesPointDto {
  observedAt: string;
  trafficUsedBytes: number;
  wrongPasswordCount: number;
  riskScore: number | null;
  riskLevel: string;
}

export interface TerminalTimeseriesDto {
  range: '6h' | '24h' | '7d' | string;
  points: TerminalTimeseriesPointDto[];
}
