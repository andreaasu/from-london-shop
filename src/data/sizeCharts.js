const womenSource = 'https://www.primark.com/en-gb/p/pure-cotton-flannel-boyfriend-pyjamas-navy-991187289528';
const babySource = 'https://www.primark.com/en-gb/p/0-12mths-disneys-babys-ratatouille-christmas-twinning-pyjamas-blue-991192035505';

// Transcribed from each Primark product's interactive Size Guide, 2026-11-15.
// Source URLs are internal provenance only. Measurements describe the body.
export const sizeCharts = {
    women: {
        label: 'Women', source: womenSource,
        title: "Women's pyjama size guide",
        description: 'Compare your body measurements with the size below. Allow for the fit and fabric of your pyjamas.',
        columns: ['Size', 'Bust', 'Waist', 'Hips'],
        measurements: {
            cm: [['XS','82–89','65–72','91–94'],['S','90–94','73–77','95–102'],['M','95–99','78–82','103–106'],['L','100–107','83–88','107–112'],['XL','108–115','89–99','113–122'],['2XL','116–125','100–110','123–132']],
            in: [['XS','32.25–35','25.5–28.25','36–37'],['S','35.5–37','28.75–30.25','37.5–40.25'],['M','37.75–39','30.5–32.25','40.5–41.75'],['L','39.25–42.25','32.5–34.75','42.25–44'],['XL','42.5–45.25','35–39','44.5–48'],['2XL','45.5–49.25','39.25–43.25','48.5–52']],
        },
        images: [{ src: '/size-guides/women-measurements.png', alt: 'Bust, waist and hip measurement positions' }, { src: '/size-guides/women-trousers.png', alt: 'Waist, hip and inside leg measurement positions' }],
        help: 'Measure around the fullest part of your bust and hips, and around your natural waist. Keep the tape level without pulling it tight.',
    },
    men: {
        label: 'Men', source: 'https://www.primark.com/en-gb/p/mens-santa-stripe-family-christmas-pyjamas-red-991190600352',
        title: "Men's pyjama size guide",
        description: 'Compare your body measurements with the size below. Allow for the fit and fabric of your pyjamas.',
        columns: ['Size', 'Chest', 'Waist'],
        measurements: {
            cm: [['XS','89–91','71–76'],['S','91–96','76–81.5'],['M','96.5–101.5','84–89'],['L','104–109','91.5–99'],['XL','112–117','101.5–106.5'],['2XL','119.5–124.5','109–114.5']],
            in: [['XS','35–36','28–30'],['S','36–38','30–32'],['M','38–40','33–35'],['L','41–43','36–39'],['XL','44–46','40–42'],['2XL','47–49','43–45']],
        },
        images: [{ src: '/size-guides/men-top.png', alt: 'Chest, waist and hip measurement positions' }, { src: '/size-guides/men-trousers.png', alt: 'Waist, hip and inside leg measurement positions' }],
        help: 'Measure around the fullest part of your chest, just below your arms, and around your natural waist. Keep the tape level and comfortably against your body.',
    },
    kids: {
        label: 'Kids', source: 'https://www.primark.com/en-gb/p/1-15yrs-kids-the-grinch-family-christmas-pyjamas-dark-green-991189421415',
        columns: ['Age (years)', 'Height (cm)'],
        rows: [['1.5–2','86–92'],['2–3','92–98'],['3–4','98–104'],['4–5','104–110'],['5–6','110–116'],['6–7','116–122'],['7–8','122–128'],['8–9','128–134'],['9–10','134–140'],['10–11','140–146'],['11–12','146–152'],['12–13','152–158'],['13–14',164],['14–15',165]],
        help: 'Measure height from the top of the head to the floor without shoes. Age is a starting point; compare height and check the product’s fit details.',
    },
    baby: {
        label: 'Babies', source: babySource,
        columns: ['Age / size', 'Height (cm)'],
        rows: [['Newborn','44–50'],['Up to 1 month','50–56'],['0–3 months','56–62'],['3–6 months','62–68'],['6–9 months','68–74'],['9–12 months','74–80'],['12–18 months','80–86'],['18–24 months','86–92'],['24–36 months','92–98']],
        help: 'Measure your baby’s full length from head to heel. Compare length first; babies of the same age can need different sizes.',
    },
    lingerie: {
        label: 'Lingerie', source: 'https://www.primark.com/en-gb/p/3pk-microfibre-ribbed-hipster-briefs-burgundy-991181114368',
        description: 'Match your usual size to letter-sized lingerie below.',
        columns: ['Size', 'UK / Ireland', 'Europe'],
        rows: [['XS','6–8','34–36'],['S','10–12','38–40'],['M','12–14','40–42'],['L','14–16','42–44'],['XL','18–20','46–48'],['2XL','22–24','50–52']],
        images: [{ src: '/size-guides/women-measurements.png', alt: 'Bust, waist and hip measurement positions' }],
        help: 'Measure around your natural waist and the fullest part of your hips. This chart covers letter-sized lingerie. Bras require a band and cup size; contact us for help with your item.',
    },
};

export function getSizeChartCategory(product) {
    const aliases = { women: 'women', woman: 'women', men: 'men', man: 'men', kids: 'kids', children: 'kids', boys: 'kids', girls: 'kids', baby: 'baby', babies: 'baby', babys: 'baby', lingerie: 'lingerie', lingeri: 'lingerie' };
    const category = aliases[String(product?.category || '').trim().toLowerCase()];
    const gender = aliases[String(product?.gender || '').trim().toLowerCase()];
    return category || gender || '';
}
