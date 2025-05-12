import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const LOCATION_EMAILS: Record<string, string> = {
  "Bala Cynwyd Office": "qwenton.balawejder@batp.org",
  "Philadelphia Office": "samantha.power@batp.org",
  "South Philadelphia Satellite Office": "williampower@batp.org"
};

const REQUIRED_DOCUMENTS = ["resume", "degree", "idProof"];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'position', 'location'];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate required documents
    const missingDocuments = REQUIRED_DOCUMENTS.filter(doc => !formData.has(doc));
    if (missingDocuments.length > 0) {
      return NextResponse.json(
        { error: `Missing required documents: ${missingDocuments.join(", ")}` },
        { status: 400 }
      );
    }

    const location = formData.get('location') as string;
    const recipientEmail = LOCATION_EMAILS[location] || process.env.FALLBACK_EMAIL;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email service is not properly configured.');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.verify();

    const mailOptions = {
      from: `"Job Applications" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `New Application for ${formData.get('position')} - ${location}`,
      text: `
Job Application Details:

Candidate Name: ${formData.get('fullName')}
Email: ${formData.get('email')}
Phone: ${formData.get('phone') || 'Not provided'}
Position: ${formData.get('position')}
Location: ${location}

Documents Submitted:
- Resume/CV: ${formData.has('resume') ? 'Yes' : 'No'}
- Degree Certificate: ${formData.has('degree') ? 'Yes' : 'No'}
- ID Proof: ${formData.has('idProof') ? 'Yes' : 'No'}
- Experience Certificates: ${formData.has('experience') ? 'Yes' : 'No'}
- Certification 1: ${formData.has('certification1') ? 'Yes' : 'No'}
- Certification 2: ${formData.has('certification2') ? 'Yes' : 'No'}
- Other Document: ${formData.has('other') ? 'Yes' : 'No'}
      `,
      attachments: [] as any[]
    };

    const documentTypes = [
      'resume', 'degree', 'idProof', 
      'experience', 'certification1', 
      'certification2', 'other'
    ];

    for (const docType of documentTypes) {
      const file = formData.get(docType) as File | null;
      if (file) {
        mailOptions.attachments.push({
          filename: `${docType}_${file.name}`,
          content: Buffer.from(await file.arrayBuffer()),
          contentType: file.type
        });
      }
    }

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
}