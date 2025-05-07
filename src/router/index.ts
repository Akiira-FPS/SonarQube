import { createRouter, createWebHistory } from 'vue-router'
import All from '../views/All.vue'
import ProjectStats from '../views/ProjectStats.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/all',
      name: 'all',
      component: All,
    },
    {
      path: '/project/:key',
      name: 'ProjectStats',
      component: ProjectStats,
    },
  ],
})

export default router
