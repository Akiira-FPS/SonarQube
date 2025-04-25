import { createRouter, createWebHistory } from 'vue-router'
import All from '../views/All.vue'
import Front from '@/views/Front.vue'
import MYZ from '@/views/MYZ.vue'
import ZDE from '@/views/ZDE.vue'
import ZFW from '@/views/ZFW.vue'
import ZHB from '@/views/ZHB.vue'
import ZQM from '@/views/ZQM.vue'
import ZRP from '@/views/ZRP.vue'
import ZSA from '@/views/ZSA.vue'
import ZSI from '@/views/ZSI.vue'
import ZUP from '@/views/ZUP.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/all',
      name: 'all',
      component: All,
    },
    {
      path: '/frontvue',
      name: 'frontvue',
      component: Front,
    },
    {
      path: '/myz',
      name: 'myz',
      component: MYZ,
    },
    {
      path: '/zde',
      name: 'zde',
      component: ZDE,
    },
    {
      path: '/zfw',
      name: 'zfw',
      component: ZFW,
    },{
      path: '/zhb',
      name: 'zhb',
      component: ZHB,
    },
    {
      path: '/zqm',
      name: 'zqm',
      component: ZQM,
    },
    {
      path: '/zrp',
      name: 'zrp',
      component: ZRP,
    },
    {
      path: '/zsa',
      name: 'zsa',
      component: ZSA,
    },
    
    {
      path: '/zsi',
      name: 'zsi',
      component: ZSI,
    },
    {
      path: '/zup',
      name: 'zup',
      component: ZUP,
    },
  ],
})

export default router
