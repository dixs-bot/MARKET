(function () {
  const LS_PRODUCTS = "products";
  const LS_CART     = "mc3";
  const LS_ORDERS   = "mo3";
  const LS_CATEGORIES = "categories";

  const FALLBACK_IMG = "https://via.placeholder.com/150";
  const FALLBACK_CAT_IMG = "https://via.placeholder.com/150";

  function fmt(n){
    return "Rp " + (n || 0).toLocaleString("id-ID");
  }

  function safeParse(str, fallback) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function normalizeProduct(p) {
    if (!p || typeof p !== "object") return null;
    if (!p.id) return null;

    return {
      id: String(p.id),
      name: String(p.name || "").trim(),
      price: Math.max(0, Number(p.price) || 0),
      category: String(p.category || p.cat || ""),
      stock: Math.max(0, Number(p.stock) || 0),
      image: String(p.image || p.img || FALLBACK_IMG)
    };
  }

function getProducts() {
  const raw = localStorage.getItem(LS_PRODUCTS);
  const data = safeParse(raw, []);
  return data.map(normalizeProduct).filter(p => p);
}

/* 🔥 TAMBAHKAN DI SINI */
async function syncProductsFromSupabase() {

  const { data, error } =
    await window.supabaseClient
      .from('products')
      .select('*');

  if (error) {
    console.error(error);
    return [];
  }

  localStorage.setItem(
    LS_PRODUCTS,
    JSON.stringify(data)
  );

  window.dispatchEvent(
    new Event('productsUpdated')
  );

  return data;
}

  function saveProducts(products) {
    if (!Array.isArray(products)) return false;

    const map = {};
    const clean = [];

    for (let i = 0; i < products.length; i++) {
      const p = normalizeProduct(products[i]);
      if (!p) continue;
      if (map[p.id]) continue;

      map[p.id] = true;
      clean.push(p);
    }

    try {
      localStorage.setItem(LS_PRODUCTS, JSON.stringify(clean));
      window.dispatchEvent(new Event("productsUpdated"));
      return true;
    } catch {
      return false;
    }
  }

  async function syncCategoriesFromSupabase() {

    const { data, error } =
        await window.supabaseClient
            .from('categories')
            .select('*');

    if (error) {
        console.error(error);
        return [];
    }

    localStorage.setItem(
        LS_CATEGORIES,
        JSON.stringify(data)
    );

    window.dispatchEvent(
        new Event('categoriesUpdated')
    );

    return data;
}
  // 🔥 ATOMIC STOCK UPDATE (WAJIB UNTUK APP.JS)
  function atomicDeductStock(cart){
    const prods = getProducts();
    const map   = {};
    for(let i=0;i<prods.length;i++) map[prods[i].id] = prods[i];

    const errors = [];

    for(let i=0;i<cart.length;i++){
      const it = cart[i];
      const p  = map[it.id];

      if(!p){
        errors.push(it.name);
        continue;
      }

      if(p.stock < it.qty){
        errors.push(it.name);
      }
    }

    if(errors.length){
      return { ok:false, errors };
    }

    // deduct
    for(let i=0;i<cart.length;i++){
      const it = cart[i];
      const p  = map[it.id];

      p.stock -= it.qty;

      // sync cart snapshot
      it.price = p.price;
      it.image = p.image;
    }

    saveProducts(prods);

    return { ok:true };
  }

  // 🔥 VALIDATE ORDER (DIPAKAI APP.JS)
  function validateOrder(o){
    if(!o) return { ok:false, reason:"empty order" };
    if(!o.items || !o.items.length) return { ok:false, reason:"no items" };
    if(!o.address) return { ok:false, reason:"no address" };
    if(!o.total) return { ok:false, reason:"invalid total" };

    return { ok:true };
  }

  function loadOrders() {
    try {
      const raw = localStorage.getItem(LS_ORDERS);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function normalizeCategory(c) {
    if (!c || typeof c !== "object") return null;
    if (!c.id) return null;
    
    const name = String(c.name || "").trim();
    if (!name) return null; 

    return {
      id: String(c.id),
      name: name,
      image: String(c.image || FALLBACK_CAT_IMG)
    };
  }

  function getCategories() {
    const raw = localStorage.getItem(LS_CATEGORIES);
    const data = safeParse(raw, []);
    const clean = data.map(normalizeCategory).filter(c => c);

    const hasAll = clean.some(c => c.id === "all");
    if (!hasAll) {
      clean.unshift({ id: "all", name: "Semua", image: FALLBACK_CAT_IMG });
    }

    return clean.length > 0 ? clean : [{ id: "all", name: "Semua", image: FALLBACK_CAT_IMG }];
  }

  function saveCategories(categories) {
    if (!Array.isArray(categories)) return false;

    const map = {};
    const clean = [];

    for (let i = 0; i < categories.length; i++) {
      const c = normalizeCategory(categories[i]);
      if (!c) continue;
      if (map[c.id]) continue;

      map[c.id] = true;
      clean.push(c);
    }

    try {
      localStorage.setItem(LS_CATEGORIES, JSON.stringify(clean));
      window.dispatchEvent(new Event("categoriesUpdated"));
      return true;
    } catch {
      return false;
    }
  }

  function editCategory(id, newName, newImage) {
    if (!id || id === "all") return false;
    
    const cats = getCategories();
    let target = null;
    
    for (let i = 0; i < cats.length; i++) {
      if (cats[i].id === id) {
        target = cats[i];
        break;
      }
    }
    
    if (!target) return false;

    if (typeof newName === "string") {
      const trimmed = newName.trim();
      if (!trimmed) return false;
      
      const lowerNew = trimmed.toLowerCase();
      for (let i = 0; i < cats.length; i++) {
        if (cats[i].id !== id && cats[i].name.toLowerCase() === lowerNew) {
          return false; 
        }
      }
      target.name = trimmed;
    }

    if (typeof newImage === "string") {
      const trimmed = newImage.trim();
      if (trimmed) target.image = trimmed;
    }

    return saveCategories(cats);
  }

  function deleteCategory(id) {
    if (!id || id === "all") return false;
    
    const cats = getCategories();
    const exists = cats.some(c => c.id === id);
    if (!exists) return false;

    const prods = getProducts();
    let changed = false;
    
    for (let i = 0; i < prods.length; i++) {
      if (prods[i].category === id) {
        prods[i].category = "all";
        changed = true;
      }
    }
    
    if (changed) saveProducts(prods);

    const updated = cats.filter(c => c.id !== id);
    return saveCategories(updated);
  }

  function reorderCategories(newOrder) {
    if (!Array.isArray(newOrder)) return false;
    
    const cats = getCategories();
    const map = {};
    
    for (let i = 0; i < cats.length; i++) {
      map[cats[i].id] = cats[i];
    }

    const allCat = map["all"];
    const ordered = allCat ? [allCat] : [];

    for (let i = 0; i < newOrder.length; i++) {
      const id = newOrder[i];
      if (id === "all") continue;
      if (map[id]) {
        ordered.push(map[id]);
        delete map[id]; 
      }
    }

    for (let key in map) {
      if (map.hasOwnProperty(key)) {
        ordered.push(map[key]);
      }
    }

    return saveCategories(ordered);
  }

  window.MiniMarket = {
   
    // storage
    LS_PRODUCTS,
    LS_CART,
    LS_ORDERS,
    LS_CATEGORIES,

    // utils
    fmt,
    FALLBACK_IMG,
    FALLBACK_CAT_IMG,

    // products
    getProducts,
    saveProducts,
    normalizeProduct,
    syncProductsFromSupabase, 
    // categories
    normalizeCategory,
    getCategories,
    saveCategories,
    editCategory,
    deleteCategory,
    reorderCategories,
    syncCategoriesFromSupabase,
    // orders
    loadOrders,

    // advanced
    atomicDeductStock,
    validateOrder
  };
})();
