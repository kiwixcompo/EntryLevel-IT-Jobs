import { formatDistanceToNow } from 'date-fns';
import { Building2, MapPin, Clock, ExternalLink, Briefcase } from 'lucide-react';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  fullDescription: string;
  url: string;
  postedAt: string;
  source: string;
  salary?: string;
  jobType?: string;
}

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const timeAgo = job.postedAt ? formatDistanceToNow(new Date(job.postedAt), { addSuffix: true }) : 'Recently';

  return (
    <div 
      onClick={() => onClick(job)}
      className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 leading-tight mb-1">{job.title}</h3>
          <div className="flex items-center text-slate-600 text-sm mt-2">
            <Building2 className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate font-medium">{job.company}</span>
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 whitespace-nowrap ml-3">
          {job.source}
        </span>
      </div>

      <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-slate-500 mb-4">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span className="truncate max-w-[150px]">{job.location}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span>{timeAgo}</span>
        </div>
        {job.jobType && (
          <div className="flex items-center">
            <Briefcase className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="capitalize">{String(job.jobType).replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-grow">
        {job.description}
      </p>

      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
        <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View Details</span>
        <a 
          href={job.url} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors"
          title="Open original posting"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
