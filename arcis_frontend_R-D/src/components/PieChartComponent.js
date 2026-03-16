// components/PieChartComponent.js
import { Box, Text, VStack, Heading } from '@chakra-ui/react';
import React from 'react';
import Chart from 'react-apexcharts';
import theme from '../theme';

const PieChartComponent = ({ options, series }) => {
    // Extract title from options
    const { title, ...restOptions } = options;

    const updatedOptions = {
        ...restOptions,
        title: {
            ...title,
            style: {
                fontFamily: theme.fonts.heading,
                fontSize: '14px',
                color: theme.colors.gray[700],
                textTransform: 'uppercase',
                fontWeight: '600',
                textAlign: 'left',
            },
        },
    };

    // Calculate percentages for each series
    const total = series.reduce((acc, value) => acc + value, 0);
    const percentages = series.map(value => ((value / total) * 100).toFixed(2));

    return (
        <Box p={5} width='100%' height='100%' borderWidth="0px" borderRadius="20px" overflow="hidden" style={{ boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 0px 0px 1px rgba(0, 0, 0, 0.06)' }}>
            {/* Title Section */}
            {title && (
                <Box textAlign="left" mb={4}>
                    <Heading as="h3" size="md" style={updatedOptions.title.style}>
                        {title.text}
                    </Heading>
                </Box>
            )}
            {/* Chart Section */}
            <Box>

                <Box height="80%" display="flex" justifyContent="center" alignItems="center" flexShrink={0}>
                    <Chart
                        options={{ ...updatedOptions, title: { text: undefined } }} // Remove title from chart options
                        series={series}
                        type="donut"
                    // height="100%"
                    // width="100%"
                    />
                </Box>
                {/* Labels Section */}
                <Box height="20%" overflow="auto" textAlign="center" >
                    <VStack mt={4} spacing={2}>
                        {options.labels.map((label, index) => (
                            <Text key={index} fontSize="14px" color={theme.colors.gray[700]}>
                                {label}: {percentages[index]}%
                            </Text>
                        ))}
                    </VStack>
                </Box>
            </Box>
        </Box>
    );
};

export default PieChartComponent;
