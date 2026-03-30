import type { SonarHistoryFilters, SonarMetricHistory, SonarProject } from '@/model/sonar-model'
import axios from 'axios'

const token = import.meta.env.VITE_SONAR_TOKEN

export function getApiErrorMessage(error: unknown): string {
  const e = error as any
  if (!e) return 'Erreur API inconnue'

  // Axios: e.response?.status et e.response?.data peuvent contenir le message
  const status = e.response?.status
  const data = e.response?.data
  const dataMessage =
    data?.message ??
    data?.error ??
    data?.detail ??
    data?.reason ??
    data?.errors?.[0]?.message

  if (status) {
    if (dataMessage) return `Erreur API (${status}) : ${String(dataMessage)}`
    return `Erreur API (${status})`
  }

  if (typeof e === 'string') return e
  if (e.message) return String(e.message)
  return 'Erreur API inconnue'
}

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
