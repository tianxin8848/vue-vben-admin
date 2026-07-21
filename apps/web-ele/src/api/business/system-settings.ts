import { requestClient } from '#/api/request';

export namespace SystemSettingsApi {
  export interface SystemSettings {
    id: string;
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    workingHoursStart: string;
    workingHoursEnd: string;
    maxAnnualLeaveDays: number;
    maxSickLeaveDays: number;
    createdAt: string;
    updatedAt: string;
  }

  export interface RegionalHoliday {
    id: string;
    name: string;
    date: string;
    type: 'fixed' | 'variable';
    region: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface HolidayRange {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    region: string;
    isPaid: boolean;
    createdAt: string;
    updatedAt: string;
  }

  export type UpdateSettingsParams = Partial<SystemSettings>;

  export interface CreateHolidayParams {
    name: string;
    date: string;
    type: RegionalHoliday['type'];
    region: string;
  }

  export interface CreateHolidayRangeParams {
    name: string;
    startDate: string;
    endDate: string;
    region: string;
    isPaid: boolean;
  }
}

export async function getSystemSettingsApi() {
  return requestClient.get<SystemSettingsApi.SystemSettings>(
    '/system-settings',
  );
}

export async function updateSystemSettingsApi(
  data: SystemSettingsApi.UpdateSettingsParams,
) {
  return requestClient.put<SystemSettingsApi.SystemSettings>(
    '/system-settings',
    data,
  );
}

export async function updateRegionalHolidaysApi(
  data:
    | SystemSettingsApi.CreateHolidayParams
    | SystemSettingsApi.CreateHolidayParams[],
) {
  return requestClient.put('/system-settings/regional-holidays', data);
}

export async function deleteRegionalHolidayApi(id: string) {
  return requestClient.delete(`/system-settings/regional-holidays`, {
    data: { id },
  });
}

export async function updateHolidayRangeApi(
  data:
    | SystemSettingsApi.CreateHolidayRangeParams
    | SystemSettingsApi.CreateHolidayRangeParams[],
) {
  return requestClient.put('/system-settings/regional-holidays/range', data);
}

export async function deleteHolidayRangeApi(id: string) {
  return requestClient.delete(`/system-settings/regional-holidays/range`, {
    data: { id },
  });
}
