import React from "react";
import { Box, Button, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";

const ChakraPagination = ({ activePage, totalPages, onPageChange }) => {
  const bgColor = useColorModeValue("#54637A", "#C8D6E5");
  const activeColor = useColorModeValue("#FFFFFF", "#1A1A1A");
  const inactiveColor = useColorModeValue("#1A1A1A", "#FFFFFF");
  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <Flex
      spacing={2}
      justify="center"
      border={"1px solid #EAEAEA"}
      borderRadius={"10px"}
    >
      {/* Previous Button */}
      <Button
        size="sm"
        border={"none"}
        variant="outline"
        isDisabled={activePage === 1}
        onClick={() => onPageChange(activePage - 1)}
        leftIcon={<ChevronLeftIcon />}
        // rightIcon={<Text opacity={"0.5"}>|</Text>}
      >
        Previous
      </Button>
      <Text display={"flex"} pl={"0.5"} alignItems={"center"} opacity={"0.5"}>
        |
      </Text>

      {/* Page Numbers */}
      {generatePageNumbers().map((page) => (
        <Button
          key={page}
          border={"none"}
          size="sm"
          variant={activePage === page ? "solid" : "outline"}
          backgroundColor={activePage === page ? bgColor : "none"}
          color={activePage === page ? activeColor : inactiveColor}
          onClick={() => onPageChange(page)}
          borderRadius={"2px"}
          _hover={{
            backgroundColor: "none",
          }}
        >
          {page}
        </Button>
      ))}

      {/* Next Button */}
      <Text display={"flex"} alignItems={"center"} pr={"0.5"} opacity={"0.5"}>
        |
      </Text>
      <Button
        size="sm"
        border={"none"}
        variant="outline"
        isDisabled={activePage === totalPages}
        onClick={() => onPageChange(activePage + 1)}
        rightIcon={<ChevronRightIcon />}
        // leftIcon={<Text opacity={"0.5"}>|</Text>}
      >
        Next
      </Button>
    </Flex>
  );
};

export default ChakraPagination;
