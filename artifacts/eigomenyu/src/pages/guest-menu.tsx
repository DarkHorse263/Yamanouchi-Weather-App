import { useState, useCallback } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, BookOpen, ClipboardList, Plus, Minus, X, Volume2 } from "lucide-react";
import { getRestaurantBySlug, getApprovedMenuItems, type MenuItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const PHRASES = [
  { ja: "すみません", romaji: "sumimasen", phonetic: "soo-mee-mah-sen", en: "Excuse me (to call staff)" },
  { ja: "これをください", romaji: "kore o kudasai", phonetic: "koh-reh oh koo-dah-sah-ee", en: "This one, please" },
  { ja: "お水をください", romaji: "omizu o kudasai", phonetic: "oh-mee-zoo oh koo-dah-sah-ee", en: "Water, please" },
  { ja: "おすすめは何ですか", romaji: "osusume wa nan desu ka", phonetic: "oh-soo-soo-meh wah nahn des kah", en: "What do you recommend?" },
  { ja: "お会計お願いします", romaji: "okaikei onegaishimasu", phonetic: "oh-kai-keh oh-neh-gah-ee-shee-mahs", en: "Check, please" },
  { ja: "美味しかったです", romaji: "oishikatta desu", phonetic: "oy-shee-kah-tah des", en: "It was delicious" },
  { ja: "ありがとうございます", romaji: "arigatou gozaimasu", phonetic: "ah-ree-gah-toh go-zah-ee-mahs", en: "Thank you very much" },
  { ja: "いただきます", romaji: "itadakimasu", phonetic: "ee-tah-dah-kee-mahs", en: "Said before eating (bon appetit)" },
  { ja: "ごちそうさまでした", romaji: "gochisousama deshita", phonetic: "go-chee-soh-sah-mah desh-tah", en: "Said after eating (thank you for the meal)" },
  { ja: "アレルギーがあります", romaji: "arerugii ga arimasu", phonetic: "ah-reh-roo-gee gah ah-ree-mahs", en: "I have an allergy" },
  { ja: "辛くないものはありますか", romaji: "karakunai mono wa arimasu ka", phonetic: "kah-rah-koo-nah-ee moh-noh wah ah-ree-mahs kah", en: "Do you have anything not spicy?" },
  { ja: "もう一つください", romaji: "mou hitotsu kudasai", phonetic: "moh hee-toh-tsoo koo-dah-sah-ee", en: "One more, please" },
];

type Tab = "menu" | "phrasebook" | "order";

export default function GuestMenu() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const restaurant = getRestaurantBySlug(slug ?? "");
  const items = restaurant ? getApprovedMenuItems(restaurant.id) : [];
  const [activeTab, setActiveTab] = useState<Tab>("menu");
  const [orderItems, setOrderItems] = useState<Map<string, number>>(new Map());

  const addToOrder = useCallback((itemId: string) => {
    setOrderItems((prev) => {
      const next = new Map(prev);
      next.set(itemId, (next.get(itemId) || 0) + 1);
      return next;
    });
  }, []);

  const removeFromOrder = useCallback((itemId: string) => {
    setOrderItems((prev) => {
      const next = new Map(prev);
      const current = next.get(itemId) || 0;
      if (current <= 1) next.delete(itemId);
      else next.set(itemId, current - 1);
      return next;
    });
  }, []);

  const clearOrder = useCallback(() => setOrderItems(new Map()), []);

  const orderCount = Array.from(orderItems.values()).reduce((a, b) => a + b, 0);

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🍜</div>
        <h1 className="text-2xl font-bold text-sumi mb-2">Restaurant Not Found</h1>
        <p className="text-muted-foreground">This menu link may be incorrect or expired.</p>
      </div>
    );
  }

  const categories = [...new Set(items.map((i) => i.category))];

  const tabs: { id: Tab; label: string; icon: typeof Utensils }[] = [
    { id: "menu", label: "Menu", icon: Utensils },
    { id: "phrasebook", label: "Phrases", icon: BookOpen },
    { id: "order", label: `Order${orderCount > 0 ? ` (${orderCount})` : ""}`, icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-br from-akane to-[hsl(350,60%,30%)] text-white px-5 pt-8 pb-6">
        <p className="text-white/70 text-xs font-medium tracking-widest uppercase mb-1">eigomenyu</p>
        <h1 className="text-3xl font-bold font-jp leading-tight">{restaurant.nameJa}</h1>
        <p className="text-white/80 text-sm mt-1">{restaurant.nameEn}</p>
        {restaurant.description && (
          <p className="text-white/60 text-xs mt-2">{restaurant.description}</p>
        )}
      </header>

      <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === tab.id
                  ? "text-akane"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-akane rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-lg mx-auto">
        {activeTab === "menu" && (
          <MenuTab
            items={items}
            categories={categories}
            orderItems={orderItems}
            onAdd={addToOrder}
            onRemove={removeFromOrder}
          />
        )}
        {activeTab === "phrasebook" && <PhrasebookTab />}
        {activeTab === "order" && (
          <OrderTab
            items={items}
            orderItems={orderItems}
            onAdd={addToOrder}
            onRemove={removeFromOrder}
            onClear={clearOrder}
          />
        )}
      </main>
    </div>
  );
}

function MenuTab({
  items,
  categories,
  orderItems,
  onAdd,
  onRemove,
}: {
  items: MenuItem[];
  categories: string[];
  orderItems: Map<string, number>;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-muted-foreground">No menu items available yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="text-xs font-bold text-akane uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-6 h-px bg-akane/30" />
            {cat}
          </h2>
          <div className="space-y-3">
            {items
              .filter((i) => i.category === cat)
              .map((item, idx) => {
                const qty = orderItems.get(item.id) || 0;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-card rounded-xl p-4 border border-border/60 shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-lg font-bold font-jp text-sumi">{item.nameJa}</span>
                          {item.price && (
                            <span className="text-xs font-semibold text-akane">¥{item.price.toLocaleString()}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">{item.titleEn}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {item.descriptionEn}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[11px] text-muted-foreground italic">{item.romaji}</span>
                          <span className="flex items-center gap-0.5 text-[11px] text-matcha font-medium">
                            <Volume2 className="w-3 h-3" />
                            {item.phonetic}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {qty > 0 && (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 rounded-full"
                              onClick={() => onRemove(item.id)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-5 text-center text-sm font-bold">{qty}</span>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant={qty > 0 ? "default" : "outline"}
                          className="h-7 w-7 rounded-full"
                          onClick={() => onAdd(item.id)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

function PhrasebookTab() {
  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-muted-foreground mb-2 px-1">
        Common phrases for ordering at Japanese restaurants. Tap to see pronunciation.
      </p>
      {PHRASES.map((phrase, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
          className="bg-card rounded-xl p-4 border border-border/60 shadow-sm"
        >
          <p className="text-lg font-bold font-jp text-sumi mb-0.5">{phrase.ja}</p>
          <p className="text-sm font-medium text-foreground">{phrase.en}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] text-muted-foreground italic">{phrase.romaji}</span>
            <span className="flex items-center gap-0.5 text-[11px] text-matcha font-medium">
              <Volume2 className="w-3 h-3" />
              {phrase.phonetic}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function OrderTab({
  items,
  orderItems,
  onAdd,
  onRemove,
  onClear,
}: {
  items: MenuItem[];
  orderItems: Map<string, number>;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const ordered = Array.from(orderItems.entries())
    .map(([id, qty]) => ({ item: items.find((i) => i.id === id)!, qty }))
    .filter((o) => o.item);

  if (ordered.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-5xl mb-4">🍽️</div>
        <h3 className="text-lg font-bold text-sumi mb-1">Your order is empty</h3>
        <p className="text-sm text-muted-foreground">
          Tap the <Plus className="w-3 h-3 inline" /> button on menu items to add them here.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Then show this screen to your server!
        </p>
      </div>
    );
  }

  const total = ordered.reduce((sum, o) => sum + (o.item.price || 0) * o.qty, 0);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-sumi uppercase tracking-wider">
          Show this to staff
        </h2>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive text-xs">
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>

      <div className="bg-card rounded-2xl border-2 border-akane/20 p-5 space-y-4">
        <AnimatePresence>
          {ordered.map(({ item, qty }) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-black font-jp text-sumi leading-tight">
                  {item.nameJa}
                </p>
                <p className="text-xs text-muted-foreground">{item.titleEn}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={() => onRemove(item.id)}
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="w-6 text-center text-lg font-black">{qty}</span>
                <Button
                  size="icon"
                  variant="default"
                  className="h-8 w-8 rounded-full"
                  onClick={() => onAdd(item.id)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {total > 0 && (
          <>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-muted-foreground">Estimated total</span>
              <span className="text-lg font-black text-sumi">¥{total.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        Point to the items above to place your order 🙏
      </p>
    </div>
  );
}
