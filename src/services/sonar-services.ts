import type { SonarHistoryFilters, SonarMetricHistory } from '@/model/sonar-model'
import axios from 'axios'

export async function getSonarHistory(
  filters: SonarHistoryFilters,
): Promise<Array<SonarMetricHistory>> {
  return axios
    .get(`/api/measures/search_history`, { params: filters })
    .then((res) => res.data.measures)
}
