import { supabase } from '../lib/supabaseClient';
// import { allProducts } from '../data/products';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';

// Simulate network delay for mock data
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const productService = {
    async getProducts() {
        if (USE_SUPABASE && supabase) {
            const { data, error } = await supabase.from('products').select('*');
            if (error) throw error;
            return data;
        } else {
            await delay(500); // simulate latency
            return allProducts;
        }
    },

    async getProductById(id) {
        if (USE_SUPABASE && supabase) {
            const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        } else {
            await delay(300);
            return allProducts.find(p => p.id === id);
        }
    },

    async getFeaturedProducts() {
        // Just return a slice for now
        if (USE_SUPABASE && supabase) {
            const { data, error } = await supabase.from('products').select('*').limit(8);
            if (error) throw error;
            return data;
        } else {
            await delay(300);
            return allProducts.slice(0, 8);
        }
    }
};
