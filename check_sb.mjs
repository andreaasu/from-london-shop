import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '.env');
const envFile = readFileSync(envPath, 'utf-8');

const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...ver] = line.split('=');
    if (key && ver) {
        env[key.trim()] = ver.join('=').trim();
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    console.log(error ? 'Error: ' + error.message : 'Keys: ' + Object.keys(data[0] || {}));
}

check();
