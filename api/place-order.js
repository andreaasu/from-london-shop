import { Resend } from 'resend';
import { supabaseAdmin } from './_utils/supabase.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { customer, items } = req.body;

        if (!customer || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        // 1. Call the Supabase RPC
        const { data, error } = await supabaseAdmin.rpc('place_order', {
            customer,
            items
        });

        if (error) {
            console.error('Supabase RPC Error:', error);
            return res.status(500).json({ error: error.message });
        }

        const { orderId, total } = data;

        // 2. Format Items list for email
        const itemsListHtml = items.map(item =>
            `<li>Product ID: ${item.productId}, Size: ${item.size}, Quantity: ${item.qty}</li>`
        ).join('');

        const ownerEmail = process.env.OWNER_ORDER_EMAIL;
        const fromEmail = process.env.ORDER_FROM_EMAIL;

        const fetchPromises = [];

        if (ownerEmail && fromEmail && resend) {
            // 3. Send email to Owner
            fetchPromises.push(
                resend.emails.send({
                    from: fromEmail,
                    to: ownerEmail,
                    subject: `New order received #${orderId}`,
                    html: `
                        <h1>New Order Received</h1>
                        <p><strong>Order ID:</strong> ${orderId}</p>
                        <p><strong>Total:</strong> ${total}</p>
                        <h2>Customer Details:</h2>
                        <ul>
                            <li><strong>Name:</strong> ${customer.name}</li>
                            <li><strong>Phone:</strong> ${customer.phone}</li>
                            <li><strong>Email:</strong> ${customer.email || 'N/A'}</li>
                            <li><strong>City:</strong> ${customer.city}</li>
                            <li><strong>Address:</strong> ${customer.address}</li>
                            <li><strong>Notes:</strong> ${customer.notes || 'N/A'}</li>
                        </ul>
                        <h2>Order Items:</h2>
                        <ul>
                            ${itemsListHtml}
                        </ul>
                    `
                })
            );
        }

        if (customer.email && fromEmail && resend) {
            // 4. Send email to Customer
            fetchPromises.push(
                resend.emails.send({
                    from: fromEmail,
                    to: customer.email,
                    subject: `Your From London order #${orderId}`,
                    html: `
                        <h1>Thank you for your order!</h1>
                        <p>Your order <strong>#${orderId}</strong> has been received and will be processed soon.</p>
                        <p><strong>Order Total:</strong> ${total}</p>
                        <p>We will contact you shortly regarding the delivery.</p>
                        <p>Thank you for shopping with From London!</p>
                    `
                })
            );
        }

        //  await Promise.allSettled(fetchPromises);
        const results = await Promise.allSettled(fetchPromises);
        console.log("Email results:", JSON.stringify(results, null, 2));

        // 5. Return success to the client
        return res.status(200).json({ orderId, total });

    } catch (err) {
        console.error('Unexpected error in place-order:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
