import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  BorderStyle,
  AlignmentType,
  TabStopType,
  TabStopPosition,
} from 'docx'

const PAGE_WIDTH = 12240 // US Letter, DXA
const PAGE_HEIGHT = 15840
const MARGIN = 1440 // 1 inch
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2 // 9360

function formatMoney(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function ordinalDay(n) {
  const num = Number(n)
  if (Number.isNaN(num)) return String(n)
  const s = ['th', 'st', 'nd', 'rd']
  const v = num % 100
  return num + (s[(v - 20) % 10] || s[v] || s[0])
}

function bodyText(text) {
  return new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun(text)],
  })
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun(text)],
  })
}

function clause(heading, text) {
  return [sectionHeading(heading), bodyText(text)]
}

function summaryTable(data) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
  const borders = { top: border, bottom: border, left: border, right: border }
  const labelWidth = 2808
  const valueWidth = CONTENT_WIDTH - labelWidth // 6552

  const rows = [
    ['Property', data.propertyLabel],
    ['Address', data.propertyAddress],
    ['Tenant(s)', data.tenantNames],
    ['Lease term', `${data.leaseStartDate} to ${data.leaseEndDate}`],
    ['Monthly rent', formatMoney(data.monthlyRent)],
    ['Rent due', `${ordinalDay(data.rentDueDay)} of each month`],
    ['Security deposit', formatMoney(data.securityDeposit)],
  ]

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [labelWidth, valueWidth],
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              borders,
              width: { size: labelWidth, type: WidthType.DXA },
              shading: { fill: 'F2F2F2', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
            }),
            new TableCell({
              borders,
              width: { size: valueWidth, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun(value || '—')] })],
            }),
          ],
        })
    ),
  })
}

function signatureLine() {
  return new Paragraph({
    spacing: { before: 480, after: 0 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
    children: [new TextRun(' ')],
  })
}

function signatureLabelRow(leftLabel, rightLabel) {
  return new Paragraph({
    spacing: { after: 360 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({ text: leftLabel, size: 20, color: '666666' }),
      new TextRun({ text: `\t${rightLabel}`, size: 20, color: '666666' }),
    ],
  })
}

function signatureBlock(roleLabel) {
  return [
    signatureLine(),
    signatureLabelRow(`${roleLabel} Signature`, 'Date'),
    signatureLine(),
    signatureLabelRow(`${roleLabel} Printed Name`, ''),
  ]
}

export function buildLeaseDocument(data) {
  const utilitiesParagraph = `Landlord is responsible for: ${
    data.utilitiesLandlordPays || 'none specified'
  }. Tenant is responsible for: ${
    data.utilitiesTenantPays || 'none specified'
  }, and for promptly establishing any utility accounts required in Tenant's name.`

  const rentParagraphParts = [
    `Tenant agrees to pay Landlord monthly rent of ${formatMoney(
      data.monthlyRent
    )}, due on the ${ordinalDay(data.rentDueDay)} of each month.`,
  ]
  if (data.lateFeeAmount) {
    rentParagraphParts.push(
      `A late fee of ${formatMoney(data.lateFeeAmount)} applies if rent is not received within ${
        data.gracePeriodDays || 5
      } days of the due date.`
    )
  }
  rentParagraphParts.push('Rent shall be paid by a method designated by Landlord.')

  const depositParagraphParts = [
    `Tenant shall pay a refundable security deposit of ${formatMoney(
      data.securityDeposit
    )} prior to occupancy. Under Arizona law, this deposit may not exceed one and one-half times the monthly rent.`,
  ]
  if (data.petDeposit) {
    depositParagraphParts.push(
      `An additional pet deposit of ${formatMoney(data.petDeposit)} applies as described below.`
    )
  }
  depositParagraphParts.push(
    "Any portion of a deposit intended to be nonrefundable will be identified as such in writing; absent that designation, the deposit is refundable. Within fourteen (14) business days after the Term ends and Tenant has vacated and returned possession of the Premises, Landlord will return the deposit, less any lawful deductions, together with an itemized statement of any deductions, in accordance with Arizona law (A.R.S. § 33-1321)."
  )

  const occupantsText = data.additionalOccupants
    ? `The Premises shall be occupied only by Tenant and the following additional occupant(s): ${data.additionalOccupants}. No other person may reside at the Premises for more than a reasonable visiting period without Landlord's prior written consent.`
    : "The Premises shall be occupied only by Tenant. No other person may reside at the Premises for more than a reasonable visiting period without Landlord's prior written consent."

  const petsText = data.petPolicy
    ? data.petPolicy
    : "No pets are permitted on the Premises without Landlord's prior written consent."

  return new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 24 } } },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 32, bold: true, font: 'Arial' },
          paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 26, bold: true, font: 'Arial' },
          paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [new TextRun('RESIDENTIAL LEASE AGREEMENT')],
          }),
          bodyText(
            `This Residential Lease Agreement ("Agreement") is entered into on ${data.agreementDate}, by and between ${data.landlordName} ("Landlord") and ${data.tenantNames} ("Tenant"), collectively the "Parties," for the rental of the property located at ${data.propertyAddress} ("Premises").`
          ),
          summaryTable(data),
          new Paragraph({ spacing: { before: 300 } }),

          ...clause(
            '1. Term',
            `This Agreement begins on ${data.leaseStartDate} and ends on ${data.leaseEndDate} (the "Term"), unless terminated earlier or renewed in accordance with this Agreement. At the end of the Term, this Agreement does not automatically renew; continued occupancy requires a new written agreement or a mutual written extension.`
          ),
          ...clause('2. Rent', rentParagraphParts.join(' ')),
          ...clause('3. Security Deposit', depositParagraphParts.join(' ')),
          ...clause('4. Utilities', utilitiesParagraph),
          ...clause('5. Occupants', occupantsText),
          ...clause('6. Pets', petsText),
          ...clause(
            '7. Maintenance and Repairs',
            "Tenant shall maintain the Premises in a clean and sanitary condition and promptly notify Landlord of any needed repairs. Landlord is responsible for maintaining the Premises in a habitable condition, including structural components and major systems such as plumbing, heating, and electrical, consistent with the Arizona Residential Landlord and Tenant Act."
          ),
          ...clause(
            '8. Right of Entry',
            "Landlord may enter the Premises with at least two (2) days' written notice for inspections, repairs, or to show the property, except in cases of emergency, where no advance notice is required."
          ),
          ...clause(
            '9. Default and Termination',
            "If Tenant fails to pay rent or otherwise breaches this Agreement, Landlord may pursue all remedies available under Arizona law, including termination of this Agreement upon proper notice. Tenant may terminate this Agreement prior to the end of the Term only with Landlord's written consent or as otherwise permitted by law."
          ),
          ...clause(
            '10. Governing Law',
            'This Agreement is governed by the laws of the State of Arizona, including the Arizona Residential Landlord and Tenant Act. This Agreement constitutes the entire agreement between the Parties and supersedes any prior oral or written agreements.'
          ),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            pageBreakBefore: true,
            children: [new TextRun('Signatures')],
          }),
          bodyText(
            'IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.'
          ),
          ...signatureBlock('Landlord'),
          ...signatureBlock('Tenant'),
        ],
      },
    ],
  })
}
