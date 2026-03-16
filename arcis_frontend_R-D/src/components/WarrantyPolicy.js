import {
  Box,
  Flex,
  Heading,
  List,
  ListItem,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import React from "react";

function WarrantyPolicy() {
  return (
    <Box maxW={"1440px"} mx={"auto"} overflow={"hidden"}>
      <Flex
        direction={{ base: "column", md: "row" }}
        justify={{ base: "flex-start", md: "space-between" }}
        align={{ base: "flex-start", md: "center" }}
        mb={4}
      >
        <Heading size="lg" mb={{ base: 2, md: 0 }}>
          Warranty Policy
        </Heading>
        <Text fontSize="sm" color="gray.500">
          LAST UPDATED: January 25th 2021
        </Text>
      </Flex>
      <Text mb={3} fontSize={{ base: "sm", md: "md" }}>
        At <strong>Ambiplatforms LLC</strong>, we deeply value your trust in us
        and are committed to making your shopping experience as seamless and
        delightful as possible.
      </Text>
      <Text mb={3} fontSize={{ base: "sm", md: "md" }}>
        We assure you that all products sold on <strong>Arcis</strong> are brand
        new and 100% genuine. If the product you receive is{" "}
        <strong>damaged</strong>, <strong>defective</strong>, or{" "}
        <strong>not as described</strong>, our{" "}
        <strong>Friendly Returns Policy</strong> is here to help.
      </Text>
      <Heading as="h3" size={{ base: "sm", md: "md" }} mb={3}>
        Replacement Guarantee
      </Heading>
      <Box overflowX={"auto"} mb={3}>
        <Table variant="simple" size={{ base: "sm", md: "md" }}>
          <Thead>
            <Tr>
              <Th>Validity</Th>
              <Th>Covers</Th>
              <Th>Resolution</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>30 days from delivery</Td>
              <Td>Damaged, Defective, Not as Described</Td>
              <Td>Replacement</Td>
            </Tr>
          </Tbody>
        </Table>
      </Box>
      <Text mb={3} fontSize={{ base: "sm", md: "md" }}>
        If your product meets the above criteria, you can request a{" "}
        <strong>replacement</strong> within 30 days of delivery at no additional
        cost.
      </Text>
      <Heading as="h3" size={{ base: "sm", md: "md" }} mb={3}>
        When Does the Guarantee Not Apply?
      </Heading>
      <List spacing={2} mb={3} fontSize={{ base: "sm", md: "md" }}>
        <ListItem>
          Damages caused by misuse of the product or incidental damage due to
          malfunction.
        </ListItem>
        <ListItem>Products with tampered or missing serial numbers.</ListItem>
        <ListItem>
          Items returned without original packaging, freebies, or accessories.
        </ListItem>
        <ListItem>
          Damages or defects not covered under Arcis's warranty.
        </ListItem>
      </List>
      <Heading as="h3" size={{ base: "sm", md: "md" }} mb={3}>
        Possible Resolutions
      </Heading>
      <Text mb={4} fontSize={{ base: "sm", md: "md" }}>
        If a replacement cannot be provided due to unavailability of stock, you
        will receive a <strong>full refund</strong>—no questions asked.
      </Text>
      <Heading as="h3" size={{ base: "sm", md: "md" }} mb={3}>
        Important Notes
      </Heading>
      <List spacing={2} mb={3} fontSize={{ base: "sm", md: "md" }}>
        <ListItem>
          For replacements, you are responsible for the shipping costs
          associated with returning the product to us.
        </ListItem>
        <ListItem>Replacements are subject to stock availability.</ListItem>
      </List>
      <Text fontSize={{ base: "sm", md: "md" }}>
        Your satisfaction is our top priority, and we are here to ensure your
        experience with Arcis is hassle-free. For any issues, feel free to reach
        out to our support team.
      </Text>
    </Box>
  );
}

export default WarrantyPolicy;
