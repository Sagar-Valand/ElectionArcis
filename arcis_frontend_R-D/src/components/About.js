import React from "react";
import {
  Box,
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
  UnorderedList,
} from "@chakra-ui/react";
function About() {
  return (
    <Box maxW={"1440px"} mx={"auto"} overflow={"hidden"}>
      <Heading size="lg" mb={4}>
        About US
      </Heading>{" "}
      {/* Added section for last updated date and applicability */}
      <Text mb={1}>
        Today, the innovation of the cloud has changed the scenario for 24/7
        surveillance and security monitoring. It does away with the need for
        expensive hardware, while the security/surveillance data is maintained
        in the cloud.
      </Text>
      <Text mb={2}>
        Arcis is a globally innovative and leading smart cloud CCTV camera and
        security solutions provider.
      </Text>
      <Text mb={2}>
        Arcis – Next Gen Full HD Smart Cloud Camera for Retail & Enterprise. No
        Cable | No DVR | AI | 60 Sec Setup | H.265 | H.264 | SD Card Support |
        Cloud Storage.
      </Text>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          Our Mission
        </Heading>
        <Text mb={0}>
          Our Client’s success is our success, we are deeply committed to
          understand our client’s business & to sharpen our focus on our core
          competencies, and our flexible business approach allows us to look at
          client’s engagement from a different perception. Expanding the
          possibilities for our clients and them to achieve competitive
          advantages. we offer service with innovative product and technology
          solutions that we provide and this enables our clients to transform
          and perform through our services. VMukti provides its clients with
          enhanced and innovative technics that let their events and activities
          achieve superior results through a unique way of working. Our team
          relies on some of our best technics and products delivered, which aims
          to get the right technics of its service, and by working as one team
          to create and deliver the optimum solution for clients.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Our Vision
        </Heading>
        <Text mb={2}>
          Our vision is to bring out a massive transformation in the lives of
          billion-plus people through incredible innovation in cloud video
          communication technology. Arcis aims to reach maximum people and is
          strongly committed to all the different areas like Banking & Finance,
          Insurance, Retail, Electioneering, Education, Media, and Government
          institution for monitoring and surveillance services.
        </Text>

        <Text mb={2}>
          All our products are cloud-enabled and 4G/LTE/Wi-Fi compliant. Our
          vision has pushed us to achieve global leadership in our business.
          With highly scalable cloud infrastructure in more than 150000+
          locations, which are simultaneously monitored through cloud
          infrastructure using Assured Cloud data center and we are also
          providing complete and End-to-End software solution for Smart cloud
          monitoring with Wi-Fi And 4G/LTE. Our ultimate vision is to always
          stay upgraded with all new technologies of safety and security
          purposes which at last is beneficial and easy for people only.
        </Text>
      </Box>
    </Box>
  );
}

export default About;
