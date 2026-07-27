import { requestClient } from '#/api/request';

export namespace DashboardApi {
  export interface OverviewStats {
    totalEmployees: number;
    activeEmployees: number;
    totalLeaveRequests: number;
    pendingLeaveRequests: number;
    approvedLeaveRequests: number;
    annualLeaveSummary: {
      available_days: number;
      entitlement_days: number;
      used_days: number;
    };
  }

  export interface LeaveRequestCount {
    type: string;
    count: number;
  }

  export interface DepartmentLeaveStats {
    department: string;
    count: number;
  }

  export interface RecentLeaveRequest {
    id: string;
    employee_name: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    approval_status: string;
    created_at: string;
  }

  export interface DashboardData {
    overview: OverviewStats;
    leaveTypeDistribution: LeaveRequestCount[];
    departmentLeaveStats: DepartmentLeaveStats[];
    recentLeaveRequests: RecentLeaveRequest[];
    pendingApprovals: number;
  }

  export interface TrendsData {
    labels: string[];
    series: {
      color: string;
      data: number[];
      name: string;
    }[];
  }

  export interface VisitsData {
    labels: string[];
    data: number[];
  }

  export interface VisitsRadarData {
    indicator: { max: number; name: string }[];
    series: {
      color: string;
      name: string;
      value: number[];
    }[];
  }
}

export async function getDashboardDataApi() {
  return requestClient.get<DashboardApi.DashboardData>('/dashboard');
}

export async function getTrendsApi(): Promise<DashboardApi.TrendsData> {
  return {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
    series: [
      { name: '请假申请', data: [12, 15, 8, 20, 18, 25], color: '#5470C6' },
      { name: '审批通过', data: [10, 13, 7, 18, 16, 22], color: '#91CC75' },
      { name: '审批拒绝', data: [2, 2, 1, 2, 2, 3], color: '#EE6666' },
    ],
  };
}

export async function getVisitsApi(): Promise<DashboardApi.VisitsData> {
  return {
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    data: [150, 200, 180, 220, 250, 120, 80],
  };
}

export async function getVisitsDataApi(): Promise<DashboardApi.VisitsRadarData> {
  return {
    indicator: [
      { name: '病假', max: 100 },
      { name: '年假', max: 100 },
      { name: '事假', max: 100 },
      { name: '调休', max: 100 },
      { name: '长假', max: 100 },
    ],
    series: [
      { name: '本月', value: [65, 80, 55, 70, 45], color: '#5470C6' },
      { name: '上月', value: [55, 70, 60, 65, 50], color: '#91CC75' },
    ],
  };
}
