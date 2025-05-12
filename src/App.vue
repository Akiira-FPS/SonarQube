<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { ref, onMounted } from 'vue';
import { getSonarProjects } from '@/services/sonar-services';
import type { SonarProject } from '@/model/sonar-model';

const projects = ref<SonarProject[]>([]);

onMounted(async () => {
  try {
    projects.value = await getSonarProjects();
  } catch (error) {
    console.error('Erreur lors de la récupération des projets Sonar', error);
  }
});
</script>

<template>
  <header class="app-header">
    <nav class="navbar">
      <RouterLink to="/">All Stats</RouterLink>
      <template v-for="project in projects" :key="project.key">
        <RouterLink :to="`/project/${project.key}`">{{ project.name }}</RouterLink>
      </template>
    </nav>
  </header>

  <main class="app-main">
    <RouterView />
  </main>
</template>

<style scoped>
:root {
  --navbar-height: auto;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.app-header {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  background-color: var(--color-navbar-background);
  border-bottom: 1px solid var(--color-border);
  z-index: 1000;
  padding: 1rem 2rem;
  transition: background-color 0.5s, border-color 0.5s;
}

.navbar {
  display: flex;
  flex-wrap: nowrap;
  gap: 1rem;
  overflow-x: auto;
  white-space: nowrap;
  max-width: 100%;
  justify-content: center;
}

nav a {
  color: var(--color-navbar-text);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: background-color 0.2s ease, color 0.5s;
  border-radius: 5px;
}

nav a.router-link-exact-active {
  border-bottom: 2px solid var(--color-accent);
}

nav a:hover {
  background-color: var(--color-hover-nav);
  color: var(--vt-c-gray-900);
}

.app-main {
  padding: 2rem;
  overflow-y: auto;
}
</style>