'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Download,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface Resource {
  id: string;
  title: string;
  type: string;
  external_url: string;
}

export default function ResourceViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResource = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Resource not found');

      setResource(data);
    } catch (err) {
      const errorObj = err as Error;
      console.error('Error fetching resource:', errorObj);
      setError(errorObj.message || 'Failed to load resource');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResource();
  }, [fetchResource]);

  const handleDownload = () => {
    if (!resource?.external_url) return;
    const link = document.createElement('a');
    link.href = resource.external_url;
    link.download = resource.title;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-xs">Loading Resource Viewer...</p>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Access Error</h2>
        <p className="text-muted-foreground mb-6">{error || 'Resource not found'}</p>
        <Button asChild>
          <Link href="/library">Back to Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-900">
      {/* Viewer Header */}
      <div className="bg-background border-b p-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-5 w-5" />
             </div>
             <div>
                <h1 className="text-sm font-black uppercase tracking-tighter line-clamp-1">{resource.title}</h1>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{resource.type}</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={handleDownload} className="font-bold text-[10px] uppercase tracking-widest hidden sm:flex">
              <Download className="h-4 w-4 mr-2" /> Download
           </Button>
           <Button size="sm" asChild className="font-bold text-[10px] uppercase tracking-widest">
              <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                 Open Native
              </a>
           </Button>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex-1 relative bg-slate-800 overflow-hidden">
        <object
          data={resource.external_url}
          type="application/pdf"
          className="w-full h-full border-none shadow-2xl"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-slate-300">
            <FileText className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">PDF Preview Unavailable</h3>
            <p className="text-sm mb-6 max-w-md opacity-60">
              Your browser doesn&apos;t support embedded PDF viewing. No worries! You can view it in your native PDF app or download it.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="font-bold uppercase tracking-tighter">
                <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                  Open in New Tab
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={handleDownload} className="font-bold uppercase tracking-tighter">
                <Download className="h-4 w-4 mr-2" /> Download Now
              </Button>
            </div>
          </div>
        </object>

        {/* Mobile Help Text */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:hidden pointer-events-none">
           <p className="bg-black/60 backdrop-blur-md text-white text-[10px] px-4 py-2 rounded-full font-bold uppercase tracking-widest border border-white/20">
              Scroll or Pinch to navigate PDF
           </p>
        </div>
      </div>
    </div>
  );
}
