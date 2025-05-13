import type { SonarHistoryFilters, SonarMetricHistory, SonarProject } from '@/model/sonar-model'
import axios from 'axios'

const token = import.meta.env.VITE_SONAR_TOKEN
const sonarUrl = import.meta.env.VITE_SONAR_URL

export async function getSonarHistory(
  filters: SonarHistoryFilters,
): Promise<Array<SonarMetricHistory>> {
  return axios
    .get(`${sonarUrl}/api/measures/search_history`, {
      params: filters,
      headers: {
        Authorization: `Basic ${btoa(token + ':')}`,
      },
    })
    .then((res) => res.data.measures)
}

export async function getSonarProjects(): Promise<Array<SonarProject>> {
  return axios
    .get(`${sonarUrl}/api/projects/search`, {
      headers: {
        Authorization: `Basic ${btoa(token + ':')}`,
      },
    })
    .then((res) => res.data.components)
}
