import type { SonarHistoryFilters, SonarMetricHistory, SonarProject } from '@/model/sonar-model'
import axios from 'axios'

const SONAR_TOKEN = 'squ_a553b0d42e9fcf97f11d859fbc82edf88ce9bff7'

export async function getSonarHistory(
  filters: SonarHistoryFilters,
): Promise<Array<SonarMetricHistory>> {
  return axios
    .get(`/api/measures/search_history`, {
      params: filters,
      headers: {
        Authorization: `Basic ${btoa(SONAR_TOKEN + ':')}`,
      },
    })
    .then((res) => res.data.measures)
}

export async function getSonarProjects(): Promise<Array<SonarProject>> {
  return axios
    .get(`/api/projects/search`, {
      headers: {
        Authorization: `Basic ${btoa(SONAR_TOKEN + ':')}`,
      },
    })
    .then((res) => res.data.components)
}
