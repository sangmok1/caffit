import { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { subject, email, content } = req.body

  if (!subject || !email || !content) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  try {
    // 환경변수 확인
    console.log('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? '***' : 'missing'
    })

    // SMTP transporter 설정
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // TLS 사용
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // 이메일 전송
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'tkdahr1331@gmail.com',
      replyTo: email,
      subject: `${subject} [caffit]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5D4037; border-bottom: 2px solid #C8A27A; padding-bottom: 10px;">
            Caffit Contact Form
          </h2>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #F5E9D9; border-radius: 8px;">
            <p><strong>제목:</strong> ${subject}</p>
            <p><strong>회신받을 메일주소:</strong> ${email}</p>
          </div>
          
          <div style="margin: 20px 0; padding: 15px; border: 1px solid #E0C9A6; border-radius: 8px;">
            <h3 style="color: #5D4037; margin-top: 0;">문의 내용:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${content}</p>
          </div>
          
          <footer style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #E0C9A6; color: #8D6E63; font-size: 12px;">
            <p>Caffit Contact Form에서 전송된 메시지입니다.</p>
            <p>회신은 ${email}로 보내주세요.</p>
          </footer>
        </div>
      `,
    })

    console.log('Email sent successfully!')
    res.status(200).json({ message: 'Email sent successfully' })
  } catch (error) {
    console.error('Email sending error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    res.status(500).json({ 
      message: 'Failed to send email',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 