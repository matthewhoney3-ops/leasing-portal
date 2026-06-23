import {
  Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, TabStopType, TabStopPosition,
  PageBreak, UnderlineType,
} from 'docx'

const PAGE_WIDTH = 12240
const PAGE_HEIGHT = 15840
const MARGIN = 1080
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

// ─── helpers ────────────────────────────────────────────────────────────────

function hr() {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' } },
    children: [new TextRun('')],
  })
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 160 },
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    indent: opts.indent ? { left: 360 } : undefined,
    children: [new TextRun({ text, size: opts.size ?? 22, bold: opts.bold, font: 'Times New Roman' })],
  })
}

function blankLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [new TextRun('')] })
}

function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Times New Roman', allCaps: true })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 2 } },
  })
}

function subsectionTitle(num, text) {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: `${num}. ${text}`, bold: true, size: 22, font: 'Times New Roman' })],
  })
}

function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360, hanging: 180 },
    children: [
      new TextRun({ text: '\u2022  ', font: 'Times New Roman', size: 22 }),
      new TextRun({ text, font: 'Times New Roman', size: 22 }),
    ],
  })
}

function labeledItem(label, value) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22, font: 'Times New Roman' }),
      new TextRun({ text: value || '___________________________', size: 22, font: 'Times New Roman' }),
    ],
  })
}

function signatureLine() {
  return new Paragraph({
    spacing: { before: 560, after: 0 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
    children: [new TextRun('')],
  })
}

function signatureLabelRow(leftLabel, rightLabel) {
  return new Paragraph({
    spacing: { after: 400 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({ text: leftLabel, size: 18, color: '555555', font: 'Times New Roman' }),
      new TextRun({ text: `\t${rightLabel}`, size: 18, color: '555555', font: 'Times New Roman' }),
    ],
  })
}

function signatureBlock(role, name) {
  return [
    signatureLine(),
    signatureLabelRow(`${role} Signature`, 'Date'),
    signatureLine(),
    signatureLabelRow(`${role} Printed Name: ${name || ''}`, ''),
  ]
}

function summaryTable(rows) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
  const borders = { top: border, bottom: border, left: border, right: border }
  const labelW = 3600
  const valueW = CONTENT_WIDTH - labelW
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [labelW, valueW],
    rows: rows.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          borders, width: { size: labelW, type: WidthType.DXA },
          shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Times New Roman' })] })],
        }),
        new TableCell({
          borders, width: { size: valueW, type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: value || '—', size: 20, font: 'Times New Roman' })] })],
        }),
      ],
    })),
  })
}

function ordinal(n) {
  const num = Number(n)
  const s = ['th','st','nd','rd'], v = num % 100
  return num + (s[(v-20)%10] || s[v] || s[0])
}

function money(v) {
  const n = Number(v)
  return isNaN(n) ? String(v) : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

// ─── main export ─────────────────────────────────────────────────────────────

export function buildLeaseDocument(d) {
  const firstName = d.tenantNames?.split(' ')[0] || 'Tenant'
  const landlordName = d.landlordName || 'Golden Hive Capital'
  const propertyLabel = d.propertyLabel || ''
  const propertyAddress = d.propertyAddress || ''

  // ── COVER PAGE ──────────────────────────────────────────────────────────
  const coverPage = [
    new Paragraph({
      spacing: { before: 1440, after: 240 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'RESIDENTIAL LEASE AGREEMENT', bold: true, size: 36, font: 'Times New Roman', allCaps: true })],
    }),
    new Paragraph({
      spacing: { after: 120 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: propertyAddress, bold: true, size: 26, font: 'Times New Roman' })],
    }),
    new Paragraph({
      spacing: { after: 2400 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Arizona Residential Lease', size: 22, color: '666666', font: 'Times New Roman' })],
    }),
    hr(),
    blankLine(),
    para('This lease was prepared for use in the State of Arizona and is intended to comply with the Arizona Residential Landlord and Tenant Act (A.R.S. § 33-1301 et seq.). Some localities may impose additional requirements not reflected in this lease. If you have questions about the legal implications of this lease, please consult a licensed Arizona attorney.', { align: AlignmentType.LEFT }),
    blankLine(),
    para('This Lease constitutes the entire agreement between Landlord and Tenant. Any modifications must be in writing and signed by all parties.', { align: AlignmentType.LEFT }),
    new Paragraph({ children: [new PageBreak()] }),
  ]

  // ── TABLE OF CONTENTS ───────────────────────────────────────────────────
  const tocItems = [
    '1. Basic Terms',
    '2. Amounts Due Upfront',
    '3. Property',
    '4. Term',
    '5. Rent',
    '6. Utilities and Services',
    '7. Security Deposit',
    '8. Tenant Insurance',
    '9. Parking',
    '10. Pets',
    '11. Smoking Policy',
    '12. Property Condition',
    '13. Tenant\'s Obligations',
    '14. Landlord\'s Obligations',
    '15. Right of Entry',
    '16. Alterations and Improvements',
    '17. Subletting and Assignment',
    '18. Default',
    '19. Surrender',
    '20. Notices',
    '21. General Provisions',
    'Addendum A – Parking Rules',
    'Addendum B – House Rules',
    'Addendum C – Lead-Based Paint Disclosure',
    'Addendum D – Bed Bug Addendum',
    'Signature Page',
  ]

  const tocPage = [
    new Paragraph({
      spacing: { before: 480, after: 320 },
      children: [new TextRun({ text: 'TABLE OF CONTENTS', bold: true, size: 28, font: 'Times New Roman', allCaps: true })],
    }),
    ...tocItems.map(item => new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: item, size: 22, font: 'Times New Roman' })],
    })),
    new Paragraph({ children: [new PageBreak()] }),
  ]

  // ── PREAMBLE ────────────────────────────────────────────────────────────
  const preamble = [
    new Paragraph({
      spacing: { before: 480, after: 240 },
      children: [new TextRun({ text: 'LEASE AGREEMENT', bold: true, size: 28, font: 'Times New Roman', allCaps: true })],
      alignment: AlignmentType.CENTER,
    }),
    para(`This Residential Lease Agreement ("Lease") is entered into as of ${d.agreementDate || '_______________'} (the "Effective Date") between ${landlordName} ("Landlord") and ${d.tenantNames} ("Tenant"), collectively the "Parties," for the property located at ${propertyAddress} ("Property").`),
    para('Landlord hereby leases the Property to Tenant, subject to the terms and conditions of this Lease:'),
    blankLine(),
  ]

  // ── SECTION 1: BASIC TERMS ──────────────────────────────────────────────
  const section1 = [
    sectionTitle('1. Basic Terms'),
    blankLine(),
    summaryTable([
      ['Property', propertyLabel],
      ['Property Address', propertyAddress],
      ['Landlord', landlordName],
      ['Tenant(s)', d.tenantNames || ''],
      ['Lease Start Date', d.leaseStartDate || ''],
      ['Lease End Date', d.leaseEndDate || ''],
      ['Monthly Rent', money(d.monthlyRent)],
      ['Rent Due Date', `${ordinal(d.rentDueDay || 1)} of each month`],
      ['Grace Period', `${d.gracePeriodDays || 5} days`],
      ['Late Fee', d.lateFeeAmount ? money(d.lateFeeAmount) : 'N/A'],
      ['Security Deposit', money(d.securityDeposit)],
      ['Renter\'s Insurance Required', 'Yes — minimum $100,000 per occurrence'],
    ]),
    blankLine(),
  ]

  // ── SECTION 2: AMOUNTS DUE UPFRONT ─────────────────────────────────────
  const totalDue = (Number(d.monthlyRent) || 0) + (Number(d.securityDeposit) || 0) + (Number(d.petDeposit) || 0)
  const section2 = [
    sectionTitle('2. Amounts Due Upfront'),
    blankLine(),
    summaryTable([
      ['First Month\'s Rent', money(d.monthlyRent)],
      ['Security Deposit', money(d.securityDeposit)],
      ...(d.petDeposit ? [['Pet Deposit (Refundable)', money(d.petDeposit)]] : []),
      ['Total Due at Signing', money(totalDue)],
    ]),
    blankLine(),
  ]

  // ── SECTION 3: PROPERTY ─────────────────────────────────────────────────
  const section3 = [
    sectionTitle('3. Property'),
    subsectionTitle('3.1', 'Property Description'),
    para(`The Property is located at ${propertyAddress}. ${d.propertyDescription || `The Property is a residential unit in a multifamily building.`} The Property includes all appliances, fixtures, and equipment installed as of the Start Date, including but not limited to: refrigerator, oven/range, microwave, dishwasher, clothes washer, and clothes dryer (as applicable and present at the Property).`),
    subsectionTitle('3.2', 'Occupants'),
    para(`The Property shall be occupied only by Tenant${d.additionalOccupants ? ` and the following additional occupants: ${d.additionalOccupants}` : ''}. No other persons may reside at the Property for more than fourteen (14) consecutive days without Landlord's prior written consent. All occupants must be listed on this Lease.`),
    blankLine(),
  ]

  // ── SECTION 4: TERM ─────────────────────────────────────────────────────
  const section4 = [
    sectionTitle('4. Term'),
    subsectionTitle('4.1', 'Fixed Term'),
    para(`The term of this Lease ("Term") shall begin on ${d.leaseStartDate} ("Start Date") and end on ${d.leaseEndDate} ("Expiration Date"). Neither Landlord nor Tenant is obligated, nor has the right, to unilaterally renew or extend the Term.`),
    subsectionTitle('4.2', 'Month-to-Month Holdover'),
    para('If Landlord accepts Tenant\'s payment of Monthly Rent for the month following the Expiration Date, this Lease shall be deemed to continue on a month-to-month basis on the same terms. Either party may terminate a month-to-month tenancy by providing at least thirty (30) days\' written notice prior to the last day of any calendar month.'),
    subsectionTitle('4.3', 'Holdover Without Landlord Consent'),
    para('If Tenant remains in possession of the Property after the Expiration Date without Landlord\'s written consent, Tenant shall be liable for double the Monthly Rent prorated on a daily basis for each day Tenant remains in holdover, in addition to all other remedies available to Landlord under applicable law.'),
    blankLine(),
  ]

  // ── SECTION 5: RENT ─────────────────────────────────────────────────────
  const section5 = [
    sectionTitle('5. Rent'),
    subsectionTitle('5.1', 'Monthly Rent'),
    para(`Tenant shall pay Landlord monthly rent of ${money(d.monthlyRent)} ("Monthly Rent"), due in advance on the ${ordinal(d.rentDueDay || 1)} day of each calendar month ("Rent Due Date"). First month's rent is due upon execution of this Lease.`),
    subsectionTitle('5.2', 'Late Fee'),
    para(`If Monthly Rent is not received in full within ${d.gracePeriodDays || 5} days after the Rent Due Date, a late fee of ${d.lateFeeAmount ? money(d.lateFeeAmount) : '$50.00'} shall be immediately assessed and due. Acceptance of late rent does not waive Landlord's right to require timely payment in the future.`),
    subsectionTitle('5.3', 'Returned / Insufficient Funds'),
    para('If any payment is returned for insufficient funds or otherwise fails, Tenant shall pay a returned payment fee of $25.00, in addition to any applicable late fees. Landlord may require all future payments be made by certified check, cashier\'s check, or money order if more than two payments are returned during the Term.'),
    subsectionTitle('5.4', 'Manner of Payment'),
    para('All rent shall be paid by a method designated by Landlord. Landlord may update the approved payment method upon written notice to Tenant.'),
    blankLine(),
  ]

  // ── SECTION 6: UTILITIES ────────────────────────────────────────────────
  const tenantPays = d.utilitiesTenantPays || 'as specified by Landlord'
  const landlordPays = d.utilitiesLandlordPays || 'as specified by Landlord'
  const section6 = [
    sectionTitle('6. Utilities and Services'),
    para(`Landlord shall provide the following utilities, included in the Monthly Rent: ${landlordPays}.`),
    para(`Tenant shall arrange and pay directly for the following utilities: ${tenantPays}. Tenant shall not cause any utility to be interrupted or disconnected during the Term.`),
    para('In the event actual utility costs attributable to Tenant\'s use exceed an agreed monthly allowance (if any), Tenant agrees to pay any overage within ten (10) days of written notice from Landlord with supporting documentation.'),
    blankLine(),
  ]

  // ── SECTION 7: SECURITY DEPOSIT ─────────────────────────────────────────
  const section7 = [
    sectionTitle('7. Security Deposit'),
    subsectionTitle('7.1', 'Amount and Payment'),
    para(`Tenant shall pay a refundable security deposit of ${money(d.securityDeposit)} ("Security Deposit") prior to or upon execution of this Lease. Under Arizona law (A.R.S. § 33-1321), the Security Deposit may not exceed one and one-half (1.5) times the monthly rent.${d.petDeposit ? ` An additional refundable pet deposit of ${money(d.petDeposit)} is also required.` : ''}`),
    subsectionTitle('7.2', 'Nonrefundable Fees'),
    para('Any fee designated as nonrefundable will be identified as such in writing at the time of collection. Absent such written designation, all deposits are refundable.'),
    subsectionTitle('7.3', 'Use of Security Deposit'),
    para('Subject to applicable law, Landlord may apply the Security Deposit to: (i) unpaid rent or other charges due under this Lease; (ii) costs to repair damage to the Property caused by Tenant beyond ordinary wear and tear; and/or (iii) cleaning costs to restore the Property to its condition at the Start Date.'),
    subsectionTitle('7.4', 'Return of Security Deposit'),
    para('Within fourteen (14) business days after Tenant vacates the Property and returns all keys, Landlord shall return the Security Deposit, less any lawful deductions, along with an itemized written statement of any amounts withheld, in accordance with A.R.S. § 33-1321. The deposit will be mailed to the forwarding address provided by Tenant.'),
    blankLine(),
  ]

  // ── SECTION 8: TENANT INSURANCE ─────────────────────────────────────────
  const section8 = [
    sectionTitle('8. Tenant Insurance'),
    para('Tenant is required to obtain and maintain renter\'s insurance throughout the Term, with per-occurrence liability limits of not less than $100,000.00. Landlord (and any Managing Agent) shall be named as an interested party. Tenant shall provide evidence of coverage prior to occupancy and upon Landlord\'s reasonable request. Landlord\'s insurance does not cover Tenant\'s personal property.'),
    blankLine(),
  ]

  // ── SECTION 9: PARKING ──────────────────────────────────────────────────
  const section9 = [
    sectionTitle('9. Parking'),
    para(`Parking is ${d.parking ? `included as follows: ${d.parking}` : 'provided as designated by Landlord on Building grounds'}. The cost of parking is included in the Base Rent. Tenant may only park in the designated space(s) assigned. See Addendum A for full parking rules and regulations.`),
    blankLine(),
  ]

  // ── SECTION 10: PETS ────────────────────────────────────────────────────
  const section10 = [
    sectionTitle('10. Pets'),
    para(d.petPolicy || 'No pets or animals of any kind are permitted in the Property without the prior written consent of Landlord. Landlord will review requests for reasonable accommodations for service and assistance animals as required by applicable law.'),
    blankLine(),
  ]

  // ── SECTION 11: SMOKING ─────────────────────────────────────────────────
  const section11 = [
    sectionTitle('11. Smoking Policy'),
    para('Smoking is strictly prohibited inside the Property, on any balcony or patio, and in all common areas of the Building and grounds. "Smoking" includes cigarettes, cigars, pipes, hookahs, vaping devices, e-cigarettes, and any similar product. Tenant shall not engage in or permit the use, cultivation, distribution, or storage of marijuana or THC products on the Property, regardless of state law authorization.'),
    para('Landlord may charge Tenant a remediation fee of up to $500 for any smoking violation, in addition to all other remedies available under this Lease.'),
    blankLine(),
  ]

  // ── SECTION 12: PROPERTY CONDITION ──────────────────────────────────────
  const section12 = [
    sectionTitle('12. Property Condition'),
    subsectionTitle('12.1', 'Existing Condition'),
    para('Tenant has examined the Property, either in person or virtually, prior to signing this Lease and is satisfied with its condition and appearance as of the Effective Date ("Existing Condition"). Landlord shall deliver possession of the Property on the Start Date in the same or better condition as the Existing Condition, except for ordinary wear and tear.'),
    subsectionTitle('12.2', 'Move-In Checklist'),
    para('A Move-In Property Condition Checklist shall be completed and signed by both parties within five (5) days of the Start Date. The completed checklist shall serve as the baseline reference for the condition of the Property at the start of the Term.'),
    subsectionTitle('12.3', 'Possession'),
    para('In the event Landlord cannot deliver possession by the Start Date through no fault of Landlord, this Lease shall remain in full force, but Tenant shall not owe Monthly Rent for the period of delay. Tenant may terminate the Lease upon five (5) days\' written notice if possession has not been delivered within thirty (30) days of the Start Date.'),
    blankLine(),
  ]

  // ── SECTION 13: TENANT OBLIGATIONS ──────────────────────────────────────
  const section13 = [
    sectionTitle('13. Tenant\'s Obligations'),
    subsectionTitle('13.1', 'Residential Use Only'),
    para('Tenant shall use the Property for residential purposes only. No commercial, illegal, or otherwise inappropriate use is permitted.'),
    subsectionTitle('13.2', 'Maintenance'),
    para('Tenant shall: (i) keep the Property in a clean, safe, and sanitary condition; (ii) dispose of all garbage and waste properly in designated receptacles; (iii) use all appliances and fixtures in a safe and reasonable manner; (iv) not obstruct access to doors, windows, or emergency exits; and (v) maintain the Property in the same condition as delivered at the Start Date, ordinary wear and tear excepted.'),
    subsectionTitle('13.3', 'Reporting'),
    para('Tenant shall promptly notify Landlord in writing upon becoming aware of any condition requiring repair or maintenance. Tenant\'s failure to timely report known conditions may result in Tenant being held responsible for damages resulting from the delay.'),
    subsectionTitle('13.4', 'No Disturbance'),
    para('Tenant shall not, and shall not permit any occupants or guests to: (i) make unreasonably loud noise; (ii) create any condition posing a threat of injury; or (iii) interfere with the rights, comfort, or enjoyment of other tenants or neighboring properties. Tenant shall comply with all HOA quiet hour requirements applicable to the Property.'),
    subsectionTitle('13.5', 'Joint and Several Liability'),
    para('All individuals executing this Lease as Tenant shall be jointly and severally liable for all obligations under this Lease.'),
    subsectionTitle('13.6', 'Move-Out Condition'),
    para('Upon vacating, Tenant shall return the Property in the same condition as the Start Date, ordinary wear and tear excepted, including professional cleaning of all surfaces and carpets at Tenant\'s cost. Tenant shall return all keys, access fobs, parking passes, and remotes. Replacement costs for unreturned items shall be deducted from the Security Deposit.'),
    blankLine(),
  ]

  // ── SECTION 14: LANDLORD OBLIGATIONS ────────────────────────────────────
  const section14 = [
    sectionTitle('14. Landlord\'s Obligations'),
    subsectionTitle('14.1', 'Habitability'),
    para('Landlord shall maintain the Property in a fit and habitable condition throughout the Term, in compliance with all applicable federal, state, and local health, safety, and housing laws.'),
    subsectionTitle('14.2', 'Maintenance and Repairs'),
    para('Landlord shall maintain all structural elements, roof, systems, and common areas in good order and repair. Landlord shall repair any appliances or equipment included with the Property, unless damage results from Tenant\'s improper use. Landlord shall undertake repairs within a reasonable time following written notice from Tenant, as required by applicable law.'),
    subsectionTitle('14.3', 'Landlord Noncompliance'),
    para('If Landlord materially fails to maintain the Property, Tenant shall provide written notice specifying the condition and required repairs. Landlord shall have ten (10) days to remedy noncompliance affecting habitability, or five (5) days for conditions affecting health and safety. If repairs are not completed within the applicable period, Tenant may exercise remedies available under A.R.S. § 33-1361.'),
    blankLine(),
  ]

  // ── SECTION 15: RIGHT OF ENTRY ───────────────────────────────────────────
  const section15 = [
    sectionTitle('15. Right of Entry'),
    para('Landlord, its agents, and contractors shall have the right of reasonable access to the Property during normal business hours upon at least two (2) days\' prior written notice to Tenant, for purposes of inspection, maintenance, repair, or showing. In the case of emergency, Landlord may enter immediately and shall provide notice within two (2) days after entry. Tenant shall not unreasonably withhold consent to entry.'),
    blankLine(),
  ]

  // ── SECTION 16: ALTERATIONS ──────────────────────────────────────────────
  const section16 = [
    sectionTitle('16. Alterations and Improvements'),
    para('Tenant shall not make any alterations, additions, or improvements to the Property without the prior written consent of Landlord. This includes painting, drilling, installing shelves, or adding or replacing fixtures, appliances, or wiring. Any unauthorized alterations shall be restored to original condition at Tenant\'s sole expense. Any Landlord-approved alterations shall remain as part of the Property at the end of the Term unless otherwise agreed in writing.'),
    blankLine(),
  ]

  // ── SECTION 17: SUBLETTING ───────────────────────────────────────────────
  const section17 = [
    sectionTitle('17. Subletting and Assignment'),
    para('Tenant shall not sublease, assign, or transfer any interest in this Lease or the Property without the prior written consent of Landlord. Any unauthorized sublease or assignment shall be void and shall constitute grounds for termination of this Lease. Tenant shall not list or rent the Property through any short-term rental platform (including Airbnb, VRBO, or similar services).'),
    blankLine(),
  ]

  // ── SECTION 18: DEFAULT ──────────────────────────────────────────────────
  const section18 = [
    sectionTitle('18. Default'),
    subsectionTitle('18.1', 'Default by Tenant'),
    para('Tenant shall be in default if: (a) Tenant fails to pay any rent within ten (10) days of the due date and does not cure within five (5) days of written notice; (b) Tenant fails to comply with any other obligation under this Lease and does not cure within ten (10) days of written notice (or five (5) days for conditions materially affecting health and safety); or (c) Tenant abandons the Property.'),
    subsectionTitle('18.2', 'Landlord\'s Remedies'),
    para('Upon Tenant\'s default, Landlord may exercise all rights and remedies available under applicable law, including: (a) termination of this Lease; (b) regaining possession through eviction; (c) recovery of all unpaid rent and other charges; (d) recovery of rent through the stated Expiration Date, less amounts collected from replacement tenants; and (e) recovery of reasonable attorneys\' fees and court costs to the extent permitted by law. Landlord shall use reasonable efforts to mitigate damages.'),
    blankLine(),
  ]

  // ── SECTION 19: SURRENDER ────────────────────────────────────────────────
  const section19 = [
    sectionTitle('19. Surrender'),
    para('Tenant shall surrender possession of the Property and return all keys to Landlord on or before the Expiration Date or earlier termination of the Lease. At surrender, the Property shall be in the same condition as the Start Date, ordinary wear and tear excepted, and free of all personal property. If any personal property is abandoned, Landlord may store, sell, or dispose of it after providing notice per applicable Arizona law.'),
    blankLine(),
  ]

  // ── SECTION 20: NOTICES ──────────────────────────────────────────────────
  const section20 = [
    sectionTitle('20. Notices'),
    para('All required written notices shall be delivered to:'),
    blankLine(),
    labeledItem('Landlord', `${landlordName}, goldenhivecapital@gmail.com`),
    labeledItem('Tenant', `${d.tenantNames}, ${d.tenantEmail || '________________________'}`),
    blankLine(),
    para('Notices may be delivered by: (i) hand delivery; (ii) first-class mail with postage prepaid; or (iii) email with confirmation of receipt. Either party may update their notice address by providing written notice to the other party.'),
    blankLine(),
  ]

  // ── SECTION 21: GENERAL PROVISIONS ──────────────────────────────────────
  const section21 = [
    sectionTitle('21. General Provisions'),
    subsectionTitle('21.1', 'Governing Law'),
    para('This Lease shall be governed by the laws of the State of Arizona, including the Arizona Residential Landlord and Tenant Act (A.R.S. § 33-1301 et seq.), and any applicable local ordinances.'),
    subsectionTitle('21.2', 'Entire Agreement'),
    para('This Lease, including all attached addenda, constitutes the entire agreement between the parties and supersedes all prior oral or written agreements. This Lease may only be modified by a written instrument signed by all parties.'),
    subsectionTitle('21.3', 'Severability'),
    para('If any provision of this Lease is found invalid or unenforceable, the remaining provisions shall remain in full force and effect.'),
    subsectionTitle('21.4', 'Waiver'),
    para('Landlord\'s failure to enforce any provision of this Lease shall not constitute a waiver of Landlord\'s right to enforce such provision in the future.'),
    subsectionTitle('21.5', 'Electronic Signatures'),
    para('The parties consent to execution of this Lease and all attached addenda by electronic signature. Electronic signatures shall have the same legal force and effect as original signatures.'),
    blankLine(),
  ]

  // ── ADDENDUM A: PARKING ──────────────────────────────────────────────────
  const addendumA = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { before: 480, after: 240 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'ADDENDUM A — PARKING RULES', bold: true, size: 26, font: 'Times New Roman', allCaps: true })],
    }),
    para('This Parking Addendum is attached to and made part of the Lease between Landlord and Tenant for the Property. All capitalized terms have the meanings given in the Lease.'),
    blankLine(),
    para(`Tenant is assigned parking space(s): ${d.parking || '_______________'}. The cost of parking is included in the Base Rent.`),
    blankLine(),
    subsectionTitle('A.1', 'Parking Rules'),
    bullet('Only registered, operable passenger vehicles may park in the designated parking area.'),
    bullet('Commercial vehicles, recreational vehicles, boats, and trailers are prohibited.'),
    bullet('Tenant must comply with all posted parking regulations and fire lane restrictions.'),
    bullet('Vehicle repairs are prohibited in the parking area, except for emergency repairs.'),
    bullet('Landlord may tow, at the vehicle owner\'s expense, any improperly parked, abandoned, or unregistered vehicle without prior notice.'),
    bullet('Tenant parks at their own risk. Landlord is not liable for damage to or theft of vehicles.'),
    blankLine(),
    para('Violation of any parking rule constitutes a Default under the Lease.'),
    blankLine(),
    ...signatureBlock('Tenant', d.tenantNames),
    ...signatureBlock('Landlord', landlordName),
  ]

  // ── ADDENDUM B: HOUSE RULES ──────────────────────────────────────────────
  const addendumB = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { before: 480, after: 240 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'ADDENDUM B — HOUSE RULES', bold: true, size: 26, font: 'Times New Roman', allCaps: true })],
    }),
    para('This Rules Addendum is attached to and made part of the Lease. Tenant\'s compliance with these rules is a material obligation of the Lease.'),
    blankLine(),
    subsectionTitle('B.1', 'Trash and Recycling'),
    bullet('Dispose of trash only in designated receptacles.'),
    bullet('Do not overload trash receptacles or leave trash in common areas.'),
    blankLine(),
    subsectionTitle('B.2', 'Keys and Access'),
    bullet('Tenant shall sign a key receipt at move-in identifying all keys and access devices provided.'),
    bullet('Tenant may not duplicate keys or access cards without written consent of Landlord.'),
    bullet('At move-out, Tenant must return all keys, fobs, parking passes, and remotes. Unreturned items will be charged at replacement cost.'),
    blankLine(),
    subsectionTitle('B.3', 'Use of Property'),
    bullet('Tenant may not drill holes, use nails, or attach anything to walls without written consent, except for minor picture hanging with standard nails.'),
    bullet('No laundry or items shall be hung from windows, balconies, or porches.'),
    bullet('Flammable chemicals, open-flame candles, and grilling equipment are prohibited inside the Property.'),
    bullet('Tenant shall not cook or barbecue on any balcony or within fifteen (15) feet of the building.'),
    bullet('Waterbeds and unusually heavy items (pianos, large safes) are prohibited without written approval.'),
    bullet('No signage, advertisements, or notices may be displayed so as to be visible outside the Property.'),
    blankLine(),
    subsectionTitle('B.4', 'Quiet Hours'),
    bullet('Tenant must observe HOA quiet hours: 10:00 PM to 7:00 AM on weekdays, and 11:00 PM to 8:00 AM on weekends.'),
    bullet('Tenant is responsible for the conduct of guests and occupants.'),
    blankLine(),
    subsectionTitle('B.5', 'HOA Compliance'),
    bullet('Tenant must comply with all applicable HOA rules and regulations, the Declaration of Condominium, and any Covenants, Conditions, and Restrictions applicable to the Property.'),
    bullet('Any fines or penalties assessed by the HOA as a result of Tenant\'s actions shall be the sole responsibility of Tenant and payable on demand.'),
    blankLine(),
    ...signatureBlock('Tenant', d.tenantNames),
    ...signatureBlock('Landlord', landlordName),
  ]

  // ── ADDENDUM C: LEAD PAINT ───────────────────────────────────────────────
  const addendumC = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { before: 480, after: 240 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'ADDENDUM C — LEAD-BASED PAINT DISCLOSURE', bold: true, size: 26, font: 'Times New Roman', allCaps: true })],
    }),
    new Paragraph({
      spacing: { before: 160, after: 200 },
      children: [new TextRun({ text: 'LEAD WARNING STATEMENT', bold: true, underline: { type: UnderlineType.SINGLE }, size: 22, font: 'Times New Roman' })],
    }),
    para('Housing built before 1978 may contain lead-based paint. Lead from paint, paint chips, and dust can pose health hazards if not managed properly. Lead exposure is especially harmful to young children and pregnant women. Before renting pre-1978 housing, lessors must disclose the presence of known lead-based paint and/or lead-based paint hazards in the dwelling. Lessees must also receive a federally approved pamphlet on lead poisoning prevention.'),
    blankLine(),
    subsectionTitle('C.1', 'Landlord\'s Disclosures'),
    para('The Property was built in 2008. Landlord has no knowledge of lead-based paint and/or lead-based paint hazards in the Property. Landlord has no records or reports pertaining to lead-based paint hazards in the Property.'),
    blankLine(),
    subsectionTitle('C.2', 'Tenant\'s Acknowledgement'),
    para('By signing below, Tenant acknowledges receipt of all information above and acknowledges receipt of the pamphlet "Protect Your Family from Lead in Your Home."'),
    blankLine(),
    ...signatureBlock('Tenant', d.tenantNames),
    ...signatureBlock('Landlord', landlordName),
  ]

  // ── ADDENDUM D: BED BUGS ─────────────────────────────────────────────────
  const addendumD = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { before: 480, after: 240 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'ADDENDUM D — BED BUG ADDENDUM', bold: true, size: 26, font: 'Times New Roman', allCaps: true })],
    }),
    subsectionTitle('D.1', 'Landlord\'s Disclosure'),
    para('Landlord has no knowledge of any bed bug infestation in the Property as of the Effective Date.'),
    subsectionTitle('D.2', 'Tenant\'s Obligations'),
    bullet('Tenant shall not bring used furniture from unknown sources into the Property without first inspecting for bed bugs.'),
    bullet('Tenant must immediately notify Landlord in writing upon suspecting or discovering bed bugs.'),
    bullet('Tenant shall not attempt to treat a bed bug infestation independently using retail pest control products.'),
    bullet('Tenant shall comply with all eradication protocols established by Landlord and their designated pest control provider.'),
    subsectionTitle('D.3', 'Cost Allocation'),
    para('If a bed bug infestation is found to have been introduced by Tenant, Tenant shall be responsible for reasonable extermination costs. If the infestation predated Tenant\'s occupancy, Landlord shall bear the cost of extermination.'),
    blankLine(),
    ...signatureBlock('Tenant', d.tenantNames),
    ...signatureBlock('Landlord', landlordName),
  ]

  // ── MAIN SIGNATURE PAGE ──────────────────────────────────────────────────
  const signaturePage = [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { before: 480, after: 320 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'SIGNATURE PAGE', bold: true, size: 28, font: 'Times New Roman', allCaps: true })],
    }),
    para('IN WITNESS WHEREOF, the parties have executed this Residential Lease Agreement as of the date first written above.'),
    blankLine(),
    para('By signing below, each party acknowledges that they have read, understood, and agreed to all terms and conditions of this Lease and all attached Addenda.'),
    blankLine(),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: 'TENANT', bold: true, size: 22, font: 'Times New Roman', allCaps: true })],
    }),
    ...signatureBlock('Tenant', d.tenantNames),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: 'LANDLORD', bold: true, size: 22, font: 'Times New Roman', allCaps: true })],
    }),
    ...signatureBlock('Landlord', landlordName),
  ]

  // ── ASSEMBLE DOCUMENT ────────────────────────────────────────────────────
  return new Document({
    styles: {
      default: { document: { run: { font: 'Times New Roman', size: 22 } } },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: 'Times New Roman' },
          paragraph: { spacing: { before: 360, after: 200 } },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, font: 'Times New Roman' },
          paragraph: { spacing: { before: 280, after: 120 } },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      children: [
        ...coverPage,
        ...tocPage,
        ...preamble,
        ...section1,
        ...section2,
        ...section3,
        ...section4,
        ...section5,
        ...section6,
        ...section7,
        ...section8,
        ...section9,
        ...section10,
        ...section11,
        ...section12,
        ...section13,
        ...section14,
        ...section15,
        ...section16,
        ...section17,
        ...section18,
        ...section19,
        ...section20,
        ...section21,
        ...addendumA,
        ...addendumB,
        ...addendumC,
        ...addendumD,
        ...signaturePage,
      ],
    }],
  })
}
