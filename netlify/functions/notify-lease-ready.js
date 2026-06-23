exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) return { statusCode: 500, body: 'RESEND_API_KEY not configured' }
  let body
  try { body = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { tenant_name, tenant_email, property_label, lease_start, lease_end, monthly_rent, signwell_link } = body
  const firstName = tenant_name?.split(' ')[0] || 'there'
  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333"><div style="background:linear-gradient(135deg,#F7E7A6,#D6BC63,#A8862C);padding:24px;border-radius:8px 8px 0 0"><h1 style="margin:0;color:#1a1600;font-size:20px">Your lease is ready to sign</h1></div><div style="background:#f9f9f9;padding:28px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;border-top:none"><p style="font-size:15px;margin:0 0 16px">Hi ${firstName},</p><p style="font-size:15px;margin:0 0 20px">Great news — your lease for <strong>${property_label}</strong> is ready for your review and signature. Please review carefully and sign at your earliest convenience.</p><div style="background:#fff;border:1px solid #e5e5e5;border-radius:6px;padding:16px;margin-bottom:24px"><div style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px">Lease Summary</div><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:5px 0;color:#666;width:140px">Property</td><td style="padding:5px 0;font-weight:bold">${property_label}</td></tr><tr><td style="padding:5px 0;color:#666">Lease term</td><td style="padding:5px 0">${formatDate(lease_start)} – ${formatDate(lease_end)}</td></tr><tr><td style="padding:5px 0;color:#666">Monthly rent</td><td style="padding:5px 0">$${Number(monthly_rent).toLocaleString()}/month</td></tr></table></div><div style="text-align:center;margin-bottom:24px"><a href="${signwell_link}" style="display:inline-block;background:linear-gradient(135deg,#F7E7A6,#D6BC63,#A8862C);color:#1a1600;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:bold;font-size:15px">Review &amp; Sign Lease</a></div><p style="font-size:13px;color:#888;margin:0 0 8px">You can also access your lease anytime through the tenant portal: <a href="https://apply.goldenhivecapital.com/login" style="color:#A8862C">apply.goldenhivecapital.com</a></p><p style="font-size:13px;color:#888;margin:0">Questions? Reply to this email or contact us at <a href="mailto:goldenhivecapital@gmail.com" style="color:#A8862C">goldenhivecapital@gmail.com</a>.</p><div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:12px;color:#aaa">Golden Hive Capital · <a href="https://goldenhivecapital.com" style="color:#aaa">goldenhivecapital.com</a></div></div></div>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Golden Hive Capital <noreply@goldenhivecapital.com>', to: [tenant_email], reply_to: 'goldenhivecapital@gmail.com', subject: `Your lease for ${property_label} is ready to sign`, html }),
  })
  if (!res.ok) { console.error('Resend error:', await res.text()); return { statusCode: 500, body: 'Failed to send email' } }
  return { statusCode: 200, body: 'OK' }
}
