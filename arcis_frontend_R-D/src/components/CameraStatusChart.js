// src/components/DistrictBarChart.js
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
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DistrictBarChart = ({ chartData }) => {
  const gridColor = useColorModeValue('rgba(200, 200, 200, 0.4)', 'rgba(255, 255, 255, 0.1)');
  const textColor = useColorModeValue('gray.800', 'white');
    const chartBg = useColorModeValue(
    "linear-gradient(180deg, #E8F1F9 0%, #F4F8FB 100%)", 
    "gray.800"
  );

  if (!chartData || chartData.length === 0) {
    return (
      <Box p={5} borderWidth="1px" bg={chartBg}  borderRadius="lg" textAlign="center" height="400px" display="flex" alignItems="center" justifyContent="center">
        <Text>Select "All Districts" to view the comparison chart or data is loading...</Text>
      </Box>
    );
  }

  // Transform the incoming data into the format Chart.js expects
  const labels = chartData.map((d) => d.districtName);
  const onlineData = chartData.map((d) => d.onlineCamera);
  const offlineData = chartData.map((d) => d.offlineCamera);
  // Using 'isLiveCount' from your code for the "Connected Once" category
  const connectedData = chartData.map((d) => d.isLiveCount); 
  console.log("connectedData: ",connectedData);
  

  const data = {
    labels,
    datasets: [
      {
        label: 'Online',
        data: onlineData,
        backgroundColor: '#7BC111', 
      },
      {
        label: 'Offline',
        data: offlineData,
        backgroundColor: '#ff0800ff', 
      },
      {
        label: 'Connected Once', 
        data: connectedData,
        backgroundColor: '#8760e3ff', 
      },
    ],
  };

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
    title: {
      display: false,
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
        stepSize: 1,
      },
      grid: {
        color: gridColor,
        drawBorder: false,
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
  barPercentage: 0.3,
  categoryPercentage: 0.5,
};


  return (
    <Box height="400px" p={4} borderWidth="1px" borderRadius="lg" bg={chartBg}>
      <Bar options={options} data={data} />
    </Box>
  );
};

export default DistrictBarChart;