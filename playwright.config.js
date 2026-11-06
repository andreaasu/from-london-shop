import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './tests/browser',
    fullyParallel: false,
    expect: { timeout:15000 },
    use: { baseURL:'http://127.0.0.1:4178', channel:'chrome', screenshot:'only-on-failure', trace:'retain-on-failure' },
    projects: [{ name:'desktop',use:{ viewport:{ width:1440,height:1000 } } },{ name:'mobile',use:{ viewport:{ width:390,height:844 },isMobile:true,hasTouch:true } }],
    webServer: { command:'npm run dev -- --host 127.0.0.1 --port 4178 --strictPort',url:'http://127.0.0.1:4178',reuseExistingServer:false,
        env:{ VITE_SUPABASE_URL:'https://admin-test.supabase.co',VITE_SUPABASE_ANON_KEY:'public-browser-test-key',VITE_USE_SUPABASE:'true' } },
});
