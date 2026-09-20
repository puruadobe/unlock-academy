const STARTER_ROOMS = [
  {
    id: "last-transfer",
    topic: "Cybersecurity",
    title: "The Last Transfer",
    subtitle: "A convincing request. A hidden compromise. One decision left.",
    description:
      "You are the new investigator at Northstar Studio. A supplier payment is waiting for release. Find the misleading request, follow the account evidence, and choose a safe response.",
    duration: "10–15 min",
    level: "Beginner",
    color: "purple",
    icon: "↗",
    objectives: [
      "Verify a sensitive request independently",
      "Distinguish a password from an active session",
      "Choose containment before irreversible action",
    ],
    fiction:
      "All messages, organizations, logs, and amounts in this room are fictional. No payment or account action is performed.",
    sources: [
      {
        title:
          "Microsoft: support impersonation and remote-access misuse (2024)",
        url: "https://www.microsoft.com/en-us/security/blog/2024/05/15/threat-actors-misusing-quick-assist-in-social-engineering-attacks-leading-to-ransomware/",
      },
      {
        title:
          "Cloudflare: stolen integration credentials and support-case exposure (2025)",
        url: "https://blog.cloudflare.com/response-to-salesloft-drift-incident/",
      },
    ],
    puzzles: [
      {
        id: "verify",
        title: "The request",
        eyebrow: "LOCK 01 / TRUST",
        story:
          "Finance has received a request to change a supplier’s bank details. A colleague says the email “looks right.” You have access to the message and the supplier record.",
        question:
          "What is the strongest next step before changing the payment details?",
        evidence: [
          {
            id: "mail",
            title: "Payment-change email",
            type: "MESSAGE",
            body: "From: Supplier Accounts\nSubject: Updated payment details\n\nPlease use our new bank details for today’s invoice. We need this processed before the afternoon deadline. You can reach us at the new phone number in this message.",
            clue: "Both the change request and its suggested verification channel come from the same message.",
          },
          {
            id: "directory",
            title: "Existing supplier record",
            type: "DIRECTORY",
            body: "Supplier: Cedar Works\nRelationship: Active for two years\nVerified contact: Stored in the finance directory\nLast confirmed bank change: None\n\nPolicy: Verify bank-detail changes using an independently maintained contact.",
            clue: "You already have a contact route established before this request arrived.",
          },
          {
            id: "branding",
            title: "Visual inspection",
            type: "OBSERVATION",
            body: "The email contains the familiar logo, signature, and invoice number. The displayed sender name matches earlier messages.",
            clue: "Appearance and familiarity provide context, but do not independently verify authorization.",
          },
        ],
        required: ["mail", "directory"],
        options: [
          "Call the new number supplied in the email.",
          "Contact the supplier using the existing verified directory entry.",
          "Accept the change because the invoice number is correct.",
        ],
        answer: 1,
        feedback: [
          "That number came from the same unverified request. Find an independent route.",
          "Correct. A previously verified contact provides an independent check on the requested change.",
          "A familiar invoice number is not proof that a payment change is authorized.",
        ],
        explanation:
          "Verify a sensitive request through a channel established independently of the request. Urgency, logos, and accurate details should not replace authorization checks.",
        hints: [
          "Compare where each possible contact route came from.",
          "One route was established before the suspicious message existed.",
          "Use the existing supplier directory, not the contact details in the new email.",
        ],
        unlock:
          "You paused the payment change. The supplier confirms it did not request new bank details.",
      },
      {
        id: "session",
        title: "The access that remained",
        eyebrow: "LOCK 02 / IDENTITY",
        story:
          "The supplier confirms the request was false. The employee whose mailbox sent it recently changed their password. Examine the local training logs to find what still needs attention.",
        question:
          "Which finding most directly shows that a password change alone did not end the suspicious access?",
        evidence: [
          {
            id: "password",
            title: "Account events",
            type: "AUDIT LOG",
            body: "09:10 — Password changed by account owner\n09:12 — Interactive sign-in from employee’s known device\n09:20 — No additional password-change events",
            clue: "The log confirms a password change, but says nothing about revoking sessions.",
          },
          {
            id: "sessions",
            title: "Session activity",
            type: "AUDIT LOG",
            body: "08:50 — Session S-042 created from an unfamiliar device\n09:18 — Session S-042 reads supplier thread\n09:23 — Session S-042 sends payment-change message\nStatus — Session not yet revoked\n\nIn this fictional system, password changes do not automatically revoke existing sessions.",
            clue: "The same session acts before and after the password change.",
          },
          {
            id: "terms",
            title: "Identity field guide",
            type: "REFERENCE",
            body: "Password: a credential used to authenticate.\nSession: ongoing access established after authentication.\nRevocation: ending previously granted access.\n\nReal systems differ in how password changes affect sessions and connected applications.",
            clue: "An existing access path can require its own containment step.",
          },
        ],
        required: ["password", "sessions"],
        options: [
          "The employee’s normal device signed in.",
          "There were no more password-change events.",
          "The unfamiliar session sent the message after the password changed.",
        ],
        answer: 2,
        feedback: [
          "A normal sign-in is not the suspicious activity described here. Compare timestamps.",
          "The absence of more password changes does not establish that access ended.",
          "Correct. The explicitly unrevoked session continued acting after the password changed.",
        ],
        explanation:
          "Password changes, session revocation, and connected-app review address different access paths. Verify the actual behavior of your system instead of assuming one action ends every session.",
        hints: [
          "Put the password event and message event in time order.",
          "S-042 appears on both sides of the password-change timestamp.",
          "Compare 09:10 with the 09:23 message from the unfamiliar session.",
        ],
        unlock:
          "You identified the active session that needs investigation and containment.",
      },
      {
        id: "contain",
        title: "The containment decision",
        eyebrow: "LOCK 03 / RESPONSE",
        story:
          "The payment is still on hold. You have identified suspicious session activity. Select the response package that protects the company while preserving evidence.",
        question:
          "Which response package should the authorized security and finance teams carry out?",
        evidence: [
          {
            id: "status",
            title: "Current situation",
            type: "STATUS",
            body: "Payment: Not released\nBank-detail change: Not approved\nSuspicious session: Still active\nEvidence: Message and audit logs available\nSecurity team: Reachable through the verified directory",
            clue: "There is still time to contain access and stop the pending payment.",
          },
          {
            id: "playbook",
            title: "Incident response card",
            type: "PLAYBOOK",
            body: "Keep sensitive changes on hold.\nPreserve relevant messages and logs.\nNotify the authorized security team through a known channel.\nRevoke suspicious access and review related sessions and integrations.\nVerify any payment instructions independently with finance.",
            clue: "Containment and evidence preservation are complementary actions.",
          },
          {
            id: "shortcut",
            title: "A colleague’s suggestion",
            type: "CHAT",
            body: "“Can we just delete the message and pay the invoice? We don’t want this to hold up the afternoon.”",
            clue: "Removing the visible message does not terminate the underlying access.",
          },
        ],
        required: ["status", "playbook"],
        options: [
          "Hold the payment, preserve evidence, and have authorized teams revoke suspicious access and investigate.",
          "Delete the message, clear the logs, and approve payment.",
          "Reply to the suspicious message asking the sender to confirm it is legitimate.",
        ],
        answer: 0,
        feedback: [
          "Correct. This contains the immediate risk while retaining evidence for investigation.",
          "This removes evidence and releases the sensitive action without resolving access.",
          "A reply stays inside the channel already under suspicion. Use your verified reporting route.",
        ],
        explanation:
          "A good response interrupts the risky action, ends suspicious access through authorized teams, and preserves enough evidence to understand what happened. Avoid improvised changes outside your authority.",
        hints: [
          "Which option addresses both the payment and the active session?",
          "The team will need the message and logs to investigate.",
          "Choose the package that holds payment, preserves evidence, and involves authorized responders.",
        ],
        unlock:
          "Transfer stopped. Evidence preserved. The authorized team can now contain the incident.",
      },
    ],
  },
  {
    id: "orbital-rescue",
    topic: "Physics",
    title: "Orbital Rescue",
    subtitle: "Your spacecraft has lost its instruments. Bring the crew home.",
    description:
      "Use motion, forces, and energy to diagnose three problems aboard a fictional spacecraft. The mission runs on the same room engine as every other subject.",
    duration: "5–8 min",
    level: "Beginner",
    color: "orange",
    icon: "✦",
    objectives: [
      "Explain motion when net force is zero",
      "Connect net force to acceleration",
      "Track energy through a transformation",
    ],
    fiction:
      "A simplified teaching simulation. Ignore air resistance and other effects unless a clue specifies them.",
    sources: [],
    puzzles: [
      {
        id: "motion",
        title: "Engines offline",
        eyebrow: "LOCK 01 / MOTION",
        story:
          "The engines shut down during a straight flight. The crew thinks the ship must stop immediately.",
        question: "What happens under the conditions in the evidence?",
        evidence: [
          {
            id: "sensor",
            title: "Last sensor reading",
            type: "TELEMETRY",
            body: "Velocity: 100 m/s in a straight line\nNet external force: Zero\nFrame: Inertial reference frame",
            clue: "The net force is the quantity that determines acceleration.",
          },
          {
            id: "law",
            title: "Flight handbook",
            type: "REFERENCE",
            body: "An object continues at constant velocity when the net force on it is zero.",
            clue: "Maintaining motion is different from changing motion.",
          },
        ],
        required: ["sensor", "law"],
        options: [
          "The ship instantly stops.",
          "It continues at constant velocity.",
          "It speeds up continuously.",
        ],
        answer: 1,
        feedback: [
          "Stopping is a change in velocity and would require a net force.",
          "Correct. Zero net force means zero acceleration in this simplified model.",
          "Speeding up would require acceleration, which needs a net force.",
        ],
        explanation:
          "A force is needed to change velocity, not to maintain constant velocity. This is Newton’s first law.",
        hints: [
          "Does the evidence specify a net force?",
          "Zero net force means no change in velocity.",
          "The velocity remains 100 m/s in the same direction.",
        ],
        unlock: "The crew understands that coasting is expected.",
      },
      {
        id: "force",
        title: "One thruster returns",
        eyebrow: "LOCK 02 / FORCES",
        story:
          "A thruster is available. Predict the acceleration before the crew uses it.",
        question: "What is the acceleration magnitude?",
        evidence: [
          {
            id: "mass",
            title: "Ship mass",
            type: "TELEMETRY",
            body: "Total mass: 1,000 kg",
            clue: "Use the total mass.",
          },
          {
            id: "force",
            title: "Thruster readout",
            type: "TELEMETRY",
            body: "Net force: 2,000 N\nUse F = m × a.",
            clue: "Divide force by mass to find acceleration.",
          },
        ],
        required: ["mass", "force"],
        options: ["2 m/s²", "2,000 m/s²", "0.5 m/s²"],
        answer: 0,
        feedback: [
          "Correct. 2,000 N divided by 1,000 kg is 2 m/s².",
          "You used the force value without dividing by mass.",
          "Check the order of the division: force divided by mass.",
        ],
        explanation:
          "Newton’s second law relates net force, mass, and acceleration. Here a = F/m = 2 m/s².",
        hints: [
          "Rearrange F = m × a.",
          "Acceleration equals force divided by mass.",
          "Calculate 2,000 ÷ 1,000.",
        ],
        unlock: "The crew can predict the thruster’s effect.",
      },
      {
        id: "energy",
        title: "The warm brake",
        eyebrow: "LOCK 03 / ENERGY",
        story:
          "A docking mechanism slows a moving component by friction. Its brake becomes warm.",
        question:
          "Where did the component’s kinetic energy primarily go in this model?",
        evidence: [
          {
            id: "before",
            title: "Before docking",
            type: "OBSERVATION",
            body: "A component is moving. The brake is cool.",
            clue: "The moving component has kinetic energy.",
          },
          {
            id: "after",
            title: "After braking",
            type: "OBSERVATION",
            body: "The component slows down. The brake and contact surfaces warm up. Assume negligible sound and other transfers.",
            clue: "Account for the increase in internal energy of the materials.",
          },
        ],
        required: ["before", "after"],
        options: [
          "It was destroyed.",
          "It became extra mass large enough to notice.",
          "It was transferred primarily into thermal/internal energy.",
        ],
        answer: 2,
        feedback: [
          "Energy is conserved; look for the observed change in the surroundings.",
          "The clear modeled effect is warming, not a noticeable mass change.",
          "Correct. Friction converts organized motion into internal energy of the interacting materials.",
        ],
        explanation:
          "Energy changes form and can move between objects. In this model, the decrease in kinetic energy corresponds primarily to increased internal energy.",
        hints: [
          "What changed besides the speed?",
          "The contact surfaces became warmer.",
          "Connect the lost kinetic energy with thermal/internal energy.",
        ],
        unlock:
          "Docking complete. Your three explanations restored the crew’s confidence.",
      },
    ],
  },
];

// Deeper learning metadata for the first-party missions.
STARTER_ROOMS[0].learningPlan={audience:'Students and employees new to cyber-awareness',prerequisites:['Recognize an email, a password, and a login session'],bigQuestion:'How do you decide what to trust when a request looks familiar?'};
STARTER_ROOMS[0].puzzles.forEach((p,i)=>{p.objective=STARTER_ROOMS[0].objectives[i];p.reasoning={prompt:'Select only the evidence that directly supports your decision.',evidenceIds:[['mail','directory'],['password','sessions'],['status','playbook']][i],explanation:['The email supplies its own verification channel; the earlier directory supplies an independent one. Branding alone does not settle authorization.','The account event and session activity together establish that access continued after the password change.','The current situation identifies the risks; the response card explains the authorized containment steps.'][i]}});
STARTER_ROOMS[0].transfer={question:'A familiar colleague sends a chat asking you to change a payroll bank account and supplies a new number to call. What lesson transfers to this new situation?',options:['Use the new number because the colleague is familiar.','Verify through a previously established contact route before making the sensitive change.','Treat any chat message as proof of authorization.'],answer:1,explanation:'The channel changed from email to chat, but the principle did not: independently verify a sensitive request rather than relying on contact details supplied within it.'};
STARTER_ROOMS[1].learningPlan={audience:'Beginning physics learners',prerequisites:['Divide whole numbers','Recognize mass, speed, and temperature'],bigQuestion:'How can a few physical laws explain what you observe?'};
STARTER_ROOMS[1].puzzles.forEach((p,i)=>{p.objective=STARTER_ROOMS[1].objectives[i]});
STARTER_ROOMS[1].transfer={question:'A cart moves at constant velocity along a straight track. In an inertial frame, what can you infer about the net force?',options:['The net force must point forward.','The net force is zero.','The net force must point backward.'],answer:1,explanation:'Constant velocity means zero acceleration. Newton’s second law then gives zero net force. Individual forces may still be present and balanced.'};

// Advanced extension of the user-created greenhouse mission.
STARTER_ROOMS.push({
  "id": "mendel-heredity-advanced",
  "topic": "Mendelian Genetics",
  "title": "The Pea Vault of Inheritance",
  "subtitle": "Five genetic locks. One missing inheritance ledger.",
  "description": "A greenhouse archive has sealed its inheritance ledger. Reconstruct genotypes, calculate conditional probabilities, and uncover a linked gene pair to recover the missing pages. Each lock requires both a decision and supporting evidence.",
  "duration": "20–30 min",
  "level": "Advanced",
  "color": "purple",
  "icon": "✦",
  "fiction": "A fictional greenhouse investigation using simplified genetic models and invented data. The linkage extension reflects genetics developed after Mendel.",
  "objectives": [
    "Infer genotype using a recessive test cross",
    "Calculate genotype probability conditional on a dominant phenotype",
    "Combine independent single-gene probabilities in a dihybrid cross",
    "Infer linkage phase and recombination frequency from offspring counts",
    "Distinguish allele segregation from independent assortment"
  ],
  "learningPlan": {
    "audience": "Advanced secondary-school biology learners (grade 12)",
    "prerequisites": [
      "Alleles, genotype, phenotype, and meiosis",
      "Punnett squares and complete dominance",
      "Fractions, conditional probability, and the product rule"
    ],
    "bigQuestion": "Which inheritance predictions follow from segregation, and which require independent assortment?"
  },
  "sources": [
    {
      "title": "OpenStax Biology 2e — Laws of Inheritance",
      "url": "https://openstax.org/books/biology-2e/pages/12-3-laws-of-inheritance"
    },
    {
      "title": "OpenStax Biology 2e — Chromosomal Theory and Genetic Linkage",
      "url": "https://openstax.org/books/biology-2e/pages/13-1-chromosomal-theory-and-genetic-linkage"
    }
  ],
  "puzzles": [
    {
      "id": "mendel-1",
      "title": "The unknown parent",
      "eyebrow": "LOCK 01 / GENETIC INFERENCE",
      "objective": "Infer genotype using a recessive test cross",
      "story": "A tall plant guards the first drawer. Its appearance alone cannot distinguish TT from Tt. A technician has crossed it with a known dwarf plant.",
      "question": "Under the stated model, which genotype must the tall parent have?",
      "evidence": [
        {
          "id": "e1",
          "title": "Trait model",
          "type": "REFERENCE",
          "body": "T gives tall plants and is completely dominant to t. Dwarf plants are tt. Assume normal segregation, reliable parentage, no mutation, and full penetrance.",
          "clue": "A dwarf offspring must receive t from both parents."
        },
        {
          "id": "e2",
          "title": "Test-cross results",
          "type": "OBSERVATION",
          "body": "Unknown tall parent × tt produced 48 tall and 52 dwarf offspring.",
          "clue": "The near-equal counts fit two gamete types from the unknown parent."
        },
        {
          "id": "e3",
          "title": "Archive note",
          "type": "OBSERVATION",
          "body": "The seed boxes are labeled with shelf numbers and inspection dates. These labels contain no genotype information.",
          "clue": "A storage label is not genetic evidence."
        }
      ],
      "required": [
        "e1",
        "e2"
      ],
      "options": [
        "TT, because tall is dominant",
        "Tt, because the parent produced both T-bearing and t-bearing gametes",
        "tt, because some offspring are dwarf"
      ],
      "answer": 1,
      "feedback": [
        "Dominant appearance alone cannot establish TT; TT × tt cannot produce tt under this model.",
        "Correct. The dwarf offspring require t from the tall parent, whose tall phenotype also requires T.",
        "A tt parent would be dwarf under complete dominance, contrary to the observed parent."
      ],
      "explanation": "The tall parent must be Tt under the stated assumptions. A tt tester always supplies t; the unknown parent supplies either T or t. A 1:1 expectation allows sampling variation, so 48:52 is compatible.",
      "hints": [
        "Start with the tester: which allele can tt supply?",
        "Use a dwarf offspring to infer an allele from the unknown parent.",
        "Combine the required t allele with the tall parent’s own phenotype."
      ],
      "unlock": "Ledger page 1 recovered. Infer genotype using a recessive test cross.",
      "reasoning": {
        "prompt": "Select the two records needed to justify your conclusion.",
        "evidenceIds": [
          "e1",
          "e2"
        ],
        "explanation": "The model card defines the assumptions and the experiment record supplies the cross or observations. Both are needed; the archive note is irrelevant."
      }
    },
    {
      "id": "mendel-2",
      "title": "The selected seedling",
      "eyebrow": "LOCK 02 / GENETIC INFERENCE",
      "objective": "Calculate genotype probability conditional on a dominant phenotype",
      "story": "The second drawer only admits tall F2 seedlings. You must infer the genotype of one seedling chosen at random from that filtered group.",
      "question": "Given that the selected F2 seedling is tall, what is the probability it is Tt?",
      "evidence": [
        {
          "id": "e1",
          "title": "Cross model",
          "type": "REFERENCE",
          "body": "Tt × Tt; each parent produces T and t gametes equally. Fertilization is random, T is completely dominant, and genotypes have equal survival.",
          "clue": "Work out genotype proportions before filtering."
        },
        {
          "id": "e2",
          "title": "Selection protocol",
          "type": "OBSERVATION",
          "body": "Only tall F2 offspring are eligible. Select one randomly from those tall offspring, not from the entire F2 generation.",
          "clue": "The condition changes the denominator."
        },
        {
          "id": "e3",
          "title": "Archive note",
          "type": "OBSERVATION",
          "body": "The seed boxes are labeled with shelf numbers and inspection dates. These labels contain no genotype information.",
          "clue": "A storage label is not genetic evidence."
        }
      ],
      "required": [
        "e1",
        "e2"
      ],
      "options": [
        "1/2",
        "3/4",
        "2/3"
      ],
      "answer": 2,
      "feedback": [
        "1/2 is P(Tt) among all offspring, before conditioning on tall.",
        "3/4 is P(tall), not P(Tt given tall).",
        "Correct. Of the three tall genotype slots TT, Tt, and tT, two are heterozygous."
      ],
      "explanation": "The genotype probabilities are 1/4 TT, 1/2 Tt, and 1/4 tt. Tall offspring account for 3/4, so P(Tt | tall)=(1/2)/(3/4)=2/3.",
      "hints": [
        "List TT, Tt, tT, and tt.",
        "Exclude the dwarf genotype because the seedling is known to be tall.",
        "Two of the three remaining equally likely slots are heterozygous."
      ],
      "unlock": "Ledger page 2 recovered. Calculate genotype probability conditional on a dominant phenotype.",
      "reasoning": {
        "prompt": "Select the two records needed to justify your conclusion.",
        "evidenceIds": [
          "e1",
          "e2"
        ],
        "explanation": "The model card defines the assumptions and the experiment record supplies the cross or observations. Both are needed; the archive note is irrelevant."
      }
    },
    {
      "id": "mendel-3",
      "title": "The two-trait gate",
      "eyebrow": "LOCK 03 / GENETIC INFERENCE",
      "objective": "Combine independent single-gene probabilities in a dihybrid cross",
      "story": "A gate reads both seed shape and color. The next ledger predicts how many offspring will pass both phenotype checks.",
      "question": "For this cross, what is the probability of a round, yellow offspring?",
      "evidence": [
        {
          "id": "e1",
          "title": "Two-locus model",
          "type": "REFERENCE",
          "body": "R is completely dominant to r (round vs wrinkled); Y is completely dominant to y (yellow vs green). These loci assort independently. Assume random fertilization and equal survival.",
          "clue": "Independence permits multiplying separate probabilities."
        },
        {
          "id": "e2",
          "title": "Parent record",
          "type": "OBSERVATION",
          "body": "RrYy × RrYy. At each locus, the single-gene cross is heterozygote × heterozygote.",
          "clue": "Find the probability of each dominant phenotype separately."
        },
        {
          "id": "e3",
          "title": "Archive note",
          "type": "OBSERVATION",
          "body": "The seed boxes are labeled with shelf numbers and inspection dates. These labels contain no genotype information.",
          "clue": "A storage label is not genetic evidence."
        }
      ],
      "required": [
        "e1",
        "e2"
      ],
      "options": [
        "9/16",
        "1/4",
        "3/4"
      ],
      "answer": 0,
      "feedback": [
        "Correct. P(round)=3/4 and P(yellow)=3/4; their product is 9/16.",
        "1/4 is the frequency of one gamete type from a double heterozygote, not this offspring phenotype.",
        "3/4 accounts for one dominant phenotype, not both together."
      ],
      "explanation": "Round means RR or Rr; yellow means YY or Yy. Each dominant phenotype has probability 3/4, and independent assortment gives (3/4)(3/4)=9/16. This is an expected probability, not an exact guarantee in a finite family.",
      "hints": [
        "Treat shape and color as two single-gene problems.",
        "A heterozygote cross gives a 3/4 dominant-phenotype probability.",
        "Multiply 3/4 by 3/4 only because the model explicitly supplies independence."
      ],
      "unlock": "Ledger page 3 recovered. Combine independent single-gene probabilities in a dihybrid cross.",
      "reasoning": {
        "prompt": "Select the two records needed to justify your conclusion.",
        "evidenceIds": [
          "e1",
          "e2"
        ],
        "explanation": "The model card defines the assumptions and the experiment record supplies the cross or observations. Both are needed; the archive note is irrelevant."
      }
    },
    {
      "id": "mendel-4",
      "title": "The linked ledger",
      "eyebrow": "LOCK 04 / GENETIC INFERENCE",
      "objective": "Infer linkage phase and recombination frequency from offspring counts",
      "story": "A later researcher added a chromosome-mapping page. This extension goes beyond Mendel’s original model: two marker genes may travel together.",
      "question": "Which phase and observed recombination frequency fit these test-cross data?",
      "evidence": [
        {
          "id": "e1",
          "title": "Mapping model",
          "type": "REFERENCE",
          "body": "AaBb is test-crossed with aabb. Each offspring genotype identifies the gamete contributed by AaBb. Assume equal viability, reliable scoring, and no segregation distortion. The more frequent classes represent parental combinations.",
          "clue": "Identify the parental classes before counting recombinants."
        },
        {
          "id": "e2",
          "title": "Offspring counts",
          "type": "OBSERVATION",
          "body": "AaBb: 410; aabb: 410; Aabb: 90; aaBb: 90. Total: 1,000 offspring.",
          "clue": "Both less frequent classes contribute to the recombinant total."
        },
        {
          "id": "e3",
          "title": "Archive note",
          "type": "OBSERVATION",
          "body": "The seed boxes are labeled with shelf numbers and inspection dates. These labels contain no genotype information.",
          "clue": "A storage label is not genetic evidence."
        }
      ],
      "required": [
        "e1",
        "e2"
      ],
      "options": [
        "Ab/aB phase; 82% recombinants",
        "AB/ab phase; 18% recombinants",
        "AB/ab phase; 9% recombinants"
      ],
      "answer": 1,
      "feedback": [
        "The abundant AB and ab classes identify parental phase; 82% is the parental fraction.",
        "Correct. AB and ab are parental; Ab and aB together account for 180/1,000=18%.",
        "9% counts only one recombinant class. Both Ab and aB must be included."
      ],
      "explanation": "The tester supplies ab, so the abundant AaBb and aabb offspring reveal AB and ab gametes. The heterozygote is in coupling phase AB/ab. The observed recombinant fraction is (90+90)/1000=0.18; it is an estimate from this sample.",
      "hints": [
        "Translate each offspring genotype back to its non-tester gamete.",
        "The two most common classes indicate which alleles were together on parental chromosomes.",
        "Add both rare classes, then divide by all 1,000 offspring."
      ],
      "unlock": "Ledger page 4 recovered. Infer linkage phase and recombination frequency from offspring counts.",
      "reasoning": {
        "prompt": "Select the two records needed to justify your conclusion.",
        "evidenceIds": [
          "e1",
          "e2"
        ],
        "explanation": "The model card defines the assumptions and the experiment record supplies the cross or observations. Both are needed; the archive note is irrelevant."
      }
    },
    {
      "id": "mendel-5",
      "title": "The scope of the law",
      "eyebrow": "LOCK 05 / GENETIC INFERENCE",
      "objective": "Distinguish allele segregation from independent assortment",
      "story": "The final lock challenges an archivist’s claim: “Linkage means Mendel’s segregation principle is false.” Compare the marginal allele counts with the joint gamete counts.",
      "question": "Which conclusion best distinguishes segregation from independent assortment?",
      "evidence": [
        {
          "id": "e1",
          "title": "Gamete totals",
          "type": "REFERENCE",
          "body": "From the preceding test cross: AB=410, ab=410, Ab=90, aB=90. Thus A-bearing gametes=500, a-bearing=500, B-bearing=500, and b-bearing=500.",
          "clue": "Equal single-locus totals can coexist with unequal joint combinations."
        },
        {
          "id": "e2",
          "title": "Definition card",
          "type": "OBSERVATION",
          "body": "Segregation separates the two alleles of a locus into gametes. Independent assortment predicts combinations of different loci independently; for an unlinked AaBb individual, AB, Ab, aB, and ab are each expected at 1/4 under this model.",
          "clue": "These statements concern different aspects of inheritance."
        },
        {
          "id": "e3",
          "title": "Archive note",
          "type": "OBSERVATION",
          "body": "The seed boxes are labeled with shelf numbers and inspection dates. These labels contain no genotype information.",
          "clue": "A storage label is not genetic evidence."
        }
      ],
      "required": [
        "e1",
        "e2"
      ],
      "options": [
        "Equal A and a totals prove that the two loci assort independently",
        "Linkage requires gametes to carry both A and a at the same locus",
        "The data fit equal segregation at each locus but not independent combinations of these two loci"
      ],
      "answer": 2,
      "feedback": [
        "Equal marginal totals do not imply independence; the four joint classes are strongly unequal.",
        "A normal haploid gamete carries one allele per locus; linkage concerns alleles at different loci.",
        "Correct. Each locus has equal allele totals, while the two-locus combinations show association."
      ],
      "explanation": "Each locus has 500:500 allele totals, consistent with equal segregation. The joint classes differ from the 250-per-class expectation for independence. Linkage can preserve parental combinations without invalidating separation of alleles at a single locus.",
      "hints": [
        "Compare the one-locus totals with the four two-locus classes.",
        "Ask whether a 1:1 ratio at each locus forces a 1:1:1:1 ratio across loci.",
        "Segregation describes one locus; independent assortment describes relationships between loci."
      ],
      "unlock": "Ledger page 5 recovered. Distinguish allele segregation from independent assortment.",
      "reasoning": {
        "prompt": "Select the two records needed to justify your conclusion.",
        "evidenceIds": [
          "e1",
          "e2"
        ],
        "explanation": "The model card defines the assumptions and the experiment record supplies the cross or observations. Both are needed; the archive note is irrelevant."
      }
    }
  ],
  "transfer": {
    "question": "In an unlinked AaBb × AaBb cross with complete dominance and equal viability, what is P(A_bb), meaning dominant A phenotype and recessive b phenotype?",
    "options": [
      "3/16",
      "9/16",
      "1/16"
    ],
    "answer": 0,
    "explanation": "At the A locus P(A_)=3/4; at the B locus P(bb)=1/4. Independent assortment permits multiplication: 3/4 × 1/4 = 3/16. The linked pair from the previous lock must not be assumed independent."
  }
});

// Learning-science mission: durable retention through retrieval, spacing, structure, and spatial cues.
STARTER_ROOMS.push({
  id: "memory-atlas",
  topic: "Learning Science",
  title: "The Memory Atlas",
  subtitle: "Build a study route that lasts beyond tomorrow.",
  description: "The Atlas Library is losing its routes to long-term memory. Recover five learning principles by choosing evidence-backed study moves instead of familiar-feeling shortcuts.",
  duration: "20–30 min",
  level: "Advanced",
  color: "teal",
  icon: "◈",
  fiction: "A fictional library investigation using simplified learning-science scenarios. The records model general findings; learners should adapt strategies to their own subjects and goals.",
  objectives: [
    "Distinguish retrieval practice from passive review",
    "Plan spaced retrieval rather than massed repetition",
    "Use meaningful chunks to reduce working-memory demands",
    "Explain how stable spatial cues can support recall",
    "Choose interleaving when selecting among problem types matters"
  ],
  learningPlan: {
    audience: "High-school and college learners who want durable, transferable study habits",
    prerequisites: ["Recognize the difference between remembering and recognizing", "Read a simple study schedule", "Identify patterns in worked examples"],
    bigQuestion: "How can a study session create knowledge you can retrieve later, in a new place and for a new problem?"
  },
  sources: [
    { title: "Karpicke & Roediger (2008) — retrieval practice", url: "https://doi.org/10.1126/science.1152408" },
    { title: "Cepeda et al. (2006) — distributed practice", url: "https://doi.org/10.1111/j.1467-9280.2006.01700.x" },
    { title: "Cowan (2001) — working-memory capacity", url: "https://doi.org/10.1017/S0140525X01003922" },
    { title: "Rohrer & Taylor (2007) — interleaving mathematics practice", url: "https://doi.org/10.1002/acp.1347" }
  ],
  puzzles: [
    {
      id: "retrieval-lock", title: "The blank-page ledger", eyebrow: "LOCK 01 / RETRIEVAL",
      objective: "Distinguish retrieval practice from passive review",
      story: "Two learners prepare for the same quiz. One rereads a highlighted page three times; the other closes the book, writes what she can recall, then checks and repairs gaps.",
      question: "Which next step is most likely to strengthen later recall of the ideas?",
      evidence: [
        { id: "comparison", title: "Study comparison", type: "OBSERVATION", body: "Both learners spend ten minutes with the same notes. Only the second learner must produce ideas without seeing the page before checking accuracy.", clue: "Producing an answer creates a retrieval attempt; seeing it again does not require the same operation." },
        { id: "delay", title: "Tomorrow's assessment", type: "REFERENCE", body: "The goal is to explain the ideas from memory tomorrow, not merely recognize highlighted sentences while the notes remain open.", clue: "Match the practice operation to the later demand." },
        { id: "pen", title: "Ink inventory", type: "CONTEXT", body: "The library supplied blue pens to both learners.", clue: "Pen color does not determine how memory is practiced." }
      ],
      required: ["comparison", "delay"],
      options: ["Close the notes, retrieve the explanation, then check and correct missing parts", "Reread the highlighted page until every sentence feels familiar", "Copy the page word for word while keeping the notes visible"],
      answer: 0,
      feedback: ["Correct. Retrieval followed by feedback practices the later task and exposes gaps that can be repaired.", "Familiarity can feel fluent without showing that the idea can be produced later.", "Copying may create a record, but the notes being visible removes the retrieval demand."],
      explanation: "Retrieval practice asks the learner to reconstruct information before feedback. It is harder than rereading, but that desirable difficulty gives the learner diagnostic information and rehearses future recall.",
      hints: ["What will the quiz require you to do without notes?", "Choose the move that requires producing an answer first.", "Retrieve first, then use feedback to repair."],
      unlock: "The first atlas page appears: effortful recall is evidence about what you can actually retrieve.",
      reasoning: { prompt: "Which two records justify the study move?", evidenceIds: ["comparison", "delay"], explanation: "The comparison identifies retrieval, and the delayed assessment shows why practice should require recall without notes." }
    },
    {
      id: "spacing-lock", title: "The calendar vault", eyebrow: "LOCK 02 / SPACING",
      objective: "Plan spaced retrieval rather than massed repetition",
      story: "A history learner has four 20-minute study blocks before a Friday assessment. She can use all four on Thursday night or distribute them across the week.",
      question: "Which schedule best uses the same total time for durable recall on Friday?",
      evidence: [
        { id: "schedule", title: "Available blocks", type: "REFERENCE", body: "Four equal blocks are available on Monday, Tuesday, Wednesday, and Thursday. Friday's assessment requires recall without notes.", clue: "The total study time is fixed; timing is the decision." },
        { id: "forgetting", title: "Practice log", type: "OBSERVATION", body: "After a one-day gap, the learner cannot immediately state every cause of the event, but can recover the outline after attempting recall and checking notes.", clue: "A manageable gap makes practice less fluent and more diagnostic." },
        { id: "calendar-color", title: "Calendar theme", type: "CONTEXT", body: "Monday's calendar square is green and Thursday's is orange.", clue: "Color does not change retention." }
      ],
      required: ["schedule", "forgetting"],
      options: ["Retrieve for 20 minutes on each day, checking and repairing after each attempt", "Save all 80 minutes for Thursday night and reread continuously", "Study for 80 minutes on Monday, then avoid the topic until Friday"],
      answer: 0,
      feedback: ["Correct. Distributed retrieval gives repeated opportunities to reconstruct after short gaps and repair what was missed.", "Massed review may feel smooth that night but provides fewer separated retrieval opportunities.", "One early session leaves no later feedback cycle before the assessment."],
      explanation: "Spacing does not mean never reviewing. It means returning after time has passed, attempting retrieval, and using feedback. The gaps should be challenging enough to require reconstruction but not so long that the learner has no useful foothold.",
      hints: ["The learner has the same amount of time in every option.", "Which choice creates several retrieval attempts separated by time?", "Spread retrieval and feedback across the available days."],
      unlock: "The calendar vault opens: forgetting a little can make the next retrieval useful.",
      reasoning: { prompt: "Which records support the spaced plan?", evidenceIds: ["schedule", "forgetting"], explanation: "The schedule fixes equal time, while the log shows why a recoverable gap can make retrieval informative." }
    },
    {
      id: "chunking-lock", title: "The signal shelf", eyebrow: "LOCK 03 / CHUNKS",
      objective: "Use meaningful chunks to reduce working-memory demands",
      story: "A learner must remember the sequence 1–7–7–6–1–9–4–5. One card presents eight isolated digits; another groups the sequence into meaningful dates, 1776 and 1945, with a note explaining the grouping.",
      question: "Why can the grouped card be easier to hold and use during a history explanation?",
      evidence: [
        { id: "grouping", title: "Two study cards", type: "OBSERVATION", body: "Card A lists 1 7 7 6 1 9 4 5. Card B labels 1776 as U.S. Declaration of Independence and 1945 as end of World War II, then asks the learner to explain the two-event timeline.", clue: "The second card organizes symbols into meaningful units linked to prior knowledge." },
        { id: "limit", title: "Working-memory note", type: "REFERENCE", body: "Working memory is limited. A chunk is not simply a shorter list: it is a meaningful, familiar unit treated as one element for the current task.", clue: "Meaningful organization changes what must be coordinated at once." },
        { id: "font", title: "Typography note", type: "CONTEXT", body: "Both cards use the same 14-point font.", clue: "Font size does not create conceptual chunks." }
      ],
      required: ["grouping", "limit"],
      options: ["It organizes digits into meaningful events, so the learner coordinates a few connected units instead of eight isolated items", "It proves that working memory has unlimited capacity when dates are used", "It works only because historical dates are always easier than any other material"],
      answer: 0,
      feedback: ["Correct. Chunking depends on meaningful structure and relevant prior knowledge, not on magically expanding capacity.", "Chunking helps manage limits; it does not remove them.", "A date becomes a useful chunk because it is connected to learned meaning, not because dates are inherently easy."],
      explanation: "Chunking compresses several elements into a meaningful pattern that the learner can recognize and use. The benefit depends on knowledge: an expert may see a familiar pattern where a novice still sees separate pieces.",
      hints: ["Compare isolated symbols with named historical events.", "A chunk has meaning beyond its individual pieces.", "The advantage is fewer meaningful units to coordinate."],
      unlock: "The signal shelf aligns: structure reduces the load of handling disconnected pieces.",
      reasoning: { prompt: "Which two records explain the chunking advantage?", evidenceIds: ["grouping", "limit"], explanation: "The cards show meaningful organization; the working-memory note explains why that organization matters." }
    },
    {
      id: "spatial-lock", title: "The route of loci", eyebrow: "LOCK 04 / SPATIAL CUES",
      objective: "Explain how stable spatial cues can support recall",
      story: "A biology student assigns the stages of mitosis to five distinct, familiar locations along a route through her home. At each location she imagines one vivid stage-specific action, then walks the same route mentally while recalling the stages.",
      question: "What feature makes this spatial strategy more than merely decorating the notes?",
      evidence: [
        { id: "route", title: "Route plan", type: "OBSERVATION", body: "The route has a stable order: front door, hallway, kitchen, stairs, desk. Each location receives one stage and a meaningful image tied to the stage's process.", clue: "The locations supply ordered retrieval cues, not random scenery." },
        { id: "recall", title: "Recall trial", type: "REFERENCE", body: "During a later closed-book attempt, the student mentally visits each location in order and names the stage and its defining event before checking the diagram.", clue: "The route is used to retrieve, then feedback checks accuracy." },
        { id: "wallpaper", title: "Wallpaper record", type: "CONTEXT", body: "The hallway wallpaper is striped.", clue: "A decorative detail that is not linked to the material is not the retrieval mechanism." }
      ],
      required: ["route", "recall"],
      options: ["Stable locations provide an ordered set of cues that prompt retrieval of the linked stages", "Spatial imagery eliminates the need to know what each stage means", "Changing to a new route every trial makes the cues stronger because they stay surprising"],
      answer: 0,
      feedback: ["Correct. The route supplies a consistent cue structure, while the linked images and retrieval attempt connect each cue to meaning.", "The spatial cue helps access knowledge; it cannot replace accurate understanding.", "Constantly changing cues removes the stable route the learner is using to prompt recall."],
      explanation: "A method-of-loci style strategy combines an ordered, familiar spatial scaffold with meaningful associations. It is most useful when the learner actively retrieves the content from the cues and checks it, rather than only enjoying vivid images.",
      hints: ["What stays the same from one recall attempt to the next?", "The learner walks the route without looking at the diagram.", "A stable location can cue a specific, meaningful memory."],
      unlock: "The route lights up: place can organize a sequence when each place cues a real idea.",
      reasoning: { prompt: "Which two records establish the spatial-memory mechanism?", evidenceIds: ["route", "recall"], explanation: "The route supplies stable ordered cues; the recall trial shows those cues are used to retrieve before feedback." }
    },
    {
      id: "interleaving-lock", title: "The sorting chamber", eyebrow: "LOCK 05 / INTERLEAVING",
      objective: "Choose interleaving when selecting among problem types matters",
      story: "A mathematics learner must decide whether a word problem requires a linear equation, a proportion, or a percent-change calculation. She can practice ten of one type in a row or mix types after first seeing worked examples of each.",
      question: "Which practice choice best prepares her to select a method on an unfamiliar mixed quiz?",
      evidence: [
        { id: "quiz", title: "Quiz format", type: "REFERENCE", body: "The quiz mixes linear, proportional, and percent-change problems without labels. The learner must first identify the problem type, then carry out a method.", clue: "Choosing a method is part of the target performance." },
        { id: "practice", title: "Practice records", type: "OBSERVATION", body: "A blocked set labels every problem as one type, so the next method is obvious. A mixed set removes labels and requires comparing features before selecting a method; feedback follows each answer.", clue: "Mixed practice rehearses discrimination as well as calculation." },
        { id: "paper", title: "Paper stock", type: "CONTEXT", body: "Both sets are printed on recycled paper.", clue: "Paper stock does not determine method selection." }
      ],
      required: ["quiz", "practice"],
      options: ["Use mixed, unlabeled problems with feedback after learning the basic methods", "Use only blocked problems because the quiz will automatically identify each method", "Avoid worked examples and feedback so every problem feels difficult"],
      answer: 0,
      feedback: ["Correct. Interleaving is useful here because the target includes deciding which method fits, followed by feedback.", "The quiz explicitly removes labels, so the method-selection demand must be practiced.", "Difficulty alone is not the goal; examples and feedback are needed to build and correct the methods."],
      explanation: "Interleaving is not automatically superior for every task. Here it matches the assessment because learners must discriminate among similar-looking problem types. A productive sequence is to learn each method with examples, then mix types and use feedback to refine the selection rule.",
      hints: ["What must happen before calculation on the quiz?", "The mixed set removes the method label.", "Practice choosing the method, then check the result."],
      unlock: "The sorting chamber clears: durable learning includes recognizing when a strategy applies.",
      reasoning: { prompt: "Which two records justify interleaving in this case?", evidenceIds: ["quiz", "practice"], explanation: "The quiz demands method selection, and the mixed practice specifically rehearses that discrimination with feedback." }
    }
  ],
  transfer: {
    question: "You have a language vocabulary test in two weeks and a final that requires using words in sentences a month later. Which plan best transfers the Atlas principles?",
    options: ["Make a one-night rereading session before the vocabulary test", "Use short spaced sessions that retrieve words from meaning or cues, correct errors, and later mix sentence-use prompts with word recall", "Copy every definition repeatedly while keeping the word list visible"],
    answer: 1,
    explanation: "The plan combines spaced retrieval with feedback and practices the later transfer demand: selecting and using words in context. Chunks or spatial cues can support organization, but they should lead into retrieval rather than replace it."
  }
});

// Advanced Grade 12 organic chemistry mission. Reactions and spectra are
// fictional teaching data; sources provide background, not answer keys.
STARTER_ROOMS.push({
  id: "organic-chemistry-advanced",
  topic: "Organic Chemistry",
  title: "The Molecular Archive",
  subtitle: "Read the mechanism. Decode the spectra. Rebuild the synthesis route.",
  description: "An archive of reaction notebooks has been scrambled. Use experimental conditions, stereochemical constraints, and spectral evidence to reconstruct an advanced organic chemistry sequence.",
  duration: "25–35 min",
  level: "Advanced",
  color: "purple",
  icon: "⌬",
  fiction: "A fictional Grade 12 laboratory investigation. Reaction conditions and spectra are simplified for learning; no laboratory procedure is supplied.",
  objectives: [
    "Use substrate, nucleophile, and solvent evidence to distinguish SN1 from SN2 reasoning",
    "Apply anti-periplanar geometry to predict an E2 product",
    "Use IR and proton NMR evidence together to identify a constitutional isomer",
    "Predict directing effects and relative activation in electrophilic aromatic substitution",
    "Explain why an enolate gives an aldol addition product under the stated conditions"
  ],
  learningPlan: {
    audience: "Advanced Grade 12 chemistry learners",
    prerequisites: ["Lewis structures and resonance", "acid-base strength", "stereochemistry", "IR and 1H NMR interpretation"],
    bigQuestion: "How can structural evidence and reaction conditions constrain a mechanism more strongly than a memorized reaction name?"
  },
  sources: [
    { title: "OpenStax Organic Chemistry — substitution and elimination reactivity", url: "https://openstax.org/books/organic-chemistry/pages/11-12-a-summary-of-reactivity-sn1-sn2-e1-e1cb-and-e2" },
    { title: "OpenStax Organic Chemistry — reaction summary", url: "https://openstax.org/books/organic-chemistry/pages/11-summary-of-reactions" },
    { title: "OpenStax Organic Chemistry — aromatic substitution", url: "https://openstax.org/books/organic-chemistry/pages/16-summary" }
  ],
  puzzles: [
    {
      id: "mechanism-lock", title: "The inversion record", eyebrow: "LOCK 01 / MECHANISM",
      objective: "Use substrate, nucleophile, and solvent evidence to distinguish SN1 from SN2 reasoning",
      story: "A sealed vial is labeled (S)-2-bromobutane. The product log records one major substitution product. Determine the mechanism that best accounts for all observations.",
      question: "Which mechanism best explains the evidence?",
      evidence: [
        { id: "conditions", title: "Reaction conditions", type: "REFERENCE", body: "(S)-2-bromobutane was treated with sodium azide in dry DMSO at room temperature. DMSO is polar aprotic; azide is a strong nucleophile but weak base in this teaching model.", clue: "The medium keeps the nucleophile available for backside approach." },
        { id: "outcome", title: "Product analysis", type: "OBSERVATION", body: "The major substitution product is predominantly (R)-2-azidobutane. No rearranged carbon skeleton was detected in this simplified data set.", clue: "Configuration changed at the reacting stereocenter." },
        { id: "label", title: "Archive label", type: "CONTEXT", body: "The vial was stored on shelf B-14 beneath a blue lamp.", clue: "Storage metadata does not choose a mechanism." }
      ],
      required: ["conditions", "outcome"],
      options: ["SN2, because a nucleophile attacks in one step from the side opposite the leaving group", "SN1, because a freely rotating carbocation gives the observed inversion", "E2, because azide removes a beta hydrogen to form the substitution product"],
      answer: 0,
      feedback: ["Correct. The polar aprotic conditions and inversion support a concerted backside substitution model.", "A planar carbocation would generally erase the starting configuration rather than specifically predict inversion.", "E2 gives an alkene, not the recorded azide substitution product."],
      explanation: "The conclusion follows from the combined evidence: polar aprotic solvent plus a nucleophile favors direct attack, and the observed inversion is consistent with backside attack. Real systems can have competing pathways, but this question constrains the model explicitly.",
      hints: ["Does the product preserve, invert, or lose configuration?", "Ask whether a planar intermediate is needed.", "A one-step backside attack accounts for inversion."],
      unlock: "The first notebook page opens: mechanism claims must explain stereochemical evidence.",
      reasoning: { prompt: "Which two records directly support this mechanism assignment?", evidenceIds: ["conditions", "outcome"], explanation: "The conditions constrain the likely pathway and the stereochemical outcome tests that pathway. The shelf label is irrelevant." }
    },
    {
      id: "geometry-lock", title: "The anti alignment", eyebrow: "LOCK 02 / STEREOCHEMISTRY",
      objective: "Apply anti-periplanar geometry to predict an E2 product",
      story: "A conformational sketch of 2-bromobutane is pinned beside a bulky base. Only one beta hydrogen is anti-periplanar to the C–Br bond in the drawn reactive conformer.",
      question: "What product follows from the stated anti-periplanar E2 model?",
      evidence: [
        { id: "base", title: "Base card", type: "REFERENCE", body: "Potassium tert-butoxide is used under conditions modeled as strong, bulky base. The question assumes concerted E2 elimination is the dominant teaching pathway.", clue: "The model specifies a concerted elimination." },
        { id: "conformer", title: "Reactive conformer", type: "OBSERVATION", body: "In the supplied staggered conformation, the anti beta hydrogen lies on carbon 3. Removing it while bromide leaves creates the C2=C3 bond with the higher-priority carbon substituents on opposite sides.", clue: "The geometry fixes both the double-bond location and E/Z relationship." },
        { id: "thermometer", title: "Thermometer note", type: "CONTEXT", body: "The room temperature was recorded as 22 °C.", clue: "The stated conformer supplies the decisive information." }
      ],
      required: ["base", "conformer"],
      options: ["(E)-2-butene", "(Z)-2-butene", "1-butene"], answer: 0,
      feedback: ["Correct. The anti hydrogen on carbon 3 gives 2-butene, and the described arrangement gives E geometry.", "Z would require the higher-priority groups to be on the same side, contrary to the supplied conformer.", "1-butene would require abstraction from the other beta carbon, which is not the specified anti alignment."],
      explanation: "E2 elimination is stereospecific because the breaking C–H and C–Br bonds align anti-periplanar in the reactive conformation. The problem provides the relevant anti hydrogen and the resulting relative arrangement, so no unprovided conformer needs to be assumed.",
      hints: ["Find the beta carbon bearing the anti hydrogen.", "Form the double bond between that beta carbon and the carbon bearing bromine.", "Use the stated opposite-side arrangement to assign E."],
      unlock: "A stereochemical seal breaks: geometry can be evidence, not decoration.",
      reasoning: { prompt: "Which two records are required to justify the product?", evidenceIds: ["base", "conformer"], explanation: "The base card supplies the E2 model; the conformer identifies the anti hydrogen and product geometry." }
    },
    {
      id: "spectra-lock", title: "The spectral cabinet", eyebrow: "LOCK 03 / STRUCTURE",
      objective: "Use IR and proton NMR evidence together to identify a constitutional isomer",
      story: "Three possible formulas are written on a cabinet. A sample has formula C3H6O. Identify the structure supported by both spectra rather than by formula alone.",
      question: "Which structure best matches the spectral evidence?",
      evidence: [
        { id: "ir", title: "IR spectrum note", type: "REFERENCE", body: "A strong absorption appears near 1715 cm⁻¹. No broad O–H absorption is reported between 2500–3300 cm⁻¹ in this simplified spectrum.", clue: "A carbonyl is present; a carboxylic-acid O–H signal is not." },
        { id: "nmr", title: "1H NMR integration", type: "OBSERVATION", body: "Two signals are reported: a singlet integrating to 3 H near 2.1 ppm and a singlet integrating to 3 H near 9.8 ppm.", clue: "One methyl group is adjacent to a carbonyl, and one aldehydic proton is present." },
        { id: "mass", title: "Mass label", type: "CONTEXT", body: "The molecular-ion region is marked 58 on the instrument printout.", clue: "The formula is already supplied; the decisive distinction comes from functional-group and proton evidence." }
      ],
      required: ["ir", "nmr"],
      options: ["Propanal, CH3CH2CHO", "Propanone, CH3COCH3", "Cyclopropanol"], answer: 0,
      feedback: ["Correct. The aldehydic 1 H signal and carbonyl evidence identify propanal.", "Propanone would have one 6 H methyl singlet and no aldehydic proton.", "Cyclopropanol lacks the carbonyl signal given by the IR evidence."],
      explanation: "The IR establishes a carbonyl-containing compound. The 9.8 ppm one-proton signal is characteristic of an aldehydic proton in this teaching data, while the 3 H signal fits the methyl adjacent to that carbonyl. Together those observations select propanal.",
      hints: ["First identify the functional group from IR.", "A proton near 9.8 ppm is unusually far downfield.", "Count the 3 H methyl and the 1 H aldehyde."],
      unlock: "The cabinet opens: structure assignment requires signals to agree with each other.",
      reasoning: { prompt: "Which two records directly identify the isomer?", evidenceIds: ["ir", "nmr"], explanation: "IR supplies the carbonyl constraint and NMR supplies the aldehydic proton and integration pattern. The mass label is redundant here." }
    },
    {
      id: "aromatic-lock", title: "The ring ledger", eyebrow: "LOCK 04 / AROMATICITY",
      objective: "Predict directing effects and relative activation in electrophilic aromatic substitution",
      story: "A nitration notebook compares anisole, chlorobenzene, and nitrobenzene under the same fictional electrophilic aromatic substitution conditions.",
      question: "Which prediction best matches the electronic effects stated in the records?",
      evidence: [
        { id: "substituent", title: "Resonance map", type: "REFERENCE", body: "Anisole’s oxygen lone pair can donate electron density by resonance to ortho and para positions. A nitro group withdraws strongly by resonance and directs incoming electrophiles meta in the usual teaching model.", clue: "Resonance changes both reactivity and favored position." },
        { id: "rate", title: "Relative-rate table", type: "OBSERVATION", body: "Under matched conditions, anisole reacts faster than benzene. Nitrobenzene reacts much more slowly than benzene. Chlorobenzene is deactivated overall but gives mainly ortho/para substitution in this simplified comparison.", clue: "Activation and directing category are related but not identical." },
        { id: "glassware", title: "Glassware inventory", type: "CONTEXT", body: "Three identical round-bottom flasks were used.", clue: "The flasks do not determine regioselectivity." }
      ],
      required: ["substituent", "rate"],
      options: ["Anisole is activated and ortho/para-directing; nitrobenzene is deactivated and meta-directing", "Nitrobenzene is activated because the nitro group contains oxygen", "Chlorobenzene must be meta-directing because it is deactivated"], answer: 0,
      feedback: ["Correct. The supplied resonance and rate evidence supports these two linked predictions.", "Oxygen alone does not determine donation; the nitro group withdraws by resonance in the stated model.", "Halogens are a classic exception: deactivated overall yet ortho/para-directing in this model."],
      explanation: "Resonance donation from methoxy stabilizes intermediates leading to ortho/para products and increases reactivity. Nitro withdrawal destabilizes those intermediates, deactivates the ring, and favors meta substitution. Chlorobenzene illustrates why rate and directing effect must be evaluated separately.",
      hints: ["Separate the question ‘faster or slower?’ from ‘where does it react?’", "Compare resonance donation and withdrawal.", "Methoxy donates; nitro withdraws."],
      unlock: "The aromatic ledger yields: directing effects are mechanistic claims about intermediate stabilization.",
      reasoning: { prompt: "Which two records support the aromatic prediction?", evidenceIds: ["substituent", "rate"], explanation: "The resonance map explains directing effects; the rate table supplies the comparative reactivity observations." }
    },
    {
      id: "carbonyl-lock", title: "The enolate cipher", eyebrow: "LOCK 05 / CARBONYL CHEMISTRY",
      objective: "Explain why an enolate gives an aldol addition product under the stated conditions",
      story: "The final page describes acetone treated with dilute hydroxide at low temperature, followed by prompt neutral workup. The isolated product contains both an alcohol and a ketone.",
      question: "Which explanation best accounts for the observed product?",
      evidence: [
        { id: "conditions", title: "Condition log", type: "REFERENCE", body: "Acetone was exposed to dilute hydroxide at low temperature, then neutralized promptly. The teaching model assumes reversible enolate formation followed by carbonyl addition; extended heating and dehydration are excluded.", clue: "The conditions favor addition rather than dehydration in this model." },
        { id: "product", title: "Product evidence", type: "OBSERVATION", body: "The product spectrum retains one ketone carbonyl and shows an O–H absorption. Its carbon count is double that of acetone.", clue: "Two acetone units joined while one carbonyl became an alcohol-bearing carbon." },
        { id: "cleanup", title: "Cleanup record", type: "CONTEXT", body: "The reaction bench was wiped with ethanol after workup.", clue: "Cleanup does not create the product connectivity." }
      ],
      required: ["conditions", "product"],
      options: ["An acetone enolate added to another acetone carbonyl, giving a beta-hydroxy ketone before dehydration", "Hydroxide reduced acetone directly to a secondary alcohol", "Acetone underwent SN2 substitution at its carbonyl carbon"], answer: 0,
      feedback: ["Correct. The evidence is consistent with aldol addition: C–C bond formation, retained ketone, and new alcohol.", "Hydroxide is not a hydride reducing agent, and the carbon count doubled.", "Carbonyl carbon does not undergo the stated SN2 process; the evidence instead indicates nucleophilic addition and C–C bond formation."],
      explanation: "Under the specified simplified conditions, acetone forms a small equilibrium concentration of enolate. That enolate adds to another acetone carbonyl; protonation gives a beta-hydroxy ketone. The retained carbonyl, new O–H group, and doubled carbon count distinguish addition from reduction or substitution.",
      hints: ["Account for both the doubled carbon count and the O–H group.", "One carbonyl remains, while another becomes an alcohol-bearing center.", "An enolate can add to another carbonyl: this is aldol addition."],
      unlock: "The archive is restored: conditions and product evidence together constrain the carbonyl pathway.",
      reasoning: { prompt: "Which two records directly support the aldol-addition explanation?", evidenceIds: ["conditions", "product"], explanation: "The condition log specifies the enolate/addition model; product evidence tests its predicted connectivity and functional groups." }
    }
  ],
  transfer: {
    question: "A secondary alkyl bromide is treated with sodium ethoxide in ethanol. Which claim is best supported before running the reaction?",
    options: ["A strong base can make E2 competition important; substrate, solvent, and product data are needed before claiming a single exclusive pathway", "The reaction must be SN2 because ethoxide contains oxygen", "The reaction must be SN1 because bromide is a leaving group"],
    answer: 0,
    explanation: "Mechanism prediction is evidence-based rather than a single-rule lookup. A secondary substrate with a strong base commonly has E2 competition; actual product and kinetic evidence would be needed to make a stronger claim."
  }
});
