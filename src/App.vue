<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bar, Line } from 'vue-chartjs'
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
  Filler
} from 'chart.js'
import metrics from './data/metrics.json'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]
const monthOptions = ['ALL', ...months]
const selectedMonth = ref('ALL')

const filteredData = computed(() => {
  if (selectedMonth.value === 'ALL') return metrics
  return metrics.filter(m => m.month === selectedMonth.value)
})

function getPrevMonthIndex(idx: number) {
  return idx === 0 ? null : idx - 1
}

const summaryCards = computed(() => {
  if (selectedMonth.value === 'ALL') {
    // Yearly totals/averages
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0)
    const totalVisitors = metrics.reduce((sum, m) => sum + m.visitors, 0)
    const avgConversions = metrics.reduce((sum, m) => sum + m.conversions, 0) / metrics.length
    const totalOrders = metrics.reduce((sum, m) => sum + m.orders, 0)
    return [
      {
        label: 'Revenue',
        value: `$${totalRevenue.toLocaleString()}`,
        trend: metrics[11].revenue - metrics[10].revenue,
        trendText: `Dec vs Nov: $${(metrics[11].revenue - metrics[10].revenue).toLocaleString()}`
      },
      {
        label: 'Visitors',
        value: totalVisitors.toLocaleString(),
        trend: metrics[11].visitors - metrics[10].visitors,
        trendText: `Dec vs Nov: ${(metrics[11].visitors - metrics[10].visitors).toLocaleString()}`
      },
      {
        label: 'Conversions',
        value: `${avgConversions.toFixed(2)}%`,
        trend: metrics[11].conversions - metrics[10].conversions,
        trendText: `Dec vs Nov: ${(metrics[11].conversions - metrics[10].conversions).toFixed(2)}%`
      },
      {
        label: 'Orders',
        value: totalOrders.toLocaleString(),
        trend: metrics[11].orders - metrics[10].orders,
        trendText: `Dec vs Nov: ${(metrics[11].orders - metrics[10].orders).toLocaleString()}`
      }
    ]
  } else {
    const idx = months.indexOf(selectedMonth.value)
    const m = metrics[idx]
    const prevIdx = getPrevMonthIndex(idx)
    const prev = prevIdx !== null ? metrics[prevIdx] : null
    return [
      {
        label: 'Revenue',
        value: `$${m.revenue.toLocaleString()}`,
        trend: prev ? m.revenue - prev.revenue : 0,
        trendText: prev ? `${m.revenue - prev.revenue >= 0 ? '+' : ''}$${(m.revenue - prev.revenue).toLocaleString()} vs prev` : 'N/A'
      },
      {
        label: 'Visitors',
        value: m.visitors.toLocaleString(),
        trend: prev ? m.visitors - prev.visitors : 0,
        trendText: prev ? `${m.visitors - prev.visitors >= 0 ? '+' : ''}${(m.visitors - prev.visitors).toLocaleString()} vs prev` : 'N/A'
      },
      {
        label: 'Conversions',
        value: `${m.conversions.toFixed(2)}%`,
        trend: prev ? m.conversions - prev.conversions : 0,
        trendText: prev ? `${m.conversions - prev.conversions >= 0 ? '+' : ''}${(m.conversions - prev.conversions).toFixed(2)}% vs prev` : 'N/A'
      },
      {
        label: 'Orders',
        value: m.orders.toLocaleString(),
        trend: prev ? m.orders - prev.orders : 0,
        trendText: prev ? `${m.orders - prev.orders >= 0 ? '+' : ''}${(m.orders - prev.orders).toLocaleString()} vs prev` : 'N/A'
      }
    ]
  }
})

const revenueChartData = computed(() => {
  return {
    labels: metrics.map(m => m.month),
    datasets: [
      {
        label: 'Revenue',
        data: metrics.map(m => m.revenue),
        backgroundColor: '#7C4DFF',
        borderRadius: 6,
        maxBarThickness: 32
      }
    ]
  }
})

const visitorsChartData = computed(() => {
  return {
    labels: metrics.map(m => m.month),
    datasets: [
      {
        label: 'Visitors',
        data: metrics.map(m => m.visitors),
        borderColor: '#1976D2',
        backgroundColor: 'rgba(25, 118, 210, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 4
      }
    ]
  }
})

const conversionsChartData = computed(() => {
  return {
    labels: metrics.map(m => m.month),
    datasets: [
      {
        label: 'Conversions (%)',
        data: metrics.map(m => m.conversions),
        borderColor: '#43A047',
        backgroundColor: 'rgba(67, 160, 71, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 4
      }
    ]
  }
})

const barOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#888' },
      grid: { color: '#eee' }
    },
    x: {
      ticks: { color: '#888' },
      grid: { color: '#eee' }
    }
  }
}

const lineOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#888' },
      grid: { color: '#eee' }
    },
    x: {
      ticks: { color: '#888' },
      grid: { color: '#eee' }
    }
  }
}

const areaOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false }
  },
  elements: {
    line: { borderWidth: 2 },
    point: { radius: 3 }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#888' },
      grid: { color: '#eee' }
    },
    x: {
      ticks: { color: '#888' },
      grid: { color: '#eee' }
    }
  }
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-toolbar-title>My Dashboard</v-toolbar-title>
      <v-spacer />
      <v-select
        v-model="selectedMonth"
        :items="monthOptions"
        label="Month"
        dense
        hide-details
        style="max-width: 160px"
      />
    </v-app-bar>
    <v-main>
      <v-container class="py-6">
        <v-row class="mb-4" align="stretch">
          <v-col cols="12" sm="6" md="3" v-for="card in summaryCards" :key="card.label">
            <v-card class="pa-4" outlined>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-h6">{{ card.label }}</div>
                  <div class="text-h5 font-weight-bold">{{ card.value }}</div>
                </div>
                <v-icon :color="card.trend > 0 ? 'success' : card.trend < 0 ? 'error' : 'grey'">
                  {{ card.trend > 0 ? 'mdi-arrow-up' : card.trend < 0 ? 'mdi-arrow-down' : 'mdi-minus' }}
                </v-icon>
              </div>
              <div class="caption" :class="card.trend > 0 ? 'text-success' : card.trend < 0 ? 'text-error' : ''">
                {{ card.trendText }}
              </div>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="pa-4 mb-4" outlined>
              <div class="text-subtitle-1 mb-2">Monthly Revenue</div>
              <Bar :data="revenueChartData" :options="barOptions" />
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="pa-4 mb-4" outlined>
              <div class="text-subtitle-1 mb-2">Visitors Over Time</div>
              <Line :data="visitorsChartData" :options="lineOptions" />
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-card class="pa-4 mb-4" outlined>
              <div class="text-subtitle-1 mb-2">Conversions Trend</div>
              <Line :data="conversionsChartData" :options="areaOptions" />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.v-app-bar {
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.v-card {
  min-height: 120px;
}
.caption {
  font-size: 0.85rem;
  margin-top: 4px;
}
@media (max-width: 600px) {
  .v-row {
    flex-direction: column !important;
  }
}
</style>
