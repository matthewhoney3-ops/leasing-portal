exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) return { statusCode: 500, body: 'RESEND_API_KEY not configured' }
  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { applicant_name, applicant_email, applicant_phone, property_label,
          employment_status, monthly_income, num_occupants, desired_move_in,
          prior_eviction, reason_for_moving } = body
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333"><div style="background:linear-gradient(135deg,#F7E7A6,#D6BC63,#A8862C);padding:24px;border-radius:8px 8px 0 0"><h1 style="margin:0;color:#1a1600;font-size:20px">New application received</h1></div><div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;border-top:none"><h2 style="margin:0 0 16px;font-size:16px">${property_label}</h2><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:6px 0;color:#666;width:160px">Name</td><td><strong>${applicant_name}</strong></td></tr><tr><td style="padding:6px 0;color:#666">Email</td><td>${applicant_email}</td></tr>${applicant_phone ? `<tr><td style="padding:6px 0;color:#666">Phone</td><td>${applicant_phone}</td></tr>` : ''}${employment_status ? `<tr><td style="padding:6px 0;color:#666">Employment</td><td>${employment_status.replace(/_/g,' ')}</td></tr>` : ''}${monthly_income ? `<tr><td style="padding:6px 0;color:#666">Monthly income</td><td>$${Number(monthly_income).toLocaleString()}</td></tr>` : ''}${num_occupants ? `<tr><td style="padding:6px 0;color:#666">Occupants</td><td>${num_occupants}</td></tr>` : ''}${desired_move_in ? `<tr><td style="padding:6px 0;color:#666">Move-in</td><td>${desired_move_in}</td></tr>` : ''}${prior_eviction !== undefined ? `<tr><td style="padding:6px 0;color:#666">Prior eviction</td><td style="${prior_eviction ? 'color:#c00;font-weight:bold' : ''}">${prior_eviction ? 'Yes' : 'No'}</td></tr>` : ''}${reason_for_moving ? `<tr><td style="padding:6px 0;color:#666">Reason for moving</td><td>${reason_for_moving}</td></tr>` : ''}</table><div style="margin-top:20px"><a href="https://apply.goldenhivecapital.com/dashboard" style="display:inline-block;background:linear-gradient(135deg,#F7E7A6,#D6BC63,#A8862C);color:#1a1600;padding:10px 20px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:14px">View in portal</a></div></div></div>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Golden Hive Capital <noreply@goldenhivecapital.com>', to: ['goldenhivecapital@gmail.com'], subject: `New application — ${applicant_name} for ${property_label}`, html }),
  })
  if (!res.ok) { console.error('Resend error:', await res.text()); return { statusCode: 500, body: 'Failed to send email' } }
  return { statusCode: 200, body: 'OK' }
}
