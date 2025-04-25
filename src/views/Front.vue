<script setup lang="ts">
import type { SonarHistoryFilters } from "@/model/sonar-model.ts";
import { getSonarHistory } from "../services/sonar-services.ts"

const filters: SonarHistoryFilters = {
  component: "Front-Vue", // ID du projet Sonar
  metrics: "bugs,code_smells,coverage", // Sépare par virgule
  from: "2024-01-01",
  to: "2025-04-24"
};

getSonarHistory(filters).then((data) => {
  console.log("Sonar history:", data);
}).catch((err) => {
  console.error("Erreur lors de l'appel à l'API Sonar:", err);
});

</script>

<template>
  <main>
    Bienvenue
  </main>
</template>