import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'

const DAYS = ['M', 'T', 'W', 'Th', 'F']
const STATUS_COLORS = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  excused: 'bg-orange-400',
  no_card: 'bg-blue-500'
}

function startOfWeekIso(d = new Date()) {
  const dt = new Date(d)
  const day = dt.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  dt.setDate(dt.getDate() + diff)
  return dt.toISOString().slice(0,10)
}

export default function AttendanceBoard() {
  const [me, setMe] = useState(null)
  const [weekStart, setWeekStart] = useState(() => startOfWeekIso())
  const [attendance, setAttendance] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cellMenu, setCellMenu] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  useEffect(() => { fetchMe() }, [])
  useEffect(() => { if (me !== null) fetchAttendance() }, [me, weekStart])

  async function fetchMe() {
    setLoading(true); setError(null)
    try {
      const res = await axios.get('/api/me')
      if (!mountedRef.current) return
      setMe(res.data)
    } catch (err) {
      if (!mountedRef.current) return
      setError('Failed to load user info')
    } finally { if (!mountedRef.current) return setLoading(false) }
  }

  async function fetchAttendance() {
    setLoading(true); setError(null)
    try {
      const params = { weekStart }
      if (me?.house) params.house = me.house
      const res = await axios.get('/api/attendance', { params })
      if (!mountedRef.current) return
      const data = res.data.attendance || res.data
      setAttendance(data)
      const loaded = (data?.records || []).map(r => ({
        userId: r.userId || r.user?._id || r.user?.id,
        user: r.user || null,
        status: r.status ? { ...r.status } : (r.days ? convertDaysToStatus(r.days) : (r.present ? defaultStatusFromPresent(r.present) : { M:null,T:null,W:null,Th:null,F:null })),
        _raw: r
      }))
      setRecords(loaded)
    } catch (err) {
      if (!mountedRef.current) return
      setError('Failed to load attendance')
      setAttendance(null); setRecords([])
    } finally { if (!mountedRef.current) return setLoading(false) }
  }

  function convertDaysToStatus(days = []) {
    const map = {}
    const idxMap = { M:1, T:2, W:3, Th:4, F:5 }
    DAYS.forEach(d => { const v = days[idxMap[d]]; map[d] = typeof v === 'string' ? v : (v ? 'present' : 'absent') })
    return map
  }

  function defaultStatusFromPresent(p) { const s = p ? 'present' : 'absent'; const m = {}; DAYS.forEach(d => m[d]=s); return m }

  function openCellMenu(e, userId, day) {
    if (!editing) return
    const rect = e.currentTarget.getBoundingClientRect()
    setCellMenu({ userId, day, rect })
  }

  function closeCellMenu() { setCellMenu(null) }

  function changeCellStatus(userId, day, status) {
    setRecords(prev => prev.map(r => r.userId === userId ? { ...r, status: { ...r.status, [day]: status } } : r))
    closeCellMenu()
  }

  function startEdit() { setEditing(true) }
  function cancelEdit() { fetchAttendance(); setEditing(false); setCellMenu(null) }

  async function saveChanges() {
    if (!attendance || (!attendance._id && !attendance.id)) { setError('No attendance id'); return }
    setSaving(true); setError(null)
    try {
      const payload = records.map(r => ({ userId: r.userId, status: r.status }))
      const id = attendance._id || attendance.id
      await axios.patch(`/api/attendance/${id}`, { records: payload })
      await fetchAttendance(); setEditing(false)
    } catch (err) { setError('Failed to save') }
    finally { setSaving(false); setCellMenu(null) }
  }

  function renderStatusSquare(r, day) {
    const status = r.status?.[day]
    const colorClass = STATUS_COLORS[status] || 'bg-gray-700'
    const hoverRing = editing ? 'hover:ring-2 hover:ring-offset-1 hover:ring-indigo-400 cursor-pointer' : ''
    return (
      <div
        role={editing ? 'button' : 'img'}
        tabIndex={editing ? 0 : -1}
        onClick={(e) => editing && openCellMenu(e, r.userId, day)}
        onKeyDown={(e) => editing && (e.key === 'Enter' || e.key === ' ') && openCellMenu(e, r.userId, day)}
        className={`${colorClass} w-5 h-5 rounded-sm ${hoverRing}`}
        title={status || 'no status'}
      />
    )
  }

  useEffect(() => {
    function onDocClick(e) {
      if (!cellMenu) return
      const menu = document.getElementById('att-cell-menu')
      if (menu && !menu.contains(e.target)) closeCellMenu()
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [cellMenu])

  if (loading) return <div className="p-6 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full border-white/30" /></div>
  if (error) return <div className="p-6 text-red-400">{error}</div>
  if (!attendance) return <div className="p-6 text-gray-400">No attendance for this week.</div>

  const isOverseer = me?.role === 'OVERSEER'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Attendance — {weekStart}</h2>
          <div className="text-sm text-gray-400">Week starting {weekStart}</div>
        </div>
        <div className="flex items-center gap-2">
          {!isOverseer ? null : !editing ? (
            <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={startEdit}>Edit Attendance</button>
          ) : (
            <>
              <button className={`px-3 py-1 rounded ${saving ? 'bg-gray-500 text-white' : 'bg-green-600 text-white'}`} onClick={saveChanges} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={cancelEdit} disabled={saving}>Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="text-left text-sm text-gray-300">
              <th className="pr-6 pb-2">Name</th>
              {DAYS.map(d => <th key={d} className="px-3 pb-2">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.userId} className="align-middle border-b border-white/5">
                <td className="py-3 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm text-white">{r.user?.username?.[0]?.toUpperCase() || String(r.userId)[0]}</div>
                    <div>
                      <div className="text-sm font-medium">{r.user?.displayName || r.user?.username || r.userId}</div>
                      <div className="text-xs text-gray-500">@{r.user?.username || ''}</div>
                    </div>
                  </div>
                </td>
                {DAYS.map(day => (
                  <td key={day} className="px-3 py-3">
                    <div className={`${isOverseer && editing ? 'cursor-pointer' : ''}`}>{renderStatusSquare(r, day)}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-green-500" />Present</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-red-500" />Absent</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-orange-400" />Excused</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-blue-500" />No Card</div>
      </div>

      {cellMenu && (
        <div id="att-cell-menu" className="absolute z-50" style={{ top: cellMenu.rect.bottom + window.scrollY + 6, left: cellMenu.rect.left + window.scrollX }}>
          <div className="bg-gray-800 border border-white/6 rounded shadow-lg p-2 flex flex-col gap-2">
            {Object.keys(STATUS_COLORS).map(k => (
              <button key={k} onClick={() => changeCellStatus(cellMenu.userId, cellMenu.day, k)} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5">
                <div className={`w-4 h-4 rounded-sm ${STATUS_COLORS[k]}`} />
                <div className="text-sm capitalize">{k.replace('_', ' ')}</div>
              </button>
            ))}
            <button onClick={closeCellMenu} className="mt-1 text-xs text-gray-400">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
