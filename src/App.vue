<script setup lang="ts">
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import metrics from './data/metrics'

ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

const regionNames = ['North', 'South', 'East', 'West'] as const
const monthOptions = ['ALL', ...months] as const
const selectedMonth = ref<(typeof monthOptions)[number]>('ALL')

type RegionName = (typeof regionNames)[number]

interface RegionMetrics {
  shipments: number
  onTimeRate: number
  openExceptions: number
}

interface MetricEntry {
  month: (typeof months)[number]
  year: number
  totalShipments: number
  onTimeRate: number
  openExceptions: number
  bestRegion: RegionName
  regions: Record<RegionName, RegionMetrics>
}

interface SummaryCard {
  label: string
  value: string
  trend: number
  trendText: string
}

const dataset = metrics as MetricEntry[]

const regionPalette: Record<RegionName, { stroke: string; fill: string }> = {
  North: { stroke: '#1d4ed8', fill: 'rgba(29, 78, 216, 0.14)' },
  South: { stroke: '#0f766e', fill: 'rgba(15, 118, 110, 0.14)' },
  East: { stroke: '#ca8a04', fill: 'rgba(202, 138, 4, 0.14)' },
  West: { stroke: '#b45309', fill: 'rgba(180, 83, 9, 0.14)' },
}

const filteredMetrics = computed(() => {
  if (selectedMonth.value === 'ALL') {
    return dataset
  }

  return dataset.filter((entry) => entry.month === selectedMonth.value)
})

const chartMetrics = computed(() => {
  return selectedMonth.value === 'ALL' ? dataset : dataset
})

const selectedIndex = computed(() => {
  if (selectedMonth.value === 'ALL') {
    return -1
  }

  return months.indexOf(selectedMonth.value)
})

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function getPreviousEntry() {
  if (selectedMonth.value === 'ALL') {
    return dataset[10]
  }

  return selectedIndex.value > 0 ? dataset[selectedIndex.value - 1] : null
}

function getBestRegionByRate(entries: MetricEntry[]) {
  const scores = Object.fromEntries(regionNames.map((region) => [region, 0])) as Record<RegionName, number>

  for (const entry of entries) {
    for (const region of regionNames) {
      scores[region] += entry.regions[region].onTimeRate
    }
  }

  return regionNames.reduce((best, region) => {
    return scores[region] > scores[best] ? region : best
  }, regionNames[0])
}

const currentSnapshot = computed(() => {
  if (selectedMonth.value !== 'ALL') {
    return filteredMetrics.value[0]
  }

  return {
    totalShipments: dataset.reduce((sum, entry) => sum + entry.totalShipments, 0),
    onTimeRate: average(dataset.map((entry) => entry.onTimeRate)),
    openExceptions: dataset.reduce((sum, entry) => sum + entry.openExceptions, 0),
    bestRegion: getBestRegionByRate(dataset),
    regions: Object.fromEntries(
      regionNames.map((region) => [
        region,
        {
          shipments: dataset.reduce((sum, entry) => sum + entry.regions[region].shipments, 0),
          onTimeRate: average(dataset.map((entry) => entry.regions[region].onTimeRate)),
          openExceptions: dataset.reduce((sum, entry) => sum + entry.regions[region].openExceptions, 0),
        },
      ]),
    ) as Record<RegionName, RegionMetrics>,
  }
})

function formatDelta(value: number, formatter: (input: number) => string) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatter(value)} vs previous month`
}

const summaryCards = computed<SummaryCard[]>(() => {
  const current = currentSnapshot.value
  const previous = getPreviousEntry()

  return [
    {
      label: 'Total Shipments',
      value: current.totalShipments.toLocaleString(),
      trend: previous ? current.totalShipments - previous.totalShipments : 0,
      trendText: previous
        ? formatDelta(current.totalShipments - previous.totalShipments, (value) => Math.round(value).toLocaleString())
        : 'No prior month available',
    },
    {
      label: 'On-Time Rate',
      value: `${current.onTimeRate.toFixed(1)}%`,
      trend: previous ? current.onTimeRate - previous.onTimeRate : 0,
      trendText: previous
        ? formatDelta(current.onTimeRate - previous.onTimeRate, (value) => `${value.toFixed(1)} pts`)
        : 'No prior month available',
    },
    {
      label: 'Open Exceptions',
      value: current.openExceptions.toLocaleString(),
      trend: previous ? previous.openExceptions - current.openExceptions : 0,
      trendText: previous
        ? `${current.openExceptions <= previous.openExceptions ? '-' : '+'}${Math.abs(current.openExceptions - previous.openExceptions).toLocaleString()} vs previous month`
        : 'No prior month available',
    },
    {
      label: 'Best Region',
      value: current.bestRegion,
      trend: previous ? current.regions[current.bestRegion].onTimeRate - previous.regions[current.bestRegion].onTimeRate : 0,
      trendText: `${current.regions[current.bestRegion].onTimeRate.toFixed(1)}% on-time performance`,
    },
  ]
})

const periodLabel = computed(() => {
  return selectedMonth.value === 'ALL' ? 'Jan-Dec 2025' : `${selectedMonth.value} 2025`
})

const selectedMonthLabel = computed(() => {
  return selectedMonth.value === 'ALL' ? null : selectedMonth.value
})

function createHighlightSeries<T extends number>(values: T[]) {
  return values.map((value, index) => {
    if (selectedMonth.value === 'ALL') {
      return value
    }

    return dataset[index].month === selectedMonth.value ? value : null
  })
}

const onTimeRateChartData = computed<ChartData<'line'>>(() => ({
  labels: chartMetrics.value.map((entry) => entry.month),
  datasets: regionNames.flatMap((region) => {
    const values = chartMetrics.value.map((entry) => entry.regions[region].onTimeRate)
    const baseStroke = selectedMonth.value === 'ALL' ? regionPalette[region].stroke : `${regionPalette[region].stroke}55`

    return [
      {
        label: region,
        data: values,
        borderColor: baseStroke,
        backgroundColor: regionPalette[region].fill,
        fill: false,
        tension: 0.35,
        pointRadius: selectedMonth.value === 'ALL' ? 3 : 2,
        pointHoverRadius: 5,
        borderWidth: selectedMonth.value === 'ALL' ? 2.5 : 1.5,
      },
      ...(selectedMonth.value === 'ALL'
        ? []
        : [{
            label: `${region} selected`,
            data: createHighlightSeries(values),
            borderColor: regionPalette[region].stroke,
            backgroundColor: regionPalette[region].stroke,
            fill: false,
            tension: 0.35,
            pointRadius: 6,
            pointHoverRadius: 7,
            borderWidth: 3.5,
          }]),
    ]
  }),
}))

const openExceptionsChartData = computed<ChartData<'line'>>(() => ({
  labels: chartMetrics.value.map((entry) => entry.month),
  datasets: regionNames.flatMap((region) => {
    const values = chartMetrics.value.map((entry) => entry.regions[region].openExceptions)
    const baseStroke = selectedMonth.value === 'ALL' ? regionPalette[region].stroke : `${regionPalette[region].stroke}55`

    return [
      {
        label: region,
        data: values,
        borderColor: baseStroke,
        backgroundColor: regionPalette[region].fill,
        fill: false,
        tension: 0.35,
        pointRadius: selectedMonth.value === 'ALL' ? 3 : 2,
        pointHoverRadius: 5,
        borderWidth: selectedMonth.value === 'ALL' ? 2.5 : 1.5,
        borderDash: region === 'West' ? [6, 4] : undefined,
      },
      ...(selectedMonth.value === 'ALL'
        ? []
        : [{
            label: `${region} selected`,
            data: createHighlightSeries(values),
            borderColor: regionPalette[region].stroke,
            backgroundColor: regionPalette[region].stroke,
            fill: false,
            tension: 0.35,
            pointRadius: 6,
            pointHoverRadius: 7,
            borderWidth: 3.5,
            borderDash: region === 'West' ? [6, 4] : undefined,
          }]),
    ]
  }),
}))

const comparisonChartData = computed<ChartData<'line'>>(() => {
  const source = currentSnapshot.value.regions

  return {
    labels: [...regionNames],
    datasets: [
      {
        label: 'Total Shipments',
        data: regionNames.map((region) => source[region].shipments),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.18)',
        fill: true,
        tension: 0.3,
        yAxisID: 'shipments',
      },
      {
        label: 'On-Time Rate',
        data: regionNames.map((region) => source[region].onTimeRate),
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.18)',
        fill: true,
        tension: 0.3,
        yAxisID: 'rate',
      },
      {
        label: 'Open Exceptions',
        data: regionNames.map((region) => source[region].openExceptions),
        borderColor: '#b45309',
        backgroundColor: 'rgba(180, 83, 9, 0.14)',
        fill: true,
        tension: 0.3,
        yAxisID: 'exceptions',
      },
    ],
  }
})

const sharedLineOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 10,
        color: '#38526a',
        filter: (legendItem) => !legendItem.text.endsWith('selected'),
      },
    },
    tooltip: {
      backgroundColor: '#17324d',
      titleColor: '#f8fbff',
      bodyColor: '#f8fbff',
      padding: 12,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#60758a',
      },
    },
    y: {
      beginAtZero: false,
      grid: {
        color: 'rgba(96, 117, 138, 0.18)',
      },
      ticks: {
        color: '#60758a',
      },
    },
  },
}

const onTimeRateOptions: ChartOptions<'line'> = {
  ...sharedLineOptions,
  plugins: {
    ...sharedLineOptions.plugins,
    title: {
      display: selectedMonth.value !== 'ALL',
      text: selectedMonth.value === 'ALL' ? '' : `${selectedMonth.value} highlighted against full-year trend`,
      color: '#60758a',
      padding: { bottom: 12 },
    },
  },
  scales: {
    ...sharedLineOptions.scales,
    y: {
      beginAtZero: false,
      min: 80,
      max: 97,
      grid: {
        color: 'rgba(96, 117, 138, 0.18)',
      },
      ticks: {
        color: '#60758a',
        callback: (value) => `${value}%`,
      },
    },
  },
}

const openExceptionsOptions: ChartOptions<'line'> = {
  ...sharedLineOptions,
  plugins: {
    ...sharedLineOptions.plugins,
    title: {
      display: selectedMonth.value !== 'ALL',
      text: selectedMonth.value === 'ALL' ? '' : `${selectedMonth.value} highlighted against full-year trend`,
      color: '#60758a',
      padding: { bottom: 12 },
    },
  },
  scales: {
    ...sharedLineOptions.scales,
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(96, 117, 138, 0.18)',
      },
      ticks: {
        color: '#60758a',
        precision: 0,
      },
    },
  },
}

const comparisonOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        boxWidth: 10,
        color: '#38526a',
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#60758a',
      },
    },
    shipments: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      grid: {
        color: 'rgba(96, 117, 138, 0.18)',
      },
      ticks: {
        color: '#2563eb',
      },
    },
    rate: {
      type: 'linear',
      position: 'right',
      min: 80,
      max: 97,
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        color: '#0f766e',
        callback: (value) => `${value}%`,
      },
    },
    exceptions: {
      type: 'linear',
      position: 'right',
      offset: true,
      beginAtZero: true,
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        color: '#b45309',
        precision: 0,
      },
    },
  },
}
</script>

<template>
  <v-app>
    <v-app-bar class="app-bar" elevation="0">
      <div>
        <div class="eyebrow">FastForward Logistics</div>
        <v-toolbar-title class="title">Operations Dashboard</v-toolbar-title>
      </div>
      <v-spacer />
      <div class="picker-wrap">
        <div class="picker-label">Reporting Period</div>
        <v-select
          v-model="selectedMonth"
          :items="monthOptions"
          density="comfortable"
          hide-details
          variant="outlined"
          class="month-select"
        />
      </div>
    </v-app-bar>

    <v-main>
      <v-container class="dashboard-shell py-8">
        <section class="hero-panel mb-6">
          <div>
            <p class="hero-kicker">Operations snapshot</p>
            <h1>{{ periodLabel }}</h1>
            <p class="hero-copy">
              Track shipment flow, delivery performance, and operational exceptions across all four regions.
            </p>
          </div>
        </section>

        <v-row class="mb-2" align="stretch">
          <v-col v-for="card in summaryCards" :key="card.label" cols="12" sm="6" md="3">
            <v-card class="metric-card" elevation="0">
              <div class="metric-card__header">
                <span class="metric-card__label">{{ card.label }}</span>
                <v-icon :color="card.trend > 0 ? 'success' : card.trend < 0 ? 'error' : 'medium-emphasis'" size="20">
                  {{ card.trend > 0 ? 'mdi-arrow-top-right' : card.trend < 0 ? 'mdi-arrow-bottom-right' : 'mdi-minus' }}
                </v-icon>
              </div>
              <div class="metric-card__value">{{ card.value }}</div>
              <div class="metric-card__trend" :class="card.trend > 0 ? 'is-up' : card.trend < 0 ? 'is-down' : ''">
                {{ card.trendText }}
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-card class="chart-card" elevation="0">
              <div class="chart-card__title">Regional On-Time Rates</div>
              <div class="chart-card__subtitle">
                {{ selectedMonthLabel ? selectedMonthLabel + ' highlighted against the annual trend' : 'All four regions for ' + periodLabel }}
              </div>
              <div class="chart-frame">
                <Line :data="onTimeRateChartData" :options="onTimeRateOptions" />
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="chart-card" elevation="0">
              <div class="chart-card__title">Regional Open Exceptions</div>
              <div class="chart-card__subtitle">
                {{ selectedMonthLabel ? 'Selected month highlighted with year-long context' : 'Operational issue backlog by region' }}
              </div>
              <div class="chart-frame">
                <Line :data="openExceptionsChartData" :options="openExceptionsOptions" />
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="chart-card chart-card--wide" elevation="0">
              <div class="chart-card__title">Regional Metric Comparison</div>
              <div class="chart-card__subtitle">Shipments, on-time rate, and exceptions across North, South, East, and West</div>
              <div class="chart-frame chart-frame--wide">
                <Line :data="comparisonChartData" :options="comparisonOptions" />
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-bar {
  background: rgba(248, 251, 255, 0.92);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  padding-inline: 20px;
}

.eyebrow {
  color: #5b7894;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.title {
  color: #17324d;
  font-size: 1.35rem;
  font-weight: 700;
}

.picker-wrap {
  min-width: 200px;
}

.picker-label {
  color: #5b7894;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.month-select :deep(.v-field) {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 14px;
}

.dashboard-shell {
  max-width: 1240px;
}

.hero-panel {
  background:
    linear-gradient(135deg, rgba(18, 67, 124, 0.96), rgba(23, 50, 77, 0.94)),
    radial-gradient(circle at top right, rgba(102, 187, 255, 0.35), transparent 34%);
  border-radius: 28px;
  color: #f4f8fc;
  padding: 32px;
  box-shadow: 0 24px 60px rgba(17, 38, 62, 0.16);
}

.hero-kicker {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  margin: 0 0 10px;
  opacity: 0.72;
  text-transform: uppercase;
}

h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
  margin: 0 0 14px;
}

.hero-copy {
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
  max-width: 560px;
  opacity: 0.84;
}

.metric-card,
.chart-card {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(198, 214, 229, 0.86);
  border-radius: 24px;
  box-shadow: 0 14px 34px rgba(28, 52, 77, 0.08);
}

.metric-card {
  min-height: 164px;
  padding: 22px;
}

.metric-card__header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
}

.metric-card__label {
  color: #5b7894;
  font-size: 0.9rem;
  font-weight: 600;
}

.metric-card__value {
  color: #163047;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  margin-bottom: 8px;
}

.metric-card__trend {
  color: #60758a;
  font-size: 0.92rem;
}

.metric-card__trend.is-up {
  color: #15803d;
}

.metric-card__trend.is-down {
  color: #b91c1c;
}

.chart-card {
  padding: 24px;
}

.chart-card--wide {
  padding-bottom: 30px;
}

.chart-card__title {
  color: #17324d;
  font-size: 1.05rem;
  font-weight: 700;
}

.chart-card__subtitle {
  color: #60758a;
  font-size: 0.92rem;
  margin-top: 6px;
}

.chart-frame {
  height: 320px;
  margin-top: 22px;
}

.chart-frame--wide {
  height: 400px;
}

@media (max-width: 960px) {
  .app-bar {
    min-height: 108px;
    padding-block: 12px;
  }

  .picker-wrap {
    min-width: 170px;
  }
}

@media (max-width: 600px) {
  .app-bar {
    align-items: flex-start;
    gap: 16px;
    padding-inline: 16px;
  }

  .picker-wrap {
    width: 100%;
  }

  .hero-panel,
  .metric-card,
  .chart-card {
    border-radius: 20px;
  }

  .hero-panel {
    padding: 24px;
  }

  .chart-frame {
    height: 280px;
  }

  .chart-frame--wide {
    height: 340px;
  }
}
</style>
