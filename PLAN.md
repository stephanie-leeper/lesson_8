# My Dashboard - Project Brief

## What is this?
An internal executive dashboard for FastForward Logistics, built as part of the Protogen 200s Capstone. The dashboard gives the VP of Operations a single view of key freight and supply chain metrics, updated by month.

## Data
Generate a fake dataset as a JSON file (src/data/metrics.json).
12 months of data (Jan-Dec 2025), each month containing:
- Total Shipments: Volume of freight shipments processed (number, values between 150-400 with natural variations)
- On-Time Rate: Percentage of shipments delivered on time (percentage, fluctuates between 80-95%)
- Open Exceptions: Count of unresolved shipment issues (number, should loosely correlate to total shipment volume)
- Best Region: The top-performing region for the selected period (values are North, South, East, and West, should be selected based on highest on-time rates)

## Layout (Vuetify)
- v-app-bar at the top with the dashboard title and a month picker
- The month picker should default to showing ALL months
- When a specific month is selected, all cards and charts filter to that month. When "ALL" is selected, show the full year.
- Below the app bar: a row of 4 summary cards (v-card) showing the key metrics - Total shipments, ON-time rate, Open exceptions, Best region
- Below the cards: a row of 2 charts
  - Left: Line chart showing all four regions on-time rates
  - Right: Line chart showing all four regions open exceptions
- Below that: one full-width area chart showing a comparison of all four regions total shipments, open exceptions, and on-time rate
- Use v-container, v-row, v-col for responsive grid layout

## Interactions
- Month picker in the app bar filters EVERYTHING - summary cards show that month's numbers, charts highlight or filter to that month
- When "ALL" is selected, summary cards show yearly totals/averages and charts show all 12 months
- Cards should show a small up/down arrow or color indicating change from previous month

## Style
- Light theme by default (Vuetify light theme)
- Clean, minimal, lots of whitespace
- Charts should use a cohesive color palette - not rainbow
- Mobile responsive - cards stack on small screens

## Tech
- Vue 3 + TypeScript + Vuetify 3
- Chart.js via vue-chartjs for all charts
- Fake data from a local JSON file (No API calls)
- Single page - no routing needed for this app