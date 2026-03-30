<template>
  <div class="page-all">
    <div v-if="isLoading" class="loading-state">
      <ProgressSpinner aria-label="Loading" />
      <span>Loading statistics...</span>
    </div>

    <div v-else-if="errorMessage" class="error-state">
      <Card class="error-card">
        <template #title>
          <div class="error-title">Erreur pendant le chargement</div>
        </template>
        <template #content>
          <div class="error-details">{{ errorMessage }}</div>
          <div class="error-actions">
            <Button label="Réessayer" severity="danger" :outlined="true" @click="loadData()" />
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="content">
      <div v-if="warningMessage" class="warning-banner">
        <div class="warning-title">Attention</div>
        <div class="warning-details">{{ warningMessage }}</div>
      </div>

      <div class="top-header">
        <div class="titles">
          <h1 class="title">Statistics for all projects</h1>
          <p class="subtitle">Trend of bugs, code smells and security hotspots over the selected period.</p>
        </div>
      </div>

      <div class="kpi-grid">
        <Card class="kpi-card">
          <template #content>
            <div class="kpi-label">Period (chart focus)</div>
            <div class="picker-shortcuts">
              <Button size="small" label="1 jour" :severity="activePreset === 'day' ? 'primary' : 'secondary'"
                :outlined="activePreset !== 'day'" @click="applyRangePreset('day')" />
              <Button size="small" label="1 semaine" :severity="activePreset === 'week' ? 'primary' : 'secondary'"
                :outlined="activePreset !== 'week'" @click="applyRangePreset('week')" />
              <Button size="small" label="1 mois" :severity="activePreset === 'month' ? 'primary' : 'secondary'"
                :outlined="activePreset !== 'month'" @click="applyRangePreset('month')" />
              <Button size="small" label="1 an" :severity="activePreset === 'year' ? 'primary' : 'secondary'"
                :outlined="activePreset !== 'year'" @click="applyRangePreset('year')" />
            </div>
          </template>
        </Card>

        <Card class="kpi-card">
          <template #content>
            <div class="kpi-label">Bugs</div>
            <div class="kpi-value">{{ selectedMetrics.bugs }}</div>
            <div class="kpi-hint">For selected date</div>
          </template>
        </Card>

        <Card class="kpi-card">
          <template #content>
            <div class="kpi-label">Code Smells</div>
            <div class="kpi-value">{{ selectedMetrics.smells }}</div>
            <div class="kpi-hint">For selected date</div>
          </template>
        </Card>

        <Card class="kpi-card">
          <template #content>
            <div class="kpi-label">Security Hotspots</div>
            <div class="kpi-value">{{ selectedMetrics.security }}</div>
            <div class="kpi-hint">For selected date</div>
          </template>
        </Card>

        <Card class="kpi-card kpi-card-total">
          <template #content>
            <div class="kpi-label">Total</div>
            <div class="kpi-value">{{ selectedMetrics.total }}</div>
            <div class="kpi-hint">Bugs + Code Smells + Security</div>
          </template>
        </Card>
      </div>

      <Card class="chart-card">
        <template #title>
          <div class="card-title">Total issues (trend)</div>
        </template>
        <template #content>
          <ApexChart type="line" height="520px" width="100%" :options="chartOptions" :series="chartOptions.series" />
        </template>
      </Card>

      <Divider />

      <div class="chart-grid">
        <Card class="chart-card">
          <template #title>
            <div class="card-title">
              Issues by project <span class="muted">({{ pieBarDate }})</span>
            </div>
          </template>
          <template #content>
            <ApexChart type="bar" height="480px" :options="barOptions" :series="barSeries" />
          </template>
        </Card>

        <Card class="chart-card">
          <template #title>
            <div class="card-title">Distribution (bugs / smells / security)</div>
          </template>
          <template #content>
            <ApexChart type="pie" height="480px" :options="pieOptions" :series="pieSeries" />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getSonarProjects, getSonarHistory, getApiErrorMessage } from '@/services/sonar-services'
import type { SonarMetricHistory } from '@/model/sonar-model'
import { format, eachDayOfInterval } from 'date-fns'

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const warningMessage = ref<string | null>(null)
const dailyBugs = ref<Record<string, number>>({})
const dailyCodeSmells = ref<Record<string, number>>({})
const dailySecurityHotspots = ref<Record<string, number>>({})
const dailyTotals = ref<Record<string, number>>({})
const projects = ref<Array<{ key: string; name: string }>>([])

const today = new Date()
const lastYear = new Date()
lastYear.setFullYear(today.getFullYear() - 1)

const dateRange = ref({ start: lastYear, end: today })
const pieBarDate = ref(format(today, 'yyyy-MM-dd'))

type RangePreset = 'day' | 'week' | 'month' | 'year'
const activePreset = ref<RangePreset>('year')

function applyRangePreset(preset: RangePreset) {
  activePreset.value = preset
  pieBarDate.value = format(today, 'yyyy-MM-dd')
}

const selectedMetrics = computed(() => {
  const d = pieBarDate.value
  const bugs = dailyBugs.value[d] ?? 0
  const smells = dailyCodeSmells.value[d] ?? 0
  const security = dailySecurityHotspots.value[d] ?? 0
  return {
    bugs,
    smells,
    security,
    total: bugs + smells + security,
  }
})

const allDates = computed(() =>
  eachDayOfInterval({ start: dateRange.value.start, end: dateRange.value.end }).map(d =>
    format(d, 'yyyy-MM-dd')
  )
)

const focusedDates = computed(() => {
  const end = new Date(today)
  const start = new Date(end)

  if (activePreset.value === 'day') start.setDate(start.getDate() - 1)
  if (activePreset.value === 'week') start.setDate(start.getDate() - 7)
  if (activePreset.value === 'month') start.setMonth(start.getMonth() - 1)
  if (activePreset.value === 'year') start.setFullYear(start.getFullYear() - 1)

  const startKey = format(start, 'yyyy-MM-dd')
  const endKey = format(end, 'yyyy-MM-dd')
  return allDates.value.filter(date => date >= startKey && date <= endKey)
})

const projectDailyBugs = ref<Record<string, Record<string, number>>>({})
const projectDailySmells = ref<Record<string, Record<string, number>>>({})
const projectDailySecurity = ref<Record<string, Record<string, number>>>({})

function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = items.slice()
  let active = 0

  return new Promise((resolve, reject) => {
    const launchNext = () => {
      if (queue.length === 0 && active === 0) return resolve()
      while (active < limit && queue.length > 0) {
        const item = queue.shift() as T
        active++
        worker(item)
          .catch(reject)
          .finally(() => {
            active--
            launchNext()
          })
      }
    }
    launchNext()
  })
}

async function loadData() {
  isLoading.value = true
  errorMessage.value = null
  warningMessage.value = null

  let firstProjectError: string | null = null
  let projectErrorCount = 0
  try {
    const sonarProjects = await getSonarProjects()
    projects.value = sonarProjects.map(p => ({ key: p.key, name: p.name }))
    projectDailyBugs.value = {}
    projectDailySmells.value = {}
    projectDailySecurity.value = {}

    const bugsTotal: Record<string, number> = {}
    const smellsTotal: Record<string, number> = {}
    const securityTotal: Record<string, number> = {}
    const totals: Record<string, number> = {}
    const dates = allDates.value
    const from = format(dateRange.value.start, 'yyyy-MM-dd')
    const to = format(dateRange.value.end, 'yyyy-MM-dd')

    for (const date of dates) {
      bugsTotal[date] = 0
      smellsTotal[date] = 0
      securityTotal[date] = 0
      totals[date] = 0
    }

    const concurrency = 6
    await runWithConcurrency(sonarProjects, concurrency, async (sonarProject) => {
      try {
        const measures: SonarMetricHistory[] = await getSonarHistory({
          component: sonarProject.key,
          metrics: 'bugs,code_smells,security_hotspots',
          from,
          to,
        })

        const bugsHistoryByDate: Record<string, number> = {}
        const smellsHistoryByDate: Record<string, number> = {}
        const securityHistoryByDate: Record<string, number> = {}

        for (const metric of measures) {
          for (const entry of metric.history) {
            const date = entry.date.slice(0, 10)
            const value = parseFloat(entry.value || '0')

            if (metric.metric === 'bugs') bugsHistoryByDate[date] = value
            else if (metric.metric === 'code_smells') smellsHistoryByDate[date] = value
            else if (metric.metric === 'security_hotspots') securityHistoryByDate[date] = value
          }
        }

        let lastBugs = 0, lastSmells = 0, lastSecurity = 0
        const bugsByDate: Record<string, number> = {}
        const smellsByDate: Record<string, number> = {}
        const securityByDate: Record<string, number> = {}

        for (const date of dates) {
          if (bugsHistoryByDate[date] !== undefined) lastBugs = bugsHistoryByDate[date]
          if (smellsHistoryByDate[date] !== undefined) lastSmells = smellsHistoryByDate[date]
          if (securityHistoryByDate[date] !== undefined) lastSecurity = securityHistoryByDate[date]

          bugsByDate[date] = lastBugs
          smellsByDate[date] = lastSmells
          securityByDate[date] = lastSecurity
          bugsTotal[date] += lastBugs
          smellsTotal[date] += lastSmells
          securityTotal[date] += lastSecurity
          totals[date] += lastBugs + lastSmells + lastSecurity
        }

        projectDailyBugs.value[sonarProject.key] = bugsByDate
        projectDailySmells.value[sonarProject.key] = smellsByDate
        projectDailySecurity.value[sonarProject.key] = securityByDate
      } catch (err) {
        projectErrorCount++
        const msg = getApiErrorMessage(err)
        if (!firstProjectError) {
          firstProjectError = `Projet "${sonarProject.name}": ${msg}`
        }
        console.warn(`Error for project ${sonarProject.name}`, err)
      }
    })

    dailyBugs.value = bugsTotal
    dailyCodeSmells.value = smellsTotal
    dailySecurityHotspots.value = securityTotal
    dailyTotals.value = totals

    if (firstProjectError) {
      warningMessage.value =
        projectErrorCount > 1
          ? `Certaines métriques n'ont pas pu être chargées (${projectErrorCount} projets). Première erreur: ${firstProjectError}`
          : `Certaines métriques n'ont pas pu être chargées. Détail: ${firstProjectError}`
    }

  } catch (error) {
    console.error('Error while loading Sonar projects:', error)
    errorMessage.value = getApiErrorMessage(error)
    projects.value = []
    dailyBugs.value = {}
    dailyCodeSmells.value = {}
    dailySecurityHotspots.value = {}
    dailyTotals.value = {}
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

const chartData = computed(() => ({
  categories: focusedDates.value,
  bugs: focusedDates.value.map(date => dailyBugs.value[date] ?? 0),
  smells: focusedDates.value.map(date => dailyCodeSmells.value[date] ?? 0),
  security: focusedDates.value.map(date => dailySecurityHotspots.value[date] ?? 0),
  total: focusedDates.value.map(date =>
    (dailyBugs.value[date] ?? 0) +
    (dailyCodeSmells.value[date] ?? 0) +
    (dailySecurityHotspots.value[date] ?? 0)
  ),
}))

const isDarkMode =
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
const lightChartColors = {
  bug: '#f43f5e',
  smell: '#fb7185',
  security: '#fda4af',
  total: '#be123c',
}
const darkChartColors = {
  bug: '#60a5fa',
  smell: '#818cf8',
  security: '#a78bfa',
  total: '#c084fc',
}
const chartColors = isDarkMode ? darkChartColors : lightChartColors
const roseBugColor = chartColors.bug
const roseSmellColor = chartColors.smell
const roseSecurityColor = chartColors.security
const roseTotalColor = chartColors.total
const chartTextColor = isDarkMode ? '#e5e7eb' : '#374151'
const chartGridColor = isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)'

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    foreColor: chartTextColor,
  },
  colors: [roseBugColor, roseSmellColor, roseSecurityColor, roseTotalColor],
  grid: {
    borderColor: chartGridColor,
  },
  xaxis: {
    categories: chartData.value.categories,
    type: 'datetime',
    labels: {
      style: { colors: chartTextColor },
    },
    title: { text: 'Date', style: { color: chartTextColor } },
  },
  yaxis: {
    min: 0,
    labels: {
      style: { colors: chartTextColor },
    },
  },
  tooltip: {
    shared: true,
    custom: function ({ dataPointIndex }: any) {
      const date = chartData.value.categories[dataPointIndex]
      const bugs = chartData.value.bugs[dataPointIndex]
      const smells = chartData.value.smells[dataPointIndex]
      const security = chartData.value.security[dataPointIndex]
      const total = chartData.value.total[dataPointIndex]
      return `
        <div style="padding:10px; min-width:220px; color:#111827;">
          <div style="font-weight:700; margin-bottom:8px; color:#111827;">${date}</div>
          <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:4px; color:#111827;">
            <span style="display:flex; align-items:center; gap:8px;">
              <span style="width:10px; height:10px; background:${roseBugColor}; border-radius:50%; display:inline-block;"></span>
              Bugs
            </span>
            <strong style="color:#111827;">${bugs}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:4px; color:#111827;">
            <span style="display:flex; align-items:center; gap:8px;">
              <span style="width:10px; height:10px; background:${roseSmellColor}; border-radius:50%; display:inline-block;"></span>
              Code Smells
            </span>
            <strong style="color:#111827;">${smells}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:4px; color:#111827;">
            <span style="display:flex; align-items:center; gap:8px;">
              <span style="width:10px; height:10px; background:${roseSecurityColor}; border-radius:50%; display:inline-block;"></span>
              Security Hotspots
            </span>
            <strong style="color:#111827;">${security}</strong>
          </div>
          <div style="border-top:1px solid rgba(0,0,0,.08); padding-top:8px; display:flex; justify-content:space-between; gap:12px;">
            <span style="font-weight:700; color:${roseTotalColor};">Total</span>
            <strong style="color:#111827;">${total}</strong>
          </div>
        </div>
      `
    }
  },
  series: [
    { name: 'Bugs', data: chartData.value.bugs, hidden: true },
    { name: 'Code Smells', data: chartData.value.smells, hidden: true },
    { name: 'Security Hotspots', data: chartData.value.security, hidden: true },
    { name: 'Total Issues', data: chartData.value.total }
  ],
}))

const barSeries = computed(() => {
  const d = pieBarDate.value
  return [
    {
      name: 'Total',
      data: projects.value.map(p => {
        const bugs = projectDailyBugs.value[p.key]?.[d] ?? 0
        const smells = projectDailySmells.value[p.key]?.[d] ?? 0
        const security = projectDailySecurity.value[p.key]?.[d] ?? 0
        return bugs + smells + security
      }),
    },
  ]
})

const barOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    foreColor: chartTextColor,
  },
  colors: [roseTotalColor],
  grid: {
    borderColor: chartGridColor,
  },
  xaxis: {
    categories: projects.value.map(p => p.name),
    labels: {
      style: { colors: chartTextColor },
    },
    title: { text: 'Project', style: { color: chartTextColor } },
  },
  yaxis: {
    labels: {
      style: { colors: chartTextColor },
    },
    title: { text: 'Number of issues', style: { color: chartTextColor } }
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '50%',
    }
  },
  legend: { show: false },
  tooltip: {
    custom: function ({ dataPointIndex }: any) {
      const project = projects.value[dataPointIndex]
      const date = pieBarDate.value

      const bugs = project ? projectDailyBugs.value[project.key]?.[date] ?? 0 : 0
      const smells = project ? projectDailySmells.value[project.key]?.[date] ?? 0 : 0
      const security = project ? projectDailySecurity.value[project.key]?.[date] ?? 0 : 0
      const total = bugs + smells + security

      return `
        <div style="padding:10px; min-width:220px; color:#111827;">
          <div style="font-weight:700; margin-bottom:8px; color:#111827;">${project?.name ?? ''}</div>
          <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:4px; color:#111827;">
            <span style="display:flex; align-items:center; gap:8px;">
              <span style="width:10px; height:10px; background:${roseBugColor}; border-radius:50%; display:inline-block;"></span>
              Bugs
            </span>
            <strong style="color:#111827;">${bugs}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:4px; color:#111827;">
            <span style="display:flex; align-items:center; gap:8px;">
              <span style="width:10px; height:10px; background:${roseSmellColor}; border-radius:50%; display:inline-block;"></span>
              Code Smells
            </span>
            <strong style="color:#111827;">${smells}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; gap:12px; margin-bottom:4px; color:#111827;">
            <span style="display:flex; align-items:center; gap:8px;">
              <span style="width:10px; height:10px; background:${roseSecurityColor}; border-radius:50%; display:inline-block;"></span>
              Security Hotspots
            </span>
            <strong style="color:#111827;">${security}</strong>
          </div>
          <div style="border-top:1px solid rgba(0,0,0,.08); padding-top:8px; display:flex; justify-content:space-between; gap:12px;">
            <span style="font-weight:700; color:${roseTotalColor};">Total</span>
            <strong style="color:#111827;">${total}</strong>
          </div>
        </div>
      `
    },
  }
}))

const pieSeries = computed(() => {
  const selectedDate = pieBarDate.value
  const bugs = dailyBugs.value[selectedDate] || 0
  const smells = dailyCodeSmells.value[selectedDate] || 0
  const security = dailySecurityHotspots.value[selectedDate] || 0
  return [bugs, smells, security]
})

const pieOptions = computed(() => ({
  labels: ['Bugs', 'Code Smells', 'Security Hotspots'],
  colors: [roseBugColor, roseSmellColor, roseSecurityColor],
  chart: {
    type: 'pie',
    foreColor: chartTextColor,
  },
  tooltip: {
    y: {
      formatter: (val: number) => {
        const total = pieSeries.value.reduce((a, b) => a + b, 0)
        if (total === 0) return `${val} (0%)`
        return `${val} (${((val / total) * 100).toFixed(1)}%)`
      }
    }
  },
  legend: {
    position: 'bottom',
    horizontalAlign: 'center',
    labels: {
      colors: chartTextColor,
    },
  },
}))
</script>

<style scoped>
.page-all {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
  min-height: 60vh;
  font-size: 1.05rem;
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.error-card {
  width: min(780px, 100%);
}

.error-title {
  font-weight: 900;
  color: var(--color-accent);
}

.error-details {
  white-space: pre-wrap;
  opacity: 0.95;
}

.error-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.warning-banner {
  padding: 0.9rem 1rem;
  border-left: 4px solid var(--color-accent);
  background: var(--color-background-soft);
  border-radius: 10px;
}

.warning-title {
  font-weight: 900;
  color: var(--color-accent);
  margin-bottom: 0.25rem;
}

.warning-details {
  opacity: 0.95;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.top-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.titles {
  min-width: 260px;
}

.title {
  font-size: 1.65rem;
  font-weight: 800;
}

.subtitle {
  margin-top: 0.35rem;
  color: var(--color-text);
  opacity: 0.9;
}

.range-holder {
  width: min(520px, 100%);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.kpi-card :deep(.p-card-body) {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.kpi-card-total :deep(.p-card-body) {
  border-left: 4px solid var(--color-accent);
  border-top-left-radius: 0;
  padding-left: 1rem;
}

:deep(.kpi-card-total) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.kpi-label {
  font-size: 0.9rem;
  font-weight: 650;
  opacity: 0.9;
  color: var(--color-heading);
}

.kpi-value {
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.1;
  color: var(--color-heading);
}

.kpi-date {
  font-variant-numeric: tabular-nums;
}

.kpi-hint {
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.85;
}

.chart-card {
  width: 100%;
}

.card-title {
  font-weight: 850;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.muted {
  font-weight: 600;
  color: var(--color-text);
  opacity: 0.75;
}

.kpi-date-picker {
  margin-top: 0.5rem;
  /* évite que le datepicker prenne trop de place dans la carte */
  width: 100%;
}

.picker-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 1rem;
}

@media (prefers-color-scheme: dark) {
  .picker-shortcuts :deep(.p-button) {
    color: var(--vt-c-gray-50) !important;
    border-color: var(--color-border) !important;
  }

  .picker-shortcuts :deep(.p-button.p-button-secondary) {
    background: var(--color-background-mute) !important;
  }

  .picker-shortcuts :deep(.p-button.p-button-primary) {
    background: var(--color-accent) !important;
    border-color: var(--color-accent) !important;
    color: #ffffff !important;
  }

  .picker-shortcuts :deep(.p-button.p-button-primary:not(:disabled):hover) {
    background: var(--color-accent-hover) !important;
    border-color: var(--color-accent-hover) !important;
    color: #ffffff !important;
  }

  .picker-shortcuts :deep(.p-button:not(.p-button-primary):not(:disabled):hover) {
    background: var(--color-hover-nav) !important;
    color: var(--vt-c-gray-50) !important;
    border-color: var(--color-border-hover) !important;
  }
}

.chart-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 992px) {
  .chart-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>