'use client';

import { useState, useEffect } from 'react';
import {
  Library,
  Book,
  FileText,
  Map,
  Lightbulb,
  Search,
  Zap,
  ChevronRight,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast-provider';
import { cn } from '@/lib/utils';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'book' | 'cheat_sheet' | 'roadmap' | 'note' | 'case_study';
  external_url?: string;
  thumbnail_url?: string;
  price_points: number;
  is_published: boolean;
}

export default function LibraryPage() {
  const { success, error: toastError } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [myResources, setMyResources] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const getFileExtension = (url?: string) => {
    if (!url) return '';
    try {
       const path = new URL(url).pathname;
       const parts = path.split('.');
       return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
    } catch {
       const cleanUrl = url.split('?')[0].split('#')[0];
       const parts = cleanUrl.split('.');
       return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
    }
  };

  const isPDF = (url?: string) => getFileExtension(url) === 'pdf';

  const handleDownload = (resource: Resource) => {
    if (!resource.external_url) return;

    const link = document.createElement('a');
    link.href = resource.external_url;
    link.download = resource.title;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [resData, myResData, profileData] = await Promise.all([
        supabase.from('resources').select('*').eq('is_published', true),
        supabase.from('user_resources').select('resource_id').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('id', user.id).single()
      ]);

      setResources(resData.data || []);
      setMyResources(myResData.data?.map(r => r.resource_id) || []);
      setProfile(profileData.data);
    } catch (err) {
      console.error('Error fetching library data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (resource: Resource) => {
    const skillPoints = Math.floor((profile?.total_points || 0) / 10);
    if (skillPoints < resource.price_points) {
      toastError(`Insufficient points! You need ${resource.price_points - skillPoints} more Skill Points.`);
      return;
    }

    const { error } = await supabase
      .from('user_resources')
      .insert({ user_id: profile.id, resource_id: resource.id });

    if (error) {
      toastError('Purchase failed. Please try again.');
    } else {
      success(`Successfully purchased ${resource.title}!`);
      setMyResources([...myResources, resource.id]);
      // Ideally we should also deduct points, but for now we follow the "points gain" model
    }
  };

  const filteredResources = resources.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenResource = (resource: Resource) => {
    const isPDFUrl = isPDF(resource.external_url);
    const isMobile = window.innerWidth < 768;

    if (isPDFUrl) {
       if (isMobile) {
          window.open(resource.external_url, '_blank');
       } else {
          router.push(`/library/view/${resource.id}`);
       }
    } else {
       // Non-PDF, trigger download
       handleDownload(resource);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'book': return <Book className="h-5 w-5" />;
      case 'cheat_sheet': return <FileText className="h-5 w-5" />;
      case 'roadmap': return <Map className="h-5 w-5" />;
      case 'case_study': return <Lightbulb className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) return (
    <main className="flex-1 p-8 text-center">
      <div className="animate-pulse">Loading Knowledge Base...</div>
    </main>
  );

  return (
    <main className="flex-1 p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
            <Library className="h-10 w-10 text-primary" />
            KNOWLEDGE HUB
          </h1>
          <p className="text-muted-foreground font-medium">Unlock premium resources with your earned Skill Points.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center gap-4">
           <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Zap className="h-6 w-6 fill-current" />
           </div>
           <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-primary/70">Skill Points Available</div>
              <div className="text-2xl font-black">{Math.floor((profile?.total_points || 0) / 10)}</div>
           </div>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search for books, cheat sheets, or case studies..."
          className="pl-12 h-14 rounded-2xl text-lg bg-background border-2 focus:border-primary transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="browse" className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="browse" className="rounded-lg px-8 py-2 font-bold uppercase tracking-tighter">Browse All</TabsTrigger>
          <TabsTrigger value="my-collection" className="rounded-lg px-8 py-2 font-bold uppercase tracking-tighter">My Collection</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredResources.map((res) => {
              const isOwned = myResources.includes(res.id);
              return (
                <Card key={res.id} className={cn(
                  "group overflow-hidden border-2 transition-all hover:border-primary/50",
                  isOwned && "border-primary/20 bg-primary/[0.02]"
                )}>
                  <div className="h-32 sm:h-40 md:h-48 bg-muted relative overflow-hidden">
                    {res.thumbnail_url ? (
                      <img src={res.thumbnail_url} alt={res.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                         {getIcon(res.type)}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                       <Badge variant="secondary" className="bg-background/80 backdrop-blur-md font-black uppercase tracking-widest text-[8px] sm:text-[10px] px-1 sm:px-2">
                          {res.type.replace('_', ' ')}
                       </Badge>
                    </div>
                    {isOwned && (
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="h-3 w-3 sm:h-5 sm:w-5" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="text-sm sm:text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1">{res.title}</CardTitle>
                    <CardDescription className="hidden sm:line-clamp-2">{res.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 flex justify-between items-center border-t pt-2 sm:pt-4">
                    {isOwned ? (
                      <Button variant="outline" size="sm" className="w-full font-bold uppercase tracking-tighter group-hover:bg-primary group-hover:text-primary-foreground transition-all text-[9px] sm:text-xs" onClick={() => handleOpenResource(res)}>
                        Open {isPDF(res.external_url) ? 'PDF' : 'Resource'} <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                      </Button>
                    ) : (
                      <div className="flex w-full gap-1 sm:gap-2">
                        <div className="flex-1 bg-muted/50 rounded-lg flex items-center justify-center font-black text-[9px] sm:text-sm">
                           <Zap className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 fill-amber-500 text-amber-500" /> {res.price_points}
                        </div>
                        <Button size="sm" className="flex-[2] font-black uppercase tracking-tighter text-[9px] sm:text-xs px-1 sm:px-4" onClick={() => handlePurchase(res)}>
                           Unlock
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="my-collection">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {resources.filter(r => myResources.includes(r.id)).map(res => (
                <Card key={res.id} className="hover:border-primary transition-all cursor-pointer" onClick={() => handleOpenResource(res)}>
                   <CardHeader className="p-3 sm:p-6 flex flex-row items-center gap-2 sm:gap-4">
                      <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                         {getIcon(res.type)}
                      </div>
                      <div className="min-w-0">
                         <CardTitle className="text-xs sm:text-lg font-bold truncate">{res.title}</CardTitle>
                         <Badge variant="outline" className="text-[7px] sm:text-[10px] uppercase font-bold px-1 sm:px-2">{res.type}</Badge>
                      </div>
                   </CardHeader>
                </Card>
              ))}
              {myResources.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl">
                   <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                   <h3 className="text-xl font-bold">Your collection is empty</h3>
                   <p className="text-muted-foreground">Purchase resources from the hub to see them here.</p>
                </div>
              )}
           </div>
        </TabsContent>
      </Tabs>

    </main>
  );
}
