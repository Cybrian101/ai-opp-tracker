import opportunities from '../../api/data/opportunities.json'
import { RETURNER } from './returnerDemo'

// Demo mode: a fictional candidate and canned results for every module, so the whole platform can be
// shown with no resume, no API key and no network. Nothing here is real personal data.

const YEAR = new Date().getFullYear()

const profile = {
  name: 'Priya Raman (demo)',
  email: null,
  phone: null,
  degree: 'B.Tech Computer Science',
  institution: 'Anna University',
  graduationYear: YEAR,
  experienceLevel: 'fresher',
  summary:
    'Final-year CS graduate who builds small data apps with Python and SQL and organised her college tech fest.',
  skills: [
    { name: 'Python', category: 'programming', level: 'intermediate' },
    { name: 'SQL', category: 'data', level: 'intermediate' },
    { name: 'Pandas', category: 'data', level: 'intermediate' },
    { name: 'Flask', category: 'programming', level: 'beginner' },
    { name: 'Git', category: 'programming', level: 'beginner' },
    { name: 'Excel', category: 'data', level: 'advanced' },
    { name: 'Team Leadership', category: 'management', level: 'intermediate' },
  ],
  projects: [
    {
      title: 'Campus Canteen Predictor',
      technologies: ['Python', 'Flask', 'SQLite', 'Pandas'],
      domain: 'data',
      impact: 'Used by 120 students to avoid queues',
      description: 'REST API plus dashboard that predicts canteen rush hours from order history.',
    },
  ],
  experience: [
    {
      company: 'Anna University Tech Fest',
      role: 'Events Coordinator (volunteer)',
      duration: '2023-2024',
      description: 'Managed a 15-person volunteer team and a Rs 80,000 budget for a 2,000-attendee event.',
    },
  ],
  certifications: [{ name: 'Google Data Analytics Certificate', issuer: 'Coursera', year: YEAR - 1 }],
  interests: ['data storytelling', 'education'],
  preferredDomains: ['Data Analytics', 'Backend Development'],
}

const analysis = {
  resumeScore: 71,
  employabilityScore: 58,
  careerReadinessScore: 63,
  domainFit: 'Data Analytics / Data Engineering',
  strengths: ['Python and SQL fundamentals', 'End-to-end project with real users', 'Leadership of a 15-person team', 'Data analytics certification'],
  improvementAreas: ['No cloud or deployment experience', 'No automated testing', 'Resume lacks quantified results beyond one project', 'Git usage is basic'],
  recommendedRoles: [
    { role: 'Junior Data Analyst', matchPercent: 88, reason: 'Pandas, SQL and a certificate, backed by a project with real users' },
    { role: 'Junior Data Engineer', matchPercent: 64, reason: 'Strong Python and SQL, but missing cloud, Docker and orchestration' },
    { role: 'Backend Developer', matchPercent: 59, reason: 'Flask API experience, limited testing and deployment' },
  ],
  skillGaps: [
    { skill: 'Docker', priority: 'high', learning: 'Docker for Data Applications, plus containerise your own project' },
    { skill: 'AWS or GCP basics', priority: 'high', learning: 'AWS Cloud Practitioner or Google Cloud Digital Leader' },
    { skill: 'Unit testing', priority: 'medium', learning: 'pytest fundamentals, add tests to the Canteen Predictor' },
    { skill: 'Airflow', priority: 'medium', learning: 'Build one scheduled pipeline with Apache Airflow' },
  ],
  plan30Days: ['Containerise the Canteen Predictor with Docker', 'Add pytest tests and push to GitHub with a clear README', 'Rewrite resume bullets with numbers'],
  plan90Days: ['Earn a cloud fundamentals certification', 'Build an Airflow ETL pipeline into BigQuery or Redshift', 'Apply to 15 junior data roles with tailored resumes'],
  plan180Days: ['Land a junior data analyst or engineer role', 'Contribute to one open-source data project', 'Publish a data-storytelling blog post'],
  aiNarrative:
    'You are a credible junior data candidate: solid Python and SQL, a project people actually used, and leadership experience most freshers lack. Your biggest risk is the gap between building a project and shipping one: no Docker, no cloud, no tests. Closing that in the next 90 days moves you from "promising student" to "hireable engineer".',
}

const matchScores = {
  'google-careers': [78, 'Python and SQL align with entry-level data roles.', ['Cloud', 'System design']],
  'microsoft-careers': [74, 'Data skills fit student and graduate programmes.', ['Cloud', 'Testing']],
  'amazon-student': [72, 'Project plus leadership suits student programmes.', ['AWS']],
  'linkedin-jobs': [81, 'Entry-level analyst roles match your skills and certificate.', ['Docker']],
  wellfound: [69, 'Startups value your end-to-end project.', ['Cloud', 'CI/CD']],
  'unstop-hackathons': [77, 'Your canteen project shows you can build something in a team.', []],
  'devpost-hackathons': [73, 'Data apps do well in hackathons.', []],
  'mlh-hackathons': [71, 'Good practice and visibility for a fresher.', []],
  'kaggle-competitions': [84, 'Pandas and analytics skills transfer directly.', ['Machine learning']],
  gsoc: [52, 'Needs stronger open-source and Git history first.', ['Git workflow', 'Open-source contributions']],
  'she-codes': [80, 'Community and mentorship fit your goals.', []],
  'adplist-mentorship': [76, 'Free mentoring to close the cloud gap.', []],
  'lfx-mentorship': [55, 'Needs open-source contributions first.', ['Open source']],
}

const matches = opportunities
  .map((o) => {
    const m = matchScores[o.id]
    return { ...o, matchScore: m ? m[0] : 45, matchExplanation: m ? m[1] : '', skillGap: m ? m[2] : [] }
  })
  .sort((a, b) => b.matchScore - a.matchScore)

const dna = {
  archetype: {
    title: 'The Analytical Builder',
    tagline: 'Turns raw data into things real people use.',
    description:
      'Your Canteen Predictor reached 120 students, and you ran a 15-person team on a real budget. You pair technical building with organising people, which is rarer than either alone.',
  },
  superpower: 'Shipping data tools people actually use: your canteen app has 120 real users.',
  workingStyle: [
    { trait: 'Practical problem-solver', evidence: 'Built a predictor for a real campus problem rather than a toy dataset.' },
    { trait: 'Natural coordinator', evidence: 'Managed 15 volunteers and a Rs 80,000 budget.' },
    { trait: 'Learns by building', evidence: 'Projects and a certificate rather than coursework alone.' },
  ],
  hiddenPotentials: [
    {
      title: 'Data product / analytics-engineering path',
      evidence: 'Flask API plus dashboard plus real users is a small data product.',
      whyItMatters: 'Companies pay a premium for analysts who can ship, not just report.',
      roles: ['Analytics Engineer', 'Data Product Associate'],
    },
    {
      title: 'Technical project coordination',
      evidence: 'Tech fest leadership combined with engineering skills.',
      whyItMatters: 'Technical program roles need people who can talk to both sides.',
      roles: ['Technical Program Associate', 'Developer Relations'],
    },
    {
      title: 'Data storytelling and teaching',
      evidence: 'Interest in education and data storytelling, plus a dashboard people used.',
      whyItMatters: 'Explaining data clearly is the most under-supplied analytics skill.',
      roles: ['Data Educator', 'BI Analyst'],
    },
  ],
  transferableSkills: [
    { skill: 'Budget management', from: 'Tech fest (Rs 80,000)', appliesTo: 'Project planning and cost-aware engineering' },
    { skill: 'Stakeholder coordination', from: 'Leading 15 volunteers', appliesTo: 'Cross-functional data projects' },
    { skill: 'Forecasting', from: 'Canteen Predictor', appliesTo: 'Demand and operations analytics' },
  ],
  informalExperience: [
    {
      activity: 'Events Coordinator (volunteer), Anna University Tech Fest',
      professionalTranslation: 'Led a 15-person team and managed an Rs 80,000 budget for a 2,000-attendee event.',
      resumeBullet:
        'Led a 15-person volunteer team and managed an Rs 80,000 budget to deliver a 2,000-attendee technical event.',
    },
    {
      activity: 'Campus Canteen Predictor (personal project)',
      professionalTranslation: 'Built and shipped a forecasting tool adopted by real users.',
      resumeBullet:
        'Built a Flask API and dashboard predicting canteen rush hours from order history, used by 120 students.',
    },
  ],
  blindSpots: [
    { risk: 'Nothing you have built runs outside your laptop.', fix: 'Containerise the project and deploy it on a free tier this month.' },
    { risk: 'No tests, so employers cannot trust your code.', fix: 'Add pytest tests and a CI badge to the repository.' },
  ],
  radar: [
    { axis: 'Technical depth', score: 60 },
    { axis: 'Problem solving', score: 68 },
    { axis: 'Communication', score: 64 },
    { axis: 'Leadership', score: 72 },
    { axis: 'Domain breadth', score: 45 },
    { axis: 'Delivery', score: 75 },
  ],
}

function timeline(titles, skills) {
  return titles.map((t, i) => ({
    year: YEAR + i,
    title: t[0],
    milestone: t[1],
    skillsGained: skills[i] || [],
  }))
}

const multiverse = {
  universes: [
    {
      id: 'u1',
      role: 'Junior Data Analyst',
      kind: 'realistic',
      tagline: 'Turn campus-scale data into decisions',
      fitScore: 88,
      difficulty: 'easy',
      monthsToFirstRole: 3,
      whyYou: 'Pandas, SQL and the Google certificate, backed by a project with real users.',
      dayInLife: 'Clean data in Pandas, build a dashboard, and present one clear insight to a stakeholder.',
      timeline: timeline(
        [
          ['Junior Data Analyst', 'First analyst role; own one dashboard end to end'],
          ['Data Analyst', 'Lead reporting for a product area'],
          ['Senior Analyst', 'Mentor juniors and define metrics'],
          ['Analytics Lead', 'Run a small analytics team'],
          ['Head of Insights', 'Set analytics strategy for a business unit'],
        ],
        [['Tableau', 'Stakeholder reporting'], ['Experimentation'], ['Metric design'], ['Team leadership'], ['Strategy']]
      ),
      futureTitle: 'Analytics Lead',
      risks: ['Dashboard work is increasingly automated', 'Ceiling without engineering depth'],
      firstStep: 'Publish the Canteen Predictor dashboard publicly and write a one-page case study.',
      upside: 'Fast entry and a clear path into product analytics.',
      downside: 'Plateaus unless you add engineering or domain depth.',
    },
    {
      id: 'u2',
      role: 'Junior Data Engineer',
      kind: 'stretch',
      tagline: 'Build the pipes data runs through',
      fitScore: 64,
      difficulty: 'moderate',
      monthsToFirstRole: 8,
      whyYou: 'Strong Python and SQL. Cloud, Docker and orchestration are the missing pieces.',
      dayInLife: 'Maintain ETL jobs, fix a broken pipeline, and review a teammate\'s SQL.',
      timeline: timeline(
        [
          ['Upskilling and portfolio', 'Docker, cloud basics, one Airflow pipeline'],
          ['Junior Data Engineer', 'Own a small set of pipelines'],
          ['Data Engineer', 'Design a warehouse model'],
          ['Senior Data Engineer', 'Lead platform improvements'],
          ['Staff / Lead Engineer', 'Architect the data platform'],
        ],
        [['Docker', 'AWS basics'], ['Airflow', 'dbt'], ['Data modelling'], ['Spark'], ['Architecture']]
      ),
      futureTitle: 'Senior Data Engineer',
      risks: ['Steep tooling curve', 'Crowded junior market'],
      firstStep: 'Containerise the Canteen Predictor with Docker this week.',
      upside: 'High demand and strong pay growth.',
      downside: 'Slowest ramp of the four paths.',
    },
    {
      id: 'u3',
      role: 'EdTech Product Associate',
      kind: 'wildcard',
      tagline: 'Combine event leadership with data',
      fitScore: 70,
      difficulty: 'moderate',
      monthsToFirstRole: 6,
      whyYou: 'You led 15 people on a real budget and have shown interest in education and data.',
      dayInLife: 'Run an experiment on a learning product and decide with the data what ships next.',
      timeline: timeline(
        [
          ['Associate Product Analyst', 'Analyse learner behaviour for a product team'],
          ['Product Associate', 'Own a feature roadmap slice'],
          ['Product Manager', 'Own a product area'],
          ['Senior Product Manager', 'Lead a product line'],
          ['Group PM, Learning', 'Set direction for a learning product'],
        ],
        [['Experimentation'], ['Roadmapping'], ['Stakeholder management'], ['Product strategy'], ['Leadership']]
      ),
      futureTitle: 'Product Manager',
      risks: ['Competitive entry-level market', 'Less technical depth over time'],
      firstStep: 'Write a short product teardown of a learning app you use.',
      upside: 'Broad leverage across teams and companies.',
      downside: 'Fewer roles are open to freshers.',
    },
    {
      id: 'u4',
      role: 'Backend Developer',
      kind: 'realistic',
      tagline: 'Build the APIs and services behind products',
      fitScore: 59,
      difficulty: 'moderate',
      monthsToFirstRole: 7,
      whyYou: 'You have already built and shipped a Flask API.',
      dayInLife: 'Ship an endpoint, write its tests, and review a pull request.',
      timeline: timeline(
        [
          ['Junior Backend Developer', 'Ship features under guidance'],
          ['Backend Developer', 'Own a service'],
          ['Senior Backend Engineer', 'Design systems'],
          ['Tech Lead', 'Lead a squad'],
          ['Engineering Manager', 'Manage a team'],
        ],
        [['Testing', 'Docker'], ['System design'], ['Scalability'], ['Mentoring'], ['People management']]
      ),
      futureTitle: 'Senior Backend Engineer',
      risks: ['Crowded junior market', 'Needs tests and deployment skills first'],
      firstStep: 'Add pytest tests to the Canteen Predictor API.',
      upside: 'Stable, transferable career.',
      downside: 'Less aligned with your data interests.',
    },
  ],
}


const jdlab = {
  roleTitle: 'Junior Data Engineer',
  company: 'Acme Analytics',
  eligibility: {
    now: 35,
    verdict: 'not_yet',
    summary:
      'Solid Python and SQL foundations, but no cloud, Docker or Airflow experience, which this role lists as core. You are a plausible hire in 3-4 months, not today.',
  },
  requirements: [
    { requirement: '0-2 years of experience', status: 'met', evidence: 'Recent graduate with a project and volunteer leadership.' },
    { requirement: 'Strong Python and SQL', status: 'met', evidence: 'Both listed, used in the Canteen Predictor.' },
    { requirement: 'Build and maintain ETL pipelines', status: 'partial', evidence: 'Processes order history, but no explicit pipeline work.' },
    { requirement: 'Orchestrate with Airflow', status: 'missing', evidence: 'No orchestration experience on the resume.' },
    { requirement: 'Cloud warehouse (BigQuery or Redshift)', status: 'missing', evidence: 'Only SQLite is used.' },
    { requirement: 'Containerise services with Docker', status: 'missing', evidence: 'Docker does not appear anywhere.' },
    { requirement: 'Git and CI familiarity', status: 'partial', evidence: 'Git is listed at beginner level, no CI.' },
    { requirement: 'Good communication', status: 'met', evidence: 'Led 15 volunteers and presented a dashboard to students.' },
  ],
  blockers: [
    { blocker: 'No Docker or deployment experience', skill: 'Docker', severity: 'high', howToClose: 'Containerise your Canteen Predictor and publish the image.', weeks: 3 },
    { blocker: 'No cloud data warehouse exposure', skill: 'BigQuery', severity: 'high', howToClose: 'Load your project data into BigQuery free tier and write three analytical queries.', weeks: 6 },
    { blocker: 'No pipeline orchestration', skill: 'Airflow', severity: 'medium', howToClose: 'Build one scheduled Airflow DAG that refreshes your data daily.', weeks: 4 },
  ],
  milestones: [
    { label: 'Docker for data applications (course and project)', type: 'course', weeks: 3, eligibilityAfter: 50 },
    { label: 'Cloud data warehouse basics (BigQuery)', type: 'course', weeks: 6, eligibilityAfter: 65 },
    { label: 'Build a data pipeline with Airflow', type: 'project', weeks: 4, eligibilityAfter: 75 },
    { label: 'Add CI and tests to the pipeline repository', type: 'project', weeks: 3, eligibilityAfter: 80 },
  ],
  alternativeRoles: [
    { title: 'Junior Data Analyst', fit: 86, why: 'Your SQL, Pandas and certificate match this directly.' },
    { title: 'Analytics Associate', fit: 78, why: 'Combines your data skills with stakeholder communication.' },
    { title: 'Data Operations Associate', fit: 70, why: 'A gateway role that touches pipelines without owning them.' },
  ],
  keywords: {
    present: ['Python', 'SQL', 'Git'],
    missing: ['ETL', 'Airflow', 'BigQuery', 'Docker', 'CI', 'AWS', 'GCP'],
  },
  interviewQuestions: [
    { question: 'Walk me through how your Canteen Predictor handles new data each day.', type: 'technical', whyAsked: 'Probes whether you understand pipelines, not just models.', tip: 'Describe the ingestion, cleaning and refresh steps you really built.' },
    { question: 'How would you schedule and monitor a pipeline that fails at 3 a.m.?', type: 'gap', whyAsked: 'Airflow and monitoring are missing from your resume.', tip: 'Be honest that you are learning Airflow, then describe how you would approach it.' },
    { question: 'What is the difference between a container and a virtual machine?', type: 'gap', whyAsked: 'Checks Docker fundamentals.', tip: 'Give a short, correct answer and mention you are containerising your project.' },
    { question: 'Tell me about a time you led a team under pressure.', type: 'behavioral', whyAsked: 'Tests collaboration and ownership.', tip: 'Use the tech fest: 15 volunteers, a fixed budget and a hard deadline.' },
    { question: 'How would you design the schema for the canteen order data in a warehouse?', type: 'technical', whyAsked: 'Probes data modelling.', tip: 'Talk about a fact table of orders and dimensions for time and item.' },
    { question: 'You have no cloud experience. How will you get productive quickly?', type: 'gap', whyAsked: 'Directly addresses a gap the interviewer will spot.', tip: 'Name the concrete certificate or project you are doing, with dates.' },
    { question: 'Describe a bug you found in your own code and how you fixed it.', type: 'behavioral', whyAsked: 'Shows debugging habits.', tip: 'Pick a real bug from the predictor and explain how you verified the fix.' },
    { question: 'How do you make sure a data pipeline is correct?', type: 'gap', whyAsked: 'You have no testing on your resume.', tip: 'Mention data validation checks and the tests you are adding.' },
  ],
  tailoredSummary:
    'Data-minded computer science graduate with Python, SQL and Pandas experience who built and shipped a forecasting app used by 120 students, and led a 15-person team on an Rs 80,000 event. Currently building Docker and Airflow skills to move into data engineering.',
}

const evaluate = {
  scores: { relevance: 7, structure: 4, specificity: 6, communication: 6 },
  overall: 6,
  verdict: 'Good raw material, but the answer needs a clear structure and a result.',
  strengths: ['Uses a real, relevant example', 'Includes concrete numbers'],
  improvements: ['Use Situation, Action, Result so the answer has a clear arc', 'End with the outcome: what changed because of your leadership?'],
  improvedAnswer:
    'As Events Coordinator for our tech fest I led a 15-person volunteer team with an Rs 80,000 budget. With two weeks to go, sponsorship was behind, so I split the team into logistics and sponsorship, set weekly spending checkpoints, and personally followed up with the last three sponsors. We delivered a 2,000-attendee event on budget, and I now run every project with that same weekly checkpoint rhythm.',
  followUp: 'What would you do differently if two of your volunteers dropped out the week before?',
}

function builder(skill) {
  const s = skill || 'Docker'
  return {
    title: `Containerised Campus Canteen Predictor (${s})`,
    pitch: `Take your existing Canteen Predictor and make it production-ready: packaged, tested and deployed. This proves ${s} on a project that already has real users.`,
    skillsProven: [s, 'Deployment', 'Testing', 'Documentation'],
    techStack: ['Python', 'Flask', 'Docker', 'pytest', 'GitHub Actions', 'Render (free tier)'],
    difficulty: 'intermediate',
    estimatedHours: 30,
    architecture: [
      'Flask API reads order history and serves predictions',
      'A Dockerfile packages the app with pinned dependencies',
      'docker-compose runs the API alongside a database container',
      'pytest covers the prediction logic and the API routes',
      'GitHub Actions runs the tests and builds the image on every push',
    ],
    milestones: [
      { week: 1, title: 'Containerise the app', tasks: ['Write a Dockerfile', 'Pin dependencies', 'Run it locally in a container', 'Add a .dockerignore'], deliverable: 'The API runs with one docker command.' },
      { week: 2, title: 'Add tests and compose', tasks: ['Write pytest tests for prediction logic', 'Add docker-compose with a database', 'Test the API routes'], deliverable: 'A passing test suite and a one-command local stack.' },
      { week: 3, title: 'Automate and deploy', tasks: ['Add a GitHub Actions workflow', 'Deploy to a free host', 'Write the README with a diagram'], deliverable: 'A live URL and a green CI badge.' },
    ],
    evaluationCriteria: ['App starts from a clean machine with one command', 'Test coverage above 70% on core logic', 'CI passes on every push', 'README explains setup in under 5 steps'],
    stretchGoals: ['Add a health-check endpoint and logging', 'Publish the image to a public registry'],
    resumeBullet: 'Containerised and deployed a Flask forecasting API with Docker and GitHub Actions CI ([N]% test coverage), serving [N] daily users.',
    readmeOutline: ['Overview', 'Architecture diagram', 'Quick start', 'Running tests', 'Deployment', 'Roadmap'],
  }
}

function simulator(hours) {
  const h = Math.min(Math.max(hours || 8, 3), 40)
  const rows = [
    ['Set up and plan', ['Rewrite resume bullets with numbers', 'Push the Canteen Predictor to GitHub', 'Pick 5 target roles'], 'A fresh resume and a public repo', 8],
    ['Docker basics', ['Learn containers vs VMs', 'Write a Dockerfile for the predictor', 'Run it locally'], 'The app runs in a container', 14],
    ['Compose and tests', ['Add docker-compose', 'Write pytest tests', 'Measure coverage'], 'A passing test suite', 20],
    ['CI with GitHub Actions', ['Create a build workflow', 'Run tests in CI', 'Add a status badge'], 'A green pipeline', 26],
    ['Cloud fundamentals I', ['Study core cloud concepts', 'First course module', 'Make a cheat sheet'], 'Notes and one module done', 32],
    ['Cloud fundamentals II', ['Finish the course', 'Deploy the container to a free tier', 'Capture the URL'], 'A live deployment', 40],
    ['BigQuery basics', ['Load the canteen data', 'Write 3 analytical queries', 'Chart one insight'], 'A queryable dataset', 46],
    ['Airflow pipeline I', ['Install Airflow locally', 'Write a first DAG', 'Schedule a daily load'], 'A scheduled DAG', 54],
    ['Airflow pipeline II', ['Add error handling', 'Add a data quality check', 'Document the pipeline'], 'A documented pipeline', 60],
    ['Interview stories', ['Write 4 STAR stories', 'Use the tech-fest leadership example', 'Practise out loud'], 'Four ready stories', 66],
    ['Technical interview prep', ['Review SQL and Python', 'Two mock interviews', 'Fix weak spots'], 'Two mock interviews done', 72],
    ['Start applying', ['Apply to 8 tailored roles', 'Message 3 alumni', 'Track applications'], '8 tailored applications sent', 78],
    ['Review and next 90 days', ['Review what worked', 'Set the next goals', 'Celebrate'], 'A written next plan', 82],
  ]
  return {
    summary: `At ${h} hours a week, you finish with a containerised, tested, cloud-deployed data project and a pipeline you can explain in an interview.`,
    hoursPerWeek: h,
    weeks: rows.map((r, i) => ({ week: i + 1, theme: r[0], goals: r[1], deliverable: r[2], hours: Math.min(h, i < 2 ? Math.max(3, Math.round(h * 0.6)) : h), checkpoint: 'You can explain what you built to a friend.', readiness: r[3] })),
    risks: [
      { risk: 'Exams or deadlines eat your study time.', mitigation: 'Drop to a 3-hour minimum week and resume the following week.' },
      { risk: 'You keep polishing instead of applying.', mitigation: 'Start applying in week 12 regardless of polish.' },
    ],
  }
}

const tldr = {
  "tone": "steady",
  "average": 64,
  "opener": "You have a solid base: Python, SQL and a project real people use. Now let us turn it into your first offer.",
  "missing": [
    {
      "point": "No cloud or deployment experience",
      "section": "gaps"
    },
    {
      "point": "No automated tests on your project",
      "section": "gaps"
    }
  ],
  "improve": [
    {
      "point": "Add numbers to your resume bullets",
      "section": "intelligence"
    },
    {
      "point": "Publish the project on GitHub with a clear README",
      "section": "roadmap"
    }
  ],
  "next": [
    {
      "point": "Put the Canteen Predictor in a Docker container",
      "section": "plan"
    },
    {
      "point": "Test one real job description in JD Lab",
      "section": "jdlab"
    }
  ],
  "pursue": [
    {
      "point": "Junior Data Analyst, your strongest match",
      "section": "roles"
    },
    {
      "point": "Junior Data Engineer, once Docker and cloud are in",
      "section": "skillmap"
    }
  ]
}

export const GRADUATE = {
  id: 'graduate',
  label: 'Recent graduate',
  description: 'Fresher with a data project',
  profile,
  analysis,
  matches,
  comeback: null,
  modules: { tldr, dna, multiverse, jdlab, evaluate },
  builder,
  simulator,
}

export const DEMOS = { returner: RETURNER, graduate: GRADUATE }
