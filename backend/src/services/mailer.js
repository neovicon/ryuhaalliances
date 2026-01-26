import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  const { EMAIL_USER, MAIL_FROM, RESEND_API_KEY } = process.env;
  const from = MAIL_FROM || 'Ryuha Alliance <onboarding@resend.dev>'; // Default Resend testing domain

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is missing');
    // Fallback logging for dev if key missing
    console.log('\n========== EMAIL DEBUG (No Key) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Content:', html);
    console.log('==========================================\n');
    return;
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error('Resend Error:', error);
    throw error;
  }
}

export async function sendBulkEmails({ recipients, subject, html }) {
  const { MAIL_FROM } = process.env;
  const from = MAIL_FROM || 'Ryuha Alliance <onboarding@resend.dev>';

  // Resend supports batch sending, but for simplicity and rate limits on free tier, 
  // we'll stick to sequential or small batches if needed. 
  // For now, let's map over recipients.

  const results = [];
  for (const email of recipients) {
    try {
      await sendEmail({ to: email, subject, html });
      results.push({ email, success: true });
    } catch (error) {
      results.push({ email, success: false, error: error.message });
    }
    // Small delay to be safe
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}
