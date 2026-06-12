// src/routes/api/send-welcome/+server.js
import nodemailer from 'nodemailer';
import { GMAIL_USER, GMAIL_APP_PASSWORD } from '$env/static/private';
import { json } from '@sveltejs/kit';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,        // your gmail e.g. pinakas.app@gmail.com
    pass: GMAIL_APP_PASSWORD // 16-char app password, NOT your real password
  }
});

export async function POST({ request }) {
  const { email, name } = await request.json();

  await transporter.sendMail({
    from: `Pinakas 🗂️ <${GMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Pinakas 🗂️',
    html: `<p>Hey ${name ?? 'there'} 👋, welcome to Pinakas!</p>`
  });

  return json({ success: true });
}
