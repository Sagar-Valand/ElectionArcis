import { Box, Stack, Avatar, Text, Grid, useColorModeValue, Flex, Icon, VStack } from '@chakra-ui/react';
import theme from '../theme';

const CustomCard = ({ title, value, sanand, color, bcolor, IconComponent, layout = 'vertical' }) => {

  const cardBg = useColorModeValue(
    "linear-gradient(180deg, #E8F1F9 0%, #F4F8FB 100%)",
    "gray.800"
  );
  const borderColor = useColorModeValue('rgba(226, 232, 240, 0.5)', 'gray.700');
  const cardBgVertical = useColorModeValue('#EBF8FF', 'gray.700');
  const cardBgHorizontal = useColorModeValue('#EBF8FF', 'gray.700');
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const valueColor = useColorModeValue('gray.800', 'white');
  const shadow = useColorModeValue('sm', 'dark-lg');

  if (layout === 'vertical') {
    return (
      <Box
        borderRadius="10px" // Matches the soft rounded corners in image
        bg={cardBg}
        p={5}
        height="140px"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="lg"
      >
        <VStack align="start" spacing={2}>
          {/* Icon Box */}
          <Flex
            alignItems="center"
            justifyContent="center"
            bg={color}
            borderRadius="8px"
            boxSize="40px"
            color="white"
          >
            {IconComponent && <Icon as={IconComponent} boxSize="24px" />}
          </Flex>

          {/* Text Content */}
          <Box pt={1}>
            <Text fontSize="15px" color={textColor} fontWeight="500">
              {title}
            </Text>
            <Text fontSize="28px" fontWeight="600" color={valueColor} lineHeight="1.1">
              {value}
            </Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  return (
     <Box
        borderRadius="12px"
        bg={cardBg}
        p={4}
        border="1px solid"
        borderColor={borderColor}
      >
        <Flex alignItems="center" gap={4}>
          <Flex
            alignItems="center"
            justifyContent="center"
            bg={color}
            borderRadius="8px"
            boxSize="42px"
            minW="42px"
            color="white"
          >
            {IconComponent && <Icon as={IconComponent} boxSize="18px" />}
          </Flex>
  
          <Stack spacing={0}>
            <Text fontSize="13px" color={textColor} fontWeight="500">
              {title}
            </Text>
            <Text fontSize="22px" fontWeight="600" color={valueColor}>
              {value}
            </Text>
          </Stack>
        </Flex>
      </Box>
  );
};

export default CustomCard;
