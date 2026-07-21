import { requestClient } from '#/api/request';

export namespace DashboardApi {
  export interface OverviewItem {
    icon: string;
    title: string;
    totalTitle: string;
    totalValue: number;
    value: number;
  }

  export interface OverviewResult {
    items: OverviewItem[];
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

  export interface RadarData {
    indicator: { name: string }[];
    series: {
      color: string;
      name: string;
      value: number[];
    }[];
  }

  export interface PieData {
    data: { name: string; value: number }[];
  }

  export interface WorkbenchProjectItem {
    id: string;
    color: string;
    content: string;
    date: string;
    group: string;
    icon: string;
    title: string;
    url: string;
  }

  export interface WorkbenchQuickNavItem {
    id: string;
    color: string;
    icon: string;
    title: string;
    url: string;
  }

  export interface WorkbenchTodoItem {
    id: string;
    completed: boolean;
    content: string;
    date: string;
    title: string;
  }

  export interface WorkbenchTrendItem {
    id: string;
    avatar: string;
    content: string;
    date: string;
    title: string;
  }

  export interface WorkbenchResult {
    projects: WorkbenchProjectItem[];
    quickNavs: WorkbenchQuickNavItem[];
    todos: WorkbenchTodoItem[];
    trends: WorkbenchTrendItem[];
  }
}

export async function getOverviewApi() {
  return requestClient.get<DashboardApi.OverviewResult>('/dashboard/overview');
}

export async function getTrendsApi() {
  return requestClient.get<DashboardApi.TrendsData>('/dashboard/trends');
}

export async function getVisitsApi() {
  return requestClient.get<DashboardApi.VisitsData>('/dashboard/visits');
}

export async function getVisitsDataApi() {
  return requestClient.get<DashboardApi.RadarData>('/dashboard/visits-data');
}

export async function getVisitsSourceApi() {
  return requestClient.get<DashboardApi.PieData>('/dashboard/visits-source');
}

export async function getVisitsSalesApi() {
  return requestClient.get<DashboardApi.PieData>('/dashboard/visits-sales');
}

export async function getWorkbenchApi() {
  return requestClient.get<DashboardApi.WorkbenchResult>(
    '/dashboard/workbench',
  );
}
