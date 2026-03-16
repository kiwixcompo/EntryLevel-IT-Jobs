import { NextResponse } from 'next/server';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

const COUNTRY_MAP: Record<string, { adzuna: string, jobicy: string, arbeitnow: string }> = {
  'United Kingdom': { adzuna: 'gb', jobicy: 'uk', arbeitnow: 'uk' },
  'Germany': { adzuna: 'de', jobicy: 'germany', arbeitnow: 'germany' },
  'Ireland': { adzuna: 'ie', jobicy: 'ireland', arbeitnow: 'ireland' },
  'Australia': { adzuna: 'au', jobicy: 'australia', arbeitnow: 'australia' },
  'New Zealand': { adzuna: 'nz', jobicy: 'new-zealand', arbeitnow: 'new-zealand' },
  'Canada': { adzuna: 'ca', jobicy: 'canada', arbeitnow: 'canada' },
};

const IT_KEYWORDS = ['developer', 'engineer', 'support', 'it', 'technician', 'helpdesk', 'software', 'data', 'network', 'system', 'cloud', 'security', 'qa', 'tester', 'analyst', 'programmer', 'admin'];
const BASIC_KEYWORDS = ['junior', 'entry', 'trainee', 'graduate', 'associate', 'support', 'helpdesk', 'intern', 'apprentice'];
const SENIOR_KEYWORDS = ['senior', 'lead', 'principal', 'architect', 'manager', 'head', 'director', 'vp', 'chief', 'snr'];

function isBasicITJob(title: string, description: string, strictBasic: boolean) {
  const text = `${title} ${description}`.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Exclude senior roles
  if (SENIOR_KEYWORDS.some(kw => titleLower.includes(kw))) {
    return false;
  }

  const hasIT = IT_KEYWORDS.some(kw => text.includes(kw));
  const hasBasic = BASIC_KEYWORDS.some(kw => text.includes(kw));

  if (strictBasic) {
    return hasIT && hasBasic;
  }
  return hasIT;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>?/gm, '');
}

async function fetchJobicy(country: string) {
  const geo = COUNTRY_MAP[country]?.jobicy;
  if (!geo) return [];
  try {
    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?geo=${geo}&count=50`, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: any) => ({
      id: `jobicy-${j.id}`,
      title: j.jobTitle,
      company: j.companyName,
      location: j.jobGeo,
      description: stripHtml(j.jobExcerpt || '').substring(0, 200) + '...',
      fullDescription: j.jobDescription,
      url: j.url,
      postedAt: j.pubDate,
      source: 'Jobicy',
      salary: j.annualSalaryMax ? `${j.annualSalaryMin} - ${j.annualSalaryMax} ${j.salaryCurrency}` : null,
      jobType: j.jobType,
    }));
  } catch (e) {
    console.error('Jobicy error:', e);
    return [];
  }
}

async function fetchArbeitnow() {
  try {
    const res = await fetch(`https://www.arbeitnow.com/api/job-board-api`, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((j: any) => ({
      id: `arbeitnow-${j.slug}`,
      title: j.title,
      company: j.company_name,
      location: j.location,
      description: stripHtml(j.description || '').substring(0, 200) + '...',
      fullDescription: j.description,
      url: j.url,
      postedAt: new Date(j.created_at * 1000).toISOString(),
      source: 'Arbeitnow',
      jobType: j.job_types?.join(', '),
    }));
  } catch (e) {
    console.error('Arbeitnow error:', e);
    return [];
  }
}

async function fetchRemotive(country: string) {
  try {
    const res = await fetch(`https://remotive.com/api/remote-jobs?category=software-dev`, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j: any) => ({
      id: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location,
      description: stripHtml(j.description || '').substring(0, 200) + '...',
      fullDescription: j.description,
      url: j.url,
      postedAt: j.publication_date,
      source: 'Remotive',
      jobType: j.job_type,
    })).filter((j: any) => {
      const loc = j.location.toLowerCase();
      const c = country.toLowerCase();
      return loc.includes(c) || loc.includes('worldwide') || loc.includes('global') || loc.includes('anywhere') || (country === 'United Kingdom' && loc.includes('uk'));
    });
  } catch (e) {
    console.error('Remotive error:', e);
    return [];
  }
}

async function fetchAdzuna(country: string, search: string) {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) return [];
  const cc = COUNTRY_MAP[country]?.adzuna;
  if (!cc) return [];
  try {
    const query = search ? encodeURIComponent(search) : 'junior IT';
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${cc}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=50&what=${query}`, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((j: any) => ({
      id: `adzuna-${j.id}`,
      title: j.title,
      company: j.company.display_name,
      location: j.location.display_name,
      description: stripHtml(j.description || ''),
      fullDescription: j.description + '<br/><br/><i>Note: Full description available on the original posting.</i>',
      url: j.redirect_url,
      postedAt: j.created,
      source: 'Adzuna',
      salary: j.salary_min ? `${j.salary_min} - ${j.salary_max}` : null,
    }));
  } catch (e) {
    console.error('Adzuna error:', e);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'United Kingdom';
    const search = searchParams.get('search') || '';
    const strictBasic = searchParams.get('strictBasic') === 'true';

    const [jobicy, arbeitnow, remotive, adzuna] = await Promise.all([
      fetchJobicy(country),
      fetchArbeitnow(),
      fetchRemotive(country),
      fetchAdzuna(country, search)
    ]);

    const filteredArbeitnow = arbeitnow.filter((j: any) => 
      j.location.toLowerCase().includes(country.toLowerCase()) || 
      (country === 'United Kingdom' && j.location.toLowerCase().includes('uk'))
    );

    let allJobs = [...jobicy, ...filteredArbeitnow, ...remotive, ...adzuna];

    // Filter by IT and Basic skills
    allJobs = allJobs.filter((j: any) => isBasicITJob(j.title, j.fullDescription, strictBasic));

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allJobs = allJobs.filter((j: any) => 
        j.title.toLowerCase().includes(searchLower) || 
        j.company.toLowerCase().includes(searchLower) ||
        j.fullDescription.toLowerCase().includes(searchLower)
      );
    }

    // Deduplicate by ID
    const uniqueJobs = Array.from(new Map(allJobs.map((j: any) => [j.id, j])).values());

    // Sort by date (newest first)
    uniqueJobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

    return NextResponse.json({ jobs: uniqueJobs });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
