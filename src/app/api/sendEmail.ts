// File: pages/api/sendEmail.js
import nodemailer from "nodemailer";

interface EmailRequestBody {
    email: string;
    subject: string;
    text: string;
}

interface EmailResponse {
    message?: string;
    error?: string;
    details?: string;
}

export default async function handler(req: { body: EmailRequestBody }, res: { status: (code: number) => { json: (body: EmailResponse) => void } }) {
    const { email, subject, text } = req.body;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.GODADDY_EMAIL,
            pass: process.env.GODADDY_PASSWORD,
        },
    });

    try {
        await transporter.sendMail({
            from: process.env.GODADDY_EMAIL,
            to: email,
            subject,
            text,
        });
        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error sending email", details: (error as any).message });
    }
}
