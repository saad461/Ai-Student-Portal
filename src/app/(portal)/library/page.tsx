'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Library,
  Book,
  FileText,
  Map,
  Lightbulb,
  Search,
  Lock,
  Zap,
  ChevronRight,
  Download,
  ExternalLink,
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
  content?: string;
  external_url?: string;
  thumbnail_url?: string;
  price_points: number;
}

export default function LibraryPage() {
  const { success, error: toastError } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [myResources, setMyResources] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
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
    setLoading(false);
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'book': return <Book className="h-5 w-5" />;
      case 'cheat_sheet': return <FileText className="h-5 w-5" />;
      case 'roadmap': return <Map className="h-5 w-5" />;
      case 'case_study': return <Lightbulb className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Knowledge Base...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res) => {
              const isOwned = myResources.includes(res.id);
              return (
                <Card key={res.id} className={cn(
                  "group overflow-hidden border-2 transition-all hover:border-primary/50",
                  isOwned && "border-primary/20 bg-primary/[0.02]"
                )}>
                  <div className="h-48 bg-muted relative overflow-hidden">
                    {res.thumbnail_url ? (
                      <img src={res.thumbnail_url} alt={res.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                         {getIcon(res.type)}
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                       <Badge variant="secondary" className="bg-background/80 backdrop-blur-md font-black uppercase tracking-widest text-[10px]">
                          {res.type.replace('_', ' ')}
                       </Badge>
                    </div>
                    {isOwned && (
                      <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{res.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{res.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center border-t pt-4">
                    {isOwned ? (
                      <Button variant="outline" className="w-full font-bold uppercase tracking-tighter group-hover:bg-primary group-hover:text-primary-foreground transition-all" onClick={() => setSelectedResource(res)}>
                        Open Resource <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <div className="flex w-full gap-2">
                        <div className="flex-1 bg-muted/50 rounded-lg flex items-center justify-center font-black text-sm">
                           <Zap className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" /> {res.price_points}
                        </div>
                        <Button className="flex-[2] font-black uppercase tracking-tighter" onClick={() => handlePurchase(res)}>
                           Unlock Now
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
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.filter(r => myResources.includes(r.id)).map(res => (
                <Card key={res.id} className="hover:border-primary transition-all cursor-pointer" onClick={() => setSelectedResource(res)}>
                   <CardHeader className="flex flex-row items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                         {getIcon(res.type)}
                      </div>
                      <div>
                         <CardTitle className="text-lg font-bold">{res.title}</CardTitle>
                         <Badge variant="outline" className="text-[10px] uppercase font-bold">{res.type}</Badge>
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

      <AnimatePresence>
        {selectedResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedResource(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-background w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-primary/20"
            >
              <div className="p-6 border-b flex justify-between items-center bg-muted/30">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                       {getIcon(selectedResource.type)}
                    </div>
                    <div>
                       <h2 className="text-xl font-black tracking-tighter uppercase">{selectedResource.title}</h2>
                       <p className="text-xs text-muted-foreground font-bold">{selectedResource.type.replace('_', ' ')}</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setSelectedResource(null)} className="rounded-full">
                    <Download className="h-5 w-5" />
                 </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 prose dark:prose-invert max-w-none">
                 {selectedResource.external_url ? (
                   <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                      <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                         <ExternalLink className="h-10 w-10" />
                      </div>
                      <div className="max-w-md">
                         <h3 className="text-2xl font-black tracking-tighter">EXTERNAL RESOURCE</h3>
                         <p className="text-muted-foreground">This resource is hosted externally or is a PDF document.</p>
                      </div>
                      <Button size="lg" className="h-14 px-10 font-black uppercase tracking-widest rounded-2xl" asChild>
                         <a href={selectedResource.external_url} target="_blank" rel="noopener noreferrer">
                           Open Document <ExternalLink className="h-5 w-5 ml-2" />
                         </a>
                      </Button>
                   </div>
                 ) : (
                   <div dangerouslySetInnerHTML={{ __html: selectedResource.content || '<p>No content provided.</p>' }} />
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
