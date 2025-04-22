import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,      // ton adresse Gmail
    pass: process.env.EMAIL_PASS,      // un mot de passe d'application
  },
})

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${process.env.APP_URL}/auth/verify?token=${token}`

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"DZYR" <noreply@dzr.com>',
    to: email,
    subject: 'Confirme ton adresse email – DZYR',
    html: `
      <p>Bienvenue sur DZYR !</p>
      <p>Clique ici pour confirmer ton adresse :</p>
      <p><a href="${url}">${url}</a></p>
    `,
  }

  try {
    const result = await transporter.sendMail(mailOptions)
    console.log('[MAIL] Sent ✅', result)
  } catch (err) {
    console.error('[MAIL ERROR] ❌', err)
  }
}


  