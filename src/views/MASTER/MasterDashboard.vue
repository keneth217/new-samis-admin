<template>
  <main id="dashboard">
    <!-- Main Content Area -->
    <div class="page-wrapper">
      <!-- Summary Cards Grid (Top-Level Counts) -->
      <div class="cards-container" ref="cardsContainer">
        <div
          class="summary-card"
          v-for="card in cards"
          :key="card.title"
          :style="{ borderLeftColor: card.accentColor }"
        >
          <div class="summary-card-top">
            <span class="summary-card-icon material-symbols-outlined" :style="{ color: card.accentColor }">{{ card.icon }}</span>
            <span class="summary-card-amount" :style="{ color: card.accentColor }">{{ card.amount }}</span>
          </div>
          <p class="summary-card-label">{{ card.title }}</p>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-container">
        <!-- Schools Bar Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Schools & Activations Overview</h3>
              <p class="chart-subtitle">Total schools and activation status</p>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas id="totalSchoolsChart"></canvas>
          </div>
        </div>

        <!-- Activations Status Pie Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Activations Status Distribution</h3>
              <p class="chart-subtitle">Active vs expired activations</p>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas id="schoolStatusPieChart"></canvas>
          </div>
        </div>

        <!-- County Schools Overview -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Schools by County</h3>
              <p class="chart-subtitle">Number of schools in each county</p>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas id="countySchoolsChart"></canvas>
          </div>
        </div>

        <!-- County Revenue Overview -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3 class="chart-title">Revenue by County</h3>
              <p class="chart-subtitle">Invoiced vs received amounts per county</p>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas id="countyRevenueChart"></canvas>
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
import axios from '../../axios';

Chart.register(...registerables);

export default {
  components: { LoadingSpinner },
  data() {
    return {
      // Core stats
      schools: 0,
      modules: 0,
      activations: 0,
      activeActivations: 0,
      expiredActivations: 0,

      // County-level stats
      countyStats: [],

      // Account stats (all-time by default)
      accountStats: {
        invoices: 0,
        receipts: 0,
        invoicedAmount: 0,
        receivedAmount: 0,
        totalExpenses: 0
      },

      Loading: false,
      chartsContainerWidth: 'auto',
      chartInstances: {
        totalSchoolsChart: null,
        schoolStatusPieChart: null,
        countySchoolsChart: null,
        countyRevenueChart: null,
      },
      cards: [
        { title: "Schools", amount: 0, icon: "school", accentColor: "#2b7ab7" },
        { title: "Modules", amount: 0, icon: "widgets", accentColor: "#22c55e" },
        { title: "Activations", amount: 0, icon: "group_work", accentColor: "#eab308" },
        { title: "Active Activations", amount: 0, icon: "check_circle", accentColor: "#ec4899" },
        { title: "Expired Activations", amount: 0, icon: "cancel", accentColor: "#0ea5e9" },
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
      // Destroy existing chart if it exists
      if (this.chartInstances[chartId]) {
        this.chartInstances[chartId].destroy();
      }
      
      const ctx = document.getElementById(chartId);
      if (!ctx) return;
      
      const chartInstance = new Chart(ctx.getContext('2d'), {
        type: chartType,
        data: data,
        options: options
      });
      
      this.chartInstances[chartId] = chartInstance;
      return chartInstance;
    },

    initializeCharts() {
      // Wait for DOM to be ready
      this.$nextTick(() => {
        const totalSchools = this.schools || 0;
        const activeActivations = this.activeActivations || 0;
        const expiredActivations = this.expiredActivations || 0;

        // Bar Chart - overall schools and activations
        this.createChart('totalSchoolsChart', 'bar', {
          labels: ['Total Schools', 'Active Activations', 'Expired Activations'],
          datasets: [{
            label: 'Counts',
            data: [totalSchools, activeActivations, expiredActivations],
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

        // Pie Chart - active vs expired activations
        this.createChart('schoolStatusPieChart', 'pie', {
          labels: ['Active Activations', 'Expired Activations'],
          datasets: [{
            data: [activeActivations, expiredActivations],
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

        // County-level charts (only if we have data)
        if (this.countyStats && this.countyStats.length > 0) {
          const countyLabels = this.countyStats.map(c => c.county || 'Unknown');
          const countySchools = this.countyStats.map(c => c.schools || 0);
          const countyInvoiced = this.countyStats.map(c => (c.accountStats?.invoicedAmount) || 0);
          const countyReceived = this.countyStats.map(c => (c.accountStats?.receivedAmount) || 0);

          // County schools bar chart
          this.createChart('countySchoolsChart', 'bar', {
            labels: countyLabels,
            datasets: [{
              label: 'Schools',
              data: countySchools,
              backgroundColor: '#2b7ab7',
            }]
          }, {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                beginAtZero: true,
              },
              y: {
                beginAtZero: true,
              },
            },
          });

          // County revenue grouped bar chart
          this.createChart('countyRevenueChart', 'bar', {
            labels: countyLabels,
            datasets: [
              {
                label: 'Invoiced Amount',
                data: countyInvoiced,
                backgroundColor: '#4f46e5',
              },
              {
                label: 'Received Amount',
                data: countyReceived,
                backgroundColor: '#22c55e',
              },
            ]
          }, {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                stacked: false,
              },
              y: {
                beginAtZero: true,
              },
            },
            plugins: {
              tooltip: {
                enabled: true,
              },
              legend: {
                display: true,
                position: 'top',
              },
            },
          });
        }

        // Set loading to false after charts are initialized
        this.Loading = false;
      });
    },



    async fetchData() {
      this.Loading = true;
      const toast = useToast();
      
      try {
        // Use the new StatsController count endpoint
        // NOTE: baseURL in axios.js already includes `/api`
        const response = await axios.post(`/stats/count`);

        const data = response.data || {};

        // Core stats
        this.schools = data.schools || 0;
        this.modules = data.modules || 0;
        this.activations = data.activations || 0;
        this.activeActivations = data.activeActivations || 0;
        this.expiredActivations = data.expiredActivations || 0;

        // County stats
        this.countyStats = data.countyStats || [];

        // Account stats
        this.accountStats = {
          invoices: data.accountStats?.invoices || 0,
          receipts: data.accountStats?.receipts || 0,
          invoicedAmount: data.accountStats?.invoicedAmount || 0,
          receivedAmount: data.accountStats?.receivedAmount || 0,
          totalExpenses: data.accountStats?.totalExpenses || 0,
        };

        // Keep legacy fields in sync for any existing UI that relies on them
        // (No extra fields now; everything comes directly from `accountStats`)

        this.cards = [
          { title: "Schools", amount: this.schools, icon: "school", accentColor: "#2b7ab7" },
          { title: "Modules", amount: this.modules, icon: "widgets", accentColor: "#22c55e" },
          { title: "Activations", amount: this.activations, icon: "group_work", accentColor: "#eab308" },
          { title: "Active Activations", amount: this.activeActivations, icon: "check_circle", accentColor: "#ec4899" },
          { title: "Expired Activations", amount: this.expiredActivations, icon: "cancel", accentColor: "#0ea5e9" },
        ];
        
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
    // Destroy all chart instances
    if (this.chartInstances.totalSchoolsChart) {
      this.chartInstances.totalSchoolsChart.destroy();
    }
    if (this.chartInstances.schoolStatusPieChart) {
      this.chartInstances.schoolStatusPieChart.destroy();
    }
        if (this.chartInstances.countySchoolsChart) {
          this.chartInstances.countySchoolsChart.destroy();
        }
        if (this.chartInstances.countyRevenueChart) {
          this.chartInstances.countyRevenueChart.destroy();
        }
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
  background-color: #e8f4f8;
  min-height: 100vh;
  padding: 0;
}

/* Main Content */
.page-wrapper {
  background-color: #e8f4f8;
  padding: 4rem 2rem 2rem;
}

/* Main Cards Container */
.main-cards-container {
  display: grid;
  grid-template-columns: 0.4fr 1.6fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Employees Overview Card */
.employees-overview-card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.employees-overview-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.employees-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #000000;
  text-transform: uppercase;
  margin-bottom: 0.3rem;
}

.employees-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.employees-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #000000;
}

.employees-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #000000;
}

/* Summary Cards Grid – Top-Level Counts (5 in one line) */
.cards-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem 1rem 1.5rem 1.25rem;
  min-height: 5rem;
  border-left: 5px solid;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.summary-card-top {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-card-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.summary-card-amount {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.summary-card-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  line-height: 1.2;
}

/* Charts Container */
.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 2.5rem;
}

.chart-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.chart-subtitle {
  font-size: 0.9rem;
  color: #64748b;
}

.chart-wrapper {
  height: 350px;
  position: relative;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-cards-container {
    grid-template-columns: 1fr;
  }
  
  .employees-overview-content {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .cards-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 992px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .employees-overview-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .cards-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 1rem;
  }
  
  .cards-container {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-card {
    padding: 1rem;
  }
  
  .chart-title {
    font-size: 1.1rem;
  }
  
  .summary-card-amount {
    font-size: 1.25rem;
  }
  
  .summary-card-icon {
    font-size: 1.25rem;
  }
}

@media (max-width: 576px) {
  .chart-wrapper {
    height: 300px;
  }
  
  .cards-container {
    grid-template-columns: 1fr;
  }
  
  .summary-card-amount {
    font-size: 1.15rem;
  }
  
  .summary-card-icon {
    font-size: 1.15rem;
  }
  
  .summary-card-label {
    font-size: 0.8rem;
  }
}
</style>