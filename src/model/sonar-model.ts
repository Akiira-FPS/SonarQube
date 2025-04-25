export interface SonarHistoryFilters {
  component: string; // Clé du projet SonarQube
  metrics: string; // Exemple: "bugs,code_smells,coverage"
  from?: string; // Format: "YYYY-MM-DD"
  to?: string;   // Format: "YYYY-MM-DD"
}
  
export interface MetricValue {
  date: string;
  value: string;
}
  
export interface SonarMetricHistory {
  metric: string;
  history: MetricValue[];
}
  