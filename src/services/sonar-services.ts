import type { SonarBranch, SonarHistoryFilters, SonarMetricHistory, SonarProject } from '@/model/sonar-model'
import axios from 'axios'

const token = import.meta.env.VITE_SONAR_TOKEN

type ApiErrorData = {
  message?: string
  error?: string
  detail?: string
  reason?: string
  errors?: Array<{ message?: string }>
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorData>(error)) {
    const status = error.response?.status
    const data = error.response?.data
    const dataMessage =
      data?.message ??
      data?.error ??
      data?.detail ??
      data?.reason ??
      data?.errors?.[0]?.message

    if (status) {
      return dataMessage
        ? `Erreur API (${status}) : ${dataMessage}`
        : `Erreur API (${status})`
    }
  }

  return error instanceof Error ? error.message : 'Erreur API inconnue'
}

function simplifyProjectName(name: string): string {
  return name.trim().match(/^(.+?)\s*\([^)]*\)$/)?.[1] ?? name
}

function activityCutoff(): string {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 12)
  return cutoff.toISOString().slice(0, 10)
}

async function hasRecentAnalysis(project: string): Promise<boolean> {
  const response = await axios.get('/api/project_analyses/search', {
    params: {
      project,
      from: activityCutoff(),
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return (response.data.paging?.total ?? 0) > 0
}

async function filterRecentProjects(projects: SonarProject[]): Promise<SonarProject[]> {
  const keep: boolean[] = []
  const concurrency = 6

  for (let i = 0; i < projects.length; i += concurrency) {
    const batch = projects.slice(i, i + concurrency)
    const batchKeep = await Promise.all(
      batch.map(project => hasRecentAnalysis(project.key).catch(() => true)),
    )
    keep.push(...batchKeep)
  }

  return projects.filter((_, index) => keep[index])
}

export async function getSonarHistory(
  filters: SonarHistoryFilters,
): Promise<Array<SonarMetricHistory>> {
  const measures: SonarMetricHistory[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const response = await axios.get('/api/measures/search_history', {
      params: {
        ...filters,
        p: page,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    for (const metric of response.data.measures as SonarMetricHistory[]) {
      const existing = measures.find(item => item.metric === metric.metric)

      if (existing) {
        existing.history.push(...metric.history)
      } else {
        measures.push(metric)
      }
    }

    const { pageIndex, pageSize, total } = response.data.paging
    hasNextPage = pageIndex * pageSize < total
    page++
  }

  return measures
}

export async function getSonarProjects(): Promise<Array<SonarProject>> {
  const projects: SonarProject[] = []
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const response = await axios.get('/api/components/search', {
      params: {
        qualifiers: 'TRK',
        p: page,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    projects.push(...response.data.components)

    const { pageIndex, pageSize, total } = response.data.paging
    hasNextPage = pageIndex * pageSize < total
    page++
  }

  const simplifiedProjects = projects
    .map(project => ({
      ...project,
      name: simplifyProjectName(project.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return filterRecentProjects(simplifiedProjects)
}

export async function getSonarBranches(project: string): Promise<Array<SonarBranch>> {
  return axios
    .get('/api/project_branches/list', {
      params: {
        project,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => res.data.branches)
}
