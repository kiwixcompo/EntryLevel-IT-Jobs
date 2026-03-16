'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2, AlertCircle, Briefcase, Filter, Info } from 'lucide-react';
import { JobCard, Job } from '@/components/JobCard';
import { JobModal } from '@/components/JobModal';

const COUNTRIES = [
  'United Kingdom',
  'Germany',
  'Ireland',
  'Australia',
  'New Zealand',
  'Canada'
];

export default function Home() {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [strictBasic, setStrictBasic] = useState(true);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        country,
        search: searchQuery,
        strictBasic: strictBasic.toString()
      });
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching jobs.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [country, searchQuery, strictBasic]);

  useEffect(() => {
    // Debounce fetch when search query changes
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchJobs]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
            <div className="flex items-center">
              <div className="bg-indigo-600 p-2 rounded-lg mr-3">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">TechStart Jobs</h1>
                <p className="text-xs text-slate-500 font-medium">Entry-Level IT & Support Roles</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Country Selector */}
              <div className="relative w-full sm:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg border bg-white text-slate-900 appearance-none shadow-sm"
                  aria-label="Select Country"
                >
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-slate-900">
              {loading ? 'Searching...' : `${jobs.length} Jobs Found`}
            </h2>
            {!loading && jobs.length > 0 && (
              <span className="ml-2 text-sm text-slate-500">in {country}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <label className="flex items-center cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={strictBasic}
                  onChange={(e) => setStrictBasic(e.target.checked)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${strictBasic ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${strictBasic ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <div className="ml-3 text-sm font-medium text-slate-700 group-hover:text-slate-900 flex items-center">
                Strict Entry-Level Filter
                <div className="group/tooltip relative ml-1.5 flex items-center">
                  <Info className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10">
                    When enabled, jobs MUST contain words like "junior" or "entry". When disabled, any IT job without "senior" keywords will show.
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Content Area */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-red-800 mb-1">Error Loading Jobs</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchJobs}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Scouring the web for the best entry-level IT jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No jobs found</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              We couldn't find any basic IT jobs matching your current filters in {country}. Try disabling the "Strict Entry-Level Filter" or changing your search terms.
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setStrictBasic(false);
              }}
              className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                onClick={setSelectedJob} 
              />
            ))}
          </div>
        )}
      </main>

      <JobModal 
        job={selectedJob} 
        onClose={() => setSelectedJob(null)} 
      />
    </div>
  );
}
