import { requestClient } from '#/api/request';

export namespace SystemSettingsApi {
  export interface SystemSettings {
    id: string;
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    working_hours_start: string;
    working_hours_end: string;
    max_annual_leave_days: number;
    max_sick_leave_days: number;
    created_at: null | string;
    updated_at: null | string;
  }

  export interface RegionalHoliday {
    id: string;
    name: string;
    date: string;
    type: 'fixed' | 'variable';
    region: string;
    created_at: null | string;
    updated_at: null | string;
  }

  export interface HolidayRange {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    region: string;
    is_paid: boolean;
    created_at: null | string;
    updated_at: null | string;
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
    start_date: string;
    end_date: string;
    region: string;
    is_paid: boolean;
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
  return requestClient.delete(`/system-settings/regional-holidays/${id}`);
}

export async function updateHolidayRangeApi(
  data:
    | SystemSettingsApi.CreateHolidayRangeParams
    | SystemSettingsApi.CreateHolidayRangeParams[],
) {
  return requestClient.put('/system-settings/regional-holidays/range', data);
}

export async function deleteHolidayRangeApi(id: string) {
  return requestClient.delete(`/system-settings/regional-holidays/range/${id}`);
}
