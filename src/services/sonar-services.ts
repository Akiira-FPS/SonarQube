import type { SonarHistoryFilters, SonarMetricHistory } from '@/model/sonar-model'
import axios from 'axios'

const SONAR_URL = '/api'
const SONAR_TOKEN = 'squ_a447d9fadabe72a4aab64968978292bf5c1196d9'

export async function getSonarHistory(
  filters: SonarHistoryFilters,
): Promise<Array<SonarMetricHistory>> {
  return axios
    .get(`${SONAR_URL}/measures/search_history`, {
      params: filters,
      headers: {
        Authorization: `Basic ${btoa(SONAR_TOKEN + ':')}`,
      },
    })
    .then((res) => res.data.measures)
}
