import { useState, useRef, useEffect } from 'react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

export default function DatePicker({ id, value, onChange, placeholder = 'Select a date' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const today = new Date()
  const parsed = value ? new Date(`${value}T00:00:00`) : null

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectDate(day) {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    onChange(`${viewYear}-${mm}-${dd}`)
    setOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const totalDays = daysInMonth(viewYear, viewMonth)
  const startDay = firstDayOfMonth(viewYear, viewMonth)

  const displayValue = parsed
    ? parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div className="relative" ref={ref}>
      <button type="button" id={id} onClick={() => setOpen(o => !o)}
        className="w-full text-left rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-gold-mid focus:outline-none flex items-center justify-between">
        <span className={displayValue ? 'text-white' : 'text-neutral-500'}>
          {displayValue || placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-neutral-500 flex-shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-800 text-neutral-400 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
            </button>
            <span className="text-sm font-medium text-white">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-neutral-800 text-neutral-400 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => <div key={d} className="text-center text-xs text-neutral-500 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1
              const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const isSelected = value === dateStr
              const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
              return (
                <button key={day} type="button" onClick={() => selectDate(day)}
                  className={`text-center text-sm py-1 rounded transition-colors
                    ${isSelected ? 'bg-gold-mid text-neutral-900 font-semibold' : ''}
                    ${!isSelected && isToday ? 'text-gold-mid font-medium' : ''}
                    ${!isSelected ? 'hover:bg-neutral-800 text-neutral-200' : ''}
                  `}>
                  {day}
                </button>
              )
            })}
          </div>
          {value && (
            <button type="button" onClick={() => { onChange(''); setOpen(false) }}
              className="mt-3 w-full text-xs text-neutral-500 hover:text-neutral-300 text-center">
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  )
}
