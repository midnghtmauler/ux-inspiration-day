/*
  Content model for the UX Team Inspiration Day companion app.
  Single source of truth, structured from:
    - ux-team-inspiration-day-zurich-2026-11-23.md (day details)
    - workshop-designing-beyond-the-interface.md   (workshop content)
    - BRIEF.md                                     (app goal and decisions)
*/

const DAY = {
  title: 'UX Team Inspiration Day',
  theme: 'Beyond the Interface',
  mission: 'Step away from the delivery context and explore how graphic communication, material, light, space, and emerging interaction models can inspire more distinctive digital experiences.',
  dateISO: '2026-11-23',
  dateLabel: 'Monday, 23 November 2026',
  city: 'Zürich',
  meet: 'Zürich HB',
  returnTo: 'Basel SBB',
  /* Photos live in ./assets/team/ and are cropped to circles by CSS.
     Mapping photo → name is provisional; fix file names here if a photo is wrong. */
  team: [
    { name: 'Dirk', photo: 'assets/team/dirk.png' },
    { name: 'Gasper', photo: 'assets/team/gasper.png' },
    { name: 'Kate', photo: 'assets/team/kate.png' },
    { name: 'Li Zhu', photo: 'assets/team/lizhu.png' },
    { name: 'Mélanie', photo: 'assets/team/melanie.png' },
    { name: 'Nicolas', photo: 'assets/team/nicolas.png' },
  ],
  goals: [
    'Gain inspiration from graphic and spatial design',
    'Look beyond pages, screens, and navigation',
    'Find journeys where AI and agents belong',
    'Leave with six tangible concepts for 2027',
  ],
  practical: [
    'Avant-Garde exhibition: CHF 20 per person (bring your ticket or badge).',
    'Sabine Marcelis exhibition: included with the museum ticket.',
    'Impact Hub workshop room is booked 14:00–16:00, Meeting Room V2.',
    'Lunch and travel are at your own expense.',
  ],
};

/* Entry types for the work log. `mapsTo` links a type to a day deliverable. */
const ENTRY_TYPES = [
  { id: 'observation', label: 'Observation', mapsTo: 'references' },
  { id: 'reference', label: 'Visual reference', mapsTo: 'references' },
  { id: 'principle', label: 'Principle', mapsTo: 'principles' },
  { id: 'convention', label: 'Convention to challenge', mapsTo: 'principles' },
  { id: 'idea', label: 'Experience idea', mapsTo: 'ideas' },
  { id: 'experiment', label: '2027 experiment', mapsTo: 'experiments' },
];

const DELIVERABLES = [
  { id: 'principles', label: 'Principles from the exhibitions captured' },
  { id: 'references', label: 'Observations and visual references logged' },
  { id: 'ideas', label: 'Experience ideas in the shared shape' },
  { id: 'experiments', label: 'Your nomination for a 2027 experiment' },
];

const CAPTURE_FORMULA =
  'Customer problem → Current interaction → New interaction → Role of AI → Business/customer impact';

const SEGMENTS = [
  {
    id: 'arrival',
    start: '09:00',
    end: '09:30',
    timeLabel: '09:00',
    title: 'Arrive in Zürich',
    type: 'logistics',
    typeLabel: 'Meet-up',
    allowNotes: false,
    location: {
      name: 'Zürich HB',
      detail: 'Meet at the main hall, under the blue angel (L’Ange Protecteur).',
      mapsUrl: 'https://maps.google.com/?q=Z%C3%BCrich+HB',
      note: 'We travel to the first exhibition together from here.',
    },
  },
  {
    id: 'avant-garde',
    start: '09:30',
    end: '10:30',
    timeLabel: '09:30–10:30',
    title: 'Avant-Garde — Graphic Design on the Rise',
    type: 'exhibition',
    typeLabel: 'Exhibition',
    location: {
      name: 'Museum für Gestaltung Zürich',
      detail: 'Ausstellungsstrasse 60, 8005 Zürich',
      mapsUrl: 'https://maps.google.com/?q=Museum+f%C3%BCr+Gestaltung+Z%C3%BCrich+Ausstellungsstrasse',
      note: 'Admission CHF 20 per person.',
    },
    focus:
      'Explore how emerging graphic designers use typography, composition, visual systems, imagery, and experimentation to create distinctive communication.',
    allowNotes: false,
    tasks: [
      {
        id: 'ag-1',
        answerable: true,
        title: 'One design that immediately attracts attention',
        lens: 'How can a consistent system still leave room for expression and surprise?',
        capture: { type: 'reference', placeholder: 'Which work stopped you — and what creates the impact: typography, colour, contrast, scale, movement, composition?' },
      },
      {
        id: 'ag-2',
        answerable: true,
        title: 'One design that makes complex information feel simple',
        lens: 'How can we make complex industrial content easier to scan and understand?',
        capture: { type: 'principle', placeholder: 'What was the guiding principle? How did hierarchy shape your understanding?' },
      },
      {
        id: 'ag-3',
        answerable: true,
        title: 'One design that challenges an established convention',
        lens: 'What makes communication feel contemporary without becoming short-lived or trend-dependent?',
        capture: { type: 'convention', placeholder: 'The convention, and whether breaking it worked.' },
      },
    ],
    /* Outputs map 1:1 to the tasks above, in order */
    output: [
      'One visual reference that stops you — to discuss in the afternoon workshop',
      'One principle for making complex information feel simple',
      'One convention worth challenging — and whether breaking it worked',
    ],
  },
  {
    id: 'transfer-toni',
    start: '10:30',
    end: '11:00',
    timeLabel: '10:30–11:00',
    title: 'Travel to Toni-Areal',
    type: 'travel',
    typeLabel: 'Transfer',
    allowNotes: false,
    location: {
      name: 'Towards Toni-Areal',
      detail: 'Tram 4 towards Bahnhof Altstetten Nord, or S-Bahn to Zürich Hardbrücke.',
      mapsUrl: 'https://maps.google.com/?q=Toni-Areal+Z%C3%BCrich',
      note: 'Allow time for the transfer and for regrouping at the entrance.',
    },
  },
  {
    id: 'marcelis',
    start: '11:00',
    end: '12:30',
    timeLabel: '11:00–12:30',
    title: 'Sabine Marcelis — Light and Color',
    type: 'exhibition',
    typeLabel: 'Exhibition',
    location: {
      name: 'Museum für Gestaltung Zürich, Toni-Areal',
      detail: 'Pfingstweidstrasse 96, 8005 Zürich',
      mapsUrl: 'https://maps.google.com/?q=Toni-Areal+Pfingstweidstrasse+96+Z%C3%BCrich',
      note: 'Included with the museum ticket.',
    },
    focus:
      'Observe how light, colour, transparency, reflection, material, scale, and physical space shape perception and create an emotional experience.',
    tasks: [
      {
        id: 'sm-1',
        answerable: true,
        title: 'How the experience changes as you move around it',
        lens: 'How might a digital experience reveal information progressively rather than presenting everything at once?',
        capture: { type: 'reference', placeholder: 'What was revealed, and when?' },
      },
      {
        id: 'sm-2',
        answerable: true,
        title: 'How material and light communicate without explanation',
        lens: 'How can interaction create atmosphere, trust, or confidence without adding complexity?',
        capture: { type: 'principle', placeholder: 'What do you observe in the simplicity of light and space?' },
      },
      {
        id: 'sm-3',
        answerable: true,
        title: 'How simplicity creates distinction',
        lens: 'What makes an experience feel distinctive while remaining calm and usable?',
        capture: { type: 'idea', placeholder: 'The idea, in a sentence or two.' },
      },
      {
        id: 'sm-4',
        answerable: true,
        title: 'How the environment becomes part of the experience',
        lens: 'Where does the boundary between object, interface, and surrounding space disappear — and what could digital products learn from physical material, light, and space?',
        capture: { type: 'observation', placeholder: 'Where did the boundary disappear?' },
      },
    ],
    /* Outputs map 1:1 to the tasks above, in order */
    output: [
      'One example of effective progressive disclosure',
      'One principle for communicating through material and light, without explanation',
      'One idea for making an Endress+Hauser experience more memorable without making it harder to use',
      'One moment where object, interface, and space merged into one experience',
    ],
  },
  {
    id: 'lunch',
    start: '12:30',
    end: '13:30',
    timeLabel: '12:30–13:30',
    title: 'Lunch discussion',
    type: 'break',
    typeLabel: 'Lunch',
    allowNotes: false,
    location: {
      name: 'Zürich-West / Toni-Areal area',
      detail: 'Informal — we pick a place on the day.',
      mapsUrl: 'https://maps.google.com/?q=Restaurants+Toni-Areal+Z%C3%BCrich',
      note: 'Lunch is at your own expense.',
    },
    focus:
      'Lunch is informal, but the purpose is to surface ideas before the structured afternoon session.',
    tasks: [
      { title: 'The most unexpected observation from the morning' },
      { title: 'One connection to our current UX work' },
      { title: 'One question you want to explore during the workshop' },
    ],
  },
  {
    id: 'transfer-hub',
    start: '13:30',
    end: '14:00',
    timeLabel: '13:30–14:00',
    title: 'Walk or travel to Impact Hub',
    type: 'travel',
    typeLabel: 'Transfer',
    allowNotes: false,
    location: {
      name: 'Impact Hub Zürich, Viadukt',
      detail: 'Geroldstrasse 33, 8005 Zürich — about 15 minutes on foot from Toni-Areal.',
      mapsUrl: 'https://maps.google.com/?q=Impact+Hub+Z%C3%BCrich+Viadukt',
      note: 'We settle into Meeting Room V2 and start at 14:00 sharp.',
    },
  },
  {
    id: 'workshop',
    start: '14:00',
    end: '15:30',
    timeLabel: '14:00–15:30',
    title: 'Workshop: Designing Beyond the Interface',
    type: 'workshop',
    typeLabel: 'Workshop',
    location: {
      name: 'Impact Hub Zürich, Viadukt',
      detail: 'Geroldstrasse 33, 8005 Zürich, Meeting Room V2',
      mapsUrl: 'https://maps.google.com/?q=Impact+Hub+Z%C3%BCrich+Viadukt',
      note: 'Room is booked 14:00–16:00 — we aim to finish by 15:30 and keep the last half hour loose.',
    },
    focus:
      'Use the morning’s inspiration to rethink Endress+Hauser customer journeys without defaulting to pages, navigation, and forms — and leave with six tangible ideas, one per person, rather than just inspiration.',
    materials: [
      'Post-its and markers',
      'Flipchart or paint wall',
      'Phones with the morning’s photos and notes',
      'Shared digital board or document for final capture',
    ],
    phases: [
      {
        id: 'harvest',
        timeLabel: '14:00–14:15',
        start: '14:00',
        end: '14:15',
        title: 'Inspiration harvest',
        goal: 'A shared wall of principles from the morning.',
        steps: [
          'On your own, review your log and photos from the two exhibitions.',
          'Write each observation or principle on a post-it and add it to the wall.',
          'Group similar observations together — no discussion yet; the wall is the reference for the rest of the afternoon.',
        ],
      },
      {
        id: 'challenge',
        timeLabel: '14:15–14:50',
        start: '14:15',
        end: '14:50',
        title: 'Challenge the interface',
        goal: 'One provocation per person — a customer journey, reframed AI-native.',
        steps: [
          'On your own: pick one principle from the wall and one customer journey that fights it today — hard to navigate, heavy with complex information, or spread across pages and handoffs.',
          'Name the customer, the need, and the friction — a sentence each, not a framework.',
          'Reframe it: if we couldn’t use a conventional website, how would we solve this need? A sentence or a doodle is enough — what disappears when an agent does the work?',
        ],
        thinkRather: {
          think: 'conversation → agent → recommendation → action → automation',
          rather: 'navigation → page → content → form',
        },
      },
      {
        id: 'sharing',
        timeLabel: '14:50–15:20',
        start: '14:50',
        end: '15:20',
        title: 'Concept sharing',
        goal: 'Six captured ideas, in one shared format.',
        steps: [
          'Each person or pair presents one idea — three minutes each.',
          'Name the principle from the wall the idea draws on — the wall stays visible.',
          'Capture every idea in the same shape:',
        ],
        formula: CAPTURE_FORMULA,
      },
      {
        id: 'close',
        timeLabel: '15:20–15:30',
        start: '15:20',
        end: '15:30',
        title: 'Close',
        goal: 'Six tangible ideas for 2027 — and one owner for the write-up.',
        steps: [
          'Each person nominates one idea we should experiment with in 2027.',
          'No ratings, no business cases — ideas may converge or diverge, both are fine.',
          'Agree who writes the ideas up and where they live.',
        ],
      },
    ],
  },
  {
    id: 'return',
    start: '15:30',
    end: '23:59',
    timeLabel: '15:30 onwards',
    title: 'Return journey',
    type: 'logistics',
    typeLabel: 'Journey home',
    allowNotes: false,
    focus: 'The day is done — close it while it’s fresh. Three short reflections for the train home; they land in your log and feed the team’s 2027 list.',
    stepsLabel: 'Your reflection',
    tasks: [
      {
        id: 'rt-1',
        title: 'The moment that stuck',
        answerable: true,
        hint: 'One image, work, or conversation from today that you’ll remember. What made it stick?',
        capture: { type: 'observation', placeholder: 'A sentence is enough.' },
      },
      {
        id: 'rt-2',
        title: 'Your 2027 nomination',
        answerable: true,
        hint: 'From the ideas on the wall this afternoon: one idea we should experiment with in 2027.',
        capture: { type: 'experiment', placeholder: 'The idea, and why it’s worth an experiment.' },
      },
      {
        id: 'rt-3',
        title: 'Monday looks different',
        answerable: true,
        hint: 'One thing you’ll look at differently in your work after today.',
        capture: { type: 'observation', placeholder: 'A sentence is enough.' },
      },
    ],
    location: {
      name: 'Zürich HB → Basel SBB',
      detail: 'Travel together to Zürich HB and continue to Basel SBB.',
      mapsUrl: 'https://maps.google.com/?q=Z%C3%BCrich+HB',
      note: 'A good moment to review your log and the day summary on the train.',
    },
  },
];
