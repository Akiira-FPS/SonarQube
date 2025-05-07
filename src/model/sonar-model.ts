export interface SonarHistoryFilters {
  component: string
  metrics: string
  from?: string
  to?: string
}

export interface MetricValue {
  date: string
  value: string
}

export interface SonarMetricHistory {
  metric: string
  history: MetricValue[]
}

export interface SonarProject {
  key: string
  name: string
  qualifier: string
  visibility: string
  lastAnalysisDate?: string
  revision?: string
}
