<template>
  <div class="page-project">
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
            <Button label="Réessayer" severity="danger" :outlined="true" @click="loadData(projectKey)" />
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="content">
      <div class="top-header">
        <div class="titles">
          <h1 class="title">Statistics: {{ projectKey }}</h1>
          <p class="subtitle">Trend of bugs, code smells and security hotspots over the selected period.</p>
        </div>
      </div>

      <div class="kpi-grid">
        <Card class="kpi-card">
          <template #content>
            <div class="kpi-label">Branch</div>
            <Select v-model="selectedBranch" :options="branches" optionLabel="name" optionValue="name" fluid @change="loadData(projectKey)" />
          </template>
        </Card>

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
              <Button size="small" label="Custom" :severity="activePreset === 'custom' ? 'primary' : 'secondary'"
                :outlined="activePreset !== 'custom'" @click="toggleCustomRange" />
              <Popover ref="customRangePopover">
                <DatePicker v-model="customRange" selectionMode="range" :manualInput="false" :maxDate="today" inline
                  @update:modelValue="applyCustomRange" />
              </Popover>
            </div>
          </template>
        </Card>

        <Card class="kpi-card">
          <template #content>
            <div class="kpi-label">Bugs</div>
            <div class="kpi-value-row">
              <div class="kpi-value">{{ currentBugs }}</div>
              <div class="kpi-change-breakdown">
                <span class="kpi-delta kpi-delta-negative">+{{ bugsChanges.added }}</span>
                <span class="kpi-delta kpi-delta-positive">-{{ bugsChanges.removed }}</span>
              </div>
            </div>
          </template>
        </Card>

        <Card class="kpi-card">
          <template #content>
            <div class="kpi-label">Code Smells</div>
            <div class="kpi-value-row">
              <div class="kpi-value">{{ currentSmells }}</div>
              <div class="kpi-change-breakdown">
                <span class="kpi-delta kpi-delta-negative">+{{ smellsChanges.added }}</span>
                <span class="kpi-delta kpi-delta-positive">-{{ smellsChanges.removed }}</span>
              </div>
            </div>
          </template>
        </Card>

        <Card class="kpi-card">
          <template #content>
            <div class="kpi-label">Security Hotspots</div>
            <div class="kpi-value-row">
              <div class="kpi-value">{{ currentHotspots }}</div>
              <div class="kpi-change-breakdown">
                <span class="kpi-delta kpi-delta-negative">+{{ hotspotsChanges.added }}</span>
                <span class="kpi-delta kpi-delta-positive">-{{ hotspotsChanges.removed }}</span>
              </div>
            </div>
          </template>
        </Card>

        <Card class="kpi-card kpi-card-total">
          <template #content>
            <div class="kpi-label">Total</div>
            <div class="kpi-value-row">
              <div class="kpi-value">{{ currentTotal }}</div>
              <div class="kpi-change-breakdown">
                <span class="kpi-delta kpi-delta-negative">+{{ totalChanges.added }}</span>
                <span class="kpi-delta kpi-delta-positive">-{{ totalChanges.removed }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <Card class="chart-card">
        <template #title>
          <div class="card-title">Total issues (trend)</div>
        </template>
        <template #content>
          <ApexChart :key="chartKey" type="line" height="580px" width="100%" :options="chartOptions" :series="chartOptions.series" />
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getApiErrorMessage, getSonarHistory, getSonarBranches } from '@/services/sonar-services';
import type { SonarBranch } from '@/model/sonar-model';
import { format, eachDayOfInterval } from 'date-fns';

const route = useRoute();

const branches = ref<SonarBranch[]>([])
const selectedBranch = ref('')
const projectKey = ref(route.params.key as string);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const today = new Date()
const lastYear = new Date()
lastYear.setFullYear(today.getFullYear() - 1)

type DateRange = { start: Date; end: Date }
type RangePreset = 'day' | 'week' | 'month' | 'year' | 'custom'

const dateRange = ref({
  start: lastYear,
  end: today,
})
const viewRange = ref<DateRange>({ start: lastYear, end: today })
const zoomRange = ref<DateRange | null>(null)
const activePreset = ref<RangePreset>('year')
const presetBeforeZoom = ref<RangePreset | null>(null)
const customRange = ref<(Date | null)[] | null>(null)
const customRangePopover = ref<{ toggle: (event: Event) => void; hide: () => void } | null>(null)
const chartKey = ref(0)

function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function subtractPeriod(date: Date, preset: Exclude<RangePreset, 'custom'>): Date {
  const start = new Date(date)
  if (preset === 'day') start.setDate(start.getDate() - 1)
  if (preset === 'week') start.setDate(start.getDate() - 7)
  if (preset === 'month') start.setMonth(start.getMonth() - 1)
  if (preset === 'year') start.setFullYear(start.getFullYear() - 1)
  return start
}

function containsRange(outer: DateRange, inner: DateRange): boolean {
  return outer.start.getTime() <= inner.start.getTime() && outer.end.getTime() >= inner.end.getTime()
}

function expandRange(outer: DateRange, inner: DateRange): DateRange {
  return {
    start: outer.start.getTime() <= inner.start.getTime() ? outer.start : inner.start,
    end: outer.end.getTime() >= inner.end.getTime() ? outer.end : inner.end,
  }
}

const allDates = computed(() =>
  eachDayOfInterval({ start: dateRange.value.start, end: dateRange.value.end }).map(d =>
    format(d, 'yyyy-MM-dd')
  )
);

const focusedDates = computed(() => {
  const start = format(viewRange.value.start, 'yyyy-MM-dd')
  const end = format(viewRange.value.end, 'yyyy-MM-dd')
  return allDates.value.filter((date) => date >= start && date <= end)
})

const changeDates = computed(() => {
  const range = zoomRange.value ?? viewRange.value
  const start = format(range.start, 'yyyy-MM-dd')
  const end = format(range.end, 'yyyy-MM-dd')
  return allDates.value.filter((date) => date >= start && date <= end)
})

const lastDate = computed(() => format((zoomRange.value ?? viewRange.value).end, 'yyyy-MM-dd'))

const dailyBugs = ref<Record<string, number>>({})
const dailySmells = ref<Record<string, number>>({})
const dailyTotal = ref<Record<string, number>>({})
const dailyHotspots = ref<Record<string, number>>({});

const currentBugs = computed(() => (lastDate.value ? dailyBugs.value[lastDate.value] : 0) ?? 0)
const currentSmells = computed(() => (lastDate.value ? dailySmells.value[lastDate.value] : 0) ?? 0)
const currentHotspots = computed(() => (lastDate.value ? dailyHotspots.value[lastDate.value] : 0) ?? 0)
const currentTotal = computed(() => (lastDate.value ? dailyTotal.value[lastDate.value] : 0) ?? 0)

function metricChanges(values: Record<string, number>) {
  const periodDates = changeDates.value
  if (periodDates.length < 2) return { added: 0, removed: 0 }

  let previous = values[periodDates[0]] ?? 0
  let added = 0
  let removed = 0

  for (const date of periodDates.slice(1)) {
    const current = values[date] ?? previous
    const delta = current - previous

    if (delta > 0) added += delta
    else if (delta < 0) removed += Math.abs(delta)

    previous = current
  }

  return { added, removed }
}

const bugsChanges = computed(() => metricChanges(dailyBugs.value))
const smellsChanges = computed(() => metricChanges(dailySmells.value))
const hotspotsChanges = computed(() => metricChanges(dailyHotspots.value))
const totalChanges = computed(() => ({
  added: bugsChanges.value.added + smellsChanges.value.added + hotspotsChanges.value.added,
  removed: bugsChanges.value.removed + smellsChanges.value.removed + hotspotsChanges.value.removed,
}))

async function applyRangePreset(preset: Exclude<RangePreset, 'custom'>) {
  const end = normalizeDate(today)
  const range = { start: normalizeDate(subtractPeriod(end, preset)), end }

  activePreset.value = preset
  presetBeforeZoom.value = null
  customRange.value = null
  viewRange.value = range
  zoomRange.value = null
  chartKey.value++

  if (!containsRange(dateRange.value, range)) {
    dateRange.value = expandRange(dateRange.value, range)
    await loadData(projectKey.value)
  }
}

function toggleCustomRange(event: Event) {
  customRangePopover.value?.toggle(event)
}

async function applyCustomRange(value: Date | Date[] | (Date | null)[] | null | undefined) {
  if (!Array.isArray(value) || !value[0] || !value[1]) return

  const first = normalizeDate(value[0])
  const second = normalizeDate(value[1])
  const range =
    first.getTime() <= second.getTime()
      ? { start: first, end: second }
      : { start: second, end: first }

  activePreset.value = 'custom'
  presetBeforeZoom.value = null
  viewRange.value = range
  zoomRange.value = null
  chartKey.value++
  customRangePopover.value?.hide()

  if (!containsRange(dateRange.value, range)) {
    dateRange.value = expandRange(dateRange.value, range)
    await loadData(projectKey.value)
  }
}

function clampToView(date: Date): Date {
  const timestamp = date.getTime()
  if (timestamp < viewRange.value.start.getTime()) return viewRange.value.start
  if (timestamp > viewRange.value.end.getTime()) return viewRange.value.end
  return date
}

function handleChartZoom(_chartContext: unknown, { xaxis }: { xaxis?: { min?: number; max?: number } }) {
  if (!Number.isFinite(xaxis?.min) || !Number.isFinite(xaxis?.max)) return

  const start = normalizeDate(clampToView(new Date(xaxis!.min!)))
  const end = normalizeDate(clampToView(new Date(xaxis!.max!)))
  if (start.getTime() > end.getTime()) return

  if (zoomRange.value === null) {
    presetBeforeZoom.value = activePreset.value
  }

  activePreset.value = 'custom'
  customRange.value = [start, end]
  zoomRange.value = { start, end }
}

function handleChartResetZoom() {
  zoomRange.value = null

  if (presetBeforeZoom.value) {
    activePreset.value = presetBeforeZoom.value
    if (presetBeforeZoom.value !== 'custom') customRange.value = null
    presetBeforeZoom.value = null
  }

  return {
    xaxis: {
      min: viewRange.value.start.getTime(),
      max: viewRange.value.end.getTime(),
    },
  }
}

async function loadData(key: string) {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    if (branches.value.length === 0) {
      branches.value = await getSonarBranches(key)
      selectedBranch.value =
        branches.value.find((branch) => branch.isMain)?.name ?? branches.value[0]?.name ?? ''
    }

    const response = await getSonarHistory({
      component: key,
      metrics: 'bugs,code_smells,security_hotspots',
      branch: selectedBranch.value || undefined,
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

    let lastBugs = 0, lastSmells = 0, lastHotspots = 0;
    const bugs: Record<string, number> = {};
    const smells: Record<string, number> = {};
    const hotspots: Record<string, number> = {};
    const total: Record<string, number> = {};

    for (const date of allDates.value) {
      const m = grouped[date] || {};
      if (m.bugs !== undefined) lastBugs = m.bugs;
      if (m.code_smells !== undefined) lastSmells = m.code_smells;
      if (m.security_hotspots !== undefined) lastHotspots = m.security_hotspots;
      bugs[date] = lastBugs;
      smells[date] = lastSmells;
      hotspots[date] = lastHotspots;
      total[date] = lastBugs + lastSmells + lastHotspots;
    }

    dailyBugs.value = bugs;
    dailySmells.value = smells;
    dailyHotspots.value = hotspots;
    dailyTotal.value = total;
  } catch (err) {
    console.error('Metrics loading error:', err);
    errorMessage.value = getApiErrorMessage(err);
  } finally {
    isLoading.value = false;
  }
}

watch(() => route.params.key, newKey => {
  if (typeof newKey === 'string') {
    projectKey.value = newKey;
    branches.value = [];
    selectedBranch.value = '';
    zoomRange.value = null;
    chartKey.value++;
    loadData(newKey);
  }
});

onMounted(() => loadData(projectKey.value));

const chartData = computed(() => ({
  categories: focusedDates.value,
  bugs: focusedDates.value.map(date => dailyBugs.value[date] ?? 0),
  smells: focusedDates.value.map(date => dailySmells.value[date] ?? 0),
  total: focusedDates.value.map(date => dailyTotal.value[date] ?? 0),
  hotspots: focusedDates.value.map(date => dailyHotspots.value[date] ?? 0),
}));

const isDarkMode =
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
const lightChartColors = {
  bug: '#f43f5e',
  smell: '#fb7185',
  security: '#fda4af',
  total: '#be123c',
};
const darkChartColors = {
  bug: '#60a5fa',
  smell: '#818cf8',
  security: '#a78bfa',
  total: '#c084fc',
};
const chartColors = isDarkMode ? darkChartColors : lightChartColors;
const roseBugColor = chartColors.bug;
const roseSmellColor = chartColors.smell;
const roseSecurityColor = chartColors.security;
const roseTotalColor = chartColors.total;
const chartTextColor = isDarkMode ? '#e5e7eb' : '#111827'
const chartGridColor = isDarkMode ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)'

const chartOptions = computed(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: {
      enabled: true,
      type: 'x',
      autoScaleYaxis: true,
    },
    events: {
      zoomed: handleChartZoom,
      beforeResetZoom: handleChartResetZoom,
    },
    foreColor: chartTextColor,
  },
  colors: [roseBugColor, roseSmellColor, roseSecurityColor, roseTotalColor],
  grid: {
    borderColor: chartGridColor,
  },
  legend: { show: false },
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
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  tooltip: {
    shared: true,
    custom: function ({ dataPointIndex }: any) {
      const date = chartData.value.categories[dataPointIndex];
      const bugs = chartData.value.bugs[dataPointIndex];
      const smells = chartData.value.smells[dataPointIndex];
      const total = chartData.value.total[dataPointIndex];
      const hotspots = chartData.value.hotspots[dataPointIndex];
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
            <strong style="color:#111827;">${hotspots}</strong>
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
    { name: 'Security Hotspots', data: chartData.value.hotspots, hidden: true },
    { name: 'Total Issues', data: chartData.value.total }
  ]
}));
</script>

<style scoped>
.page-project {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
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

.picker-shortcuts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
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
  padding-left: 1rem;
}

.kpi-label {
  font-size: 0.9rem;
  font-weight: 650;
  opacity: 0.9;
}

.kpi-value {
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.1;
}

.kpi-value-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.kpi-change-breakdown {
  display: flex;
  gap: 0.25rem;
}

.kpi-delta {
  font-size: 0.85rem;
  font-weight: 800;
  border-radius: 999px;
  padding: 0.2rem 0.5rem;
  line-height: 1;
}

.kpi-delta-positive {
  color: #166534;
  background: rgba(34, 197, 94, 0.18);
}

.kpi-delta-negative {
  color: #991b1b;
  background: rgba(239, 68, 68, 0.18);
}

@media (prefers-color-scheme: dark) {
  .kpi-delta-positive {
    color: #86efac;
    background: rgba(34, 197, 94, 0.28);
  }

  .kpi-delta-negative {
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.3);
  }
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
}
</style>