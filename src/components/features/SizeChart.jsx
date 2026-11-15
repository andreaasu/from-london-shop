import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ruler, X } from 'lucide-react';
import { getSizeChartCategory, sizeCharts } from '../../data/sizeCharts';

export default function SizeChart({ product }) {
    const dialogRef = useRef(null);
    const category = getSizeChartCategory(product);
    const [unit, setUnit] = useState('cm');
    const chart = sizeCharts[category];

    if (!chart) return <Link to="/contact" className="text-sm underline text-gray-600">Need sizing help?</Link>;

    function openChart() {
        dialogRef.current.showModal();
    }

    return <>
        <button type="button" onClick={openChart} className="inline-flex items-center gap-1.5 text-sm underline text-gray-600 hover:text-black" aria-haspopup="dialog">
            <Ruler size={16} aria-hidden="true" /> Size chart
        </button>
        <dialog ref={dialogRef} aria-labelledby="size-chart-title" className="w-[calc(100%-2rem)] max-w-3xl max-h-[85dvh] overflow-y-auto rounded-xl p-0 backdrop:bg-black/50" onClick={event => {
            if (event.target !== event.currentTarget) return;
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialogRef.current.close();
        }}>
            <div className="p-5 sm:p-8 text-gray-900">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h2 id="size-chart-title" className="text-2xl font-bold">{chart.title || `${chart.label} size guide`}</h2>
                    <button type="button" autoFocus onClick={() => dialogRef.current.close()} aria-label="Close size guide" className="p-2 rounded-full hover:bg-gray-100"><X size={22} /></button>
                </div>
                <p className="text-sm text-gray-600 mb-5">{chart.description || 'Find your fit using the guide below.'}</p>
                {(category === 'women' || category === 'men') && <section className="rounded-lg border border-gray-200 p-4 mb-5" aria-label="Our size recommendations">
                    <h3 className="font-bold mb-3">Our recommendation by weight</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                        {[['XS', '45–55'], ['S', '55–65'], ['M', '65–75'], ['L', '75–85'], ['XL', '85–95'], ['2XL', '95–105']].map(([size, weight]) => <div key={size} className="rounded-lg bg-gray-50 p-2"><span className="block font-bold text-sm">{size}</span><span className="block text-xs text-gray-600 mt-1">{weight} kg</span></div>)}
                    </div>
                    <p className="text-xs text-gray-600 mt-3">Approximate recommendations from From London. Height, body shape and preferred fit can affect your size; check the body measurements below too.</p>
                </section>}
                {chart.measurements && <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 mb-4 text-sm text-gray-800">
                    <p className="font-bold">Full body circumference — all the way around</p>
                    <p className="mt-1">Wrap the tape measure all the way around your body for each measurement. These values are not the width of pyjamas laid flat or measured from armpit to armpit.</p>
                </div>}
                {chart.measurements && <div className="flex justify-end mb-3 gap-1" role="group" aria-label="Measurement units">{['cm', 'in'].map(value => <button key={value} type="button" aria-pressed={unit === value} onClick={() => setUnit(value)} className={`px-4 py-2 text-xs font-bold uppercase rounded-full ${unit === value ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>{value}</button>)}</div>}
                <div className="overflow-x-auto border border-gray-200 rounded">
                    <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
                        <caption className="sr-only">{chart.label} size chart</caption>
                        <thead className="bg-gray-100"><tr>{chart.columns.map(column => <th key={column} scope="col" className="px-2 sm:px-4 py-3 font-semibold">{chart.measurements && column !== 'Size' ? `${column} (${unit})` : column}</th>)}</tr></thead>
                        <tbody>{(chart.measurements ? chart.measurements[unit] : chart.rows).map(row => <tr key={row[0]} className="border-t border-gray-100"><th scope="row" className="px-2 sm:px-4 py-3 font-bold">{row[0]}</th>{row.slice(1).map((cell, index) => <td key={index} className="px-2 sm:px-4 py-3">{cell}</td>)}</tr>)}</tbody>
                    </table>
                </div>
                <h3 className="font-bold mt-5 mb-2">How to measure</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{chart.help}</p>
                {chart.images && <figure className="mt-4">
                    <div className="grid grid-cols-2 gap-3">{chart.images.map(img => <img key={img.src} src={img.src} alt={img.alt} width="600" height="904" className="w-full h-auto max-h-72 object-contain rounded-lg border border-gray-100" />)}</div>
                    <figcaption className="text-xs text-gray-600 mt-2">The illustrations show where to measure. For bust, chest, waist and hips, wrap the tape all the way around your body.</figcaption>
                </figure>}
                <div className="text-sm mt-5 pt-4 border-t border-gray-100">
                    <Link to="/contact" onClick={() => dialogRef.current.close()} className="underline">Need sizing help?</Link>
                </div>
            </div>
        </dialog>
    </>;
}

