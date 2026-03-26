'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Zap, X, Check, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SHOP_ITEMS, ShopItem, getSkillPoints } from '@/lib/gamification';
import { useToast } from '@/components/ui/toast-provider';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export function SkillShop() {
  const [isOpen, setIsOpen] = useState(false);
  const [skillPoints, setSkillPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const fetchPoints = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', user.id)
      .single();

    if (profile) {
      setSkillPoints(getSkillPoints(profile.total_points || 0));
    }
  };

  useEffect(() => {
    fetchPoints();

    // Subscribe to profile changes to keep points in sync
    const channel = supabase
      .channel('profile_points_sync')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, (payload) => {
        if (payload.new) {
          setSkillPoints(getSkillPoints(payload.new.total_points || 0));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleBuy = async (item: ShopItem) => {
    if (skillPoints < item.price) {
      error(`You need ${item.price - skillPoints} more Sparks!`);
      return;
    }

    setLoading(true);
    try {
      const { purchaseShopItemAction } = await import('@/app/admin/actions');
      const res = await purchaseShopItemAction(item.id, item.price);

      if (res.success) {
        success(`Purchased ${item.name}! Check your inventory.`);
        fetchPoints();
      } else {
        error(res.error || 'Failed to complete purchase.');
      }
    } catch (err) {
      error('Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-2xl z-40 bg-amber-500 hover:bg-amber-600 hover:scale-110 transition-all p-0 border-4 border-white dark:border-slate-800"
      >
        <ShoppingCart className="h-5 w-5 md:h-6 md:w-6 text-white" />
        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-black text-white text-[8px] md:text-[10px] font-black px-1.5 md:px-2 py-0.5 rounded-full border-2 border-white">
           SHOP
        </div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-background border shadow-2xl rounded-3xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] md:max-h-[80vh]"
            >
              <div className="p-4 md:p-6 bg-amber-500 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                       <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                       <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-tight">Spark Shop</h2>
                       <div className="flex items-center gap-1 text-xs font-bold opacity-90">
                          <Zap className="h-3 w-3 fill-white" /> {skillPoints} Available Sparks
                       </div>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/10 text-white">
                    <X className="h-6 w-6" />
                 </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {SHOP_ITEMS.map((item) => (
                      <Card key={item.id} className={cn(
                        "relative overflow-hidden group transition-all hover:border-amber-500/50",
                        skillPoints < item.price && "opacity-80"
                      )}>
                         <CardContent className="p-4 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                               <div className="text-3xl md:text-4xl">{item.icon}</div>
                               <div className="text-xs md:text-sm font-black text-amber-600 flex items-center gap-1">
                                  <Zap className="h-3 w-3 fill-amber-500" /> {item.price}
                               </div>
                            </div>
                            <div className="flex-1">
                               <h3 className="font-bold text-base md:text-lg leading-tight">{item.name}</h3>
                               <p className="text-[10px] md:text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                            </div>
                            <Button
                              onClick={() => handleBuy(item)}
                              disabled={skillPoints < item.price || loading}
                              variant={skillPoints >= item.price ? "default" : "secondary"}
                              className="w-full mt-4 h-9 md:h-10 font-bold text-[10px] md:text-xs uppercase"
                            >
                               {loading ? 'Processing...' : skillPoints >= item.price ? 'Purchase Item' : 'Insufficient Sparks'}
                            </Button>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>

              <div className="p-3 md:p-4 bg-muted/30 border-t text-center text-[8px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-widest shrink-0">
                 Earn points by completing lectures and assignments
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
