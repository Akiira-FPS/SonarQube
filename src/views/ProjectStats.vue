<template>
  <div v-if="isLoading" class="loading">Chargement...</div>

  <div v-else class="chart-container">
    <DateRangePicker @update:range="handleRangeUpdate" />
    <div class="card-elevated">
      <h2 class="text-center mb-3 text-2xl">Statistiques : {{ projectKey }}</h2>
      <ApexChart type="line" width="100%" height="90%" style="flex: 1;" :options="chartOptions"
        :series="chartOptions.series" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSonarHistory } from '@/services/sonar-services';
import { format, eachDayOfInterval } from 'date-fns';

const route = useRoute();
const projectKey = ref(route.params.key as string);
const isLoading = ref(false);

const today = new Date()
const lastYear = new Date()
lastYear.setFullYear(today.getFullYear() - 1)

const dateRange = ref({
  start: lastYear,
  end: today,
})

const allDates = computed(() =>
  eachDayOfInterval({ start: dateRange.value.start, end: dateRange.value.end }).map(d =>
    format(d, 'yyyy-MM-dd')
  )
);

function handleRangeUpdate(range: any) {
  dateRange.value = range
}

const dailyBugs = ref<Record<string, number>>({})
const dailySmells = ref<Record<string, number>>({})
const dailyTotal = ref<Record<string, number>>({})

async function loadData(key: string) {
  isLoading.value = true;
  try {
    const response = await getSonarHistory({
      component: key,
      metrics: 'bugs,code_smells',
      from: format(dateRange.value.start, 'yyyy-MM-dd'),
      to: format(dateRange.value.end, 'yyyy-MM-dd'),
    });

    const grouped = response.reduce((acc: any, metric: any) => {
      for (const entry of metric.history) {
        const date = entry.date.slice(0, 10);
        acc[date] ??= {};
        acc[date][metric.metric] = parseFloat(entry.value || '0');
      }
      return acc;
    }, {});

    let lastBugs = 0, lastSmells = 0;
    const bugs: Record<string, number> = {};
    const smells: Record<string, number> = {};
    const total: Record<string, number> = {};

    for (const date of allDates.value) {
      const m = grouped[date] || {};
      if (m.bugs !== undefined) lastBugs = m.bugs;
      if (m.code_smells !== undefined) lastSmells = m.code_smells;
      bugs[date] = lastBugs;
      smells[date] = lastSmells;
      total[date] = lastBugs + lastSmells;
    }

    dailyBugs.value = bugs;
    dailySmells.value = smells;
    dailyTotal.value = total;
  } catch (err) {
    console.error('Erreur chargement métriques:', err);
  } finally {
    isLoading.value = false;
  }
}

watch(() => route.params.key, newKey => {
  if (typeof newKey === 'string') {
    projectKey.value = newKey;
    loadData(newKey);
  }
});

onMounted(() => loadData(projectKey.value));

const chartData = computed(() => ({
  categories: allDates.value,
  bugs: allDates.value.map(date => dailyBugs.value[date] ?? 0),
  smells: allDates.value.map(date => dailySmells.value[date] ?? 0),
  total: allDates.value.map(date => dailyTotal.value[date] ?? 0),
}));

const chartOptions = computed(() => ({
  chart: { type: 'line', toolbar: { show: false } },
  legend: { show: true },
  xaxis: {
    categories: chartData.value.categories,
    type: 'datetime',
    title: { text: 'Date' },
  },
  tooltip: {
    shared: true,
    custom: function ({ dataPointIndex }: any) {
      const date = chartData.value.categories[dataPointIndex];
      const bugs = chartData.value.bugs[dataPointIndex];
      const smells = chartData.value.smells[dataPointIndex];
      const total = chartData.value.total[dataPointIndex];
      return `
        <div style="padding:8px;">
          <strong>${date}</strong><br/>
          🐞 Bugs: ${bugs}<br/>
          💨 Code Smells: ${smells}<br/>
          🧮 <strong>Total: ${total}</strong>
        </div>
      `
    }
  },
  series: [
    { name: 'Bugs', data: chartData.value.bugs, hidden: true },
    { name: 'Code Smells', data: chartData.value.smells, hidden: true },
    { name: 'Total Issues', data: chartData.value.total }
  ]
}));
</script>

<style scoped>
.project-stats {
  padding: 1rem;
}

.loading {
  text-align: center;
  font-size: 1.2rem;
}

.chart-container {
  height: 100%;
}

.card-elevated {
  flex: 1;
}
</style>