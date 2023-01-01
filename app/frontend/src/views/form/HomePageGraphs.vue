<template>
  <div v-if="loaded">
    <Bar :chart-options="chartOptions"
         :chart-data="chartData"
         :chart-id="chartId"
         :dataset-id-key="datasetIdKey"
         :plugins="plugins"
         :css-classes="cssClasses"
         :styles="styles"
         :width="width"
         :height="height" />
  </div>

</template>

<script>

import { mapActions, mapGetters } from 'vuex';
import { Bar } from 'vue-chartjs/legacy';

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

//import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

//ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

//getFormioComponentsGrouping
export default {
  name: 'HomePageGraphs',
  components: {
    Bar
  },
  props: {
    chartId: {
      type: String,
      default: 'bar-chart'
    },
    datasetIdKey: {
      type: String,
      default: 'label'
    },
    width: {
      type: Number,
      default: 400
    },
    height: {
      type: Number,
      default: 600
    },
    cssClasses: {
      default: '',
      type: String
    },
    styles: {
      type: Object,
      default: () => {}
    },
    plugins: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      loaded:false,
      chartData: {
        axis: 'y',
        labels: [],
        datasets: [
          {
            label: 'Form.io Components',
            backgroundColor: '#003366',
            data: [],
          }
        ]
      },
      chartOptions: {
        layout: {
          padding: {
            left: 50,
            right:50
          }
        },
        scales: {

          y: {
            grid: {
              display: false
            }
          },
        },

        responsive: true,
        maintainAspectRatio: false,
        beginAtZero: true
      },
    };
  },

  async mounted() {
    this.loaded = false;
    await this.getFormioComponentsGrouping();
  },

  watch:{
    formioComponentsGrouping(){
      if(this.formioComponentsGrouping){
        this.loaded=true;
        if(this.formioComponentsGrouping){
          this.chartData.datasets[0].data.push(...Object.values(this.formioComponentsGrouping));
          this.chartData.labels.push(...Object.keys(this.formioComponentsGrouping ));
        }
      }
    }
  },

  computed: {
    ...mapGetters('form', ['formioComponentsGrouping']),
  },
  methods:{
    ...mapActions('form', ['getFormioComponentsGrouping']),
  },
};
</script>

