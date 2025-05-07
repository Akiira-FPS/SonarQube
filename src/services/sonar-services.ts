import type { SonarHistoryFilters, SonarMetricHistory, SonarProject } from '@/model/sonar-model'
import axios from 'axios'

const token = import.meta.env.VITE_SONAR_TOKEN

export async function getSonarHistory(
  filters: SonarHistoryFilters,
): Promise<Array<SonarMetricHistory>> {
  return axios
    .get(`/api/measures/search_history`, {
      params: filters,
      headers: {
        Authorization: `Basic ${btoa(token + ':')}`,
      },
    })
    .then((res) => res.data.measures)
}

export async function getSonarProjects(): Promise<Array<SonarProject>> {
  return axios
    .get(`/api/projects/search`, {
      headers: {
        Authorization: `Basic ${btoa(token + ':')}`,
      },
    })
    .then((res) => res.data.components)
}
