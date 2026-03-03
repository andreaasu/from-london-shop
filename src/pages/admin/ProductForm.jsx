import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { supabase } from '../../lib/supabaseClient';

export default function ProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        gender: 'women', // default
        images: [],
        stock_by_size: {},
        in_stock: false
    });

    const [sizeInput, setSizeInput] = useState({ size: '', qty: 1 });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            loadProduct();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadProduct = async () => {
        try {
            const product = await adminService.getProduct(id);
            if (product) setFormData(product);
        } catch (err) {
            console.error(err);
            alert('Failed to load product');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCreateSize = () => {
        if (!sizeInput.size) return;
        const newStock = {
            ...(formData.stock_by_size || {}),
            [sizeInput.size]: parseInt(sizeInput.qty, 10)
        };

        const hasStock = Object.values(newStock).some((q) => Number(q) > 0);

        setFormData((prev) => ({
            ...prev,
            stock_by_size: newStock,
            in_stock: hasStock
        }));
        setSizeInput({ size: '', qty: 1 });
    };

    const removeSize = (size) => {
        const newStock = { ...(formData.stock_by_size || {}) };
        delete newStock[size];
        const hasStock = Object.values(newStock).some((q) => Number(q) > 0);
        setFormData((prev) => ({
            ...prev,
            stock_by_size: newStock,
            in_stock: hasStock
        }));
    };

    const handleImageUpload = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);

            setFormData((prev) => ({
                ...prev,
                images: [...(prev.images || []), data.publicUrl]
            }));
        } catch (error) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        setFormData((prev) => ({
            ...prev,
            images: (prev.images || []).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Build payload safely (do NOT send id)
            const payload = {
                ...formData,
                gender: (formData.gender || '').toLowerCase(),
                price: Number(formData.price),
                stock_by_size: formData.stock_by_size || {}
            };

            delete payload.id; // important: DB trigger generates it
            if (Array.isArray(payload.images) && payload.images.length === 0) delete payload.images;

            if (isEdit) {
                await adminService.updateProduct(id, payload);
            } else {
                await adminService.createProduct(payload);
            }

            navigate('/admin/products');
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Product' : 'New Product'}</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Price (LE)</label>
                        <input
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        rows="3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Gender</label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    >
                        <option value="women">Women</option>
                        <option value="men">Men</option>
                        <option value="kids">Kids</option>
                        <option value="baby">Baby</option>
                        <option value="footwear">Footwear</option>
                        <option value="lingerie">Lingerie</option>
                    </select>
                </div>

                {/* Stock by Size */}
                <div className="border p-4 rounded bg-gray-50">
                    <h3 className="text-sm font-bold mb-2">Stock by Size</h3>
                    <div className="flex gap-2 mb-2">
                        <input
                            placeholder="Size (e.g. M)"
                            value={sizeInput.size}
                            onChange={(e) => setSizeInput({ ...sizeInput, size: e.target.value })}
                            className="border p-1 text-sm rounded w-20"
                        />
                        <input
                            type="number"
                            placeholder="Qty"
                            value={sizeInput.qty}
                            onChange={(e) => setSizeInput({ ...sizeInput, qty: e.target.value })}
                            className="border p-1 text-sm rounded w-16"
                        />
                        <button
                            type="button"
                            onClick={handleCreateSize}
                            className="px-3 py-1 bg-gray-800 text-white text-xs rounded"
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {Object.entries(formData.stock_by_size || {}).map(([size, qty]) => (
                            <span
                                key={size}
                                className="bg-white border px-2 py-1 text-sm rounded flex items-center gap-2"
                            >
                                {size}: {qty}
                                <button
                                    type="button"
                                    onClick={() => removeSize(size)}
                                    className="text-red-500 font-bold ml-1"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Images */}
                <div className="border p-4 rounded bg-gray-50">
                    <h3 className="text-sm font-bold mb-2">Images</h3>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="mb-2 text-sm"
                    />
                    {uploading && <div className="text-xs text-blue-600">Uploading...</div>}

                    <div className="flex gap-2 overflow-x-auto mt-2">
                        {(formData.images || []).map((url, idx) => (
                            <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                                <img src={url} alt="" className="w-full h-full object-cover rounded" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white p-3 rounded font-bold hover:bg-gray-800"
                >
                    {loading ? 'Saving...' : 'Save Product'}
                </button>
            </form>
        </div>
    );
}