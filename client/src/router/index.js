import { createRouter, createWebHistory } from 'vue-router';
import Register from '@/views/Register.vue';
import CirclesList from '@/views/Circles.vue';
import CircleDetail from '@/views/CircleDetail.vue';
import VenueMap from '@/views/VenueMap.vue';
import OcrViewer from '@/views/OcrViewer.vue';


const routes = [
  {
    path: '/',
    name: 'Register',
    component: Register
  },
  {
    path: '/circles',
    name: 'CirclesList',
    component: CirclesList
  },
  {
    path: '/circle/:id',
    name: 'CircleDetail',
    component: CircleDetail,
    props: true
  },
  {
    path: '/venue-map',
    name: 'VenueMap',
    component: VenueMap
  },
  {
    path: '/ocr',
    name: 'OcrViewer',
    component: OcrViewer
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
