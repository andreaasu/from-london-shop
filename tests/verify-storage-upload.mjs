// Opt-in live check: creates one optimized image, never edits products or existing objects.
import { readFile, writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const {data:bucket,error:bucketError} = await db.storage.getBucket('product-images');
if (bucketError) throw bucketError;
const bytes = await readFile('outputs/image-optimization/monster1.png.webp');
const path = `admin/optimization-check-${crypto.randomUUID()}.webp`;
const {error} = await db.storage.from('product-images').upload(path,bytes,{contentType:'image/webp',upsert:false});
if (error) throw error;
const url = db.storage.from('product-images').getPublicUrl(path).data.publicUrl;
const response = await fetch(url);
const loaded = Buffer.from(await response.arrayBuffer());
if (!response.ok || !bytes.equals(loaded) || !response.headers.get('content-type')?.includes('image/webp')) throw new Error('Uploaded image did not load correctly.');
const result = {bucket:bucket.name,public:bucket.public,allowedMimeTypes:bucket.allowed_mime_types,fileSizeLimit:bucket.file_size_limit,url,bytes:bytes.length,verified:true};
await writeFile('outputs/image-optimization/storage-result.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
