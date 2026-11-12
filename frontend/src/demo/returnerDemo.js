import opportunities from '../../api/data/opportunities.json'

// Demo persona: an engineer returning to work after a career break (fictional; no real person).
// Mirrors the shape of the graduate persona in demoData.js, plus `comeback` and `simulator` results.

const YEAR = new Date().getFullYear()
const LEFT = YEAR - 5

const profile = {
  name: 'Anjali Nair (demo)',
  email: null,
  phone: null,
  degree: 'B.E. Computer Science',
  institution: 'State engineering college',
  graduationYear: 2013,
  experienceLevel: 'mid',
  summary:
    'Backend engineer with five years in Java and SQL at a mid-size product company, now returning after a five-year career break.',
  skills: [
    { name: 'Java', category: 'programming', level: 'advanced' },
    { name: 'Spring Boot', category: 'programming', level: 'advanced' },
    { name: 'SQL', category: 'data', level: 'advanced' },
    { name: 'REST APIs', category: 'programming', level: 'advanced' },
    { name: 'Jenkins', category: 'cloud', level: 'intermediate' },
    { name: 'Python', category: 'programming', level: 'beginner' },
    { name: 'Budgeting', category: 'management', level: 'intermediate' },
    { name: 'Team Leadership', category: 'management', level: 'intermediate' },
  ],
  projects: [
    {
      title: 'Order Settlement Service',
      technologies: ['Java', 'Spring Boot', 'MySQL', 'Jenkins'],
      domain: 'backend',
      impact: 'Cut daily settlement time from 3 hours to 40 minutes',
      description: 'Rebuilt a batch settlement job as an idempotent service with retries and audit logging.',
    },
  ],
  experience: [
    {
      company: 'A mid-size product company',
      role: 'Software Engineer, then Senior Software Engineer',
      duration: `2014 - ${LEFT}`,
      description: 'Built payment and settlement services, mentored two junior engineers, owned on-call for the billing module.',
    },
  ],
  certifications: [{ name: 'Python for Everybody (partially completed)', issuer: 'Coursera', year: YEAR - 1 }],
  interests: ['teaching', 'data'],
  preferredDomains: ['Backend Development', 'Data Engineering'],
}

const analysis = {
  resumeScore: 66,
  employabilityScore: 52,
  careerReadinessScore: 58,
  domainFit: 'Backend Engineering (returning)',
  strengths: [
    'Five years of production backend experience',
    'A measurable result: settlement time cut from 3 hours to 40 minutes',
    'Mentoring and on-call ownership',
    'Strong SQL and API design fundamentals',
  ],
  improvementAreas: [
    'No container or cloud experience on the resume',
    'Latest hands-on work is five years old',
    'Python is only at beginner level',
    'Resume does not mention modern CI/CD or testing practices',
  ],
  recommendedRoles: [
    { role: 'Backend Developer (Java)', matchPercent: 76, reason: 'Five years of Spring Boot and a strong delivery story' },
    { role: 'QA Automation Engineer', matchPercent: 66, reason: 'Engineering depth plus attention to reliability from on-call ownership' },
    { role: 'Junior Data Engineer', matchPercent: 57, reason: 'SQL strength, but Python and cloud tools are still missing' },
  ],
  skillGaps: [
    { skill: 'Docker', priority: 'high', learning: 'Containerise your Settlement Service as a hands-on refresher' },
    { skill: 'Cloud basics (AWS or GCP)', priority: 'high', learning: 'AWS Cloud Practitioner or Google Cloud Digital Leader' },
    { skill: 'Modern CI/CD (GitHub Actions)', priority: 'medium', learning: 'Move one Jenkins-style pipeline to GitHub Actions' },
    { skill: 'Python', priority: 'medium', learning: 'Finish the Python course and build one small data script' },
  ],
  plan30Days: ['Update the resume and lead with the 40-minute settlement result', 'Containerise a sample Spring Boot service with Docker', 'Set up a public GitHub profile with one project'],
  plan90Days: ['Earn a cloud fundamentals certificate', 'Add a GitHub Actions pipeline and tests to the sample project', 'Apply to returnship and flexible backend roles'],
  plan180Days: ['Land a backend or QA automation role with flexible hours', 'Complete one Python data project', 'Mentor a returner junior in your network'],
  aiNarrative:
    'You are not starting over: five years of production Java, a result you can quantify, and mentoring experience are exactly what teams look for. The honest gap is recency, not ability. Docker, one cloud certificate and a modern pipeline on your GitHub will answer the question every interviewer will have. That is achievable at about ten hours a week.',
}

// matchScore, explanation, skill gap per opportunity id (the rest default to 45)
const scores = {
  'linkedin-jobs': [78, 'Backend roles match five years of Java and Spring.', ['Docker']],
  wellfound: [72, 'Startups often offer flexible, remote-first backend roles.', ['Cloud']],
  'google-careers': [64, 'Strong fundamentals; recent cloud experience is the gap.', ['Cloud', 'Python']],
  'microsoft-careers': [66, 'Experienced-hire and returner programmes value prior depth.', ['Cloud']],
  'amazon-student': [40, 'Student programmes are aimed at current students.', []],
  'adplist-mentorship': [82, 'Free mentoring from engineers who have returned to work.', []],
  'she-codes': [84, 'Community and mentoring for women in tech.', []],
  'lfx-mentorship': [70, 'A structured way to rebuild a public GitHub record.', ['Git workflow']],
  gsoc: [48, 'Mainly for students and newcomers to open source.', []],
  'devpost-hackathons': [62, 'A quick, low-stakes way to ship something recent.', []],
  'unstop-hackathons': [58, 'Team challenges help rebuild momentum.', []],
  'kaggle-competitions': [60, 'Good Python and data practice at your own pace.', ['Python']],
  'path-forward': [88, 'Built for people returning after a caregiving break.', []],
  herkey: [85, 'A career platform created around returning after a break.', []],
  'intuit-again': [82, 'A paid returnship for technologists returning after a break.', []],
  'accenture-career-reboot': [80, 'A structured return-to-work programme for breaks of over 24 months.', []],
  'google-career-certificates': [58, 'A flexible way to add current, recognised skills.', []],
  ctet: [35, 'Relevant only if you move into school teaching.', []],
  'gh-pubmatic-5173030008': [82, 'A Java and SQL backend role asking for 3+ years; your five years of Spring Boot fit well.', ['Docker']],
  'amazon-10594189': [79, 'Asks for 2+ years of Java; your five years of production backend work match.', ['Cloud']],
  'gh-coinbase-8165441': [74, 'A remote backend role asking for 3+ years; your Java depth and careful design fit.', ['Cloud']],
  'amazon-10602542': [72, 'Asks for 3+ years of software development; your delivery record fits.', ['Cloud']],
  'gh-twilio-7781659': [68, 'A remote engineering role asking for 3+ years; SQL and Python are enough to start.', ['Python']],
  'gh-mongodb-8143980': [66, 'Application engineering asking for 4+ years; strong Java, but database depth is the gap.', ['Cloud']],
}

// Only listings with a hand-written score are shown, the way the real app shows only what suits the candidate.
const matches = opportunities
  .filter((o) => scores[o.id])
  .map((o) => {
    const m = scores[o.id]
    return { ...o, matchScore: m[0], matchExplanation: m[1], skillGap: m[2] }
  })
  .sort((a, b) => b.matchScore - a.matchScore)

const dna = {
  archetype: {
    title: 'The Steady Systems Builder',
    tagline: 'Makes critical systems reliable, and teams better.',
    description:
      'You rebuilt a settlement job that people depended on daily, owned on-call for billing, and mentored two engineers. Reliability and teaching are your through-lines.',
  },
  superpower: 'Making money-critical systems reliable: you cut daily settlement time from 3 hours to 40 minutes.',
  workingStyle: [
    { trait: 'Reliability-first', evidence: 'Idempotent service with retries and audit logging.' },
    { trait: 'Natural mentor', evidence: 'Mentored two junior engineers.' },
    { trait: 'Calm under pressure', evidence: 'Owned on-call for the billing module.' },
  ],
  hiddenPotentials: [
    {
      title: 'Quality and reliability engineering',
      evidence: 'On-call ownership, audit logging and idempotent design are SRE and QA habits.',
      whyItMatters: 'Reliability roles value experience with real incidents, which most juniors lack.',
      roles: ['QA Automation Engineer', 'Site Reliability Engineer'],
    },
    {
      title: 'Technical training and mentoring',
      evidence: 'Mentoring juniors plus tutoring neighbourhood children shows you can teach.',
      whyItMatters: 'Bootcamps and EdTech teams hire practitioners who can explain clearly.',
      roles: ['Technical Instructor', 'Developer Advocate'],
    },
    {
      title: 'Engineering coordination',
      evidence: 'Running a school fundraiser budget alongside engineering delivery.',
      whyItMatters: 'Technical program roles need people who handle budgets, people and deadlines.',
      roles: ['Technical Program Manager', 'Delivery Lead'],
    },
  ],
  transferableSkills: [
    { skill: 'Budget ownership', from: 'School fundraiser treasurer', appliesTo: 'Project and delivery planning' },
    { skill: 'Teaching and explaining', from: 'Tutoring neighbourhood children', appliesTo: 'Mentoring and onboarding engineers' },
    { skill: 'Prioritising under constraints', from: 'Running a household and caring for family', appliesTo: 'Sprint planning and incident triage' },
  ],
  informalExperience: [
    {
      activity: 'Treasurer of the school parents association',
      professionalTranslation: 'Managed a shared budget and reported spending to a committee of 12.',
      resumeBullet: 'Managed the annual budget for a 12-person parents committee, tracking income and spending and reporting to members each term.',
    },
    {
      activity: 'Tutoring neighbourhood children in maths, twice a week',
      professionalTranslation: 'Planned and delivered regular teaching sessions for a small group.',
      resumeBullet: 'Planned and delivered twice-weekly maths tutoring for a small group of children over three years.',
    },
  ],
  blindSpots: [
    { risk: 'Your most recent engineering work is five years old.', fix: 'Publish one recent, public project so the date question has an answer.' },
    { risk: 'No cloud or container experience visible on the resume.', fix: 'Containerise your sample service and earn one cloud fundamentals certificate.' },
  ],
  radar: [
    { axis: 'Technical depth', score: 74 },
    { axis: 'Problem solving', score: 76 },
    { axis: 'Communication', score: 70 },
    { axis: 'Leadership', score: 66 },
    { axis: 'Domain breadth', score: 52 },
    { axis: 'Delivery', score: 80 },
  ],
}

const tl = (rows) => rows.map((r, i) => ({ year: YEAR + i, title: r[0], milestone: r[1], skillsGained: r[2] || [] }))

const multiverse = {
  universes: [
    {
      id: 'u1', role: 'Backend Developer (Java)', kind: 'realistic', tagline: 'Pick up where you left off, with modern tooling',
      fitScore: 76, difficulty: 'moderate', monthsToFirstRole: 4,
      whyYou: 'Five years of Spring Boot and a measurable delivery result. Recency is the only gap.',
      dayInLife: 'Review a pull request, ship an endpoint, and pair with a junior on a bug.',
      timeline: tl([
        ['Returning Backend Developer', 'First role back, ideally flexible or part-time', ['Docker', 'GitHub Actions']],
        ['Backend Developer', 'Own a service end to end', ['Cloud deployment']],
        ['Senior Backend Developer', 'Lead design for a module', ['System design']],
        ['Tech Lead', 'Lead a small team', ['Mentoring at scale']],
        ['Engineering Lead', 'Own delivery for a product area', ['Roadmapping']],
      ]),
      futureTitle: 'Tech Lead', risks: ['Rusty on current tooling in interviews', 'Some employers still screen on recent dates'],
      firstStep: 'Containerise the Order Settlement Service sample and push it to GitHub this week.',
      upside: 'Fastest route back, using skills you already have.', downside: 'Needs a visible, recent project to counter the date question.',
    },
    {
      id: 'u2', role: 'QA Automation Engineer', kind: 'realistic', tagline: 'Reliability as a craft',
      fitScore: 66, difficulty: 'easy', monthsToFirstRole: 3,
      whyYou: 'On-call ownership and idempotent design show a reliability mindset that QA teams want.',
      dayInLife: 'Write an automated test for a failing flow and triage a flaky pipeline.',
      timeline: tl([
        ['QA Automation Engineer', 'Build test suites for a product area', ['Selenium', 'pytest']],
        ['Senior QA Engineer', 'Define test strategy', ['CI integration']],
        ['SDET Lead', 'Lead quality for a team', ['Performance testing']],
        ['Quality Engineering Manager', 'Own quality across teams', ['Metrics']],
        ['Head of Quality', 'Set quality standards', ['Strategy']],
      ]),
      futureTitle: 'Quality Engineering Manager', risks: ['Can be undervalued in some companies'],
      firstStep: 'Write a small automated test suite for your sample service.',
      upside: 'Strong demand for experienced reliability thinkers, and often flexible.', downside: 'Less design ownership than backend development.',
    },
    {
      id: 'u3', role: 'Technical Instructor', kind: 'wildcard', tagline: 'Teach what you have built',
      fitScore: 62, difficulty: 'moderate', monthsToFirstRole: 5,
      whyYou: 'You mentor engineers and already tutor children. Bootcamps and EdTech teams hire practitioners.',
      dayInLife: 'Run a live coding session and review student projects.',
      timeline: tl([
        ['Part-time Technical Instructor', 'Teach one cohort a month', ['Curriculum design']],
        ['Instructor', 'Own a course', ['Assessment design']],
        ['Lead Instructor', 'Lead a programme', ['Learning design']],
        ['Curriculum Lead', 'Shape the curriculum', ['Mentoring instructors']],
        ['Head of Learning', 'Own learning outcomes', ['Strategy']],
      ]),
      futureTitle: 'Curriculum Lead', risks: ['Contract and cohort-based work can be irregular'],
      firstStep: 'Teach one free workshop on Java or SQL to a local community group.',
      upside: 'Flexible, meaningful work with a natural fit to your strengths.', downside: 'Income can be less predictable early on.',
    },
    {
      id: 'u4', role: 'Junior Data Engineer', kind: 'stretch', tagline: 'Use your SQL in a growing field',
      fitScore: 57, difficulty: 'hard', monthsToFirstRole: 9,
      whyYou: 'Strong SQL and API fundamentals, but Python and cloud tools need work.',
      dayInLife: 'Fix a pipeline, optimise a query, and review a schema change.',
      timeline: tl([
        ['Upskilling and portfolio', 'Python, Docker, one cloud pipeline', ['Python', 'Docker']],
        ['Data Engineer', 'Own a set of pipelines', ['Airflow']],
        ['Senior Data Engineer', 'Design a warehouse model', ['Data modelling']],
        ['Lead Data Engineer', 'Lead platform work', ['Architecture']],
        ['Data Platform Lead', 'Own the data platform', ['Strategy']],
      ]),
      futureTitle: 'Senior Data Engineer', risks: ['Steep tooling curve at five years out'],
      firstStep: 'Finish the Python course and write one script that loads a CSV into SQL.',
      upside: 'High demand and room to grow.', downside: 'The slowest path back of the four.',
    },
  ],
}


const jdlab = {
  roleTitle: 'Backend Engineer (Java), flexible hours', company: 'Northwind Pay',
  eligibility: { now: 58, verdict: 'stretch', summary: 'Your Java, Spring and payments experience match the core of this role. The gaps are Docker and cloud exposure, which you can close in about two months of part-time study.' },
  requirements: [
    { requirement: '3+ years of Java and Spring Boot', status: 'met', evidence: 'Five years building and owning settlement services.' },
    { requirement: 'REST API design', status: 'met', evidence: 'Designed APIs for the settlement service.' },
    { requirement: 'SQL and relational databases', status: 'met', evidence: 'Advanced SQL; MySQL in the settlement project.' },
    { requirement: 'Docker and containerised deployment', status: 'missing', evidence: 'No container experience on the resume.' },
    { requirement: 'AWS or GCP', status: 'missing', evidence: 'No cloud platform listed.' },
    { requirement: 'CI/CD pipelines', status: 'partial', evidence: 'Jenkins is listed; GitHub Actions is not.' },
    { requirement: 'Payments or fintech background', status: 'met', evidence: 'Billing and settlement services are core payments work.' },
    { requirement: 'Flexible hours (core hours 10-3)', status: 'met', evidence: 'Compatible with the part-time hours you listed.' },
  ],
  blockers: [
    { blocker: 'No Docker or container experience', skill: 'Docker', severity: 'high', howToClose: 'Containerise the Order Settlement sample and publish the image.', weeks: 3 },
    { blocker: 'No cloud platform on the resume', skill: 'AWS', severity: 'high', howToClose: 'Take a cloud fundamentals course and deploy the container to a free tier.', weeks: 5 },
  ],
  milestones: [
    { label: 'Docker for Java services (course and project)', type: 'course', weeks: 3, eligibilityAfter: 70 },
    { label: 'Cloud fundamentals certification', type: 'certification', weeks: 5, eligibilityAfter: 80 },
    { label: 'GitHub Actions pipeline with tests for the sample service', type: 'project', weeks: 3, eligibilityAfter: 86 },
  ],
  alternativeRoles: [
    { title: 'Backend Engineer (maintenance and support team)', fit: 82, why: 'Values deep Java and payments experience over the latest tools.' },
    { title: 'QA Automation Engineer', fit: 70, why: 'Your reliability instincts fit; test tooling is quick to learn.' },
  ],
  keywords: { present: ['Java', 'Spring Boot', 'REST', 'SQL', 'Jenkins'], missing: ['Docker', 'AWS', 'GitHub Actions', 'Kubernetes', 'microservices'] },
  interviewQuestions: [
    { question: 'Tell me about your career break and what brings you back now.', type: 'gap', whyAsked: 'Every interviewer will want a clear, confident answer.', tip: 'Be brief and truthful, then pivot to what you built, what you refreshed, and what you want next.' },
    { question: 'How did you cut the settlement time from 3 hours to 40 minutes?', type: 'technical', whyAsked: 'Probes the depth behind your strongest result.', tip: 'Explain the batching, idempotency and retries you actually used, and what you measured.' },
    { question: 'Have you used Docker or deployed to the cloud?', type: 'gap', whyAsked: 'The posting lists both and your resume shows neither.', tip: 'Describe the sample project you containerised and the certificate you are working on, with dates.' },
    { question: 'Describe a production incident you handled while on call.', type: 'behavioral', whyAsked: 'Tests calm and ownership.', tip: 'Use a real billing incident: what you saw, what you did, and what you changed afterwards.' },
    { question: 'How would you make an idempotent payment endpoint?', type: 'technical', whyAsked: 'Core payments design knowledge.', tip: 'Cover idempotency keys, storage of results, and retry behaviour.' },
    { question: 'How do you stay current after time away?', type: 'gap', whyAsked: 'Checks self-direction and learning habits.', tip: 'Name two concrete things you studied or built, and your weekly routine.' },
    { question: 'Tell me about a time you mentored someone.', type: 'behavioral', whyAsked: 'Assesses collaboration and leadership.', tip: 'Use the two juniors you mentored and one specific improvement you saw.' },
    { question: 'How do you work within core hours of 10 to 3?', type: 'behavioral', whyAsked: 'Checks fit with flexible-hours expectations.', tip: 'Describe how you plan deep work and handoffs around fixed hours.' },
  ],
  tailoredSummary: 'Backend engineer with five years of Java and Spring Boot in payments, including a settlement rebuild that cut processing from 3 hours to 40 minutes. Returning after a career break with current Docker and cloud skills in progress, and a track record of owning on-call and mentoring junior engineers.',
}

const evaluate = {
  scores: { relevance: 8, structure: 5, specificity: 6, communication: 7 },
  overall: 7,
  verdict: 'Honest and relevant. It needs a calmer structure and a stronger finish.',
  strengths: ['Truthful and not defensive', 'Mentions a concrete recent action'],
  improvements: ['Shorten the explanation of the break to one sentence', 'End with what you want to do now and why this role'],
  improvedAnswer: 'I stepped away from engineering for five years to care for my family. During that time I stayed connected to my craft by tutoring and by working through a Python course, and recently I containerised my settlement service to refresh my tooling. I am returning because I miss building reliable systems and mentoring other engineers, and this role is exactly that.',
  followUp: 'What did you do to make sure your skills were current when you came back?',
}

function builder(skill) {
  const s = skill || 'Docker'
  return {
    title: `Containerised Order Settlement Service (${s})`,
    pitch: `Take the settlement service you already know and modernise it: packaged, tested and automated. It proves ${s} on a project you can explain deeply.`,
    skillsProven: [s, 'CI/CD', 'Automated testing', 'Documentation'],
    techStack: ['Java', 'Spring Boot', 'Docker', 'GitHub Actions', 'JUnit', 'Free-tier cloud host'],
    difficulty: 'intermediate', estimatedHours: 25,
    architecture: [
      'Spring Boot service exposes the settlement endpoints',
      'A multi-stage Dockerfile builds and runs the app',
      'docker-compose runs the service with a MySQL container',
      'JUnit tests cover idempotency and retries',
      'GitHub Actions builds, tests and publishes the image on every push',
    ],
    milestones: [
      { week: 1, title: 'Containerise', tasks: ['Write a multi-stage Dockerfile', 'Run it locally', 'Add docker-compose with MySQL'], deliverable: 'The service starts with one command.' },
      { week: 2, title: 'Test and automate', tasks: ['Add JUnit tests for idempotency', 'Create a GitHub Actions workflow', 'Add a build badge'], deliverable: 'A green pipeline on every push.' },
      { week: 3, title: 'Deploy and document', tasks: ['Deploy to a free tier', 'Write the README with a diagram', 'Record a 2-minute walkthrough'], deliverable: 'A live URL and a clear README.' },
    ],
    evaluationCriteria: ['Starts from a clean machine with one command', 'Idempotency is covered by tests', 'CI is green', 'README explains design decisions'],
    stretchGoals: ['Add structured logging and a health endpoint', 'Publish the image to a public registry'],
    resumeBullet: 'Containerised and automated a Java settlement service with Docker and GitHub Actions ([N]% test coverage), deployed to a public cloud tier.',
    readmeOutline: ['Overview', 'Architecture diagram', 'Run locally', 'Tests', 'Deployment', 'What I would do next'],
  }
}

const comeback = {
  gapFraming: {
    lines: [
      'I took five years away from engineering to care for my family, and I have kept my skills moving while I was away.',
      'I am returning with the same engineering depth plus recent work: a containerised project and a cloud certificate in progress.',
    ],
    interviewAnswer:
      'I stepped away for five years to care for my family. I stayed close to my craft by tutoring and studying Python, and more recently I containerised my old settlement service to bring my tooling up to date. I am coming back because I miss building reliable systems and mentoring engineers, and I am ready to do it full strength.',
  },
  transferable: [
    { activity: 'Treasurer of the school parents association', competency: 'Budget ownership and stakeholder reporting', resumeBullet: 'Managed the annual budget for a 12-person parents committee, tracking income and spending and reporting to members each term.' },
    { activity: 'Tutoring neighbourhood children in maths, twice a week', competency: 'Planning and delivering structured teaching', resumeBullet: 'Planned and delivered twice-weekly maths tutoring for a small group of children over three years.' },
    { activity: 'Running the household and caring for family', competency: 'Prioritisation and scheduling under constraints', resumeBullet: 'Coordinated schedules and priorities for a household of five across school, health and logistics commitments.' },
  ],
  refresh: [
    { area: 'Containers (Docker)', whatMayHaveChanged: 'Packaging services in containers is now a baseline expectation for most backend roles.', confidence: 'high', refresher: 'Containerise your settlement sample with a multi-stage Dockerfile.', hours: 8 },
    { area: 'Cloud basics', whatMayHaveChanged: 'Teams commonly deploy to a public cloud rather than managing their own servers.', confidence: 'high', refresher: 'Work through a cloud fundamentals course and deploy one container to a free tier.', hours: 12 },
    { area: 'CI/CD pipelines', whatMayHaveChanged: 'Many teams have moved from self-run Jenkins to hosted pipelines such as GitHub Actions.', confidence: 'medium', refresher: 'Rebuild one pipeline as a GitHub Actions workflow.', hours: 6 },
    { area: 'Automated testing practices', whatMayHaveChanged: 'Expectations for unit and integration tests in every pull request have risen.', confidence: 'medium', refresher: 'Add JUnit tests with coverage to your sample service.', hours: 6 },
  ],
  confidenceNote: 'You cut a daily settlement job from 3 hours to 40 minutes and owned on-call for billing. That is real, current-quality engineering judgment, and five years away does not erase it. What you need is recent evidence, and that is a few weeks of focused work.',
}

function simulator(hours) {
  const h = Math.min(Math.max(hours || 10, 3), 40)
  const rows = [
    ['Reset and plan', ['Update your resume with the settlement result', 'Set up GitHub and push the sample service', 'Pick 5 target roles'], 'A fresh resume and a public repo', 8],
    ['Docker basics', ['Containers vs VMs', 'Write a Dockerfile for the sample service', 'Run it locally'], 'The service runs in a container', 12],
    ['Compose and databases', ['Add docker-compose with MySQL', 'Seed test data', 'Document the run steps'], 'One-command local stack', 16],
    ['Testing refresh', ['Add JUnit tests for idempotency', 'Measure coverage', 'Fix one flaky test'], 'A passing test suite', 22],
    ['CI with GitHub Actions', ['Create a build workflow', 'Run tests in CI', 'Add a status badge'], 'A green pipeline', 30],
    ['Cloud fundamentals I', ['Study core cloud concepts', 'Complete the first course module', 'Make a cheat sheet'], 'Notes and a first module done', 36],
    ['Cloud fundamentals II', ['Finish the course', 'Deploy the container to a free tier', 'Capture the URL'], 'A live deployment', 44],
    ['Certificate and polish', ['Take the practice exam', 'Book the real exam', 'Polish the README'], 'Exam booked, README done', 52],
    ['Interview stories', ['Write 4 STAR stories', 'Prepare your break answer', 'Practise out loud'], 'Four ready stories and a break answer', 58],
    ['Technical interview prep', ['Review idempotency and API design', 'Practise two system-design prompts', 'Mock interview with a peer'], 'One mock interview done', 64],
    ['Start applying', ['Apply to 5 returner-friendly roles', 'Message 3 mentors', 'Track applications'], '5 tailored applications sent', 70],
    ['Interviews and follow-ups', ['Do any screening calls', 'Send follow-ups', 'Refine your pitch'], 'Feedback collected', 76],
    ['Review and next 90 days', ['Review what worked', 'Set the next 90-day goals', 'Celebrate the progress'], 'A written next plan', 80],
  ]
  return {
    summary: `At ${h} hours a week, you finish with a containerised, tested, cloud-deployed project, a current resume and a confident answer about your break.`,
    hoursPerWeek: h,
    weeks: rows.map((r, i) => ({ week: i + 1, theme: r[0], goals: r[1], deliverable: r[2], hours: Math.min(h, i < 2 ? Math.max(3, Math.round(h * 0.6)) : h), checkpoint: i < 12 ? 'You can explain what you built to a friend.' : 'Your next plan is written.', readiness: r[3] })),
    risks: [
      { risk: 'A sick child or a busy week breaks the routine.', mitigation: 'Plan the minimum viable week of 3 hours and let the rest slide without guilt.' },
      { risk: 'You wait until you feel fully ready before applying.', mitigation: 'Start applying in week 11 regardless; interviews are part of the learning.' },
    ],
  }
}

const tldr = {
  "tone": "steady",
  "average": 59,
  "opener": "Five years away does not erase five years of real engineering. You have a strong base to return from.",
  "missing": [
    {
      "point": "No Docker or cloud work on your resume",
      "section": "gaps"
    },
    {
      "point": "Your latest hands-on project is five years old",
      "section": "intelligence"
    }
  ],
  "improve": [
    {
      "point": "Lead with the 40-minute settlement result",
      "section": "intelligence"
    },
    {
      "point": "Add one recent public project",
      "section": "roadmap"
    }
  ],
  "next": [
    {
      "point": "Containerise your sample service with Docker",
      "section": "plan"
    },
    {
      "point": "Write your honest answer about the break",
      "section": "comeback"
    }
  ],
  "pursue": [
    {
      "point": "Backend Developer, your closest match",
      "section": "roles"
    },
    {
      "point": "Technical instructor, using your mentoring",
      "section": "skillmap"
    }
  ]
}

export const RETURNER = {
  id: 'returner',
  label: 'Returning engineer',
  description: 'Five-year career break, backend engineer',
  profile,
  analysis,
  matches,
  comeback: { breakMonths: 60, hoursPerWeek: 10, flexibility: ['remote', 'part-time'], field: 'engineering', activities: 'School parents association treasurer; tutoring neighbourhood children in maths' },
  modules: { tldr, dna, multiverse, jdlab, evaluate, comeback },
  builder,
  simulator,
}
