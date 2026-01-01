import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const stored = localStorage.getItem('cart');
            const parsed = stored ? JSON.parse(stored) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    });

    const [isCartOpen, setIsCartOpen] = useState(false); // For Cart Drawer/Modal if used

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, size, color) => {
        if (!size && Array.isArray(product.sizes) && product.sizes.length > 0) {
            console.error('Size is required');
            return;
        }

        const stockAvailable = product.stock_by_size?.[size] ?? 0;

        setCartItems(prev => {
            const existing = prev.find(item =>
                item.id === product.id && item.selectedSize === size && item.selectedColor === color
            );

            if (existing) {
                const newQty = existing.quantity + 1;
                if (newQty > stockAvailable) {
                    alert(`Only ${stockAvailable} items available in size ${size}`);
                    return prev;
                }
                return prev.map(item =>
                    item === existing ? { ...item, quantity: newQty } : item
                );
            }

            if (stockAvailable < 1) {
                alert(`Out of stock for size ${size}`);
                return prev;
            }

            return [...prev, { ...product, selectedSize: size, selectedColor: color, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (id, size, color) => {
        setCartItems(prev => prev.filter(item =>
            !(item.id === id && item.selectedSize === size && item.selectedColor === color)
        ));
    };

    const updateQuantity = (id, size, color, delta) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id && item.selectedSize === size && item.selectedColor === color) {
                const newQty = item.quantity + delta;
                const stockAvailable = item.stock_by_size?.[size] ?? 0;

                if (newQty > stockAvailable) {
                    alert(`Only ${stockAvailable} items available in size ${size}`);
                    return item;
                }
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const clearCart = () => setCartItems([]);

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            subtotal,
            totalItems
        }}>
            {children}
        </CartContext.Provider>
    );
};
