import { createRouter, createWebHistory } from 'vue-router'
import All from '../views/All.vue'
import ProjectStats from '../views/ProjectStats.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'all',
      component: All,
      meta: { title: 'SonarVue - All Stats' },
    },
    {
      path: '/project/:key',
      name: 'ProjectStats',
      component: ProjectStats,
      meta: { title: 'SonarVue - ' },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const baseTitle = (to.meta.title as string) || 'SonarVue'

  if (to.name === 'ProjectStats' && to.params.key) {
    document.title = `${baseTitle}${to.params.key}`
  } else {
    document.title = baseTitle
  }

  next()
})

export default router
