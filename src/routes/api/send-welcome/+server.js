import nodemailer from 'nodemailer';
import { GMAIL_USER, GMAIL_APP_PASSWORD } from '$env/static/private';
import { json } from '@sveltejs/kit';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

export async function POST({ request }) {
  const { email, name } = await request.json();

  await transporter.sendMail({
    from: `Pinakas 🗂️ <${GMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Pinakas 🗂️',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h1 style="font-size:24px;margin-bottom:8px;">Hey ${name ?? 'there'} 👋</h1>
        <p style="color:#444;line-height:1.6;">
          Welcome to <strong>Pinakas</strong> — your team's second brain.
          Your workspace is ready.
        </p>
        <a href="https://pinakas.vercel.app/dashboard"
           style="display:inline-block;margin-top:24px;padding:12px 24px;
                  background:#000;color:#fff;border-radius:8px;text-decoration:none;">
          Open my workspace →
        </a>
        <p style="margin-top:32px;color:#999;font-size:13px;">— The Pinakas team</p>
      </div>
    `
  });

  return json({ success: true });
}
