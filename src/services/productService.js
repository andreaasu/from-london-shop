import { supabase } from "../lib/supabaseClient";
// import { allProducts } from "../data/products";

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === "true";

// Simulate network delay for mock data
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeProduct(p) {
    if (!p) return p;

    const stockObj = p.stock_by_size && typeof p.stock_by_size === "object" ? p.stock_by_size : {};

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
        if (USE_SUPABASE && supabase) {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq('sku', idOrSku)
                .single();

            if (error) return null;
            return normalizeProduct(data);
        } else {
            await delay(300);
            return allProducts.find((p) => String(p.id) === String(id));
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
