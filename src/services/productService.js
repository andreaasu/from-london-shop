import { supabase } from "../lib/supabaseClient";
// import { allProducts } from "../data/products";

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === "true";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeProduct(p) {
    if (!p) return null;

    const stockObj =
        p.stock_by_size && typeof p.stock_by_size === "object" ? p.stock_by_size : {};

    const hasAnyStock = Object.values(stockObj).some((n) => Number(n) > 0);

    const images = Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []);

    return {
        ...p,
        images,
        inStock: hasAnyStock,
        stock_by_size: stockObj,
    };
}

async function fetchOneBy(field, value) {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq(field, value)
        .maybeSingle();

    if (error) throw error;
    return data ? normalizeProduct(data) : null;
}

export const productService = {
    async getProducts() {
        if (USE_SUPABASE && supabase) {
            const { data, error } = await supabase.from("products").select("*");
            if (error) throw error;
            return (data || []).map(normalizeProduct).filter(p => p.is_visible !== false);
        } else {
            await delay(500);
            return allProducts.filter(p => p.is_visible !== false);
        }
    },

    async getProductById(idOrSku) {
        const key = decodeURIComponent(String(idOrSku || "")).trim();
        if (!key) return null;

        if (USE_SUPABASE && supabase) {
            // Try the most likely identifiers in order
            // 1) id (your real primary key like w-027)
            let p = await fetchOneBy("id", key);
            if (p && p.is_visible !== false) return p;

            // 2) sku (if you added it later)
            p = await fetchOneBy("sku", key);
            if (p && p.is_visible !== false) return p;

            // 3) code (ONLY if you have a "code" column; harmless if it doesn't exist? No.
            // If you DON'T have code column, comment this line out.
            // p = await fetchOneBy("code", key);
            // if (p) return p;

            return null;
        } else {
            await delay(300);
            return allProducts.find((p) => String(p.id) === key) || null;
        }
    },

    async getFeaturedProducts() {
        if (USE_SUPABASE && supabase) {
            const { data, error } = await supabase.from("products").select("*");
            if (error) throw error;
            return (data || []).map(normalizeProduct).filter(p => p.is_visible !== false).slice(0, 8);
        } else {
            await delay(300);
            return allProducts.filter(p => p.is_visible !== false).slice(0, 8);
        }
    },
};