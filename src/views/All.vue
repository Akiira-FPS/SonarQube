<template>
  <div v-if="isLoading" class="loading">Chargement...</div>

  <div v-else class="chart-container">
    <DateRangePicker @update:range="handleRangeUpdate" />

    <div class="line-chart card-elevated">
      <h2 class="text-center mb-3 text-2xl">Total issues :</h2>
      <ApexChart type="line" height="500px" width="100%" :options="chartOptions" :series="chartOptions.series" />
    </div>

    <hr class="my-6 border-t border-gray-300" />

    <div class="mb-4 text-center">
      <DateRangePicker @update:range="handleSingleDateUpdate" :single="true" />
    </div>

    <div class="other-chart">
      <div class="card-elevated">
        <h3 class="text-center mb-2 text-xl">Issues par projet</h3>
        <ApexChart type="bar" height="500px" :options="barOptions" :series="barSeries" />
      </div>

      <div class="card-elevated">
        <h3 class="text-center mb-2 text-xl">Répartition bugs vs code smells vs security</h3>
        <ApexChart type="pie" height="500px" :options="pieOptions" :series="pieSeries" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getSonarProjects, getSonarHistory } from '@/services/sonar-services'
import type { SonarMetricHistory } from '@/model/sonar-model'
import { format, eachDayOfInterval } from 'date-fns'
import DateRangePicker from '../components/DateRangePicker.vue'

const isLoading = ref(false)
const dailyBugs = ref<Record<string, number>>({})
const dailyCodeSmells = ref<Record<string, number>>({})
const dailySecurityHotspots = ref<Record<string, number>>({})
const dailyTotals = ref<Record<string, number>>({})
const issuesPerProject = ref<Record<string, number>>({})
const issuesPerProjectDaily = ref<Record<string, number>>({})

const today = new Date()
const oneMonthAgo = new Date()
oneMonthAgo.setMonth(today.getMonth() - 1)

const dateRange = ref({ start: oneMonthAgo, end: today })
const pieBarDate = ref(format(today, 'yyyy-MM-dd'))

const allDates = computed(() =>
  eachDayOfInterval({ start: dateRange.value.start, end: dateRange.value.end }).map(d =>
    format(d, 'yyyy-MM-dd')
  )
)

const projectDailyBugs = ref<Record<string, Record<string, number>>>({})
const projectDailySmells = ref<Record<string, Record<string, number>>>({})
const projectDailySecurity = ref<Record<string, Record<string, number>>>({})

watch(pieBarDate, () => {
  const updated: Record<string, number> = {}
  const projects = Object.keys(issuesPerProject.value)

  for (const project of projects) {
    const key = Object.keys(projectDailyBugs.value).find(k => k.includes(project))
    if (key) {
      const bugs = projectDailyBugs.value[key]?.[pieBarDate.value] ?? 0
      const smells = projectDailySmells.value[key]?.[pieBarDate.value] ?? 0
      const security = projectDailySecurity.value[key]?.[pieBarDate.value] ?? 0
      updated[project] = bugs + smells + security
    }
  }

  issuesPerProjectDaily.value = updated
})

async function loadData() {
  isLoading.value = true
  try {
    const sonarProjects = await getSonarProjects()
    projectDailyBugs.value = {}
    projectDailySmells.value = {}
    projectDailySecurity.value = {}
    issuesPerProject.value = {}

    for (const sonarProject of sonarProjects) {
      try {
        const measures: SonarMetricHistory[] = await getSonarHistory({
          component: sonarProject.key,
          metrics: 'bugs,code_smells,security_hotspots',
          from: format(dateRange.value.start, 'yyyy-MM-dd'),
          to: format(dateRange.value.end, 'yyyy-MM-dd'),
        })

        const metricMap: Record<string, Record<string, number>> = {}
        for (const metric of measures) {
          for (const entry of metric.history) {
            const date = entry.date.slice(0, 10)
            const value = parseFloat(entry.value || '0')
            metricMap[date] ??= {}
            metricMap[date][metric.metric] = value
          }
        }

        let lastBugs = 0, lastSmells = 0, lastSecurity = 0
        const bugsByDate: Record<string, number> = {}
        const smellsByDate: Record<string, number> = {}
        const securityByDate: Record<string, number> = {}

        for (const date of allDates.value) {
          const metrics = metricMap[date] ?? {}
          if (metrics['bugs'] !== undefined) lastBugs = metrics['bugs']
          if (metrics['code_smells'] !== undefined) lastSmells = metrics['code_smells']
          if (metrics['security_hotspots'] !== undefined) lastSecurity = metrics['security_hotspots']
          bugsByDate[date] = lastBugs
          smellsByDate[date] = lastSmells
          securityByDate[date] = lastSecurity
        }

        projectDailyBugs.value[sonarProject.key] = bugsByDate
        projectDailySmells.value[sonarProject.key] = smellsByDate
        projectDailySecurity.value[sonarProject.key] = securityByDate

        const firstDate = allDates.value[0]
        const lastDate = allDates.value[allDates.value.length - 1]
        const bugsDelta = (bugsByDate[lastDate] ?? 0) - (bugsByDate[firstDate] ?? 0)
        const smellsDelta = (smellsByDate[lastDate] ?? 0) - (smellsByDate[firstDate] ?? 0)
        const securityDelta = (securityByDate[lastDate] ?? 0) - (securityByDate[firstDate] ?? 0)
        const totalIssues = bugsDelta + smellsDelta + securityDelta

        issuesPerProject.value[sonarProject.name] = totalIssues

      } catch (err) {
        console.warn(`Erreur pour le projet ${sonarProject.name}`, err)
      }
    }

    const bugsTotal: Record<string, number> = {}
    const smellsTotal: Record<string, number> = {}
    const securityTotal: Record<string, number> = {}
    const totals: Record<string, number> = {}

    for (const date of allDates.value) {
      const bugsSum = Object.values(projectDailyBugs.value).reduce((sum, daily) => sum + (daily[date] || 0), 0)
      const smellsSum = Object.values(projectDailySmells.value).reduce((sum, daily) => sum + (daily[date] || 0), 0)
      const securitySum = Object.values(projectDailySecurity.value).reduce((sum, daily) => sum + (daily[date] || 0), 0)
      bugsTotal[date] = bugsSum
      smellsTotal[date] = smellsSum
      securityTotal[date] = securitySum
      totals[date] = bugsSum + smellsSum + securitySum
    }

    dailyBugs.value = bugsTotal
    dailyCodeSmells.value = smellsTotal
    dailySecurityHotspots.value = securityTotal
    dailyTotals.value = totals

    const updated: Record<string, number> = {}
    const sonarProjectsList = Object.keys(issuesPerProject.value)

    for (const project of sonarProjectsList) {
      const key = Object.keys(projectDailyBugs.value).find(k => k.includes(project))
      if (key) {
        const bugs = projectDailyBugs.value[key]?.[pieBarDate.value] ?? 0
        const smells = projectDailySmells.value[key]?.[pieBarDate.value] ?? 0
        const security = projectDailySecurity.value[key]?.[pieBarDate.value] ?? 0
        updated[project] = bugs + smells + security
      }
    }

    issuesPerProjectDaily.value = updated

  } catch (error) {
    console.error('Erreur lors de la récupération des projets Sonar :', error)
  } finally {
    isLoading.value = false
  }
}

function handleRangeUpdate(newRange: { start: Date; end: Date }) {
  dateRange.value = newRange
}

function handleSingleDateUpdate(newRange: { start: Date }) {
  pieBarDate.value = format(newRange.start, 'yyyy-MM-dd')
}

onMounted(loadData)

const chartData = computed(() => ({
  categories: allDates.value,
  bugs: allDates.value.map(date => dailyBugs.value[date] ?? 0),
  smells: allDates.value.map(date => dailyCodeSmells.value[date] ?? 0),
  security: allDates.value.map(date => dailySecurityHotspots.value[date] ?? 0),
  total: allDates.value.map(date =>
    (dailyBugs.value[date] ?? 0) +
    (dailyCodeSmells.value[date] ?? 0) +
    (dailySecurityHotspots.value[date] ?? 0)
  ),
}))

const chartOptions = computed(() => ({
  chart: { type: 'line', toolbar: { show: false } },
  xaxis: {
    categories: chartData.value.categories,
    type: 'datetime',
    title: { text: 'Date' },
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
        <div style="padding:8px;">
          <strong>${date}</strong><br/>
          🐞 Bugs: ${bugs}<br/>
          💨 Code Smells: ${smells}<br/>
          🔐 Security Hotspots: ${security}<br/>
          <strong>🧮 Total: ${total}</strong>
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
  const selectedDate = pieBarDate.value
  const projectNames = Object.keys(issuesPerProjectDaily.value)

  return projectNames.map(project => {
    const data = projectNames.map(p =>
      p === project
        ? (projectDailyBugs.value[p]?.[selectedDate] ?? 0) +
        (projectDailySmells.value[p]?.[selectedDate] ?? 0) +
        (projectDailySecurity.value[p]?.[selectedDate] ?? 0)
        : 0
    )
    return {
      name: project,
      data
    }
  })
})

const barOptions = computed(() => ({
  chart: {
    type: 'bar',
    stacked: true,
    toolbar: { show: false }
  },
  xaxis: {
    categories: Object.keys(issuesPerProjectDaily.value),
    title: { text: 'Projet' },
  },
  yaxis: {
    title: { text: 'Nombre de problèmes' }
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '60%',
    }
  },
  legend: {
    position: 'top'
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} problèmes`
    }
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
  labels: ['🐞 Bugs', '💨 Code Smells', '🔐 Security Hotspots'],
  chart: {
    type: 'pie',
  },
  tooltip: {
    y: {
      formatter: (val: number) => {
        const total = pieSeries.value.reduce((a, b) => a + b, 0)
        return `${val} (${((val / total) * 100).toFixed(1)}%)`
      }
    }
  },
  legend: {
    position: 'bottom',
    horizontalAlign: 'center',
  },
}))
</script>

<style scoped>
.loading {
  text-align: center;
  font-size: 1.2rem;
  margin-top: 2rem;
}

.other-chart {
  display: flex;
  gap: 1.5rem;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>