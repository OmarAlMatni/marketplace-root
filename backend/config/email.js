const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    const err = new Error('Email verification is not configured. Set RESEND_API_KEY and EMAIL_FROM.');
    err.status = 503;
    throw err;
  }

  if (!/^re_[^_]/.test(process.env.RESEND_API_KEY)) {
    const err = new Error('RESEND_API_KEY is malformed. Copy a Resend API key beginning with re_.');
    err.status = 503;
    throw err;
  }

  return nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
  });
}

async function sendVerificationEmail({ email, code }) {
  const transporter = getTransporter();
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify your Marketplace account',
      text: `Your Marketplace verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your Marketplace verification code is:</p><p style="font-size: 24px; font-weight: bold; letter-spacing: 6px">${code}</p><p>This code expires in 10 minutes.</p>`,
    });
  } catch (err) {
    if (err.code === 'EAUTH' || err.responseCode === 535) {
      const authError = new Error('Resend rejected RESEND_API_KEY. Generate a new Resend API key and update backend/.env.');
      authError.status = 503;
      authError.code = 'EMAIL_PROVIDER_AUTH';
      throw authError;
    }
    throw err;
  }
}

module.exports = { sendVerificationEmail };