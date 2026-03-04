<template>
  <div class="the-page">
    <div class="search-area">
      <!-- Header -->
      <div class="header-container1">
        <h2>Expenses Tracking</h2>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="refreshData" :disabled="loading">
          <span class="material-symbols-outlined">refresh</span> Refresh
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon" style="background-color: #e3f2fd;">
          <span class="material-symbols-outlined">groups</span>
        </div>
        <div class="card-content">
          <p class="card-label">Employee Expenses</p>
          <p class="card-amount">{{ formatCurrency(expenseSummary.employees) }}</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon" style="background-color: #e0f2f1;">
          <span class="material-symbols-outlined">message</span>
        </div>
        <div class="card-content">
          <p class="card-label">Message Expenses</p>
          <p class="card-amount">{{ formatCurrency(expenseSummary.messages) }}</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="card-icon" style="background-color: #f3e5f5;">
          <span class="material-symbols-outlined">call</span>
        </div>
        <div class="card-content">
          <p class="card-label">Call Expenses</p>
          <p class="card-amount">{{ formatCurrency(expenseSummary.calls) }}</p>
        </div>
      </div>
      <div class="summary-card total-card">
        <div class="card-icon" style="background-color: #ffebee;">
          <span class="material-symbols-outlined">payments</span>
        </div>
        <div class="card-content">
          <p class="card-label">Total Expenses</p>
          <p class="card-amount">{{ formatCurrency(expenseSummary.total) }}</p>
        </div>
      </div>
    </div>

    <!-- Expense Categories Section -->
    <div class="expense-sections">
      <!-- Employee Expenses -->
      <div class="expense-section">
        <div class="section-header">
          <h3>Employee Expenses</h3>
          <div class="section-total">
            Total: {{ formatCurrency(expenseSummary.employees) }}
          </div>
        </div>
        <div class="table-container">
          <table class="expense-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="category-cell">
                    <span class="material-symbols-outlined category-icon">business_center</span>
                    <span>Office Employees</span>
                  </div>
                </td>
                <td>{{ employeeData.office }}</td>
                <td>{{ formatCurrency(employeeCosts.office.unitCost) }}</td>
                <td class="amount-cell">{{ formatCurrency(employeeCosts.office.total) }}</td>
              </tr>
              <tr>
                <td>
                  <div class="category-cell">
                    <span class="material-symbols-outlined category-icon">campaign</span>
                    <span>Marketers</span>
                  </div>
                </td>
                <td>{{ employeeData.marketers }}</td>
                <td>{{ formatCurrency(employeeCosts.marketers.unitCost) }}</td>
                <td class="amount-cell">{{ formatCurrency(employeeCosts.marketers.total) }}</td>
              </tr>
              <tr>
                <td>
                  <div class="category-cell">
                    <span class="material-symbols-outlined category-icon">construction</span>
                    <span>Installers</span>
                  </div>
                </td>
                <td>{{ employeeData.installers }}</td>
                <td>{{ formatCurrency(employeeCosts.installers.unitCost) }}</td>
                <td class="amount-cell">{{ formatCurrency(employeeCosts.installers.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Message Expenses -->
      <div class="expense-section">
        <div class="section-header">
          <h3>Message Expenses</h3>
          <div class="section-total">
            Total: {{ formatCurrency(expenseSummary.messages) }}
          </div>
        </div>
        <div class="table-container">
          <table class="expense-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Count</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="category-cell">
                    <span class="material-symbols-outlined category-icon">message</span>
                    <span>Messages Sent</span>
                  </div>
                </td>
                <td>{{ messageData.count }}</td>
                <td>{{ formatCurrency(messageCosts.unitCost) }}</td>
                <td class="amount-cell">{{ formatCurrency(messageCosts.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Call Expenses -->
      <div class="expense-section">
        <div class="section-header">
          <h3>Call Expenses</h3>
          <div class="section-total">
            Total: {{ formatCurrency(expenseSummary.calls) }}
          </div>
        </div>
        <div class="table-container">
          <table class="expense-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Count</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="category-cell">
                    <span class="material-symbols-outlined category-icon">call</span>
                    <span>Calls Made</span>
                  </div>
                </td>
                <td>{{ callData.count }}</td>
                <td>{{ formatCurrency(callCosts.unitCost) }}</td>
                <td class="amount-cell">{{ formatCurrency(callCosts.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <LoadingSpinner :isLoading="loading" />
  </div>
</template>

<script>
import axios from '../../axios';
import { useToast } from 'vue-toastification';
import LoadingSpinner from '../../components/LoadingSpinner.vue';

export default {
  name: 'ExpensesTracking',
  components: { LoadingSpinner },
  data() {
    return {
      loading: false,
      employeeData: {
        office: 0,
        marketers: 0,
        installers: 0,
        total: 0
      },
      messageData: {
        count: 0
      },
      callData: {
        count: 0
      },
      // Default unit costs (can be configured or fetched from API)
      employeeCosts: {
        office: { unitCost: 50000, total: 0 }, // KES 50,000 per month per office employee
        marketers: { unitCost: 40000, total: 0 }, // KES 40,000 per month per marketer
        installers: { unitCost: 35000, total: 0 } // KES 35,000 per month per installer
      },
      messageCosts: {
        unitCost: 2.5, // KES 2.5 per message
        total: 0
      },
      callCosts: {
        unitCost: 10, // KES 10 per minute (assuming average 2 min per call = KES 20 per call)
        total: 0
      },
      apiBase: import.meta.env.VITE_API_URL || ''
    };
  },
  computed: {
    expenseSummary() {
      const employeesTotal = this.employeeCosts.office.total + 
                            this.employeeCosts.marketers.total + 
                            this.employeeCosts.installers.total;
      const messagesTotal = this.messageCosts.total;
      const callsTotal = this.callCosts.total;
      
      return {
        employees: employeesTotal,
        messages: messagesTotal,
        calls: callsTotal,
        total: employeesTotal + messagesTotal + callsTotal
      };
    }
  },
  methods: {
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    },
    async fetchData() {
      this.loading = true;
      const toast = useToast();
      
      try {
        // Fetch dashboard data which includes employees, calls, and messages
        const dashboardResponse = await axios.post(`${this.apiBase}/api/stats/dashboard`);
        
        if (dashboardResponse.data) {
          // Get employee counts
          this.employeeData = {
            office: dashboardResponse.data.employees?.office || 0,
            marketers: dashboardResponse.data.employees?.marketers || 0,
            installers: dashboardResponse.data.employees?.installers || 0,
            total: (dashboardResponse.data.employees?.office || 0) + 
                   (dashboardResponse.data.employees?.marketers || 0) + 
                   (dashboardResponse.data.employees?.installers || 0)
          };
          
          // Get message count
          this.messageData.count = dashboardResponse.data.messages || 0;
          
          // Get call count
          this.callData.count = dashboardResponse.data.calls || 0;
          
          // Calculate costs
          this.calculateCosts();
          toast.success('Expense data has been fetched successfully!');
        } else {
          toast.warning('No expense data available');
        }
      } catch (error) {
        console.error('Error fetching expense data:', error);
        toast.error('Failed to load expense data');
      } finally {
        this.loading = false;
      }
    },
    calculateCosts() {
      // Calculate employee costs (monthly)
      this.employeeCosts.office.total = this.employeeData.office * this.employeeCosts.office.unitCost;
      this.employeeCosts.marketers.total = this.employeeData.marketers * this.employeeCosts.marketers.unitCost;
      this.employeeCosts.installers.total = this.employeeData.installers * this.employeeCosts.installers.unitCost;
      
      // Calculate message costs
      this.messageCosts.total = this.messageData.count * this.messageCosts.unitCost;
      
      // Calculate call costs (assuming average 2 minutes per call)
      const averageCallDurationMinutes = 2;
      this.callCosts.total = this.callData.count * this.callCosts.unitCost * averageCallDurationMinutes;
    },
    refreshData() {
      this.fetchData();
    }
  },
  mounted() {
    this.fetchData();
  }
};
</script>

<style scoped>
* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.the-page {
  margin-top: 4.5rem;
  padding: 1rem;
  background-color: #f4f6fa;
}

.search-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-container1 h2 {
  font-size: 1.5rem;
  color: #333;
  padding-bottom: 0.5rem;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background-color: #4368b9;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.action-btn:hover:not(:disabled) {
  background-color: #2b4d8a;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.summary-card.total-card {
  border: 2px solid #1a73e8;
  background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon .material-symbols-outlined {
  font-size: 2rem;
  color: #1a73e8;
}

.card-content {
  flex: 1;
}

.card-label {
  font-size: 0.9rem;
  color: #6c7480;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.card-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.total-card .card-amount {
  color: #1a73e8;
  font-size: 1.75rem;
}

/* Expense Sections */
.expense-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.expense-section {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e1e4ea;
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
}

.section-total {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a73e8;
}

.table-container {
  overflow-x: auto;
}

.expense-table {
  width: 100%;
  border-collapse: collapse;
}

.expense-table thead {
  background: #f6f7fb;
}

.expense-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 700;
  color: #1a1a1a;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.expense-table td {
  padding: 1rem;
  border-bottom: 1px solid #e1e4ea;
  color: #1a1a1a;
}

.expense-table tbody tr:hover {
  background: #f8f9fa;
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.category-icon {
  font-size: 1.5rem;
  color: #1a73e8;
}

.amount-cell {
  font-weight: 700;
  color: #1a73e8;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .expenses-page {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .expense-table {
    font-size: 0.9rem;
  }
  
  .expense-table th,
  .expense-table td {
    padding: 0.75rem 0.5rem;
  }
}
</style>

