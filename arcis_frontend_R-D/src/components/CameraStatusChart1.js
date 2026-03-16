// src/components/DistrictBarChart1.js
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
// --- CHANGE: Import Text for the "no data" message ---
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// This component now has the same styling as DistrictBarChart.js
const DistrictBarChart1 = ({ chartData, districtName }) => {
  const textColor = useColorModeValue('gray.800', 'white');
  const gridColor = useColorModeValue('rgba(200, 200, 200, 0.4)', 'rgba(255, 255, 255, 0.1)');

  // --- CHANGE: Added a more descriptive "no data" message, like in your example ---
  if (!chartData || chartData.length === 0) {
    return (
      <Box p={5} borderWidth="1px" borderRadius="lg" textAlign="center" height="400px" display="flex" alignItems="center" justifyContent="center">
        <Text>No accessible assembly data found for this district.</Text>
      </Box>
    );
  }

  // The data transformation logic remains the same.
  const labels = chartData.map(assembly => assembly.assemblyName);

  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Online',
        data: chartData.map(assembly => assembly.onlineCamera),
        // Color copied from your example
        backgroundColor: '#7BC111',
      },
      {
        label: 'Offline',
        data: chartData.map(assembly => assembly.offlineCamera),
        // Color copied from your example
        backgroundColor: '#ff0800ff',
      },
      {
        // --- CHANGE: Label changed to match your example ---
        label: 'Connected Once',
        data: chartData.map(assembly => assembly.isLiveCount),
        // Color copied from your example
        backgroundColor: '#8760e3ff',
      },
    ],
  };

  // --- CHANGE: The entire 'options' object is replaced with the style from DistrictBarChart.js ---
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: textColor,
          boxWidth: 20,
          padding: 20,
        },
      },
      // We keep the title because it's very useful for this specific chart
      title: {
        display: true,
        text: `Camera Status for Assemblies in ${districtName}`,
        color: textColor,
        font: { size: 18 },
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColor,
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: textColor,
          // Use stepSize to ensure whole numbers on the axis
          stepSize: 1,
        },
        grid: {
          color: gridColor,
          drawBorder: false,
          // Add the dashed line effect
          borderDash: [5, 5],
        },
        title: {
          display: true,
          text: 'Number of Cameras',
          color: textColor,
          font: {
            size: 14,
          },
        },
      },
    },
    // Add bar and category percentages for consistent thickness
    barPercentage: 0.3,
    categoryPercentage: 0.5,
  };

  // Adjust height to match your other chart
  return (
    <Box height="400px" p={4} borderWidth="1px" borderRadius="lg">
      <Bar options={options} data={data} />
    </Box>
  );
};

export default DistrictBarChart1;