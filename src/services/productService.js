import { supabase } from "../lib/supabaseClient";
// import { allProducts } from "../data/products";

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === "true";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeProduct(p) {
    if (!p) return p;

    const stockObj =
        p.stock_by_size && typeof p.stock_by_size === "object" ? p.stock_by_size : {};

    const hasAnyStock = Object.values(stockObj).some((n) => Number(n) > 0);

    return {
        ...p,
        inStock: hasAnyStock,
        stock_by_size: stockObj,
    };
}

export const productService = {
    async getProducts() {
        if (USE_SUPABASE && supabase) {
            const { data, error } = await supabase.from("products").select("*");
            if (error) throw error;
            return (data || []).map(normalizeProduct);
        } else {
            await delay(500);
            return allProducts;
        }
    },

    async getProductById(idOrSku) {
        const key = decodeURIComponent(String(idOrSku || "")).trim();

        if (USE_SUPABASE && supabase) {
            // 1) Try by id (works for your old products)
            let { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", key)
                .maybeSingle();

            if (error) throw error;
            if (data) return normalizeProduct(data);

            // 2) Fallback: try by sku (works if you added sku later)
            ({ data, error } = await supabase
                .from("products")
                .select("*")
                .eq("sku", key)
                .maybeSingle());

            if (error) throw error;
            return normalizeProduct(data); // could be null
        } else {
            await delay(300);
            return allProducts.find((p) => String(p.id) === key) || null;
        }
    },

    async getFeaturedProducts() {
        if (USE_SUPABASE && supabase) {
            const { data, error } = await supabase.from("products").select("*").limit(8);
            if (error) throw error;
            return (data || []).map(normalizeProduct);
        } else {
            await delay(300);
            return allProducts.slice(0, 8);
        }
    },
};