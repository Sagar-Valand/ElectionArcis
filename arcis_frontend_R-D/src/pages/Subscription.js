import React, { useEffect, useState } from 'react';
import { useToast, ChakraProvider, Box, Button, Text, Flex, VStack, Switch, Stack, Heading, Spacer, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, FormControl, FormLabel, Checkbox, ModalFooter, RadioGroup, Radio, Grid, GridItem, Input, useColorModeValue, Textarea, InputGroup, InputLeftAddon, Icon } from '@chakra-ui/react';
import { IoIosCheckmarkCircle } from 'react-icons/io';
import theme from '../theme';
import { createOrder, getAIPlans, getFinalPrice, getMasterPlans } from '../actions/planActions';
import { getAllCameras } from '../actions/cameraActions';
import Select from 'react-select';
import { FaLock } from "react-icons/fa";
import axios from 'axios';
import MobileHeader from '../components/MobileHeader';

const SubscriptionCard = ({
  name,
  price,
  features,
  color,
  openModal,
  textColor,
}) => (
  <Flex
    direction="column"
    borderRadius="md"
    borderWidth="1px"
    // borderColor={useColorModeValue('custom.darkModeText', 'custom.darModeBg')}
    // p={6}
    bg={useColorModeValue("custom.darkModeText", "custom.darModeBg")}
    width={{ base: "100%", md: "300px" }}
    textAlign="left"
    boxShadow="1px 2px 20px 1px rgba(0, 0, 0, 0.25);"
    position="relative"
    minHeight="400px"
  >
    <Box h="10px" bg={color} borderTopRadius="md" mb={4} />
    <Box p={6}>
      <Heading
        as="h3"
        size="lg"
        fontWeight={"400"}
        mb={2}
        color={useColorModeValue("custom.lightModeText", "custom.darkModeText")}
      >
        {name}
      </Heading>
      <Text
        fontSize="4xl"
        fontWeight="bold"
        color={useColorModeValue("custom.lightModeText", "custom.darkModeText")}
      >
        ₹{price}
      </Text>
      <Text
        fontSize="sm"
        color={useColorModeValue(
          "custom.secondaryTextColor",
          "custom.secondaryTextColor"
        )}
        mb={4}
      >
        Everything You Need To Get Started:
      </Text>
      <Stack spacing={2} align="left" mb={4}>
        {features.map((feature, index) => (
          <Flex key={index} color="gray.600">
            <IoIosCheckmarkCircle
              style={{ color: theme.colors.custom.primary, marginRight: "8px" }}
            />
            <Text color={textColor} fontSize="xs">
              {feature}
            </Text>
          </Flex>
        ))}
      </Stack>
    </Box>
    <Spacer />
    <Button
      colorScheme="blue"
      variant="outline"
      m={4}
      onClick={() => openModal({ name, price, features, color })}
    >
      {name === "Basic" ? "FREE" : "Subscribe Now"}
    </Button>
  </Flex>
);

const Subscription = () => {
  const toast = useToast();
  useEffect(() => {
    const scriptId = 'razorpay-checkout-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.id = scriptId; // Add an ID to the script
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);


  const [plans, setPlans] = useState([]);
  const fetchData = async () => {
    const result = await getMasterPlans();
    console.log("samjho", result);
    setPlans(result.data);
  }
  useEffect(() => {
    fetchData();
  }, []);

  const [aiSubscriptionPlans, setAiSubscriptionPlans] = useState([]);
  const [storagePlan, setStoragePlan] = useState([]);
  const [didDropdown, setDidDropdown] = useState([]);
  const [selectedDid, setSelectedDid] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAIOptions, setSelectedAIOptions] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [aiPrice, setAiPrice] = useState(0);
  const [isAnnually, setIsAnnually] = useState(false);
  const [selectedPlanOptions, setSelectedPlanOptions] = useState([]);
  // const [isAnnually, setIsAnnual] = useState(true);
  const [includeAI, setIncludeAI] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [didForPlan, setDidForPlan] = useState(null);
  const textColor = useColorModeValue("custom.lightModeText", "custom.darkModeText");

  const options =
    didDropdown && didDropdown.length > 0
      ? didDropdown.map((did) => ({
        value: did,   // `did` is the deviceid
        label: did,   // Use the deviceid as the label as well
      }))
      : [];

  const openModal = async (plan) => {
    const result = await getAIPlans(plan.name);
    console.log("samjho", result);
    setAiSubscriptionPlans(result.data[0].aiFeatures);
    setStoragePlan(result.data[0].storagePlan);
    const getAllCamera = await getAllCameras(1, 100);
    setDidDropdown(getAllCamera.cameras.map(camera => camera.deviceId));
    setSelectedPlan(plan); // Store the entire plan object here
    setIsModalOpen(true);
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAIOptions([]);
    setSelectedPlanOptions([]);
    setAiPrice(0);
  };

  const calculatePrice = (plan) => {
    if (!plan) return 0;
    // let price = isAnnually ? plan.annually : plan.monthly;
    let price = plan.price;
    if (includeAI) {
      price += aiPrice;
    }
    return price;
  };

  const handleChange = (selected) => {
    setSelectedOptions(selected);
    handleCategoryChange(selected); // Pass the selected options to your handler
  };

  const handleCategoryChange = (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setDidForPlan(values); // Update the state with the array of selected subdeviceid values
  };

  const handlePlanOptionChange = (selectedValue) => {
    setSelectedPlanOptions(selectedValue); // selectedValue will be the new selected plan
  };

  const handleAIOptionChange = (e) => {
    const value = e.target.value;
    setSelectedAIOptions((prev) =>
      prev.includes(value)
        ? prev.filter((option) => option !== value)
        : [...prev, value]
    );
  };

  useEffect(() => {
    const updateTotalPrice = () => {
      // Calculate AI Options Price
      const totalAiPrice = selectedAIOptions.reduce((acc, option) => {
        const feature = aiSubscriptionPlans.find((f) => f.name === option);
        if (feature) {
          return acc + (isAnnually ? feature.aiAnnuallyPrice : feature.aiMonthlyPrice);
        }
        return acc;
      }, 0);

      // Calculate DVR Plan Price
      const selectedDvrPlan = storagePlan.find(
        (plan) => plan.planName === selectedPlanOptions
      );
      const dvrPlanPrice = selectedDvrPlan
        ? selectedDvrPlan.price
        : 0;

      // Add both AI options price and DVR plan price
      const totalPrice = totalAiPrice + dvrPlanPrice;

      // Update the AI price
      setAiPrice(totalPrice);
    };

    updateTotalPrice();
  }, [selectedAIOptions, isAnnually, selectedPlanOptions, storagePlan]); // Add selectedPlanOptions to dependency array

  // Toggle handler for the Switch
  const togglePlan = () => {
    setIsAnnually((prevState) => !prevState);
    console.log("anualllllll", isAnnually);
  };

  // PROCEED TO PAY BUTTON ONWARDS

  const [finalAmt, setFinalAmt] = useState(0);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("white", "gray.800");
  const boxShadowColor = useColorModeValue("lg", "2xl");

  const handleProceedToAddress = async () => {
    const planType = isAnnually ? 'Annually' : 'monthly';
    // Close the first modal and open the address modal
    // const result = await getFinalPrice(selectedPlan.name, planType, selectedAIOptions, selectedPlanOptions);
    // setFinalAmt(result.data);
    setIsModalOpen(false);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contact: ''
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const isFormComplete = Object.values(formData).every((field) => field.trim() !== '');

  // PAYMENT BUTTON ONWARDS

  const currentTime = new Date();
  const formattedDate = currentTime.toLocaleDateString('en-GB');

  // Parse formattedDate back to a Date object
  const parts = formattedDate.split('/');
  const date = new Date(parts[2], parts[1] - 1, parts[0]);

  // Add 28 days to the date
  date.setDate(date.getDate() + 28);

  // Format the new date back to 'en-GB' format
  const formattedEndDate = date.toLocaleDateString('en-GB');

  // const handlePayment = async (amount) => {
  //   try {
  //     if (!amount) {
  //       console.error("Amount is not provided");
  //       return;
  //     }

  //     // Step 1: Create order in backend
  //     const orderDetails = {
  //       amount: amount * 100, // Amount in the smallest currency unit
  //       currency: 'INR',
  //       receipt: `order_rcptid_${Date.now()}`,
  //       notes: {
  //         key1: 'value1',
  //         key2: 'value2',
  //       },
  //       shippingInfo: {
  //         firstName: formData.firstName,
  //         lastName: formData.lastName,
  //         email: formData.email,
  //         address: formData.address,
  //         city: formData.city,
  //         state: formData.state,
  //         pinCode: formData.pincode,
  //         phoneNo: formData.contact,
  //       },
  //       orderItems: {
  //         cameraName: 'Camera 1',
  //         cameraType: 'Type A',
  //         quantity: 2,
  //         price: 100,
  //         planName: selectedPlan.name,
  //         featuresList: selectedAIOptions,
  //         planDays: 28,
  //         planStartDate: formattedDate,
  //         planEndDate: formattedEndDate,
  //         deviceId: selectedOptions,
  //         storagePlan: selectedPlanOptions,
  //       }
  //     };

  //     // Use the createOrder function from actions
  //     const orderResponse = await createOrder(
  //       orderDetails.amount,
  //       orderDetails.currency,
  //       orderDetails.receipt,
  //       orderDetails.notes,
  //       orderDetails.shippingInfo,
  //       orderDetails.orderItems
  //     );

  //     // Handle the response from createOrder
  //     console.log('Order created successfully:', orderResponse);
  //     // You can proceed with payment flow using the returned orderResponse

  //     console.log("Order Response Hittu:", orderResponse.data);

  //     // Step 2: Get Razorpay order details from backend response
  //     const { id: order_id } = orderResponse.data;
  //     console.log("Order Response 2:", order_id);

  //     // Step 3: Open Razorpay checkout
  //     const options = {
  //       key: 'rzp_test_ioFPZksKePXDlm', // Your Razorpay API key
  //       amount: amount * 100, // Convert to the smallest currency unit (paise)
  //       currency: 'INR',
  //       name: "Your Company Name",
  //       description: "Description of the order",
  //       order_id: order_id, // The order ID returned from backend
  //       handler: async (response) => {
  //         try {
  //           // Handle the success response here
  //           const paymentResponse = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/plan/verifyPayment`, {
  //             order_id: response.razorpay_order_id,
  //             razorpay_payment_id: response.razorpay_payment_id,
  //             razorpay_signature: response.razorpay_signature
  //           },
  //             { withCredentials: true });

  //           if (paymentResponse.data.success) {

  //             // Log payment details to the console
  //             console.log('Payment Details:', {
  //               order_id: response.razorpay_order_id,
  //               payment_id: response.razorpay_payment_id,
  //               signature: response.razorpay_signature,
  //               amount: amount * 100,
  //               currency: 'INR',
  //               notes: {
  //                 key1: 'value1',
  //                 key2: 'value2'
  //               },
  //               status: 'successful'
  //             });
  //             alert('Payment Successful');
  //           } else {

  //             // Log failed payment details to the console
  //             console.log('Failed Payment Details:', {
  //               order_id: response.razorpay_order_id,
  //               payment_id: response.razorpay_payment_id,
  //               signature: response.razorpay_signature,
  //               amount: amount * 100,
  //               currency: 'INR',
  //               notes: {
  //                 key1: 'value1',
  //                 key2: 'value2'
  //               },
  //               status: 'failed'
  //             });
  //             alert('Payment Verification Failed');
  //           }
  //         } catch (error) {
  //           console.error('Error verifying payment:', error);
  //         }
  //         // You can send the payment details to your backend for further processing
  //       },
  //       prefill: {
  //         name: 'Purvesh',
  //         email: 'rutvikjani22@gmail.com',
  //         contact: '8401918193',
  //       },
  //       theme: {
  //         color: "#F37254", // Customize the color of the Razorpay modal
  //       },
  //     };

  //     console.log("Razorpay Options:", options);

  //     const rzp = new window.Razorpay(options);
  //     rzp.open();

  //   } catch (error) {
  //     console.error("Error during payment process", error);
  //   }
  // };

  const handlePayment = async (amount) => {
    try {
      // if (!amount) {
      //   console.error("Amount is not provided");
      //   return;
      // }

      // Step 1: Create order in backend
      const orderDetails = {
        amount: 0, // Amount in the smallest currency unit
        currency: 'INR',
        receipt: `order_rcptid_${Date.now()}`,
        notes: {
          key1: 'value1',
          key2: 'value2',
        },
        shippingInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pinCode: formData.pincode,
          phoneNo: formData.contact,
        },
        orderItems: {
          cameraName: 'Camera 1',
          cameraType: 'Type A',
          quantity: 2,
          price: 100,
          planName: selectedPlan.name,
          featuresList: selectedAIOptions,
          planDays: 28,
          planStartDate: formattedDate,
          planEndDate: formattedEndDate,
          deviceId: selectedOptions,
          storagePlan: selectedPlanOptions,
        }
      };

      // Use the createOrder function from actions
      const orderResponse = await createOrder(
        orderDetails.amount,
        orderDetails.currency,
        orderDetails.receipt,
        orderDetails.notes,
        orderDetails.shippingInfo,
        orderDetails.orderItems
      );

      // Handle the response from createOrder
      console.log('Order created successfully:', orderResponse);
      // You can proceed with payment flow using the returned orderResponse

      console.log("Order Response Hittu:", orderResponse.data);

      // Step 2: Get Razorpay order details from backend response
      const { id: order_id } = orderResponse.data;
      console.log("Order Response 2:", order_id);

      //step 3(replace it with below for turning razorpay on): Hit api directly
      const paymentResponse = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/plan/verifyPayment`, {
        order_id: order_id,
      },
        { withCredentials: true });
      toast({
        title: "Plan Added Successfully",
        // description: "The video failed to load.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      closeAddressModal();

      // Step 3: Open Razorpay checkout
      // const options = {
      //   key: 'rzp_test_ioFPZksKePXDlm', // Your Razorpay API key
      //   amount: amount * 100, // Convert to the smallest currency unit (paise)
      //   currency: 'INR',
      //   name: "Your Company Name",
      //   description: "Description of the order",
      //   order_id: order_id, // The order ID returned from backend
      //   handler: async (response) => {
      //     try {
      //       // Handle the success response here
      //       const paymentResponse = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/plan/verifyPayment`, {
      //         order_id: response.razorpay_order_id,
      //         razorpay_payment_id: response.razorpay_payment_id,
      //         razorpay_signature: response.razorpay_signature
      //       },
      //         { withCredentials: true });

      //       if (paymentResponse.data.success) {

      //         // Log payment details to the console
      //         console.log('Payment Details:', {
      //           order_id: response.razorpay_order_id,
      //           payment_id: response.razorpay_payment_id,
      //           signature: response.razorpay_signature,
      //           amount: amount * 100,
      //           currency: 'INR',
      //           notes: {
      //             key1: 'value1',
      //             key2: 'value2'
      //           },
      //           status: 'successful'
      //         });
      //         alert('Payment Successful');
      //       } else {

      //         // Log failed payment details to the console
      //         console.log('Failed Payment Details:', {
      //           order_id: response.razorpay_order_id,
      //           payment_id: response.razorpay_payment_id,
      //           signature: response.razorpay_signature,
      //           amount: amount * 100,
      //           currency: 'INR',
      //           notes: {
      //             key1: 'value1',
      //             key2: 'value2'
      //           },
      //           status: 'failed'
      //         });
      //         alert('Payment Verification Failed');
      //       }
      //     } catch (error) {
      //       console.error('Error verifying payment:', error);
      //     }
      //     // You can send the payment details to your backend for further processing
      //   },
      //   prefill: {
      //     name: 'Purvesh',
      //     email: 'rutvikjani22@gmail.com',
      //     contact: '8401918193',
      //   },
      //   theme: {
      //     color: "#F37254", // Customize the color of the Razorpay modal
      //   },
      // };

      // console.log("Razorpay Options:", options);

      // const rzp = new window.Razorpay(options);
      // rzp.open();

    } catch (error) {
      console.error("Error during payment process", error);
    }
  };


  return (
    <Box
      p={3}
      width="100%"
      maxW="1440px"
      mx="auto"
      mb={{ base: "20", md: "5" }}
    >
      <MobileHeader title="Subscription" />

      <Flex
        alignItems="center"
        justifyContent="space-between"
        width="full"
        maxWidth="100%"
        mt={{ base: "12", md: "0" }}
      >
        {/* Left Side: Subscription Texts */}
        <VStack width="100%" alignItems="center" spacing={1}>
          <Text
            display={{ base: "none", md: "block" }}
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="bold"
            color={useColorModeValue(
              "custom.lightModeText",
              "custom.darkModeText"
            )}
          >
            Subscription
          </Text>

          <Text
            fontSize="md"
            color={useColorModeValue(
              "custom.secondaryTextColor",
              "custom.darkModeText"
            )}
            display={{ base: "none", md: "block" }}
          >
            Select the plan that suits your demand. Hardware and accessibility
            are different in each plan.
          </Text>

          <Flex
            justify="center"
            align="center"
            mb={4}
            color={useColorModeValue(
              "custom.lightModeText",
              "custom.darkModeText"
            )}
            fontSize="sm"
          >
            <Text mr={2}>Monthly</Text>
            <Switch
              colorScheme="blue"
              isChecked={isAnnually}
              onChange={togglePlan}
            />{" "}
            {/* isChecked={isAnnually} onChange={togglePlan} */}
            <Text ml={2}>Yearly</Text>
          </Flex>
          <Text color="blue.400" mb={6}>
            Save 20% Annually
          </Text>
        </VStack>
      </Flex>

      <Flex justify="center" gap={8} flexWrap="wrap">
        {plans.map((plan, index) => (
          <SubscriptionCard
            key={index}
            name={plan.name}
            price={isAnnually ? plan.annually : plan.monthly}
            features={plan.features}
            color={plan.color}
            openModal={openModal}
            textColor={textColor}
          />
        ))}
      </Flex>

      {/* Modal for Plan Options */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        size={{ base: "50%", md: "lg" }}
        zIndex={1000}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Customize Your AI Plan</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4} fontSize={{ base: "md", md: "lg" }}>
              Select AI options for the {selectedPlan?.name} plan:
            </Text>
            <FormControl mb={4}>
              <FormLabel fontSize={{ base: "sm", md: "md" }}>
                Select DID
              </FormLabel>
              <Select
                placeholder="Select DID"
                isMulti
                value={selectedOptions}
                options={options}
                onChange={handleChange}
                size={{ base: "sm", md: "md" }}
              />
              <FormLabel fontSize={{ base: "sm", md: "md" }}>
                AI Options
              </FormLabel>
              {aiSubscriptionPlans.map((feature) => (
                <VStack key={feature.id} spacing={2} align="start" mb={2}>
                  <Checkbox
                    value={feature.name}
                    isChecked={selectedAIOptions.includes(feature.name)}
                    onChange={handleAIOptionChange}
                    size={{ base: "sm", md: "md" }}
                  >
                    {feature.name} (+₹
                    {isAnnually
                      ? feature.aiAnnuallyPrice
                      : feature.aiMonthlyPrice}
                    )
                  </Checkbox>
                </VStack>
              ))}
              <FormLabel fontSize={{ base: "sm", md: "md" }}>
                Storage Plans
              </FormLabel>
              {storagePlan && storagePlan.length > 0 ? (
                <RadioGroup
                  onChange={handlePlanOptionChange}
                  value={selectedPlanOptions}
                >
                  {storagePlan.map((feature) => (
                    <VStack key={feature.id} spacing={2} align="start" mb={2}>
                      <Radio
                        value={feature.planName}
                        size={{ base: "sm", md: "md" }}
                      >
                        {feature.planName}&nbsp;-&nbsp;₹{feature.price}
                      </Radio>
                    </VStack>
                  ))}
                </RadioGroup>
              ) : (
                <p>No storage plans available</p>
              )}
            </FormControl>
            <VStack spacing={4} align="start">
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold">
                Total AI Cost: ₹{aiPrice}
              </Text>
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold">
                Updated Plan Price: ₹
                {selectedPlan
                  ? calculatePrice(selectedPlan) + aiPrice
                  : aiPrice}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Stack spacing={4} w="100%">
              <Button
                colorScheme="purple"
                mr={3}
                onClick={handleProceedToAddress}
                size={{ base: "sm", md: "md" }}
              >
                Proceed To Pay
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Address Modal */}

      <Modal
        isOpen={isAddressModalOpen}
        onClose={closeAddressModal}
        size={{ base: "50%", md: "lg" }}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Shipping Address</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <GridItem>
              <Box
                border="1px solid"
                borderColor={borderColor}
                borderRadius="lg"
                boxShadow={boxShadowColor}
                p={6} // Increase padding for form container
                bg={bgColor}
              >
                <form>
                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                    gap={4}
                  >
                    <GridItem colSpan={{ base: 2, md: 1 }}>
                      <FormControl isRequired>
                        <FormLabel htmlFor="firstName">First Name</FormLabel>
                        <Input
                          id="firstName"
                          name="firstName"
                          autoComplete="given-name"
                          variant="outline"
                          focusBorderColor="purple.500"
                          placeholder="Enter your first name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 2, md: 1 }}>
                      <FormControl isRequired>
                        <FormLabel htmlFor="lastName">Last Name</FormLabel>
                        <Input
                          id="lastName"
                          name="lastName"
                          autoComplete="family-name"
                          focusBorderColor="purple.500"
                          placeholder="Enter your last name"
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl isRequired>
                        <FormLabel htmlFor="email">Email</FormLabel>
                        <Input
                          id="email"
                          name="email"
                          autoComplete="email"
                          focusBorderColor="purple.500"
                          placeholder="Enter your Email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={2}>
                      <FormControl isRequired>
                        <FormLabel htmlFor="address">Street Address</FormLabel>
                        <Textarea
                          id="address"
                          name="address"
                          autoComplete="shipping street-address"
                          rows={3}
                          focusBorderColor="purple.500"
                          placeholder="Enter your address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 2, md: 1 }}>
                      <FormControl isRequired>
                        <FormLabel htmlFor="city">City</FormLabel>
                        <Input
                          id="city"
                          name="city"
                          autoComplete="address-level2"
                          focusBorderColor="purple.500"
                          placeholder="Enter your city"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 2, md: 1 }}>
                      <FormControl isRequired>
                        <FormLabel htmlFor="state">State</FormLabel>
                        <Input
                          id="state"
                          name="state"
                          autoComplete="address-level1"
                          focusBorderColor="purple.500"
                          placeholder="Enter your state"
                          value={formData.state}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 2, md: 1 }}>
                      <FormControl isRequired>
                        <FormLabel htmlFor="pincode">Pin/Postal Code</FormLabel>
                        <Input
                          id="pincode"
                          name="pincode"
                          autoComplete="postal-code"
                          focusBorderColor="purple.500"
                          placeholder="Enter your PinCode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem colSpan={{ base: 2, md: 1 }}>
                      <FormControl isRequired>
                        <FormLabel htmlFor="contact">Contact Number</FormLabel>
                        <InputGroup>
                          <InputLeftAddon children="+91" />
                          <Input
                            type="tel"
                            id="contact"
                            name="contact"
                            placeholder="Enter Contact"
                            autoComplete="tel"
                            focusBorderColor="purple.500"
                            value={formData.contact}
                            onChange={handleInputChange}
                          />
                        </InputGroup>
                      </FormControl>
                    </GridItem>
                  </Grid>
                </form>
              </Box>
            </GridItem>
          </ModalBody>
          <ModalFooter>
            <Stack spacing={4} w="100%">
              <Button
                colorScheme="purple"
                mr={3}
                onClick={() => handlePayment(finalAmt)}
                size={{ base: "sm", md: "md" }}
                isDisabled={!isFormComplete}
              >
                Payment ₹{finalAmt}
              </Button>

              <Flex align="center" justify="center" mt={2}>
                <Icon as={FaLock} w={4} h={4} color="green.500" mr={1} />
                <Text
                  fontSize="xs"
                  color="green.500"
                  _dark={{ color: "gray.300" }}
                >
                  Secured Payment
                </Text>
              </Flex>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Subscription;
