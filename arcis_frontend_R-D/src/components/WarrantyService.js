import React from "react";
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
  UnorderedList,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
function WarrantyService() {
  return (
    <Box maxW={"1440px"} mx={"auto"} overflow={"hidden"}>
      <Flex
        direction={{ base: "column", md: "row" }}
        justify={{ base: "flex-start", md: "space-between" }}
        align={{ base: "flex-start", md: "center" }}
        mb={4}
      >
        <Heading size="lg" mb={{ base: 2, md: 0 }}>
          Warranty Service
        </Heading>
        <Text fontSize="sm" color="gray.500">
          LAST UPDATED: January 25th 2021
        </Text>
      </Flex>
      {/* Added section for last updated date and applicability */}
      <Text mb={2}>
        Welcome to the online store (the “Store”) provided by Ambiplatforms LLC
        (“Ambiplatforms”). Your purchase of Arcis hardware products (“Products”)
        and/or subscription services (“Subscription Services”) from the Store
        constitutes your agreement to be bound by these Terms & Conditions of
        Sale (“Terms & Conditions”) and any additional terms we provide,
        including but not limited to our Terms of Serviceand the terms of the
        Limited Warranty included in-box with a Product.
      </Text>
      <Text mb={2}>
        This is a legal agreement. by placing an order for Arcis products and/or
        subscription services, you are accepting and agreeing to these terms &
        conditions. you represent and warrant that you have the right,
        authority, and capacity to accept and agree to these terms & conditions.
        you represent that you are of sufficient legal age in your jurisdiction
        or residence to purchase and use products and to enter into this
        agreement. if you do not agree with any of the provisions of these terms
        & conditions, you should not purchase the products.
      </Text>
      <Text mb={2}>
        We reserve the right to change these Terms & Conditions at any time, so
        please review the Terms & Conditions each time prior to making a
        purchase from the Store. Every time you order Products from Arcis , the
        Terms & Conditions in force at that time will apply between you and
        Arcis . If you purchase our Subscription Services, we will notify you in
        the event we make changes to these Terms & Conditions that affect your
        subscription. If you have any questions regarding these Terms &
        Conditions, you can contact Arcis .
      </Text>
      <Text mb={2}>
        The Store is for retail sales to private consumers only. Please
        <strong> contact@adiance.com</strong> if you wish to purchase wholesale
        supplies.
      </Text>
      <Text mb={2}>
        As a consumer, you have certain legal rights. The disclaimers,
        exclusions, and limitations of liability under these Terms & Conditions
        will not apply to the extent prohibited by applicable law. Some
        jurisdictions do not allow the exclusion of implied warranties,
        including exclusions relating to products or services that are faulty or
        not as described, or the exclusion or limitation of incidental or
        consequential damages or other rights. For a full description of your
        legal rights you should refer to the laws applicable in your country or
        jurisdiction. Nothing in these Terms & Conditions will affect those
        other legal rights.
      </Text>
      <Text mb={2}>
        Although the Store is accessible worldwide, the Products and
        Subscription Services offered on the Store are not designed and tested
        for use in all countries. If you choose to access the Store and/or use
        the Products and Subscription Services outside the India (each, a
        “Target Country”), as applicable, you do so on your own initiative and
        you are solely responsible for complying with applicable local laws in
        your country. You understand and accept that the Store and our Products
        and Subscription Services are not designed for use in a non-Target
        Country and some or all of the features of the Store, Products and
        Subscription Services may not work or be appropriate for use in such a
        country. To the extent permissible by law, Arcis accepts no
        responsibility or liability for any damage or loss caused by your access
        or use of the Store, Products and Subscription Services in a non-Target
        Country.
      </Text>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          1. Compatibility
        </Heading>
        <Text mb={2}>
          You acknowledge that you have verified the compatibility of the
          Products you are purchasing with other equipment in your home. You are
          solely responsible for determining the compatibility of the Products
          with other equipment in your home, and you accept that lack of
          compatibility is not a valid claim under the warranty provided with
          your Products and does not otherwise constitute a basis for receiving
          a refund after the 30-day refund policy described below.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          2. Reservations and Pre-Orders.{" "}
        </Heading>
        <Text mb={2}>
          Products available for reservation and pre-order are not offered for
          sale by Arcis . Your placement of a reservation and pre-order does not
          create a contract for sale.
        </Text>

        <Text mb={2}>
          By placing a reservation and pre-order for a Product that is not yet
          available for sale, you make an offer to Arcis to purchase the Product
          subject to these Terms & Conditions. Arcis will obtain an
          authorization from your bank or credit card Company for no charge. An
          authorization from your payment card company may stay open for several
          days or weeks before a charge is actually made.
        </Text>
        <Text mb={2}>
          You may cancel your offer to purchase Products at any time prior to
          shipment and you will not be charged. You will receive an email
          several days prior to the shipment of reserved Products in which you
          will have an option to cancel your offer and you will not be charged.
        </Text>
        <Text mb={2}>
          Later, when the Product is offered for sale, Arcis may accept your
          offer to purchase Products subject to these Terms & Conditions. At
          that time, Arcis will capture payment on the payment card you provided
          and ship your Product. Arcis may obtain an additional authorization
          from your payment card company to confirm necessary funds are
          available to purchase the Products requested.
        </Text>
        <Text mb={2}>
          Arcis reserves the right to cancel or refuse any order for any reason
          at any time prior to shipment, including after an order has been
          submitted, whether or not the order has been confirmed. We may attempt
          to contact you if all or a portion of your order is cancelled, or if
          additional information is needed to complete and accept your order.
        </Text>
        <Heading as="h4" size="md" mt={4}>
          Payment
        </Heading>
        <Text mb={2}>
          By providing a credit card or other payment method accepted by Arcis ,
          you represent and warrant that you are authorized to use the
          designated payment method and that you authorize us (or our
          third-party payment processor) to charge your payment method for the
          total amount of your order (including any applicable taxes and other
          charges). If the payment method you provide cannot be verified, is
          invalid or is otherwise not acceptable, your order may be suspended or
          cancelled. You must resolve any problem we encounter in order to
          proceed with your order. In the event you want to change or update
          payment information associated with your Arcis account, you can do so
          at any time by logging into your account and editing your payment
          information.
        </Text>

        <Heading as="h4" size="md" mt={4}>
          Subscription Services
        </Heading>
        <UnorderedList>
          <ListItem mb={2}>
            Subscription Plans. We offer different subscription plans for our
            Subscription Services. For more information about these plans,
            please visit <strong>https://www.ambicam.in/support</strong>.
          </ListItem>
          <ListItem mb={2}>
            Continuous Subscriptions. When you purchase any of our Subscription
            Services, you expressly acknowledge and agree that (1) Arcis is
            authorized to charge you a monthly or annual subscription service
            fee depending on the billing cycle you choose (in addition to any
            applicable taxes) for as long as your subscription continues, and
            (2) your subscription is continuous until you cancel it or such
            Subscription Service is suspended, discontinued, or terminated in
            accordance with Arcis’s Terms of Service.
          </ListItem>
          <ListItem mb={2}>Abuse or misuse of the Product.</ListItem>
          <ListItem mb={2}>
            Cancellations and Refunds. You may cancel your Subscription Services
            at any time by logging into your Arcis Account and selecting “Cancel
            Subscription.” Note that merely unpairing a Product from a
            Subscription Service will not trigger cancellation of the
            Subscription Service. In the event you cancel a Subscription
            Service, we will provide a prorated refund for the period of time
            starting the day after cancellation of the Subscription Service
            through the remainder of your billing cycle.
          </ListItem>
          <ListItem mb={2}>
            Free Trials. We may offer free trials of our Subscription Services
            for limited periods of time. If we offer you a free trial, the
            specific terms of your free trial will be provided at registration.
            We have no obligation to notify you when your free trial ends, and
            we reserve the right to modify or terminate free trials at any time,
            without notice and in our sole discretion.
          </ListItem>
        </UnorderedList>
      </Box>
      {/* Added section 4 and 5 */}
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          THE INFORMATION WE SHARE
        </Heading>
        <Text mb={0}>
          When you create an account on the Sites, Arcis will collect and retain
          information about you, some of which is Personal Information. You may
          be required to provide additional personal or demographic information
          when registering for an event hosted on the Sites including, but not
          limited to, photo, resume, work experience, educational qualification,
          location, skills, industry.
        </Text>
        <Text mb={2}>
          The information you provide is collected by Arcis , and is shared with
          the company(ies) participating in the Event, which may be a customer
          or a Third Party. This includes personal information such as name,
          email address, resume and other questions you answer during the
          registration process. This also includes the conversation (chat)
          history from conversations with any other participant and/or
          organization. If providing information for an Event, this information
          may become subject to the policies of the respective company(ies)
          after it has been shared, as Arcis is not responsible for these
          policies. Providing additional information beyond what is required at
          registration is entirely optional, but enables you to better identify
          yourself.
        </Text>
        <Text mb={2}>
          We may share your Personal Information with third party contractors or
          service providers to provide you with the services that we offer you
          through our Sites; to provide technical support, or to provide
          specific services in accordance with your instructions. These third
          parties are required not to use your Personal Information other than
          to provide the services requested by Arcis .
        </Text>
        <Text mb={2}>
          We may also disclose specific user information when we determine, in
          good faith, that such disclosure is necessary to comply with the law,
          to cooperate with or seek assistance from law enforcement, to prevent
          a crime or protect national security, or to protect the interests or
          safety of Arcis , our customers, or other users of the Sites.
        </Text>
        <Text mb={2}>
          You should be aware that any Personal Information you submit on the
          Sites may be read, collected, or used by other users of Arcis , and
          could be used to send you unsolicited messages. In addition, any
          personal information you submit in an Event can be read, collected, or
          used by participating companies, and could be used to send you
          unsolicited messages. We are not responsible for the Personal
          Information you choose to submit to the Sites.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Availability and Pricing
        </Heading>
        <Text mb={2}>
          All Products offered on the Store are subject to availability, and we
          reserve the right to impose quantity limits on any order, to reject
          all or part of an order and to discontinue offering certain Products
          and/or Subscription Services without prior notice. Prices for the
          Products and Subscription Services are subject to change at any time,
          but changes will not affect any order for Products you have already
          placed. In the event we change the pricing for any Subscription
          Service you have purchased, we will give you advance notice of this
          change in accordance with law of sates, country. After receiving this
          notice, you will be deemed to have accepted the change in pricing,
          unless you cancel your subscription as set forth in section 4(d)
          above.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Sales Tax
        </Heading>
        <Text mb={2}>
          Depending on the order, Arcis calculates and charges sales tax as
          prescribed in accordance with applicable laws in states, country.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Resale and Title Transfer
        </Heading>
        <Text mb={2}>
          Purchases made on the Store are intended for end users only, and are
          not authorized for resale. Title for Products purchased from the Store
          passes to the purchaser at the time of delivery by Arcis to the
          freight carrier, but Arcis and/or the freight carrier will be
          responsible for any Product loss or damage that occurs when the
          Product is in transit to you.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Shipping and Delivery
        </Heading>
        <Text mb={2}>
          Prices for the Products do not include shipping costs. Our delivery
          charges and methods are as described on the Store website from time to
          time. The estimated arrival or delivery date is not a guaranteed
          delivery date for your order. Refused deliveries will be returned to
          our warehouse. It may take up to 30 days for the returned items to be
          identified as refused and processed for a refund. The Products
          available on the Store have been designed, marketed and sold for use
          by residents of the Country of India, AS APPLICABLE. All safety
          warnings, information, instructions, packaging, in-box materials,
          mobile apps, and support services are provided only in English (U.S.).
          The Products available on the Store are not intended for use outside
          of the India, AS APPLICABLE. You are responsible for complying with
          all applicable laws and regulations of the country for which the
          Product is destined. We are not liable or responsible if you break any
          such law.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Installation
        </Heading>
        <Text mb={2}>
          There may be laws in the jurisdiction that you install a particular
          Product applicable to where and how to install that Product. You
          should check that you are in compliance with all relevant laws in your
          jurisdiction. Arcis is not responsible for any injury or damage caused
          by self-installation. Arcis maintains a list of recommended installers
          of the Products on its website. These installers are not Arcis
          employees and are not affiliated with Arcis . Arcis is not responsible
          for any conduct of or liability associated with these installers. You
          should do your own diligence of the installers to select one that best
          fits your needs.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Returns
        </Heading>
        <Text mb={2}>
          See our return policy at http://ambicam.vmukti.com/return-policy/If,
          you want to return the Product you purchased from the Store for a
          refund, you must notify us no later than 30 days following the date of
          purchase (the “Cancellation Period”). To initiate a return, you must
          inform us of your decision within the Cancellation Period by
          contacting Arcis customer support and clearly stating your desire to
          return the Product. Although it will not affect your right to a
          replacement or refund, please include details on where and when you
          purchased the Product and your reason for returning the Product. Arcis
          customer service will provide you with a Return Materials
          Authorization (“RMA”) that must be included with your return shipment
          to Arcis so Arcis can identify your shipment and with a return
          address. If you purchased the Product from somewhere other than the
          Store, please contact that reseller to return. Return request shall be
          processed as per the Arcis Return Policy.
        </Text>
        <Text mb={2}>
          You must return your Product (and any promotional merchandise supplied
          with the Product) with an RMA within the 14 days following the day on
          which you notify Arcis customer support that you desire to return your
          Product. The Product is not eligible for a return after the 30-day
          period.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Disputes and Arbitration
        </Heading>
        <UnorderedList>
          <ListItem>
            <strong>Contact Arcis First:</strong> If a dispute arises between
            you and Arcis , our goal is to learn about and address your
            concerns. You agree that you will notify Arcis about any dispute you
            have with Arcis regarding these Terms & Conditions by contacting
            Arcis .
          </ListItem>
          <ListItem>
            <strong>Binding Arbitration:</strong> You and Arcis agree, subject
            to section 11(g) (Protection of Confidentiality and Intellectual
            Property Rights), to submit any claim, dispute, action, cause of
            action, issue, or request for relief arising out of or relating to
            these Terms & Conditions or your use of the Products and/or
            Subscription Services to binding arbitration rather than by filing
            any lawsuit in any forum other than set forth in this section.
            Further, you agree arbitration is final and binding and subject to
            only very limited review by a court. You also waive your right to
            any form of appeal, review, or recourse to any court or other
            judicial authority, insofar as such waiver may be validly made. This
            provision is intended to be interpreted broadly to encompass all
            disputes or claims arising out of or relating to your use of the
            Products and/or Subscription Services. Subject to section 11(g)
            (Protection of Confidentiality and Intellectual Property Rights),
            any dispute or claim made by you against us or us against you
            arising out of or relating to these Terms & Conditions or your use
            of the Products and/or Subscription Services (whether based in
            contract, tort, statute, fraud, misrepresentation, or any other
            legal theory) will be resolved by binding arbitration except that
            you may take claims to small claims court if they qualify for
            hearing by such a court.
          </ListItem>
          <ListItem>
            <strong>Arbitration Procedures:</strong> You must first present any
            claim or dispute to Arcis by contacting us to allow us an
            opportunity to resolve the dispute. You may request arbitration if
            your claim or dispute cannot be resolved within 60 days after
            presenting the claim or dispute to Arcis . Arcis may request
            arbitration against you at any time after it has notified you of a
            claim or dispute in accordance with section 16 (Notifications). The
            arbitration of any dispute or claim shall be conducted in accordance
            with the then current and applicable rules of the Indian Arbitration
            laws as modified by this agreement. The place of any arbitration
            will be Ahmedabad, Gujarat, India, and will be conducted in the
            English language. Claims will be heard by a single arbitrator. The
            arbitrator may not award relief in excess of or contrary to what
            this agreement provides, order consolidation or arbitration on a
            class-wide or representative basis, award punitive or consequential
            damages or any other damages aside from the prevailing party’s
            actual damages, or order injunctive or declaratory relief, except
            that the arbitrator may award on an individual basis damages
            required by statute and may order injunctive or declaratory relief
            pursuant to an applicable consumer protection statute. Any
            arbitration shall be confidential, and neither you, nor Arcis nor
            the arbitrator may disclose the existence, content, or results of
            any arbitration, except as may be required by law or for purposes of
            enforcement or appeal of the arbitration award. Judgment on any
            arbitration award may be entered in any court having proper
            jurisdiction. If any portion of this arbitration section is
            determined by a court to be inapplicable or invalid, then the
            remainder shall still be given full force and effect.
          </ListItem>
          <ListItem>
            <strong>No Class Actions:</strong> There shall be no right or
            authority for any claims subject to this arbitration section to be
            arbitrated on a class action or consolidated basis or on bases
            involving claims brought in a purported representative capacity on
            behalf of the general public (including, but not limited to, as a
            private attorney general).
          </ListItem>
          <ListItem>
            <strong>Fees and Expenses:</strong> All administrative fees and
            expenses of arbitration will be divided equally between you and
            Arcis . Each party will bear the expense of its own counsel,
            experts, witnesses, and preparation and presentation of evidence at
            the arbitration hearing.
          </ListItem>
          <ListItem>
            <strong>Time Limit for Claims:</strong> You must contact Arcis
            within one (1) year of the date of the occurrence of the event or
            facts giving rise to a dispute, or you waive the right to pursue any
            claim based upon such event, facts, or dispute.
          </ListItem>
          <ListItem>
            <strong>
              Protection of Confidentiality and Intellectual Property Rights:
            </strong>{" "}
            Notwithstanding the foregoing, Arcis may seek injunctive or other
            equitable relief to protect its confidential information and
            intellectual property rights or to prevent loss of data or damage to
            its servers in any court of competent jurisdiction.
          </ListItem>
        </UnorderedList>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Warranties and Disclaimers.
        </Heading>
        <Text mb={2}>
          As far as permitted by applicable law, the Store, and all content
          available on the Store, is provided on an “as-is” basis without
          warranties or conditions of any kind, either express or implied,
          including, without limitation, warranties of title or implied
          warranties of merchantability or fitness for a particular purpose. All
          products and services purchased through the Store are provided on an
          “as-is” basis unless otherwise noted in the Limited Warranty included
          with a Product. You may choose whether to make a claim under these
          Terms & Conditions or the Limited Warranty or both, but you may not
          recover twice in respect of the same loss. To initiate a return under
          the Limited Warranty, you should contact Arcis .
        </Text>
        <Text mb={2}>
          You use our Products and Subscription Services at your own discretion
          and risk. You will be solely responsible for (and Arcis disclaims) any
          and all loss, liability or damages resulting from your use of a
          Product and/or Subscription Service, including damage or loss to your
          HVAC system, plumbing, home, Product, other peripherals connected to
          the Product, computer, mobile device, and all other items and pets in
          your home. Unless explicitly promising a “guarantee,” Arcis does not
          guarantee or promise any specific level of energy savings or other
          monetary benefit from the use of a Product and/or Subscription
          Services or any feature of them. Actual energy savings and monetary
          benefits vary with factors beyond Arcis ’s control or knowledge.
        </Text>
        <Text mb={2}>
          Arcis gives no warranty regarding the life of the batteries used in a
          Product. Actual battery life may vary depending on a number of
          factors, including the configuration and usage of a Product.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Limitation of Liability
        </Heading>
        <Text mb={2}>
          AmNothing in these Terms & Conditions and in particular within this
          “Limitation of Liability” section shall attempt to exclude or limit
          liability that cannot be excluded under applicable law.
        </Text>
        <Text mb={2}>
          to the maximum extent permitted by applicable law, in addition to the
          above warranty disclaimers, in no event will (a) Arcis be liable for
          any indirect, consequential, exemplary, special, or incidental
          damages, including any damages for lost data or lost profits, arising
          from or relating to the products, even if Arcis knew or should have
          known of the possibility of such damages, and (b) Arcis’s total
          cumulative liability arising from or related to the products, whether
          in contract or tort or otherwise, exceed the fees actually paid by you
          to Arcis or Arcis’s authorized reseller for the product at issue in
          the prior six (6)months (if any). this limitation is cumulative and
          will not be increased by the existence of more than one incident or
          claim. Arcis disclaims all liability of any kind of Arcis's licensors
          and suppliers.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Data Protection
        </Heading>
        <Text mb={2}>
          By placing an order for Products and/or Subscription Services, you
          agree and understand that Arcis may store, share, process and use data
          collected from your order form or phone/fax/email order for the
          purposes of processing the order. Arcis may also share such data
          globally with its subsidiaries and affiliates. Arcis companies shall
          protect your information in accordance with the Website Privacy
          Policy. Arcis works with other companies that help Arcis provide
          Products to you, such as freight carriers and credit card processing
          companies, and Arcis may have to share certain information with these
          companies for this purpose.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          Electronic Communications
        </Heading>
        <Text mb={0}>
          You are communicating with Arcis electronically when you use the Store
          or send email to Arcis . You agree that all agreements, notices,
          disclosures and other communications that we provide to you
          electronically satisfy any legal requirement that such communications
          be in writing. When you order in the Store, we collect and store your
          email address. From that point forward, your email address is used to
          send you information about Arcis’s products and services unless you
          opt-out of such emails using the opt-out link in the emails.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Notifications
        </Heading>
        <Text mb={2}>
          Arcis may provide notifications to you as required by law or for
          marketing or other purposes via (at its option) email to the primary
          email associated with your Arcis account, hard copy, or posting of
          such notice on the Arcis website. Arcis is not responsible for any
          automatic filtering you or your network provider may apply to email
          notifications. Arcis recommends that you{" "}
          <strong>add@adiance.com</strong> URLs to your email address book to
          help ensure you receive email notifications from Arcis .
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Force Majeure
        </Heading>
        <Text mb={2}>
          We will not be liable or responsible for any failure to perform, or
          delay in performance of, any of our obligations under a contract that
          is caused by an act or event beyond our reasonable control, including
          without limitation acts of God, strikes, lock-outs or other industrial
          action by third parties, civil commotion, riot, terrorist attack, war,
          fire, explosion, storm, flood, earthquake, epidemic or other natural
          disaster, failure of public or private telecommunications networks or
          impossibility of the use of railways, shipping, aircraft, motor
          transport or other means of public or private transport.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Severability
        </Heading>
        <Text mb={2}>
          If any part of these Terms & Conditions becomes illegal, invalid,
          unenforceable, or prohibited in any respect under any applicable law
          or regulation, such provision or part thereof will be deemed to not
          form part of the contract between us. The legality, validity or
          enforceability of the remainder of these Terms & Conditions will
          remain in full force and effect.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Survivability
        </Heading>
        <Text mb={2}>
          The obligations in Sections 1 of the act will survive any expiration
          or termination of these Terms.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Waiver
        </Heading>
        <Text mb={2}>
          Failure or delay by us to enforce any these Terms & Conditions will
          not constitute a waiver of our rights against you and does not affect
          our right to require future performance thereof.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={2}>
          Governing Law and Jurisdiction
        </Heading>
        <Text mb={2}>
          These Terms & Conditions are governed by the laws of Country of India
          without giving effect to any conflict of laws principles that may
          provide the application of the law of another jurisdiction. You agree
          to submit to the personal jurisdiction of the state and federal courts
          in or for Ahmedabad, Gujarat, India, for the purpose of litigating all
          such claims or disputes, unless such claim or dispute is required to
          be arbitrated as set forth in an above section.
        </Text>
      </Box>
    </Box>
  );
}

export default WarrantyService;
