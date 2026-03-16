import { Box, Flex, Heading, List, ListItem, Text } from "@chakra-ui/react";
import React from "react";

function TermsOfService({ headingHide }) {
  return (
    <Box maxW={"1440px"} mx={"auto"} overflow={"hidden"}>
      <Flex
        direction={{ base: "column", md: "row" }}
        justify={{ base: "flex-start", md: "space-between" }}
        align={{ base: "flex-start", md: "center" }}
        mb={4}
      >
        {!headingHide && (
          <Heading size="lg" mb={{ base: 2, md: 0 }}>
            Terms of Services
          </Heading>
        )}

        <Text fontSize="sm" color="gray.500">
          LAST UPDATED: January 25th 2021
        </Text>
      </Flex>
      {/* Added section for last updated date and applicability */}
      <Text fontSize="sm" mb={6} color="gray.500">
        These terms apply to all Arcis products.
      </Text>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          1. Your Relationship with Arcis
        </Heading>
        <Text mb={0}>
          Your use of Arcis products, software, services, and websites (referred
          to collectively as the "Services" in this document) is subject to the
          terms of a legal agreement between you and Arcis. This document
          explains how the agreement is made up and sets out some of the terms
          of that agreement.
        </Text>
        <Text>
          Unless otherwise agreed in writing with Arcis, your agreement with
          Arcis will always include, at a minimum, the terms and conditions set
          out in this document.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          2. Accepting the Terms
        </Heading>
        <Text mb={0}>
          In order to use the Services, you must first agree to the Terms. You
          may not use the Services if you do not accept the Terms.
        </Text>
        <List spacing={2} mb={0}>
          <ListItem>
            <Text as="span" fontWeight="bold">
              A)
            </Text>{" "}
            Clicking to accept or agree to the Terms, where this option is made
            available to you by Arcis in the user interface for any Service;
          </ListItem>
          <ListItem>
            <Text as="span" fontWeight="bold">
              B)
            </Text>{" "}
            By actually using the Services. In this case, you understand and
            agree that Arcis will treat your use of the Services as acceptance
            of the Terms from that point onwards.
          </ListItem>
        </List>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          3. Language of the Terms
        </Heading>
        <Text mb={0}>
          Where Arcis has provided you with a translation of the English
          language version of the Terms, then you agree that the translation is
          provided for your convenience only and that the English language
          versions of the Terms will govern your relationship with Arcis.
        </Text>
        <Text>
          If there is any contradiction between what the English language
          version of the Terms says and what a translation says, then the
          English language version shall take precedence.
        </Text>
      </Box>
      {/* Added section 4 and 5 */}
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          4. Provision of the Services by Arcis
        </Heading>
        <Text mb={0}>
          Arcis is constantly innovating in order to provide the best possible
          experience for its users. You acknowledge and agree that the form and
          nature of the Services which Arcis provides may change from time to
          time without prior notice to you.
        </Text>
        <Text mb={0}>
          As part of this continuing innovation, you acknowledge and agree that
          Arcis may stop (permanently or temporarily) providing the Services (or
          any features within the Services) to you or to users generally at
          Arcis's sole discretion, without prior notice to you. You may stop
          using the Services at any time. You do not need to specifically inform
          Arcis when you stop using the Services.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          5. Use of the Services by You
        </Heading>
        <Text mb={0}>
          You agree to use the Services only for purposes that are permitted by
          (a) the Terms and (b) any applicable law, regulation, or generally
          accepted practices or guidelines in the relevant jurisdictions
          (including any laws regarding the export of data or software to and
          from the United States or other relevant countries).
        </Text>
        <Text mb={0}>
          You agree that you will not engage in any activity that interferes
          with or disrupts the Services (or the servers and networks which are
          connected to the Services).
        </Text>
        <Text mb={0}>
          Unless you have been specifically permitted to do so in a separate
          agreement with Arcis, you agree that you will not reproduce,
          duplicate, copy, sell, trade, or resell the Services for any purpose.
        </Text>
        <Text mb={0}>
          You agree that you are solely responsible for (and that Arcis has no
          responsibility to you or to any third party for) any breach of your
          obligations under the Terms and for the consequences (including any
          loss or damage which Arcis may suffer) of any such breach.
        </Text>
        <Text mb={0}>
          You agree that you cannot impersonate any real or fictional person or
          entity or perform any fraudulent activity.
        </Text>
        <Text mb={0}>
          You must be at least 13 years old to use the Services.
        </Text>
        <Text>
          Upon signing up for the Services, you agree to receive email
          communications from Arcis, which is important for Arcis to deliver the
          Services to you.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          6. Privacy and Your Personal Information
        </Heading>
        <Text mb={0}>
          For information about Arcis's data protection practices, please read
          Arcis's privacy policy.
        </Text>
        <Text>
          You agree to the use of your data in accordance with Arcis's privacy
          policies.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          7. Content in the Services
        </Heading>
        <Text mb={0}>
          You understand that all information (such as data files, written text,
          computer software, music, audio files or other sounds, photographs,
          videos or other images) which you may have access to as part of, or
          through your use of, the Services are the sole responsibility of the
          person from which such content originated. All such information is
          referred to below as the "Content".
        </Text>
        <Text mb={0}>
          Prohibited Content: You agree that you will not send, display, post,
          submit, publish or transmit Content that: (i) is unfair or deceptive
          under the consumer protection laws of any jurisdiction; (ii) is
          copyrighted, protected by trade secret or otherwise subject to third
          party proprietary rights, including privacy and publicity rights,
          unless you are the owner of such rights; (iii) creates a risk to a
          person's safety or health, creates a risk to public safety or health,
          compromises national security, or interferes with an investigation by
          law enforcement; (iv) impersonates another person; (v) promotes
          illegal drugs, violates export control laws, relates to illegal
          gambling, or illegal arms trafficking, (vi) is unlawful, defamatory,
          libelous, threatening, pornographic, harassing, hateful, racially or
          ethnically offensive, or encourages conduct that would be considered a
          criminal offense, gives rise to civil liability, violates any law, or
          is otherwise dishonest, inaccurate, inappropriate, malicious or
          fraudulent; (vii) involves theft or terrorism; (viii) constitutes an
          unauthorized commercial communication; (ix) contains the contact
          information or any personally identifiable information of any third
          party unless you have first obtained the express consent of said third
          party to include their contact information or personally identifiable
          information, and/or (x) breaches this agreement.
        </Text>
        <Text mb={0}>
          Arcis reserves the right (but shall have no obligation) to pre-screen,
          review, flag, filter, modify, refuse or remove any or all Content from
          any Service without further notice to you. We have complete discretion
          whether to publish your Content and have the right to delete any and
          all Content at any time which we believe to be in violation of the
          "Prohibited Content".
        </Text>
        <Text mb={0}>
          You should be aware that Content presented to you as part of the
          Services, including but not limited to advertisements in the Services
          and sponsored Content within the Services may be protected by
          intellectual property rights which are owned by the sponsors or
          advertisers who provide that Content to Arcis (or by other persons or
          companies on their behalf). You may not modify, rent, lease, loan,
          sell, distribute or create derivative works based on this Content
          (either in whole or in part) unless you have been specifically told
          that you may do so by Arcis or by the owners of that Content, in a
          separate agreement.
        </Text>
        <Text mb={0}>
          You understand that by using the Services you may be exposed to
          Content that you may find offensive, indecent or objectionable and
          that, in this respect, you use the Services at your own risk.
        </Text>
        <Text>
          You agree that you are solely responsible for (and that Arcis has no
          responsibility to you or to any third party for) any Content that you
          create, transmit or display while using the Services and for the
          consequences of your actions (including any loss or damage which Arcis
          Ai may suffer) by doing so.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          8. Other Content
        </Heading>
        <Text mb={0}>
          The Services may include hyperlinks to other web sites or content or
          resources. Arcis may have no control over any web sites or resources
          which are provided by companies or persons other than Arcis Ai.
        </Text>
        <Text mb={0}>
          You acknowledge and agree that Arcis is not responsible for the
          availability of any such external sites or resources, and does not
          endorse any advertising, products or other materials on or available
          from such web sites or resources.
        </Text>
        <Text mb={0}>
          You acknowledge and agree that Arcis is not liable for any loss or
          damage which may be incurred by you as a result of the availability of
          those external sites or resources, or as a result of any reliance
          placed by you on the completeness, accuracy or existence of any
          advertising, products or other materials on, or available from, such
          web sites or resources.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          9. Proprietary Rights
        </Heading>
        <Text mb={0}>
          You acknowledge and agree that Arcis owns all legal right, title and
          interest in and to the Services, including any intellectual property
          rights which subsist in the Services (whether those rights happen to
          be registered or not, and wherever in the world those rights may
          exist).
        </Text>
        <Text mb={0}>
          Unless you have agreed otherwise in writing with Arcis, nothing in the
          Terms gives you a right to use any of Arcis's trade names, trademarks,
          service marks, logos, domain names, and other distinctive brand
          features.
        </Text>
        <Text mb={0}>
          If you have been given an explicit right to use any of these brand
          features in a separate written agreement with Arcis, then you agree
          that your use of such features shall be in compliance with that
          agreement, any applicable provisions of the Terms, and Arcis's brand
          feature use guidelines as updated from time to time.
        </Text>
        <Text mb={0}>
          Arcis acknowledges and agrees that it obtains no right, title or
          interest from you (or your licensors) under these Terms in or to any
          Content that you submit, post, transmit or display on, or through, the
          Services, including any intellectual property rights which subsist in
          that Content (whether those rights happen to be registered or not, and
          wherever in the world those rights may exist). Unless you have agreed
          otherwise in writing with Arcis, you agree that you are responsible
          for protecting and enforcing those rights and that Arcis has no
          obligation to do so on your behalf.
        </Text>
        <Text mb={0}>
          You agree that you shall not remove, obscure, or alter any proprietary
          rights notices (including copyright and trademark notices) which may
          be affixed to or contained within the Services.
        </Text>
        <Text mb={0}>
          Unless you have been expressly authorized to do so in writing by Arcis
          Ai, you agree that in using the Services, you will not use any
          trademark, service mark, trade name, logo of any company or
          organization in a way that is likely or intended to cause confusion
          about the owner or authorized user of such marks, names or logos.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          10. License from Arcis
        </Heading>
        <Text mb={0}>
          Arcis gives you a personal, worldwide, royalty-free, non-assignable
          and non-exclusive license to use the software provided to you by Arcis
          Ai as part of the Services (referred to as the "Software" below). This
          license is for the sole purpose of enabling you to use and enjoy the
          benefit of the Services as provided by Arcis, in the manner permitted
          by the Terms.
        </Text>
        <Text mb={0}>
          Subject to section 1.2, you may not (and you may not permit anyone
          else to) copy, modify, create a derivative work of, reverse engineer,
          decompile or otherwise attempt to extract the source code of the
          Software or any part thereof, unless this is expressly permitted or
          required by law, or unless you have been specifically told that you
          may do so by Arcis, in writing.
        </Text>
        <Text mb={0}>
          Subject to section 1.2, unless Arcis has given you specific written
          permission to do so, you may not assign (or grant a sub-license of)
          your rights to use the Software, grant a security interest in or over
          your rights to use the Software, or otherwise transfer any part of
          your rights to use the Software.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          11. Content License from You
        </Heading>
        <Text mb={0}>
          You retain copyright and any other rights you already hold in Content
          which you submit, post or display on or through, the Services.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          12. Software Updates
        </Heading>
        <Text mb={0}>
          The Software which you use may automatically download and install
          updates from time to time from Arcis. These updates are designed to
          improve, enhance and further develop the Services and may take the
          form of bug fixes, enhanced functions, new software modules and
          completely new versions. You agree to receive such updates (and permit
          Arcis to deliver these to you) as part of your use of the Services.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          13. Ending Your Relationship with Arcis
        </Heading>
        <Text mb={0}>
          The Terms will continue to apply until terminated by either you or
          Arcis as set out below.
        </Text>
        <Text mb={0}>
          Arcis may at any time, terminate its legal agreement with you if (A)
          you have breached any provision of the Terms (or have acted in manner
          which clearly shows that you do not intend to, or are unable to comply
          with the provisions of the Terms); or (B) Arcis is required to do so
          by law (for example, where the provision of the Services to you is, or
          becomes, unlawful); or (C) the partner with whom Arcis offered the
          Services to you has terminated its relationship with Arcis Ai or
          ceased to offer the Services to you; or (D) Arcis is transitioning to
          no longer providing the Services to users in the country in which you
          are resident or from which you use the service; or (E) the provision
          of the Services to you by Arcis is, in Arcis Ai's opinion, no longer
          commercially viable.
        </Text>
        <Text mb={0}>
          Nothing in this Section shall affect Arcis's rights regarding
          provision of Services under Section 4 of the Terms.
        </Text>
        <Text>
          When these Terms come to an end, all of the legal rights, obligations
          and liabilities that you and Arcis have benefited from, been subject
          to (or which have accrued over time whilst the Terms have been in
          force) or which are expressed to continue indefinitely, shall be
          unaffected by this cessation, and the provisions of paragraph 21.1
          shall continue to apply to such rights, obligations and liabilities
          indefinitely.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          14. Exclusion of Warranties
        </Heading>
        <Text mb={0}>
          NOTHING IN THESE TERMS, INCLUDING SECTIONS 14 AND 15, SHALL EXCLUDE OR
          LIMIT Arcis'S WARRANTY OR LIABILITY FOR LOSSES WHICH MAY NOT BE
          LAWFULLY EXCLUDED OR LIMITED BY APPLICABLE LAW. SOME JURISDICTIONS DO
          NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR CONDITIONS OR THE
          LIMITATION OR EXCLUSION OF LIABILITY FOR LOSS OR DAMAGE CAUSED BY
          NEGLIGENCE, BREACH OF CONTRACT OR BREACH OF IMPLIED TERMS, OR
          INCIDENTAL OR CONSEQUENTIAL DAMAGES. ACCORDINGLY, ONLY THE LIMITATIONS
          WHICH ARE LAWFUL IN YOUR JURISDICTION WILL APPLY TO YOU AND OUR
          LIABILITY WILL BE LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.
        </Text>
        <Text mb={0}>
          YOU EXPRESSLY UNDERSTAND AND AGREE THAT YOUR USE OF THE SERVICES IS AT
          YOUR SOLE RISK AND THAT THE SERVICES ARE PROVIDED "AS IS" AND "AS
          AVAILABLE."
        </Text>
        <Text mb={0}>
          IN PARTICULAR, Arcis, ITS SUBSIDIARIES AND AFFILIATES, AND ITS
          LICENSORS DO NOT REPRESENT OR WARRANT TO YOU THAT: (A) YOUR USE OF THE
          SERVICES WILL MEET YOUR REQUIREMENTS, (B) YOUR USE OF THE SERVICES
          WILL BE UNINTERRUPTED, TIMELY, SECURE OR FREE FROM ERROR, (C) ANY
          INFORMATION OBTAINED BY YOU AS A RESULT OF YOUR USE OF THE SERVICES
          WILL BE ACCURATE OR RELIABLE, AND (D) THAT DEFECTS IN THE OPERATION OR
          FUNCTIONALITY OF ANY SOFTWARE PROVIDED TO YOU AS PART OF THE SERVICES
          WILL BE CORRECTED.
        </Text>
        <Text mb={0}>
          ANY MATERIAL DOWNLOADED OR OTHERWISE OBTAINED THROUGH THE USE OF THE
          SERVICES IS DONE AT YOUR OWN DISCRETION AND RISK AND THAT YOU WILL BE
          SOLELY RESPONSIBLE FOR ANY DAMAGE TO YOUR COMPUTER SYSTEM OR OTHER
          DEVICE OR LOSS OF DATA THAT RESULTS FROM THE DOWNLOAD OF ANY SUCH
          MATERIAL.
        </Text>
        <Text mb={0}>
          NO ADVICE OR INFORMATION, WHETHER ORAL OR WRITTEN, OBTAINED BY YOU
          FROM Arcis OR THROUGH OR FROM THE SERVICES SHALL CREATE ANY WARRANTY
          NOT EXPRESSLY STATED IN THE TERMS.
        </Text>
        <Text>
          Arcis FURTHER EXPRESSLY DISCLAIMS ALL WARRANTIES AND CONDITIONS OF ANY
          KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO THE
          IMPLIED WARRANTIES AND CONDITIONS OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE AND NON-INFRINGEMENT.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          15. Limitation of Liability
        </Heading>
        <Text mb={0}>
          SUBJECT TO THE OVERALL PROVISION IN PARAGRAPH 14.1 ABOVE, YOU
          EXPRESSLY UNDERSTAND AND AGREE THAT Arcis, ITS SUBSIDIARIES AND
          AFFILIATES, AND ITS LICENSORS SHALL NOT BE LIABLE TO YOU FOR: (A) ANY
          DIRECT, INDIRECT, INCIDENTAL, SPECIAL CONSEQUENTIAL OR EXEMPLARY
          DAMAGES WHICH MAY BE INCURRED BY YOU, HOWEVER CAUSED AND UNDER ANY
          THEORY OF LIABILITY. THIS SHALL INCLUDE, BUT NOT BE LIMITED TO, ANY
          LOSS OF PROFIT (WHETHER INCURRED DIRECTLY OR INDIRECTLY), ANY LOSS OF
          GOODWILL OR BUSINESS REPUTATION, ANY LOSS OF DATA SUFFERED, COST OF
          PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES, OR OTHER INTANGIBLE LOSS;
          (B) ANY LOSS OR DAMAGE WHICH MAY BE INCURRED BY YOU, INCLUDING BUT NOT
          LIMITED TO LOSS OR DAMAGE AS A RESULT OF: (I) ANY RELIANCE PLACED BY
          YOU ON THE COMPLETENESS, ACCURACY OR EXISTENCE OF ANY ADVERTISING, OR
          AS A RESULT OF ANY RELATIONSHIP OR TRANSACTION BETWEEN YOU AND ANY
          ADVERTISER OR SPONSOR WHOSE ADVERTISING APPEARS ON THE SERVICES; (II)
          ANY CHANGES WHICH Arcis MAY MAKE TO THE SERVICES, OR FOR ANY PERMANENT
          OR TEMPORARY CESSATION IN THE PROVISION OF THE SERVICES (OR ANY
          FEATURES WITHIN THE SERVICES); (III) THE DELETION OF, CORRUPTION OF,
          OR FAILURE TO STORE, ANY CONTENT AND OTHER COMMUNICATIONS DATA
          MAINTAINED OR TRANSMITTED BY OR THROUGH YOUR USE OF THE SERVICES: (IV)
          YOUR FAILURE TO PROVIDE Arcis WITH ACCURATE ACCOUNT INFORMATION: (V)
          YOUR FAILURE TO KEEP YOUR PASSWORD OR ACCOUNT DETAILS SECURE AND
          CONFIDENTIAL;
        </Text>
        <Text mb={0}>
          THE LIMITATIONS ON Arcis'S LIABILITY TO YOU IN PARAGRAPH 14.1 ABOVE
          SHALL APPLY WHETHER OR NOT Arcis HAS BEEN ADVISED OF OR SHOULD HAVE
          BEEN AWARE OF THE POSSIBILITY OF ANY SUCH LOSSES ARISING.
        </Text>
        <Text>
          THE TOTAL LIABILITY OF Arcis TO YOU FOR ALL DAMAGES, LOSSES, AND
          CAUSES OF ACTION (WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), OR
          OTHERWISE) SHALL NOT EXCEED THE AMOUNT ACTUALLY PAID BY YOU DURING A
          ONE-YEAR PERIOD FOR THE SPECIFIC SERVICE GIVING RISE TO THE LIABILITY.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          16. Indemnification
        </Heading>
        <Text mb={0}>
          You agree to defend, indemnify, and hold us harmless, including our
          subsidiaries, affiliates, and all of our respective officers, agents,
          partners, and employees, from and against any loss, damage, liability,
          claim, or demand, including reasonable attorneys' fees and expenses,
          made by any third party due to or arising out of: (1) your
          Contributions; (2) use of the Site; (3) breach of these Terms of Use;
          (4) any breach of your representations and warranties set forth in
          these Terms of Use; (5) your violation of the rights of a third party,
          including but not limited to intellectual property rights; or (6) any
          overt harmful act toward any other user of the Site with whom you
          connected via the Site. Notwithstanding the foregoing, we reserve the
          right, at your expense, to assume the exclusive defense and control of
          any matter for which you are required to indemnify us, and you agree
          to cooperate, at your expense, with our defense of such claims. We
          will use reasonable efforts to notify you of any such claim, action,
          or proceeding which is subject to this indemnification upon becoming
          aware of it.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          17. Copyright and Trademark Policies
        </Heading>
        <Text mb={0}>
          It is Arcis's policy to respond to notices of alleged copyright
          infringement that comply with applicable international intellectual
          property law (including, in the United States, the Digital Millennium
          Copyright Act) and to terminate the accounts of repeat infringers.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          18. Advertisements
        </Heading>
        <Text mb={0}>
          Some of the Services are supported by advertising revenue and may
          display advertisements and promotions. These advertisements may be
          targeted to the content of information stored on the Services, queries
          made through the Services, or other information.
        </Text>
        <Text mb={0}>
          The manner, mode, and extent of advertising by Arcis on the Services
          are subject to change without specific notice to you.
        </Text>
        <Text>
          In consideration for Arcis granting you access to and use of the
          Services, you agree that Arcis may place such advertising on the
          Services.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          19. Taxes, Raffles, and Auctions
        </Heading>
        <Text mb={0}>
          If there are taxes, other governmental charges, or any other fees
          associated with your use of the Site including the auction, item
          sales, raffles (a means of raising money by selling numbered tickets,
          one or some of which are subsequently drawn at random, the holder or
          holders of such tickets winning a prize), or other financial
          transactions on the Site, these will be your responsibility to pay.
          You should consult your tax adviser on any potential taxes or tax
          effects related to the auction, raffle, fund-a-need appeal, sales, and
          other transactions made through the Site.
        </Text>
        <Text mb={0}>
          If you choose to include a raffle as part of your event, you agree
          that you understand and comply with all federal, state, and local
          regulations that apply to raffles and the sale of raffle tickets
          through our site. You further agree that you shall indemnify, defend,
          and hold Arcis, its subsidiaries, affiliates, officers, employees,
          directors, shareholders, predecessors, successors in interest, and
          other agents, harmless from and against any claim, demand, suit, cause
          of action, proceeding, loss, liability, damage, or expense (including
          reasonable attorney fees) arising out of or related to raffle
          activities.
        </Text>
        <Text>
          Once an auction has closed it cannot be re-opened. In order to re-open
          an auction, a new auction must be created and will incur a new
          activation fee.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          20. Changes to the Terms
        </Heading>
        <Text mb={0}>
          Arcis may make changes to the Terms from time to time.
        </Text>
        <Text>
          You understand and agree that if you use the Services after the date
          on which the Terms have changed, Arcis will treat your use as
          acceptance of the updated Universal Terms or Additional Terms.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          21. Dispute Resolution
        </Heading>
        <Text mb={0}>
          <strong>Arbitration</strong> - If any dispute, claim, or controversy
          ("Claims") arises under this Agreement or through your use of the
          Services, such dispute shall be resolved by binding arbitration in
          accordance with the Commercial Arbitration Rules of the American
          Arbitration Association ("AAA") then pertaining, except where such
          rules conflict with this section, in which case this section shall
          control. There shall be three arbitrators. The parties agree that one
          arbitrator shall be appointed by each party within twenty (20) days of
          receipt by respondent[s] of the Request for Arbitration or in default
          thereof appointed by the AAA in accordance with its Commercial Rules,
          and the third presiding arbitrator shall be appointed by agreement of
          the two party-appointed arbitrators within fourteen (14) days of the
          appointment of the second arbitrator or, in default of such agreement,
          by the AAA. Any court with jurisdiction shall enforce this section and
          enter judgment on any award. Within forty-five (45) days of initiation
          of arbitration, the parties to the arbitration shall reach agreement
          upon and thereafter follow procedures, including limits on discovery,
          assuring that the arbitration will be concluded and the award rendered
          within no more than eight (8) months from selection of arbitrators or,
          failing agreement, procedures meeting such time limits will be
          designed by the AAA and adhered to by the parties to the arbitration.
          The arbitration shall be held in Natrona County, Wyoming, and the
          arbitrators shall apply the substantive law of the State of Wyoming,
          except that the interpretation and enforcement of this arbitration
          provision shall be governed by the Federal Arbitration Act.
        </Text>
        <Text mb={0}>
          <strong>Exceptions</strong> - You and Arcis agree that the following
          Claims are not subject to the above provisions concerning negotiations
          and binding arbitration: (a) any Claim seeking to enforce or protect,
          or concerning the validity of, any of your or Arcis intellectual
          property rights; (b) any Claim related to, or arising from,
          allegations of theft, piracy, invasion of privacy, or unauthorized
          use; (c) any claim for equitable relief; and (d) any claim by a
          resident of the European Union or Switzerland regarding our adherence
          to the Privacy Shield Principles (as defined in our Privacy Policy).
          In addition to the foregoing, either you or Arcis may assert an
          individual action in small claims court for Claims that are within the
          scope of such court's jurisdiction in lieu of arbitration.
        </Text>
        <Text>
          <strong>Class Action/Jury Trial Waiver</strong> - WITH RESPECT TO ALL
          PERSONS AND ENTITIES, REGARDLESS OF WHETHER THEY HAVE OBTAINED OR USED
          THE SERVICES FOR PERSONAL, COMMERCIAL, OR OTHER PURPOSES, ALL CLAIMS
          MUST BE BROUGHT IN THE PARTIES' INDIVIDUAL CAPACITY, AND NOT AS A
          PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS ACTION, COLLECTIVE
          ACTION, PRIVATE ATTORNEY GENERAL ACTION, OR OTHER REPRESENTATIVE
          PROCEEDING. THIS WAIVER APPLIES TO CLASS ARBITRATION, AND, UNLESS WE
          AGREE OTHERWISE, THE ARBITRATOR MAY NOT CONSOLIDATE MORE THAN ONE
          PERSON'S CLAIMS. YOU AGREE THAT, BY ENTERING INTO THIS AGREEMENT, YOU
          AND WE ARE EACH WAIVING THE RIGHT TO A TRIAL BY JURY OR TO PARTICIPATE
          IN A CLASS ACTION, COLLECTIVE ACTION, PRIVATE ATTORNEY GENERAL ACTION,
          OR OTHER REPRESENTATIVE PROCEEDING OF ANY KIND. THE WAIVER CONTAINED
          IN THIS SECTION SHALL BE SEVERABLE FROM THE REMAINDER OF THE
          AGREEMENT.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          22. Force Majeure
        </Heading>
        <Text>
          Arcis will be excused from performance under this Agreement for any
          period of time that Arcis is prevented from performing its obligations
          hereunder as a result of an act of God, criminal acts, distributed
          denial of service attacks, any acts of the common enemy, the elements,
          earthquakes, floods, fires, epidemics, riots, war, utility or
          communication failures, or other causes beyond its reasonable control.
        </Text>
      </Box>
      <Box mb={6}>
        <Heading as="h4" size="md" mb={0}>
          23. Miscellaneous
        </Heading>
        <Text mb={0}>
          These Terms of Use and any policies or operating rules posted by us on
          the Site or in respect to the Site constitute the entire agreement and
          understanding between you and us. Our failure to exercise or enforce
          any right or provision of these Terms of Use shall not operate as a
          waiver of such right or provision. These Terms of Use operate to the
          fullest extent permissible by law. We may assign any or all of our
          rights and obligations to others at any time. We shall not be
          responsible or liable for any loss, damage, delay, or failure to act
          caused by any cause beyond our reasonable control. If any provision or
          part of a provision of these Terms of Use is determined to be
          unlawful, void, or unenforceable, that provision or part of the
          provision is deemed severable from these Terms of Use and does not
          affect the validity and enforceability of any remaining provisions.
          There is no joint venture, partnership, employment, or agency
          relationship created between you and us as a result of these Terms of
          Use or use of the Site. You agree that these Terms of Use will not be
          construed against us by virtue of having drafted them. You hereby
          waive any and all defenses you may have based on the electronic form
          of these Terms of Use and the lack of signing by the parties hereto to
          execute these Terms of Use.
        </Text>
      </Box>
    </Box>
  );
}

export default TermsOfService;
