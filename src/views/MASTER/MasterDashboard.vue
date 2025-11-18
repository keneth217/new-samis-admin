<template>
  <main id="dashboard">
    <div class="page-header">
      <h2>Dashboard</h2>
    </div>
    <div class="page-wrapper">
      <div class="cards-container" ref="cardsContainer">
        <div class="info-card" v-for="card in cards" :key="card.title">
          <div class="info-card-content">
            <span class="material-symbols-outlined">{{ card.icon }}</span>
            <div class="info-details">
              <p class="text-title">{{ card.title }}</p>
              <p class="text-amount">{{ card.amount }}</p>
              <div v-if="card.details">
                <ul class="details-list">
                  <li v-for="detail in card.details" :key="detail.label">
                    <span class="detail-label">{{ detail.label }}:</span> {{ detail.value }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="charts-containerz" :style="{ maxWidth: chartsContainerWidth, marginTop: '70px', backgroundColor: '#f0f0f0' }">
        <!-- Container for both charts to be displayed side by side -->
        <div 
          class="chart-group" 
          :style="{ display: 'flex', flexDirection: 'row', gap: '15px' }"
        >
          <!-- Bar Chart -->
          <div class="bar-chart-wrapper" :style="{ flex: '1', height: '400px' }">
            <canvas 
              id="totalSchoolsChart" 
              :style="{ height: '100%', width: '100%' }">
            </canvas>
          </div>
          
          <!-- Pie Chart -->
          <div class="pie-chart-wrapper" :style="{ flex: '1', height: '400px' }">
            <canvas 
              id="schoolStatusPieChart" 
              :style="{ height: '100%', width: '100%' }">
            </canvas>
          </div>
        </div>
      </div>
    </div>
    
    <LoadingSpinner :isLoading="Loading"/>
  </main>
</template>

<script>
import { useToast } from 'vue-toastification';
import { Chart, registerables } from 'chart.js'; 
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import axios from 'axios';

Chart.register(...registerables);

export default {
  components: { LoadingSpinner },
  data() {
    return {
      schools: null,
      modules: null,
      active: null,
      expired: null,

      Loading: false,
      chartsContainerWidth: 'auto',
      cards: [
        { title: "Total Schools", amount: 0, icon: "groups_3" },
        { title: "Activated Schools", amount: 0, icon: "check_circle" },
        { title: "Expired Schools", amount: 0, icon: "cancel" },
        { title: "Total modules", amount: 0, icon: "widgets" },
        
      ],
    };
  },
  methods: {
    adjustChartsContainerWidth() {
      if (this.$refs.cardsContainer) {
        const cardsContainerWidth = window.getComputedStyle(this.$refs.cardsContainer).width;
        this.chartsContainerWidth = cardsContainerWidth;
      }
    },

    createChart(chartId, chartType, data, options) {
      const ctx = document.getElementById(chartId).getContext('2d');
      new Chart(ctx, {
        type: chartType,
        data: data,
        options: options
      });
    },

    initializeCharts() {
      // Dummy data for the bar chart
      const totalSchools = this.schools;
      const activatedSchools = this.active;
      const expiredSchools = this.expired;

      // Bar Chart
      this.createChart('totalSchoolsChart', 'bar', {
        labels: ['Total Schools', 'Activated Schools', 'Expired Schools'],
        datasets: [{
          label: 'Number of Schools',
          data: [totalSchools, activatedSchools, expiredSchools],
          backgroundColor: ['#2b7ab7', '#4368b9', '#f87171'], // Colors for each bar
        }]
      }, {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,  // Ensure bars start at 0
          },
          y: {
            beginAtZero: true,  // Ensure bars start at 0
          },
        },
      });

      // Pie Chart - showing activated vs expired schools
      this.createChart('schoolStatusPieChart', 'pie', {
        labels: ['Activated Schools', 'Expired Schools'],
        datasets: [{
          data: [activatedSchools, expiredSchools],
          backgroundColor: ['#4368b9', '#f87171'],  // Colors for pie slices
          hoverOffset: 4,  // Slight hover effect
        }]
      }, {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            enabled: true,
          }
        }
      });

      // Set loading to false after charts are initialized
      this.Loading = false;
    },



    async fetchData() {
      this.Loading = true;
      const toast = useToast();
      
      try {
        const response = await axios.post(`/api/stats/count`);

        this.schools = response.data.schools;
        this.modules = response.data.modules;
        this.active = response.data.active;
        this.expired = response.data.expired;

        this.cards = [
          { title: "Total Schools", amount: response.data.schools, icon: "groups_3" },
          { title: "Activated Schools", amount: response.data.active, icon: "check_circle" },
          { title: "Expired Schools", amount: response.data.expired, icon: "cancel" },
          { title: "Total Modules", amount: response.data.modules, icon: "widgets" },
        ];
        
        // this.statsData = await response.json();
        this.initializeCharts();
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
        this.Loading = false;
      } finally {
        this.Loading = false;
      }
    },

 

    // updateCards() {
    //   const { totalSchools, activatedSchools, deactivatedSchools } = this.fetchedData;

    //   this.cards = [
    //     { title: "Total Schools", amount: totalSchools, icon: "groups_3" },
    //     { title: "Activated Schools", amount: activatedSchools, icon: "check_circle" },
    //     { title: "Expired Schools", amount: deactivatedSchools, icon: "cancel" },
    //   ];
    // }
  },
  mounted() {
    this.fetchData();
    this.adjustChartsContainerWidth();
    window.addEventListener('resize', this.adjustChartsContainerWidth);
     
  },

  updated() {
    this.adjustChartsContainerWidth();
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.adjustChartsContainerWidth);
  },
};
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

#dashboard {
  font-family: 'Arial', sans-serif;
  background-color: #f3f4f6;
  padding: 1rem;
  min-height: 100vh;
}

.page-header {
  color: #1e293b;
  margin: 1rem 0;
  padding: 0 1rem;
}

.page-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  padding: 0 1rem;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  width: 100%;
}

.info-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.info-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  height: 100%;
}

.material-symbols-outlined {
  font-size: 2.5rem;
  color: #2b7ab7;
}

.info-details {
  text-align: center;
  width: 100%;
}

.text-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.text-amount {
  font-size: 2rem;
  font-weight: 700;
  color: #4368b9;
  margin-bottom: 1rem;
}

.details-list {
  list-style: none;
  padding: 0;
  width: 100%;
}

.details-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
  border-bottom: 1px solid #eee;
}

.detail-label {
  font-weight: 600;
  color: #374151;
}

.charts-container {
  width: 100%;
  padding: 1rem 0;
}

.chart-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1rem;
  width: 100%;
}

.chart-wrapper {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  min-height: 400px;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}

/* Medium screens (tablets) */
@media (max-width: 992px) {
  .chart-group {
    grid-template-columns: 1fr;
  }
  
  .cards-container {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
  
  .text-title {
    font-size: 1.1rem;
  }
  
  .text-amount {
    font-size: 1.8rem;
  }
}

/* Small screens (large phones) */
@media (max-width: 768px) {
  .page-wrapper {
    padding: 0 0.5rem;
  }
  
  .cards-container {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  
  .info-card {
    padding: 1rem;
  }
  
  .material-symbols-outlined {
    font-size: 2rem;
  }
  
  .text-title {
    font-size: 1rem;
  }
  
  .text-amount {
    font-size: 1.5rem;
  }
}

/* Extra small screens (phones) */
@media (max-width: 576px) {
  .cards-container {
    grid-template-columns: 1fr;
  }
  
  .chart-wrapper {
    min-height: 300px;
  }
  
  .page-header h2 {
    font-size: 1.5rem;
  }
}
</style>
