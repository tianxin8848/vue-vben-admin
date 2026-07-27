import { requestClient } from '#/api/request';

export namespace SystemSettingsApi {
  export interface SystemSettings {
    company_address: string;
    company_email: string;
    company_name: string;
    company_phone: string;
    created_at: null | string;
    id: string;
    max_annual_leave_days: number;
    max_sick_leave_days: number;
    updated_at: null | string;
    working_hours_end: string;
    working_hours_start: string;
  }

  export interface RegionalHoliday {
    created_at: null | string;
    date: string;
    id: string;
    name: string;
    region: string;
    type: 'fixed' | 'variable';
    updated_at: null | string;
  }

  export interface HolidayRange {
    created_at: null | string;
    end_date: string;
    id: string;
    is_paid: boolean;
    name: string;
    region: string;
    start_date: string;
    updated_at: null | string;
  }

  export type UpdateSettingsParams = Partial<SystemSettings>;

  export interface CreateHolidayParams {
    date: string;
    name: string;
    region: string;
    type: RegionalHoliday['type'];
  }

  export interface CreateHolidayRangeParams {
    end_date: string;
    is_paid: boolean;
    name: string;
    region: string;
    start_date: string;
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
