// Original, hand-curated skill graph for the Skill Map. Written for this project (not copied from any other site).
// `hours` are rough beginner-to-job-ready estimates, shown to users as approximate.
//
// Node:  [id, label, domain, level, hours, prerequisiteIds, aliases]
//   level 0 = foundations ... 4 = advanced; roles sit at level 5.
// Role:  { id, label, aliases, requires: [ [skillIdOrAnyOf, weight 1-3, label?] ] }
//   An `anyOf` requirement is satisfied by any one option (e.g. "a backend language").

export const DOMAINS = {
  core: { label: 'Foundations', color: '#7C97A0' },
  web: { label: 'Web', color: '#2FA3A8' },
  backend: { label: 'Backend', color: '#8FA832' },
  data: { label: 'Data', color: '#22A06B' },
  ml: { label: 'AI / ML', color: '#D9669A' },
  devops: { label: 'Cloud & DevOps', color: '#E0A526' },
  quality: { label: 'Quality', color: '#D9772B' },
}

const SKILLS = [
  // Foundations
  ['programming-basics', 'Programming Basics', 'core', 0, 30, [], ['programming', 'coding', 'computer science']],
  ['git', 'Git & GitHub', 'core', 0, 12, [], ['git', 'github', 'gitlab', 'version control']],
  ['cli', 'Command Line', 'core', 0, 8, [], ['bash', 'shell', 'linux', 'terminal', 'unix', 'command line']],
  ['agile', 'Agile & Collaboration', 'core', 1, 6, [], ['agile', 'scrum', 'jira', 'kanban']],
  ['communication', 'Technical Communication', 'core', 1, 10, [], ['communication', 'documentation', 'technical writing', 'presentation']],
  ['dsa', 'Data Structures & Algorithms', 'core', 1, 60, ['programming-basics'], ['data structures', 'algorithms', 'dsa', 'leetcode']],
  ['oop', 'Object-Oriented Design', 'core', 1, 20, ['programming-basics'], ['oop', 'object oriented', 'object-oriented', 'design patterns']],
  ['networking-basics', 'HTTP & Networking Basics', 'core', 1, 10, ['programming-basics'], ['http', 'networking', 'tcp/ip', 'dns']],
  ['mentoring-lead', 'Mentoring & Leadership', 'core', 3, 20, ['communication'], ['mentoring', 'leadership', 'team leadership', 'team lead', 'coaching', 'teaching', 'tutoring']],

  // Languages
  ['python', 'Python', 'backend', 1, 40, ['programming-basics'], ['python']],
  ['java', 'Java', 'backend', 1, 50, ['programming-basics', 'oop'], ['java']],
  ['javascript', 'JavaScript', 'web', 1, 40, ['programming-basics'], ['javascript', 'js', 'es6', 'ecmascript']],
  ['typescript', 'TypeScript', 'web', 2, 15, ['javascript'], ['typescript', 'ts']],
  ['sql', 'SQL', 'data', 1, 25, [], ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle', 'sql server', 'relational database']],

  // Web
  ['html-css', 'HTML & CSS', 'web', 0, 25, [], ['html', 'css', 'html5', 'css3', 'sass', 'tailwind', 'bootstrap']],
  ['react', 'React', 'web', 2, 40, ['javascript', 'html-css'], ['react', 'reactjs', 'react.js', 'next.js', 'nextjs', 'redux']],
  ['frontend-build', 'Build Tools & Package Managers', 'web', 2, 8, ['javascript'], ['npm', 'yarn', 'webpack', 'vite', 'babel']],
  ['web-a11y', 'Accessibility & Responsive Design', 'web', 2, 12, ['html-css'], ['accessibility', 'a11y', 'responsive design', 'wcag']],

  // Backend
  ['rest-api', 'REST API Design', 'backend', 2, 15, ['networking-basics', 'programming-basics'], ['rest', 'rest api', 'restful', 'api', 'apis', 'web services', 'graphql']],
  ['python-web', 'Python Web Framework', 'backend', 2, 20, ['python', 'rest-api'], ['flask', 'django', 'fastapi']],
  ['spring', 'Spring Boot', 'backend', 2, 40, ['java', 'rest-api'], ['spring', 'spring boot', 'hibernate', 'jpa']],
  ['node-express', 'Node.js & Express', 'backend', 2, 25, ['javascript', 'rest-api'], ['node', 'node.js', 'nodejs', 'express', 'nestjs']],
  ['databases-design', 'Database Design & Indexing', 'data', 2, 20, ['sql'], ['database design', 'normalization', 'indexing', 'schema design', 'dbms']],
  ['nosql', 'NoSQL (MongoDB, Redis)', 'data', 2, 15, ['sql'], ['mongodb', 'redis', 'nosql', 'dynamodb', 'cassandra', 'firebase']],
  ['auth', 'Authentication & Security Basics', 'backend', 2, 12, ['rest-api'], ['jwt', 'oauth', 'authentication', 'authorization', 'owasp']],
  ['caching-queues', 'Caching & Message Queues', 'backend', 3, 15, ['nosql', 'rest-api'], ['kafka', 'rabbitmq', 'caching', 'message queue', 'sqs']],
  ['system-design', 'System Design', 'backend', 4, 40, ['caching-queues', 'databases-design', 'rest-api'], ['system design', 'scalability', 'distributed systems', 'architecture']],
  ['microservices', 'Microservices', 'backend', 4, 25, ['rest-api', 'docker'], ['microservices', 'service oriented']],

  // Cloud & DevOps
  ['docker', 'Docker', 'devops', 2, 12, ['cli', 'networking-basics'], ['docker', 'containers', 'containerization', 'containerisation', 'docker compose']],
  ['cicd', 'CI/CD Pipelines', 'devops', 3, 12, ['git', 'testing-basics'], ['ci/cd', 'cicd', 'github actions', 'jenkins', 'gitlab ci', 'circleci', 'continuous integration']],
  ['cloud-basics', 'Cloud Fundamentals', 'devops', 3, 25, ['docker', 'networking-basics'], ['aws', 'gcp', 'azure', 'google cloud', 'cloud', 'ec2', 's3']],
  ['iac', 'Infrastructure as Code', 'devops', 4, 15, ['cloud-basics', 'cli'], ['terraform', 'cloudformation', 'ansible', 'infrastructure as code', 'pulumi']],
  ['k8s', 'Kubernetes', 'devops', 4, 30, ['docker', 'cloud-basics'], ['kubernetes', 'k8s', 'helm', 'eks', 'gke']],
  ['observability', 'Monitoring & Logging', 'devops', 4, 10, ['cloud-basics'], ['prometheus', 'grafana', 'logging', 'monitoring', 'elk', 'datadog']],

  // Data
  ['excel', 'Spreadsheets', 'data', 0, 10, [], ['excel', 'spreadsheets', 'google sheets', 'vlookup', 'pivot tables']],
  ['stats', 'Statistics Fundamentals', 'data', 1, 25, [], ['statistics', 'probability', 'hypothesis testing', 'a/b testing']],
  ['pandas', 'Pandas & NumPy', 'data', 2, 25, ['python'], ['pandas', 'numpy', 'data analysis', 'data wrangling', 'data cleaning']],
  ['data-viz', 'Data Visualisation', 'data', 2, 20, ['excel'], ['tableau', 'power bi', 'powerbi', 'matplotlib', 'data visualization', 'data visualisation', 'looker', 'dashboards']],
  ['etl', 'ETL & Data Pipelines', 'data', 3, 20, ['sql', 'python'], ['etl', 'elt', 'data pipeline', 'data pipelines', 'data ingestion']],
  ['airflow', 'Workflow Orchestration', 'data', 3, 20, ['etl', 'docker'], ['airflow', 'dagster', 'prefect', 'luigi']],
  ['warehouse', 'Data Warehousing', 'data', 3, 20, ['sql', 'cloud-basics'], ['bigquery', 'redshift', 'snowflake', 'data warehouse', 'data warehousing', 'synapse']],
  ['data-modelling', 'Data Modelling', 'data', 3, 15, ['databases-design', 'warehouse'], ['data modelling', 'data modeling', 'star schema', 'dimensional modelling']],
  ['dbt', 'dbt & Analytics Engineering', 'data', 3, 15, ['sql', 'warehouse'], ['dbt', 'analytics engineering']],
  ['spark', 'Spark & Big Data', 'data', 4, 30, ['python', 'warehouse'], ['spark', 'pyspark', 'hadoop', 'big data', 'databricks']],

  // AI / ML
  ['ml-basics', 'Machine Learning Fundamentals', 'ml', 3, 50, ['pandas', 'stats'], ['machine learning', 'scikit-learn', 'sklearn', 'ml', 'regression', 'classification']],
  ['deep-learning', 'Deep Learning', 'ml', 4, 50, ['ml-basics'], ['deep learning', 'pytorch', 'tensorflow', 'keras', 'neural networks', 'cnn']],
  ['nlp-llm', 'NLP & LLM Applications', 'ml', 4, 30, ['ml-basics', 'python'], ['nlp', 'llm', 'langchain', 'transformers', 'prompt engineering', 'generative ai']],
  ['mlops', 'MLOps & Model Deployment', 'ml', 4, 25, ['ml-basics', 'docker', 'cicd'], ['mlops', 'model deployment', 'mlflow', 'model serving']],

  // Quality
  ['testing-basics', 'Software Testing Basics', 'quality', 1, 12, ['programming-basics'], ['testing', 'unit testing', 'tdd', 'junit', 'pytest', 'test cases']],
  ['manual-qa', 'Test Design & Bug Reporting', 'quality', 1, 12, ['testing-basics'], ['manual testing', 'test design', 'bug reporting', 'qa', 'test plans']],
  ['test-automation', 'Test Automation', 'quality', 2, 25, ['testing-basics', 'programming-basics'], ['selenium', 'playwright', 'cypress', 'test automation', 'webdriver', 'appium']],
  ['api-testing', 'API Testing', 'quality', 2, 10, ['rest-api', 'testing-basics'], ['postman', 'rest assured', 'api testing', 'soapui']],
  ['perf-testing', 'Performance Testing', 'quality', 3, 12, ['api-testing'], ['jmeter', 'k6', 'load testing', 'performance testing', 'locust']],
]

export const ROLES = [
  {
    id: 'frontend-dev', label: 'Frontend Developer', domain: 'web',
    aliases: ['frontend', 'front-end', 'front end', 'ui developer', 'web developer', 'react developer'],
    requires: [['html-css', 3], ['javascript', 3], ['react', 3], ['git', 2], ['typescript', 2], ['web-a11y', 2], ['frontend-build', 1], ['testing-basics', 1]],
  },
  {
    id: 'backend-dev', label: 'Backend Developer', domain: 'backend',
    aliases: ['backend', 'back-end', 'back end', 'software engineer', 'software developer', 'sde', 'java developer', 'python developer', 'api developer', 'associate software'],
    requires: [[{ anyOf: ['python-web', 'spring', 'node-express'] }, 3, 'A backend framework'], ['rest-api', 3], ['sql', 3], ['git', 2], ['databases-design', 2], ['auth', 2], ['docker', 2], ['testing-basics', 2], ['cicd', 1], ['cloud-basics', 1]],
  },
  {
    id: 'fullstack-dev', label: 'Full-Stack Developer', domain: 'web',
    aliases: ['full stack', 'full-stack', 'fullstack', 'mern'],
    requires: [['html-css', 2], ['javascript', 3], ['react', 3], [{ anyOf: ['node-express', 'python-web', 'spring'] }, 2, 'A backend framework'], ['rest-api', 2], ['sql', 2], ['git', 2], ['docker', 1]],
  },
  {
    id: 'data-analyst', label: 'Data Analyst', domain: 'data',
    aliases: ['data analyst', 'business analyst', 'analytics', 'bi analyst', 'reporting analyst', 'insights analyst'],
    requires: [['sql', 3], ['excel', 2], ['stats', 2], ['data-viz', 3], ['pandas', 2], ['communication', 2], ['python', 1]],
  },
  {
    id: 'data-engineer', label: 'Data Engineer', domain: 'data',
    aliases: ['data engineer', 'etl developer', 'analytics engineer', 'big data'],
    requires: [['sql', 3], ['python', 3], ['etl', 3], ['warehouse', 2], ['airflow', 2], ['docker', 2], ['cloud-basics', 2], ['git', 2], ['data-modelling', 2], ['spark', 1], ['cicd', 1]],
  },
  {
    id: 'ml-engineer', label: 'ML / AI Engineer', domain: 'ml',
    aliases: ['machine learning', 'ml engineer', 'ai engineer', 'data scientist', 'deep learning', 'nlp engineer'],
    requires: [['python', 3], ['pandas', 3], ['stats', 2], ['ml-basics', 3], ['deep-learning', 2], ['mlops', 2], ['docker', 1], ['git', 1], ['sql', 1]],
  },
  {
    id: 'devops-engineer', label: 'DevOps / Cloud Engineer', domain: 'devops',
    aliases: ['devops', 'sre', 'site reliability', 'cloud engineer', 'platform engineer', 'infrastructure'],
    requires: [['cli', 3], ['git', 2], ['docker', 3], ['cicd', 3], ['cloud-basics', 3], ['iac', 2], ['k8s', 2], ['networking-basics', 2], ['observability', 1], ['python', 1]],
  },
  {
    id: 'qa-engineer', label: 'QA Automation Engineer', domain: 'quality',
    aliases: ['qa', 'quality assurance', 'sdet', 'test engineer', 'automation tester', 'test automation'],
    requires: [['testing-basics', 3], ['manual-qa', 2], ['test-automation', 3], ['api-testing', 2], ['programming-basics', 2], ['git', 1], ['cicd', 1], ['sql', 1]],
  },
  {
    id: 'tech-instructor', label: 'Technical Instructor', domain: 'core',
    aliases: ['instructor', 'trainer', 'teacher', 'tutor', 'educator', 'curriculum', 'teaching', 'developer advocate', 'mentor'],
    requires: [['communication', 3], ['mentoring-lead', 2], ['programming-basics', 2], [{ anyOf: ['python', 'javascript', 'java'] }, 2, 'A language you can teach'], ['git', 1], ['agile', 1]],
  },
]

// Column of each node = 1 + the deepest prerequisite, computed so every link always points left to right.
const skillRows = SKILLS.map(([id, label, domain, level, hours, prereqs, aliases]) => ({ id, label, domain, level, hours, prereqs, aliases, type: 'skill' }))
const byId = Object.fromEntries(skillRows.map((n) => [n.id, n]))
const depthOf = (id, seen = new Set()) => {
  const n = byId[id]
  if (n.depth !== undefined) return n.depth
  if (seen.has(id)) throw new Error('cycle at ' + id)
  seen.add(id)
  n.depth = n.prereqs.length ? 1 + Math.max(...n.prereqs.map((p) => depthOf(p, seen))) : 0
  return n.depth
}
skillRows.forEach((n) => depthOf(n.id))
const roleDepth = Math.max(...skillRows.map((n) => n.depth)) + 1

export const NODES = [
  ...skillRows,
  ...ROLES.map((r) => ({ id: r.id, label: r.label, domain: r.domain, level: 5, depth: roleDepth, hours: 0, prereqs: [], aliases: r.aliases, type: 'role' })),
]
