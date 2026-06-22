import logoFull from '../assets/logo-full.png'

export default function BrandMark({ size = 'md' }) {
  const heights = { sm: 40, md: 64, lg: 80 }
  const h = heights[size] ?? heights.md
  return (
    <a href="https://goldenhivecapital.com" target="_blank" rel="noreferrer">
      <img
        src={logoFull}
        alt="Golden Hive Capital"
        style={{ height: h, width: 'auto' }}
      />
    </a>
  )
}
