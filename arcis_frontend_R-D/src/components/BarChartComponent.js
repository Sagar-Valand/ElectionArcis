// components/BarChartComponent.js
import { Box, Heading } from '@chakra-ui/react';
import React from 'react';
import Chart from 'react-apexcharts';
import theme from '../theme';

const BarChartComponent = ({ options, series, title }) => {
  // const updatedOptions = {
  //   ...options,
  // };
  const headingStyle = {
    fontFamily: theme.fonts.heading,
    fontSize: '14px',
    color: theme.colors.gray[700],
    textTransform: 'uppercase',
    fontWeight: '600',
  };
  return (
    <Box p={5} width='100%' height='100%' borderWidth="0px" borderRadius="20px" overflow="hidden" style={{ boxShadow: ' 0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 0px 0px 1px rgba(0, 0, 0, 0.06) ' }}>
      <Box textAlign="left" mb={4}>
        <Heading as="h3" size="md" style={headingStyle}>
          {title}
        </Heading>
      </Box>
      <Chart
        options={options}
        series={series}
        type="bar"
        height="100%"
      />
    </Box>
  );
};

export default BarChartComponent;
