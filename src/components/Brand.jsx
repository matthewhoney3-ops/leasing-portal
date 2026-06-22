import logoFull from '../assets/logo-full.png'

export default function BrandMark({ size = 'md' }) {
  const heights = { sm: 32, md: 48, lg: 64 }
  const h = heights[size] ?? heights.md
  return (
    <img
      src={logoFull}
      alt="Golden Hive Capital"
      style={{ height: h, width: 'auto' }}
    />
  )
}
