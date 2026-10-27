export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { name, email, message } = req.body || {};

    if (!email || !message) {
        return res.status(400).json({ error: 'Email and message are required fields.' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY environment variable is missing.');
        return res.status(500).json({ error: 'Email service configuration error: Missing API Key.' });
    }

    // If you haven't verified a custom domain on Resend yet, Resend sends from 'onboarding@resend.dev'
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const toEmail = process.env.RESEND_TO_EMAIL || 'meghanaagnur@gmail.com';
    const senderName = name ? name.trim() : 'Portfolio Visitor';

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `${senderName} <${fromEmail}>`,
                to: [toEmail],
                reply_to: email,
                subject: `New Portfolio Message from ${senderName}`,
                text: `Name: ${senderName}\nEmail: ${email}\n\nMessage:\n${message}`,
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; line-height: 1.6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; background: #ffffff;">
                        <h2 style="font-size: 1.25rem; font-weight: 600; margin-top: 0; margin-bottom: 1rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.75rem; color: #111827;">New Portfolio Message</h2>
                        <p style="margin: 0.5rem 0;"><strong>Sender Name:</strong> ${senderName}</p>
                        <p style="margin: 0.5rem 0;"><strong>Sender Email:</strong> <a href="mailto:${email}" style="color: #6366f1; text-decoration: none;">${email}</a></p>
                        <div style="margin-top: 1.25rem; padding: 1rem; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                            <p style="margin: 0; white-space: pre-wrap; font-size: 0.95rem; color: #374151;">${message}</p>
                        </div>
                        <p style="margin-top: 1.5rem; font-size: 0.8rem; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 0.75rem;">
                            Direct reply enabled: simply reply to this email to contact ${email}.
                        </p>
                    </div>
                `
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API returned error:', data);
            return res.status(response.status).json({ error: data.message || 'Failed to dispatch email via Resend' });
        }

        return res.status(200).json({ success: true, id: data.id });
    } catch (err) {
        console.error('Server error handling contact form:', err);
        return res.status(500).json({ error: 'Internal server error processing email.' });
    }
}
