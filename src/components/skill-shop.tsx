'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Zap, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SHOP_ITEMS, ShopItem } from '@/lib/gamification';
import { useToast } from '@/components/ui/toast-provider';
import { cn } from '@/lib/utils';

interface SkillShopProps {
  skillPoints: number;
  onPurchase: (item: ShopItem) => void;
}

export function SkillShop({ skillPoints, onPurchase }: SkillShopProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { success, error } = useToast();

  const handleBuy = (item: ShopItem) => {
    if (skillPoints < item.price) {
      error(`You need ${item.price - skillPoints} more Sparks!`);
      return;
    }
    onPurchase(item);
    success(`Purchased ${item.name}! Check your inventory.`);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-amber-500 hover:bg-amber-600 hover:scale-110 transition-all p-0 border-4 border-white dark:border-slate-800"
      >
        <ShoppingCart className="h-6 w-6 text-white" />
        <div className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white">
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
              className="relative bg-background border shadow-2xl rounded-3xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 bg-amber-500 text-white flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                       <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                       <h2 className="text-xl font-black uppercase tracking-tighter">Spark Shop</h2>
                       <div className="flex items-center gap-1 text-xs font-bold opacity-90">
                          <Zap className="h-3 w-3 fill-white" /> {skillPoints} Available Sparks
                       </div>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/10 text-white">
                    <X className="h-6 w-6" />
                 </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {SHOP_ITEMS.map((item) => (
                   <Card key={item.id} className={cn(
                     "relative overflow-hidden group transition-all hover:border-amber-500/50",
                     skillPoints < item.price && "opacity-80"
                   )}>
                      <CardContent className="p-4 flex flex-col h-full">
                         <div className="flex justify-between items-start mb-4">
                            <div className="text-4xl">{item.icon}</div>
                            <div className="text-sm font-black text-amber-600 flex items-center gap-1">
                               <Zap className="h-3 w-3 fill-amber-500" /> {item.price}
                            </div>
                         </div>
                         <div className="flex-1">
                            <h3 className="font-bold text-lg">{item.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                         </div>
                         <Button
                           onClick={() => handleBuy(item)}
                           disabled={skillPoints < item.price}
                           variant={skillPoints >= item.price ? "default" : "secondary"}
                           className="w-full mt-4 h-10 font-bold text-xs uppercase"
                         >
                            {skillPoints >= item.price ? 'Purchase Item' : 'Insufficient Sparks'}
                         </Button>
                      </CardContent>
                   </Card>
                 ))}
              </div>

              <div className="p-4 bg-muted/30 border-t text-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                 Earn points by completing lectures and assignments
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
