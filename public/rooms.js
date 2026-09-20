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
