import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  getRestaurantsByOwner,
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  generateAITranslation,
  type MenuItem,
  type Restaurant,
} from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  LogOut,
  Sparkles,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  ChevronDown,
  Store,
  ExternalLink,
} from "lucide-react";

export default function Dashboard() {
  const { owner, logout } = useAuth();
  const restaurants = getRestaurantsByOwner(owner?.id || "");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(
    restaurants[0] || null
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showRestaurantPicker, setShowRestaurantPicker] = useState(false);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const items = selectedRestaurant
    ? getMenuItems(selectedRestaurant.id)
    : [];

  const approvedCount = items.filter((i) => i.approved).length;
  const pendingCount = items.filter((i) => !i.approved).length;

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-akane">eigomenyu</h1>
            <p className="text-xs text-muted-foreground">Welcome, {owner?.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="relative">
          <button
            onClick={() => setShowRestaurantPicker(!showRestaurantPicker)}
            className="w-full flex items-center justify-between bg-card rounded-xl border border-border p-4 hover:border-akane/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-akane/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-akane" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sumi">
                  {selectedRestaurant?.nameJa || "Select restaurant"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedRestaurant?.nameEn || ""}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {showRestaurantPicker && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 z-20 mt-1 bg-card rounded-xl border border-border shadow-lg overflow-hidden"
              >
                {restaurants.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRestaurant(r);
                      setShowRestaurantPicker(false);
                      refresh();
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors flex items-center justify-between ${
                      selectedRestaurant?.id === r.id ? "bg-accent/30" : ""
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm text-sumi">{r.nameJa}</p>
                      <p className="text-xs text-muted-foreground">{r.nameEn}</p>
                    </div>
                    {selectedRestaurant?.id === r.id && (
                      <Check className="w-4 h-4 text-akane" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedRestaurant && (
          <div className="flex items-center gap-2">
            <a
              href={`${base}/menu/${selectedRestaurant.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-akane font-medium flex items-center gap-1 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View guest menu
            </a>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-black text-sumi">{items.length}</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-black text-matcha">{approvedCount}</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Approved</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pending</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-sumi uppercase tracking-wider">Menu Items</h2>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Dish
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <div className="text-4xl mb-3">🍱</div>
            <p className="font-semibold text-sumi mb-1">No menu items yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first dish and get AI-powered translations
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add First Dish
            </Button>
          </div>
        ) : (
          <div className="space-y-3" key={refreshKey}>
            {items.map((item, idx) => (
              <MenuItemCard
                key={item.id}
                item={item}
                index={idx}
                onEdit={() => setEditingItem(item)}
                onToggleApproval={() => {
                  updateMenuItem(item.id, { approved: !item.approved });
                  refresh();
                }}
                onDelete={() => {
                  deleteMenuItem(item.id);
                  refresh();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showAddDialog && selectedRestaurant && (
        <AddDishDialog
          restaurantId={selectedRestaurant.id}
          onClose={() => setShowAddDialog(false)}
          onAdded={refresh}
        />
      )}

      {editingItem && (
        <EditDishDialog
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

function MenuItemCard({
  item,
  index,
  onEdit,
  onToggleApproval,
  onDelete,
}: {
  item: MenuItem;
  index: number;
  onEdit: () => void;
  onToggleApproval: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-card rounded-xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold font-jp text-sumi">{item.nameJa}</span>
            <Badge variant={item.approved ? "default" : "secondary"} className="text-[10px]">
              {item.approved ? "Approved" : "Pending"}
            </Badge>
          </div>
          {item.titleEn && (
            <p className="text-sm font-medium text-foreground">{item.titleEn}</p>
          )}
          {item.descriptionEn && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.descriptionEn}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
            {item.romaji && <span className="italic">{item.romaji}</span>}
            {item.phonetic && <span className="text-matcha font-medium">🔊 {item.phonetic}</span>}
            {item.category && <span>• {item.category}</span>}
            {item.price && <span>• ¥{item.price.toLocaleString()}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1.5 mr-2">
            <Switch
              checked={item.approved}
              onCheckedChange={onToggleApproval}
              className="data-[state=checked]:bg-matcha"
            />
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function AddDishDialog({
  restaurantId,
  onClose,
  onAdded,
}: {
  restaurantId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [nameJa, setNameJa] = useState("");
  const [hint, setHint] = useState("");
  const [category, setCategory] = useState("Mains");
  const [price, setPrice] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translation, setTranslation] = useState<{
    titleEn: string;
    descriptionEn: string;
    romaji: string;
    phonetic: string;
  } | null>(null);

  async function handleTranslate() {
    if (!nameJa.trim()) return;
    setTranslating(true);
    try {
      const result = await generateAITranslation(nameJa, hint);
      setTranslation(result);
    } finally {
      setTranslating(false);
    }
  }

  function handleSave(approved: boolean) {
    if (!nameJa.trim()) return;
    addMenuItem({
      restaurantId,
      nameJa: nameJa.trim(),
      titleEn: translation?.titleEn || "",
      descriptionEn: translation?.descriptionEn || "",
      romaji: translation?.romaji || "",
      phonetic: translation?.phonetic || "",
      category,
      price: price ? parseInt(price) : null,
      allergens: [],
      approved,
      hint,
    });
    onAdded();
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Dish</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Japanese name *</Label>
            <Input
              value={nameJa}
              onChange={(e) => setNameJa(e.target.value)}
              placeholder="味噌ラーメン"
              className="font-jp text-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Hint for AI (optional)</Label>
            <Input
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. Miso ramen with extra chashu"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Starters</option>
                <option>Mains</option>
                <option>Noodles</option>
                <option>Rice Bowls</option>
                <option>Sides</option>
                <option>Desserts</option>
                <option>Drinks</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Price (¥)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="900"
              />
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleTranslate}
            disabled={translating || !nameJa.trim()}
          >
            {translating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {translating ? "Translating..." : "Generate AI Translation"}
          </Button>

          {translation && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-matcha/5 rounded-lg border border-matcha/20 p-3 space-y-2"
            >
              <p className="text-xs font-bold text-matcha uppercase tracking-wider">AI Suggestion</p>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">English title</span>
                  <Input
                    value={translation.titleEn}
                    onChange={(e) =>
                      setTranslation({ ...translation, titleEn: e.target.value })
                    }
                    className="h-8 text-sm mt-0.5"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Description</span>
                  <Input
                    value={translation.descriptionEn}
                    onChange={(e) =>
                      setTranslation({ ...translation, descriptionEn: e.target.value })
                    }
                    className="h-8 text-sm mt-0.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Romaji</span>
                    <Input
                      value={translation.romaji}
                      onChange={(e) =>
                        setTranslation({ ...translation, romaji: e.target.value })
                      }
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Phonetic</span>
                    <Input
                      value={translation.phonetic}
                      onChange={(e) =>
                        setTranslation({ ...translation, phonetic: e.target.value })
                      }
                      className="h-8 text-sm mt-0.5"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSave(false)}
            disabled={!nameJa.trim()}
          >
            Save as Pending
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={!nameJa.trim() || !translation}
          >
            <Check className="w-4 h-4 mr-1" />
            Approve & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDishDialog({
  item,
  onClose,
  onSaved,
}: {
  item: MenuItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [titleEn, setTitleEn] = useState(item.titleEn);
  const [descriptionEn, setDescriptionEn] = useState(item.descriptionEn);
  const [romaji, setRomaji] = useState(item.romaji);
  const [phonetic, setPhonetic] = useState(item.phonetic);
  const [category, setCategory] = useState(item.category);
  const [price, setPrice] = useState(item.price?.toString() || "");
  const [translating, setTranslating] = useState(false);

  async function handleRetranslate() {
    setTranslating(true);
    try {
      const result = await generateAITranslation(item.nameJa, item.hint);
      setTitleEn(result.titleEn);
      setDescriptionEn(result.descriptionEn);
      setRomaji(result.romaji);
      setPhonetic(result.phonetic);
    } finally {
      setTranslating(false);
    }
  }

  function handleSave() {
    updateMenuItem(item.id, {
      titleEn,
      descriptionEn,
      romaji,
      phonetic,
      category,
      price: price ? parseInt(price) : null,
    });
    onSaved();
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit: <span className="font-jp">{item.nameJa}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>English title</Label>
            <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Romaji</Label>
              <Input value={romaji} onChange={(e) => setRomaji(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phonetic</Label>
              <Input value={phonetic} onChange={(e) => setPhonetic(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Starters</option>
                <option>Mains</option>
                <option>Noodles</option>
                <option>Rice Bowls</option>
                <option>Sides</option>
                <option>Desserts</option>
                <option>Drinks</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Price (¥)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleRetranslate}
            disabled={translating}
          >
            {translating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Re-translate with AI
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Check className="w-4 h-4 mr-1" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
