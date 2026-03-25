'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Zap,
  Book,
  FileText,
  Map,
  Shield,
  Clock,
  Sparkles,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight,
  LayoutGrid,
  Tags,
  Search
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast-provider';
import { cn } from '@/lib/utils';
import { SHOP_ITEMS } from '@/lib/gamification';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  price_points: number;
  thumbnail_url?: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  price_points?: number; // Assume 1000 for courses if not set
  slug: string;
}

export default function ShopPage() {
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [myResources, setMyResources] = useState<string[]>([]);
  const [myCourses, setMyCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileData, resData, myResData, coursesData, myCoursesData] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('resources').select('*').eq('is_published', true),
      supabase.from('user_resources').select('resource_id').eq('user_id', user.id),
      supabase.from('courses').select('*').order('index', { ascending: true }),
      supabase.from('user_courses').select('course_id').eq('user_id', user.id)
    ]);

    setProfile(profileData.data);
    setResources(resData.data || []);
    setMyResources(myResData.data?.map(r => r.resource_id) || []);
    setCourses(coursesData.data || []);
    setMyCourses(myCoursesData.data?.map(c => c.course_id) || []);
    setLoading(false);
  };

  const handlePurchase = async (id: string, type: 'resource' | 'course' | 'perk', price: number, name: string) => {
    const currentSparks = Math.floor((profile?.total_points || 0) / 10);
    if (currentSparks < price) {
      toastError(`Insufficient Sparks! You need ${price - currentSparks} more Sparks.`);
      return;
    }

    setLoading(true);
    try {
      // Use the verified server action for all shop transactions
      const { purchaseShopItemAction } = await import('@/app/admin/actions');
      const res = await purchaseShopItemAction(id, price);

      if (res.success) {
        success(`Successfully purchased ${name}!`);
        // Update local state immediately for better UX
        if (type === 'resource') setMyResources([...myResources, id]);
        if (type === 'course') setMyCourses([...myCourses, id]);
        fetchData();
      } else {
        toastError(res.error || 'Transaction failed.');
      }
    } catch (err) {
      toastError('Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) return <div className="p-12 text-center animate-pulse font-black text-2xl uppercase tracking-widest">Entering the Vault...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 bg-slate-900 text-white p-6 md:p-12 rounded-[1.5rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden">
         <div className="relative z-10 space-y-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter flex items-center gap-2 md:gap-4">
               <ShoppingCart className="h-8 w-8 md:h-12 md:w-12 text-primary" />
               SPARK SHOP
            </h1>
            <p className="text-slate-400 font-bold text-sm md:text-lg max-w-md leading-tight">Invest your Student Sparks into premium growth assets and boosters.</p>
         </div>

         <div className="relative z-10 bg-white/10 backdrop-blur-2xl border border-white/20 p-4 md:p-8 rounded-2xl md:rounded-3xl flex items-center gap-4 md:gap-6 shadow-2xl w-full md:w-auto">
            <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/40 md:animate-bounce shrink-0">
               <Zap className="h-6 w-6 md:h-10 md:w-10 fill-current" />
            </div>
            <div>
               <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">Total Sparks</div>
               <div className="text-2xl md:text-4xl font-black text-white tabular-nums">{Math.floor((profile?.total_points || 0) / 10)} <span className="text-xs md:text-sm opacity-50">SPARKS</span></div>
            </div>
         </div>

         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-20 -mt-20" />
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Filter by books, courses, or boosters..."
          className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl text-base md:text-lg border-2 focus:border-primary shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="books" className="space-y-6 md:space-y-10">
         <div className="flex justify-start md:justify-center overflow-x-auto no-scrollbar pb-2">
            <TabsList className="bg-muted p-1 rounded-xl md:rounded-2xl h-12 md:h-14 shadow-inner w-full md:w-auto">
               <TabsTrigger value="books" className="rounded-lg md:rounded-xl px-4 md:px-10 font-black uppercase tracking-widest text-[10px] md:text-xs h-full flex-1 md:flex-none whitespace-nowrap">Library Items</TabsTrigger>
               <TabsTrigger value="courses" className="rounded-lg md:rounded-xl px-4 md:px-10 font-black uppercase tracking-widest text-[10px] md:text-xs h-full flex-1 md:flex-none whitespace-nowrap">Premium Courses</TabsTrigger>
               <TabsTrigger value="perks" className="rounded-lg md:rounded-xl px-4 md:px-10 font-black uppercase tracking-widest text-[10px] md:text-xs h-full flex-1 md:flex-none whitespace-nowrap">Student Perks</TabsTrigger>
            </TabsList>
         </div>

         <TabsContent value="books" className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
               {resources.map((res) => {
                 const isOwned = myResources.includes(res.id);
                 return (
                   <Card key={res.id} className={cn(
                     "group rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all hover:scale-[1.02] hover:shadow-2xl overflow-hidden",
                     isOwned && "border-primary/20 opacity-80"
                   )}>
                      <div className="h-40 md:h-56 bg-slate-100 relative">
                         {res.thumbnail_url ? (
                           <img src={res.thumbnail_url} alt={res.title} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Book className="h-20 w-20" />
                           </div>
                         )}
                         <div className="absolute top-4 left-4">
                            <Badge className="bg-black/80 backdrop-blur-md border-none font-black uppercase tracking-widest text-[10px]">
                               {res.type.replace('_', ' ')}
                            </Badge>
                         </div>
                      </div>
                      <CardHeader className="p-6 md:p-8">
                         <CardTitle className="text-xl md:text-2xl font-black uppercase tracking-tighter group-hover:text-primary transition-colors">{res.title}</CardTitle>
                         <CardDescription className="text-xs md:text-sm font-medium leading-relaxed line-clamp-2 md:line-clamp-none">{res.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-6 md:p-8 pt-0 border-t bg-slate-50/50 flex justify-between items-center h-16 md:h-20">
                         <div className="flex items-center gap-1 md:gap-2 font-black text-lg md:text-xl">
                            <Zap className="h-4 w-4 md:h-5 md:w-5 fill-primary text-primary" /> {res.price_points}
                         </div>
                         {isOwned ? (
                           <Badge className="bg-emerald-600 text-white font-black h-8 md:h-10 px-4 md:px-6 rounded-full gap-1 md:gap-2 text-[10px] md:text-xs">
                              <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" /> OWNED
                           </Badge>
                         ) : (
                           <Button size="sm" className="rounded-lg md:rounded-xl font-black uppercase tracking-widest px-4 md:px-8 h-10 md:h-12 shadow-xl shadow-primary/20 text-[10px] md:text-xs" onClick={() => handlePurchase(res.id, 'resource', res.price_points, res.title)}>
                              Buy Item
                           </Button>
                         )}
                      </CardFooter>
                   </Card>
                 );
               })}
            </div>
         </TabsContent>

         <TabsContent value="courses" className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
               {courses.filter(c => c.slug !== 'web-dev').map((course) => {
                 const isOwned = myCourses.includes(course.id);
                 const price = 2500; // Premium courses price
                 return (
                   <Card key={course.id} className={cn(
                     "group rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all hover:shadow-2xl flex flex-col overflow-hidden",
                     isOwned && "border-primary/20"
                   )}>
                      <div className="h-32 md:h-40 bg-gradient-to-r from-primary/10 to-transparent p-6 md:p-10 flex items-center justify-between">
                         <div className="h-12 w-12 md:h-20 md:w-20 rounded-xl md:rounded-3xl bg-white shadow-xl flex items-center justify-center text-primary">
                            <Sparkles className="h-6 w-6 md:h-10 md:w-10" />
                         </div>
                         <div className="text-right">
                            <Badge variant="outline" className="font-black uppercase text-[10px] md:text-xs text-primary border-primary">PREMIUM ACCESS</Badge>
                         </div>
                      </div>
                      <CardHeader className="p-6 md:p-10 pt-4 md:pt-6">
                         <CardTitle className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-none">{course.name}</CardTitle>
                         <CardDescription className="text-base md:text-lg font-medium mt-2 line-clamp-2 md:line-clamp-none">{course.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-6 md:p-10 pt-0 mt-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
                         <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Unlocking Fee</div>
                            <div className="text-2xl md:text-3xl font-black flex items-center gap-2">
                               <Zap className="h-5 w-5 md:h-6 md:w-6 fill-primary text-primary" /> {price}
                            </div>
                         </div>
                         {isOwned ? (
                            <Button variant="outline" className="w-full md:w-auto h-12 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl font-black uppercase border-emerald-500 text-emerald-600 gap-2 text-xs md:text-sm" disabled>
                               <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> Course Unlocked
                            </Button>
                         ) : (
                           <Button className="w-full md:w-auto h-12 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 text-xs md:text-sm" onClick={() => handlePurchase(course.id, 'course', price, course.name)}>
                              Unlock Course <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                           </Button>
                         )}
                      </CardFooter>
                   </Card>
                 );
               })}
            </div>
         </TabsContent>

         <TabsContent value="perks" className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
               {SHOP_ITEMS.map((perk) => (
                 <Card key={perk.id} className="rounded-[1.5rem] md:rounded-[2rem] border-2 group hover:border-amber-500/50 transition-all flex flex-col items-center text-center p-6 md:p-8">
                    <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl md:rounded-[2rem] bg-amber-500/10 flex items-center justify-center text-2xl md:text-4xl mb-4 md:mb-6 shadow-inner group-hover:scale-110 transition-transform">
                       {perk.icon}
                    </div>
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-2">{perk.name}</h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground font-medium mb-6 md:mb-8 leading-relaxed px-4 line-clamp-3 md:line-clamp-none">{perk.description}</p>

                    <div className="mt-auto w-full space-y-3 md:space-y-4">
                       <div className="flex items-center justify-center gap-2 text-lg md:text-xl font-black text-amber-600">
                          <Zap className="h-4 w-4 md:h-5 md:w-5 fill-amber-500" /> {perk.price}
                       </div>
                       <Button variant="secondary" className="w-full h-10 md:h-12 rounded-lg md:rounded-xl font-black uppercase tracking-tighter group-hover:bg-amber-500 group-hover:text-white transition-colors text-xs md:text-sm" onClick={() => handlePurchase(perk.id, 'perk', perk.price, perk.name)}>
                          Purchase Perk
                       </Button>
                    </div>
                 </Card>
               ))}
            </div>
         </TabsContent>
      </Tabs>
    </div>
  );
}
