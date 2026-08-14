'use strict';

function buildResumeAnalysisPrompt(resumeText) {
  return `You are an expert resume parser and career analyst. Analyze the following resume text and extract all relevant information into a structured JSON object.

Resume Text:
---
${resumeText}
---

Return a JSON object with EXACTLY this structure (fill all fields as accurately as possible from the resume, use null for missing fields):
{
  "name": "Full name of the candidate",
  "email": "Email address or null",
  "phone": "Phone number or null",
  "degree": "Highest degree obtained (e.g. B.Tech, M.S., PhD) or null",
  "institution": "University or college name or null",
  "graduationYear": 2024,
  "experienceLevel": "fresher|junior|mid|senior",
  "summary": "A concise 2-3 sentence professional summary of the candidate based on their resume",
  "skills": [
    {
      "name": "Skill name",
      "category": "programming|cloud|ai|design|management|security|data",
      "level": "beginner|intermediate|advanced"
    }
  ],
  "projects": [
    {
      "title": "Project title",
      "technologies": ["tech1", "tech2"],
      "domain": "Domain of the project (e.g. web, mobile, ML, data)",
      "impact": "Brief impact or outcome of the project",
      "description": "Detailed description of what the project does"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "duration": "Duration (e.g. Jun 2022 - Dec 2023)",
      "description": "Key responsibilities and achievements"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": 2023
    }
  ],
  "interests": ["interest1", "interest2"],
  "preferredDomains": ["domain1", "domain2"]
}

Rules:
- experienceLevel: "fresher" = 0 years, "junior" = 1-2 years, "mid" = 3-5 years, "senior" = 5+ years
- Infer skill levels from context (e.g. "expert in Python" = advanced, "familiar with" = beginner)
- Extract ALL skills mentioned, including soft skills as management category
- preferredDomains should reflect what areas the candidate seems most passionate about based on projects and experience
- Return ONLY the JSON object, no additional text`;
}

function buildIntentAnalysisPrompt(query) {
  return `You are an intelligent opportunity search assistant. Analyze the following user query and extract search intent parameters.

User Query: "${query}"

Analyze the query and return a JSON object with EXACTLY this structure:
{
  "intent": "search|recommend|career_advice|specific_opportunity",
  "categories": [],
  "keywords": [],
  "location": null,
  "remote": null,
  "level": null,
  "domains": [],
  "searchQuery": "refined search query"
}

Field definitions:
- intent: 
  * "search" = user wants to find specific opportunities
  * "recommend" = user wants personalized recommendations
  * "career_advice" = user wants guidance on career path
  * "specific_opportunity" = user is looking for a particular known opportunity

- categories: array of relevant categories from this list ONLY:
  ["job", "internship", "hackathon", "fellowship", "scholarship", "conference", "research", "open_source", "startup_program", "community", "speaker"]
  Include ALL that are relevant. If the query is general, include multiple.

- keywords: array of relevant search keywords extracted from the query (tech skills, company names, domains, etc.)
- location: specific location string if mentioned (city or country), null if not specified
- remote: true if user explicitly wants remote opportunities, false if explicitly wants in-person, null if not specified
- level: "beginner|intermediate|advanced" based on the user's implied experience level, null if not specified
- domains: array of technical or professional domains mentioned
- searchQuery: a refined, concise search query suitable for full-text database search (3-8 words)

Return ONLY the JSON object, no additional text.`;
}

function buildMatchScoringPrompt(profile, opportunity) {
  return `You are an expert career counselor and opportunity matching specialist. Score how well this opportunity matches the candidate's profile.

CANDIDATE PROFILE:
Name: ${profile.name || 'Unknown'}
Experience Level: ${profile.experienceLevel || 'Unknown'}
Skills: ${Array.isArray(profile.skills) ? profile.skills.map((s) => `${s.name} (${s.level || 'intermediate'})`).join(', ') : profile.skills || 'Not specified'}
Domains: ${Array.isArray(profile.domains) ? profile.domains.join(', ') : profile.domains || 'Not specified'}
Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests || 'Not specified'}

OPPORTUNITY:
Title: ${opportunity.title || 'Unknown'}
Organization: ${opportunity.organization || 'Unknown'}
Category: ${Array.isArray(opportunity.category) ? opportunity.category.join(', ') : opportunity.category || 'Unknown'}
Eligibility: ${opportunity.eligibility || 'Open to all'}
Required Skills: ${Array.isArray(opportunity.tags) ? opportunity.tags.join(', ') : opportunity.tags || 'Not specified'}
Summary: ${opportunity.summary || 'No summary available'}

Score this match and return a JSON object with EXACTLY this structure:
{
  "matchScore": 75,
  "skillMatch": 80,
  "experienceMatch": 70,
  "domainMatch": 85,
  "interestMatch": 60,
  "whyItMatches": "2-3 sentence explanation of why this opportunity is a good fit",
  "priority": "high|medium|low",
  "suggestedActions": ["action1", "action2", "action3"]
}

Scoring rules:
- matchScore: overall fit score (0-100), weighted average of the four sub-scores
- skillMatch: how well candidate's skills match the opportunity requirements (0-100)
- experienceMatch: how well candidate's experience level matches (0-100)
- domainMatch: how well the opportunity domain aligns with candidate's background (0-100)
- interestMatch: how well the opportunity aligns with candidate's stated interests (0-100)
- priority: "high" if matchScore >= 70, "medium" if 40-69, "low" if < 40
- suggestedActions: 2-4 specific, actionable steps the candidate should take to apply or prepare

Return ONLY the JSON object, no additional text.`;
}

function buildCareerStrategyPrompt(profile, opportunities) {
  const opportunitySummaries = opportunities
    .slice(0, 5)
    .map(
      (opp, idx) =>
        `${idx + 1}. ${opp.title} at ${opp.organization} (Match: ${opp.matchScore || 'N/A'}%, Category: ${Array.isArray(opp.category) ? opp.category[0] : opp.category || 'Unknown'})`
    )
    .join('\n');

  const skillsList = Array.isArray(profile.skills)
    ? profile.skills
        .slice(0, 15)
        .map((s) => `${s.name} (${s.level || 'intermediate'})`)
        .join(', ')
    : profile.skills || 'Not specified';

  return `You are a senior career strategist and mentor. Generate a comprehensive, personalized career strategy for this candidate based on their profile and the opportunities they've been matched with.

CANDIDATE PROFILE:
Name: ${profile.name || 'Candidate'}
Experience Level: ${profile.experienceLevel || 'fresher'}
Degree: ${profile.degree || 'Not specified'} from ${profile.institution || 'Not specified'}
Summary: ${profile.summary || 'No summary provided'}
Skills: ${skillsList}
Preferred Domains: ${Array.isArray(profile.preferredDomains) ? profile.preferredDomains.join(', ') : profile.preferredDomains || 'Not specified'}
Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests || 'Not specified'}

TOP MATCHED OPPORTUNITIES:
${opportunitySummaries || 'No opportunities matched yet'}

Generate a strategic career roadmap and return a JSON object with EXACTLY this structure:
{
  "currentLevel": "Brief assessment of candidate's current standing (1-2 sentences)",
  "suggestedPath": [
    {
      "step": "Specific actionable step",
      "reason": "Why this step is important",
      "timeframe": "e.g. Next 2 weeks, Next 3 months"
    }
  ],
  "missingSkills": ["skill1", "skill2"],
  "suggestedResources": ["Resource or course recommendation 1", "Resource 2"],
  "nextSteps": ["Immediate action 1", "Immediate action 2", "Immediate action 3"],
  "overallMessage": "Encouraging, personalized 2-3 sentence message summarizing the strategy and motivating the candidate"
}

Guidelines:
- suggestedPath should have 4-6 steps in chronological order
- missingSkills should be skills that would significantly boost their profile for the matched opportunities
- suggestedResources should include specific courses, platforms, or communities
- nextSteps should be 3-5 things they can do THIS WEEK
- overallMessage should be warm, specific, and encouraging

Return ONLY the JSON object, no additional text.`;
}

function buildCareerAnalysisPrompt(profile) {
  const skillsList = Array.isArray(profile.skills)
    ? profile.skills.map((s) => `${s.name} (${s.category || 'general'}, ${s.level || 'intermediate'})`).join(', ')
    : 'Not specified';

  const projectsList = Array.isArray(profile.projects)
    ? profile.projects
        .map(
          (p) =>
            `- ${p.title}: ${p.description || p.impact || ''} [Technologies: ${Array.isArray(p.technologies) ? p.technologies.join(', ') : 'N/A'}]`
        )
        .join('\n')
    : 'None';

  const experienceList = Array.isArray(profile.experience)
    ? profile.experience
        .map((e) => `- ${e.role} at ${e.company} (${e.duration || 'N/A'}): ${e.description || ''}`)
        .join('\n')
    : 'None';

  const certsList = Array.isArray(profile.certifications)
    ? profile.certifications.map((c) => `${c.name} by ${c.issuer || 'N/A'} (${c.year || 'N/A'})`).join(', ')
    : 'None';

  return `You are a world-class career intelligence engine. Analyze this candidate profile comprehensively and return a precise JSON career assessment.

CANDIDATE PROFILE:
Name: ${profile.name || 'Candidate'}
Experience Level: ${profile.experienceLevel || profile.experience_level || 'fresher'}
Degree: ${profile.degree || 'Not specified'} from ${profile.institution || 'Not specified'} (${profile.graduationYear || 'N/A'})
Summary: ${profile.summary || 'Not provided'}

SKILLS (${Array.isArray(profile.skills) ? profile.skills.length : 0} total):
${skillsList}

PROJECTS:
${projectsList}

WORK EXPERIENCE:
${experienceList}

CERTIFICATIONS:
${certsList}

INTERESTS: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.interests || 'Not specified'}
PREFERRED DOMAINS: ${Array.isArray(profile.preferredDomains) ? profile.preferredDomains.join(', ') : profile.preferredDomains || 'Not specified'}

Perform a comprehensive career intelligence analysis and return a JSON object with EXACTLY this structure:
{
  "resumeScore": 78,
  "employabilityScore": 72,
  "careerReadinessScore": 68,
  "domainFit": "AI/ML Engineering",
  "strengths": ["Python", "Machine Learning", "Data Analysis"],
  "improvementAreas": ["System Design", "Cloud Infrastructure", "DevOps"],
  "recommendedRoles": [
    {"role": "AI Engineer", "matchPercent": 87, "reason": "Strong Python + ML projects align perfectly"},
    {"role": "Backend Engineer", "matchPercent": 72, "reason": "REST APIs and database experience"},
    {"role": "Data Scientist", "matchPercent": 68, "reason": "Data analysis skills and statistics background"}
  ],
  "skillGaps": [
    {"skill": "Docker", "priority": "high", "learning": "Complete Docker Mastery course on Udemy"},
    {"skill": "AWS", "priority": "high", "learning": "AWS Cloud Practitioner certification on AWS Training"},
    {"skill": "Kubernetes", "priority": "medium", "learning": "Kubernetes for Beginners on KodeKloud"}
  ],
  "plan30Days": [
    "Complete 2 LeetCode problems daily for DSA practice",
    "Deploy a Docker container project on GitHub",
    "Start AWS Cloud Practitioner course"
  ],
  "plan90Days": [
    "Obtain AWS Cloud Practitioner certification",
    "Build and deploy a full-stack ML project",
    "Apply to 10 AI Engineer internships"
  ],
  "plan180Days": [
    "Land first AI/ML internship or junior role",
    "Contribute to 2 open source ML projects",
    "Start building personal ML portfolio website"
  ],
  "aiNarrative": "You are a strong candidate for AI/ML engineering roles with solid Python fundamentals and hands-on ML project experience. Your main gap is cloud infrastructure — bridging this with AWS certification will significantly boost your employability. Focus on deploying real projects and your career trajectory looks excellent."
}

SCORING RULES:
- resumeScore (0-100): Quality of the resume itself — clarity, completeness, quantified impact
- employabilityScore (0-100): How ready they are for jobs RIGHT NOW based on current skills + experience
- careerReadinessScore (0-100): How prepared they are specifically for their target domain/field
- domainFit: The single best-fit career domain/field for this candidate
- strengths: 3-5 most impressive things about this candidate
- improvementAreas: 3-5 areas they most need to develop
- recommendedRoles: Recommend EXACTLY 3-5 roles with REALISTIC match percentages
- skillGaps: Identify 3-6 most impactful gaps with SPECIFIC learning resources
- plan30Days/plan90Days/plan180Days: CONCRETE, specific action items
- aiNarrative: 3-4 sentences, warm but honest. Address the candidate directly as "you".

Return ONLY the JSON object, no additional text.`;
}

function buildOpportunityMatchPrompt(profileSummary, opportunities) {
  const skillNames = Array.isArray(profileSummary.skills)
    ? profileSummary.skills.map((s) => s.name || s).join(', ')
    : profileSummary.skills || 'Not specified';

  const opportunityList = opportunities
    .map(
      (opp, idx) => `[${idx + 1}] ID: ${opp.id}
  Title: ${opp.title || 'Unknown'}
  Organization: ${opp.organization || 'Unknown'}
  Category: ${Array.isArray(opp.category) ? opp.category.join(', ') : opp.category || 'Unknown'}
  Location: ${opp.city ? `${opp.city}, ` : ''}${opp.country || 'Unknown'}
  Tags/Skills: ${Array.isArray(opp.tags) ? opp.tags.join(', ') : opp.tags || 'Not specified'}
  Eligibility: ${opp.eligibility || 'Open to all'}
  Summary: ${opp.summary || 'No summary available'}`
    )
    .join('\n\n');

  return `You are an expert opportunity-candidate matching engine. Score how well each opportunity matches this candidate.

CANDIDATE:
Name: ${profileSummary.name || 'Candidate'}
Experience Level: ${profileSummary.experienceLevel || profileSummary.experience_level || 'fresher'}
Skills: ${skillNames}
Domain Fit: ${profileSummary.domainFit || profileSummary.preferredDomains?.join?.(', ') || 'General'}
Summary: ${profileSummary.summary || 'Not provided'}

OPPORTUNITIES TO MATCH (${opportunities.length} total):
${opportunityList}

For EVERY opportunity listed above, calculate a match score and return a JSON object with EXACTLY this structure:
{
  "matches": [
    {
      "opportunityId": "exact-uuid-from-id-field",
      "matchScore": 85,
      "matchExplanation": "Your Python + ML skills directly match the required tech stack",
      "skillGap": ["Docker", "Kubernetes"]
    }
  ]
}

RULES:
- Include ALL ${opportunities.length} opportunities in the matches array — do not skip any
- opportunityId must be the EXACT id string from each opportunity entry
- matchScore 0-100: realistic fit between candidate and opportunity
- matchExplanation: 1-2 sentences referencing specific skills or experience of the candidate that match
- skillGap: array of specific skills the candidate lacks for this opportunity (empty array [] if none)
- Be realistic — fresher candidates rarely score above 85 on senior roles

Return ONLY the JSON object, no additional text.`;
}

function buildOpportunityGenerationPrompt(profile) {
  const skills = Array.isArray(profile.skills)
    ? profile.skills.slice(0, 15).map((s) => s.name || s).join(', ')
    : 'Not specified';

  const domains = Array.isArray(profile.preferredDomains)
    ? profile.preferredDomains.join(', ')
    : 'General technology';

  const level = profile.experienceLevel || profile.experience_level || 'fresher';

  const projects = Array.isArray(profile.projects)
    ? profile.projects.slice(0, 3).map((p) => p.title).join(', ')
    : 'None';

  return `You are an expert career opportunity researcher. Based on the candidate profile below, generate a curated list of REAL, CURRENTLY ACTIVE opportunities they should apply to.

CANDIDATE PROFILE:
Name: ${profile.name || 'Candidate'}
Experience Level: ${level}
Skills: ${skills}
Domains: ${domains}
Projects: ${projects}
Degree: ${profile.degree || 'Not specified'}
Institution: ${profile.institution || 'Not specified'}

Generate EXACTLY 15 opportunities across these categories:
- 3 Jobs (full-time positions)
- 3 Internships
- 3 Hackathons (real active hackathons from Devpost, MLH, Unstop, Hack2Skill)
- 3 Open Source Programs (GSoC, MLH Fellowship, Outreachy, LFX Mentorship, etc.)
- 2 Fellowships (Google Summer of Code, GHC, etc.) OR Research opportunities
- 1 Conference (IEEE, NeurIPS, ICML, etc.)

Return a JSON object with EXACTLY this structure:
{
  "opportunities": [
    {
      "id": "gen-001",
      "title": "Exact job/opportunity title",
      "organization": "Company or organization name",
      "category": ["job"],
      "country": "Country name",
      "city": "City or Remote",
      "remote": true,
      "deadline": "2025-08-31",
      "eligibility": "Who can apply (students, freshers, etc.)",
      "tags": ["python", "machine learning", "aws"],
      "summary": "2-3 sentence description of this opportunity and why it's relevant to this candidate",
      "application_url": "https://actual-apply-url.com",
      "matchScore": 85,
      "matchExplanation": "Your Python and ML skills directly match what they're looking for",
      "skillGap": ["Docker"],
      "stipend": "Paid / $X per month / Unpaid",
      "priority": "high"
    }
  ]
}

CRITICAL RULES:
- Use REAL company names, real programs, real URLs (no fake companies)
- category must be ONE of: ["job"], ["internship"], ["hackathon"], ["open_source"], ["fellowship"], ["conference"], ["research"]
- matchScore should be 55-95 based on how well the candidate's skills match
- matchExplanation must reference THIS candidate's specific skills
- application_url must be a real, working URL (e.g., careers.google.com, devpost.com, summerofcode.withgoogle.com)
- deadline should be in YYYY-MM-DD format, set to a future date within the next 6 months
- For hackathons: use Devpost (devpost.com), MLH (mlh.io), Unstop (unstop.com)
- For open source: use GSoC (summerofcode.withgoogle.com), MLH Fellowship (fellowship.mlh.io), Outreachy (outreachy.org)
- For jobs: use real companies hiring in the candidate's domain
- For internships: use real companies known for internship programs
- tags should be skills required for this opportunity

Return ONLY the JSON object, no additional text.`;
}

module.exports = {
  buildResumeAnalysisPrompt,
  buildIntentAnalysisPrompt,
  buildMatchScoringPrompt,
  buildCareerStrategyPrompt,
  buildCareerAnalysisPrompt,
  buildOpportunityMatchPrompt,
  buildOpportunityGenerationPrompt,
};
