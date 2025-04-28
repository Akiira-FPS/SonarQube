<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getSonarHistory } from '@/services/sonar-services';
import type { SonarMetricHistory } from '@/model/sonar-model';

const measures = ref<SonarMetricHistory[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const allMeasures = await getSonarHistory({
      component: 'Front-Vue',
      metrics: 'bugs,code_smells,coverage',
      from: '2024-01-01',
      to: '2025-04-24',
    });

    // Filtrer pour enlever coverage
    measures.value = allMeasures.filter(m => m.metric !== 'coverage');
  } catch (error) {
    console.error('Erreur lors de la récupération des mesures Sonar :', error);
  } finally {
    isLoading.value = false;
  }
});

// 👉 Formater une date ISO
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

// 👉 Graphique combiné (global) — computed pour éviter problème 'null'
const combinedChartOptions = computed(() => {
  if (measures.value.length === 0) return null;

  const categories = measures.value[0].history.map(h => formatDate(h.date));

  const series = measures.value.map(measure => ({
    name: measure.metric,
    data: measure.history.map(h => parseFloat(h.value))
  }));

  return {
    chart: {
      type: 'line',
      toolbar: { show: false }
    },
    xaxis: {
      categories,
      title: { text: 'Date' }
    },
    yaxis: {
      title: { text: 'Valeur' }
    },
    series
  };
});

// 👉 Graphique individuel par métrique
const getChartOptions = (measure: SonarMetricHistory) => {
  return {
    chart: {
      type: 'line',
      toolbar: { show: false }
    },
    xaxis: {
      categories: measure.history.map(h => formatDate(h.date)),
      title: { text: 'Date' }
    },
    yaxis: {
      title: { text: measure.metric }
    },
    series: [
      {
        name: measure.metric,
        data: measure.history.map(h => parseFloat(h.value))
      }
    ]
  };
};
</script>

<template>
  <div class="page-container">
    <div v-if="isLoading" class="text-center mt-10 text-xl" style="color: var(--color-text);">
      Chargement...
    </div>

    <div v-else>
      <!-- Carte Vue d'ensemble -->
      <div class="card-elevated mb-6" v-if="combinedChartOptions">
        <h2 class="text-center mb-3 text-2xl">
          Vue d'ensemble des métriques
        </h2>
        <ApexChart type="line" height="400" width="100%" :options="combinedChartOptions"
          :series="combinedChartOptions.series" />
      </div>

      <!-- LISTE DES PETITES CARTES -->
      <div class="cards-container">
        <div v-for="measure in measures" :key="measure.metric" class="card-elevated">
          <h3 class="text-center mb-3 text-xl">
            {{ measure.metric }}
          </h3>
          <ApexChart type="line" height="300" width="100%" :options="getChartOptions(measure)"
            :series="getChartOptions(measure).series" />
        </div>
      </div>
    </div>
  </div>
</template>