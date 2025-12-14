import nodemailer from 'nodemailer';

export function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_USER, EMAIL_APP_PASSWORD } = process.env;

  // Support Gmail with app password
  if (EMAIL_USER && EMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_APP_PASSWORD,
      },
    });
  }

  // Support custom SMTP
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  // Fallback: console logger transport for dev
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

export async function sendEmail({ to, subject, html }) {
  const { EMAIL_USER, MAIL_FROM, SMTP_HOST } = process.env;
  const from = MAIL_FROM || EMAIL_USER || 'no-reply@ryuha.local';
  const transport = getTransport();

  // Log email to console if no credentials configured (Dev mode)
  if (!EMAIL_USER && !SMTP_HOST) {
    console.log('\n========== EMAIL DEBUG ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Content:', html);
    console.log('=================================\n');
  }

  return transport.sendMail({ from, to, subject, html });
}

export async function sendBulkEmails({ recipients, subject, html }) {
  const transport = getTransport();
  const { EMAIL_USER, MAIL_FROM } = process.env;
  const from = MAIL_FROM || EMAIL_USER || 'no-reply@ryuha.local';

  // Send emails in batches to avoid overwhelming the server
  const batchSize = 10;
  const results = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const batchPromises = batch.map(email =>
      transport.sendMail({ from, to: email, subject, html })
        .then(() => ({ email, success: true }))
        .catch(error => {
          console.error(`Failed to send email to ${email}:`, error);
          return { email, success: false, error: error.message };
        })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}


