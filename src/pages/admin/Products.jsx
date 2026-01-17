import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errMsg, setErrMsg] = useState('');

    const loadProducts = async () => {
        try {
            setErrMsg('');
            const data = await adminService.getProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('ADMIN PRODUCTS LOAD ERROR:', error);
            setErrMsg(error?.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await adminService.deleteProduct(id);
            await loadProducts();
        } catch (error) {
            console.error('ADMIN DELETE ERROR:', error);
            alert(error?.message || 'Failed to delete product');
        }
    };

    if (loading) return <div>Loading products...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Products</h2>
                <Link
                    to="/admin/products/new"
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                    Add Product
                </Link>
            </div>

            {errMsg && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errMsg}
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {product.images?.[0] && (
                                            <img
                                                className="h-10 w-10 rounded-full object-cover mr-3"
                                                src={product.images[0]}
                                                alt=""
                                            />
                                        )}
                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.price} LE
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link
                                        to={`/admin/products/${product.id}`}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {!products.length && !errMsg && (
                            <tr>
                                <td className="px-6 py-6 text-sm text-gray-500" colSpan={4}>
                                    No products found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {products.map((product) => (
                    <div key={product.id} className="bg-white p-4 rounded-lg shadow flex items-start space-x-4">
                        {/* Image */}
                        <div className="flex-shrink-0">
                            {product.images?.[0] ? (
                                <img
                                    className="h-16 w-16 rounded-md object-cover"
                                    src={product.images[0]}
                                    alt=""
                                />
                            ) : (
                                <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">
                                    No Img
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{product.price} LE</p>
                            <div className="mt-2">
                                <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}
                                >
                                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-2">
                            <Link
                                to={`/admin/products/${product.id}`}
                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                                Edit
                            </Link>
                            <button
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
                {!products.length && !errMsg && (
                    <div className="text-center py-8 text-gray-500">
                        No products found.
                    </div>
                )}
            </div>
        </div>
    );
}
