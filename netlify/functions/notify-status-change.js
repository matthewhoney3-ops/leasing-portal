exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) return { statusCode: 500, body: 'RESEND_API_KEY not configured' }
  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { applicant_name, applicant_email, property_label, new_status } = body
  if (!['approved', 'denied'].includes(new_status)) return { statusCode: 200, body: 'No email needed' }
  const firstName = applicant_name?.split(' ')[0] || 'there'
  const isApproved = new_status === 'approved'
  const subject = isApproved ? `Your application for ${property_label} has been approved` : `Update on your application for ${property_label}`
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333"><div style="background:linear-gradient(135deg,#F7E7A6,#D6BC63,#A8862C);padding:24px;border-radius:8px 8px 0 0"><h1 style="margin:0;color:#1a1600;font-size:20px">${isApproved ? 'Application approved' : 'Application update'}</h1></div><div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;border-top:none"><p style="font-size:15px">Hi ${firstName},</p>${isApproved ? `<p style="font-size:15px">Great news — we've reviewed your application for <strong>${property_label}</strong> and we'd love to have you as a tenant. We'll be in touch shortly with your lease.</p>` : `<p style="font-size:15px">Thank you for your interest in <strong>${property_label}</strong>. After reviewing your application, we've decided to move forward with another applicant at this time. We appreciate you taking the time to apply.</p>`}<div style="margin-top:24px"><a href="https://apply.goldenhivecapital.com/login" style="display:inline-block;background:linear-gradient(135deg,#F7E7A6,#D6BC63,#A8862C);color:#1a1600;padding:10px 20px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:14px">View your application</a></div><p style="font-size:13px;color:#999;margin-top:24px">Golden Hive Capital · goldenhivecapital.com</p></div></div>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Golden Hive Capital <noreply@goldenhivecapital.com>', to: [applicant_email], reply_to: 'goldenhivecapital@gmail.com', subject, html }),
  })
  if (!res.ok) { console.error('Resend error:', await res.text()); return { statusCode: 500, body: 'Failed to send email' } }
  return { statusCode: 200, body: 'OK' }
}
