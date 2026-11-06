import nodemailer from 'nodemailer';
import { buildOrderEmail } from './order-email.js';

export function customerCanBeConfirmed(order) {
    const method = String(order.payment_method || 'cod').toLowerCase();
    return ['cod', 'cash_on_delivery', 'cash on delivery'].includes(method) || order.payment_status === 'paid';
}

export function createGmailTransport(env = process.env) {
    if (!env.SMTP_USER?.trim() || !env.SMTP_APP_PASSWORD?.replace(/\s/g, '')) return null;
    return nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 465, secure: true,
        auth: { user: env.SMTP_USER.trim(), pass: env.SMTP_APP_PASSWORD.replace(/\s/g, '') },
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
        disableFileAccess: true, disableUrlAccess: true,
    });
}

// A definite SMTP rejection or failure before message submission is safe to retry.
// Disconnects/timeouts during DATA may mean Gmail accepted the message already.
export function safeToRetrySmtp(error) {
    return (Number(error.responseCode) >= 400 && Number(error.responseCode) <= 599) ||
        ['EAUTH', 'EDNS'].includes(error.code) ||
        ['CONN', 'EHLO', 'HELO', 'AUTH', 'MAIL FROM', 'RCPT TO'].includes(error.command);
}

export async function processOrderNotifications(db, { orderId = null, limit = 10, env = process.env, client } = {}) {
    const { data: jobs, error } = await db.rpc('claim_order_notifications', { p_order_id: orderId, p_limit: limit });
    if (error) throw new Error('Notification queue unavailable');
    // No SMTP initialization at module import or before order creation.
    let transport = client;
    const summary = { sent: 0, failed: 0, skipped: 0 };
    for (const job of jobs || []) {
        const save = async fields => {
            const { data, error: updateError } = await db.from('order_notifications').update(fields)
                .eq('id', job.id).eq('lease_token', job.lease_token).select('id');
            if (updateError || !data?.length) throw new Error('Notification log write failed');
        };
        let submissionStarted = false;
        let accepted = false;
        try {
            transport ||= createGmailTransport(env);
            const order = job.snapshot.order;
            if (job.kind === 'customer' && !order.email) {
                await save({ status: 'skipped', last_error: 'No saved customer email', lease_until: null });
                summary.skipped++;
                continue;
            }
            if (job.kind === 'customer' && !customerCanBeConfirmed(order)) {
                await save({ status: 'review', last_error: 'Prepaid order requires verified payment', lease_until: null });
                continue;
            }
            if (!transport || !env.SMTP_USER || !env.EMAIL_FROM || (job.kind === 'admin' && !env.ORDER_NOTIFICATION_EMAIL)) throw new Error('Missing email configuration');
            const message = job.message || {
                from: env.EMAIL_FROM,
                to: job.kind === 'admin' ? env.ORDER_NOTIFICATION_EMAIL : order.email,
                ...buildOrderEmail(job.snapshot, job.kind),
            };
            // Stable Message-ID helps reconciliation; SMTP does NOT deduplicate it.
            const mail = { ...message, messageId: message.messageId || `<order-notification-${job.id}@gmail.com>` };
            if (!job.message || !job.message.messageId) await save({ message: mail });

            // Persist a hold BEFORE calling SMTP. If Vercel stops mid-send, the cron
            // cannot automatically send the same job again. No new DB fields needed.
            await save({ status: 'review', last_error: 'SMTP submission started; reconcile if interrupted' });
            submissionStarted = true;
            console.info('order_email_attempt', { notificationId: job.id, kind: job.kind, attempt: job.attempts });
            let timeout;
            let result;
            try {
                result = await Promise.race([
                    transport.sendMail(mail),
                    new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('SMTP outcome unknown')), 18000); }),
                ]);
            } finally {
                clearTimeout(timeout);
            }
            accepted = Boolean(result.accepted?.length);
            if (!accepted) throw Object.assign(new Error('SMTP recipient not accepted'), result.rejected?.length ? { responseCode: 550 } : {});
            // Preserve the existing column name to avoid a schema change. It now
            // stores Nodemailer's Message-ID in the existing legacy column.
            await save({ status: 'sent', resend_id: result.messageId || mail.messageId, sent_at: new Date().toISOString(), last_error: null, lease_until: null });
            summary.sent++;
        } catch (err) {
            summary.failed++;
            const retry = !submissionStarted || (!accepted && safeToRetrySmtp(err));
            console.error('order_email_failed', { notificationId: job.id, kind: job.kind, attempt: job.attempts, review: !retry });
            try {
                await save({ status: retry ? 'pending' : 'review',
                    last_error: !retry ? 'SMTP outcome uncertain or acknowledgement failed; reconcile before retrying'
                        : err.message === 'Missing email configuration' ? err.message : 'SMTP rejected or pre-submission failure',
                    next_attempt_at: new Date(Date.now() + Math.min(3600, 60 * 2 ** Math.min(job.attempts, 6)) * 1000).toISOString(), lease_until: null });
            } catch {
                console.error('order_email_log_failed', { notificationId: job.id });
            }
        }
    }
    return summary;
}
