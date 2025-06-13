<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartData,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

export default defineComponent({
  name: 'RevenueChart',
  components: { Line },
  props: {
    chartData: {
      type: Object as PropType<ChartData<'line'>>,
      required: true,
    },
    chartOptions: {
      type: Object as PropType<ChartOptions<'line'>>,
      default: () => ({
        responsive: true,
        maintainAspectRatio: false,
      }),
    },
  },
  setup() {
    return {};
  },
});
</script>

<template>
  <Line :data="chartData" :options="chartOptions" />
</template>
