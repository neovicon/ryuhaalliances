import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const DAYS = ['Su', 'M', 'T', 'W', 'Th', 'F'];
const STATUS_COLORS = {
  present: 'bg-green-500',
  absent: 'bg-red-500',
  excused: 'bg-orange-400',
  no_card: 'bg-blue-500'
};

export default function Attendance() {
  const [me, setMe] = useState(null);
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [cellMenu, setCellMenu] = useState(null);
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false }; }, []);

  useEffect(() => { fetchMe(); fetchHouses(); }, []);

  useEffect(() => { if (selectedHouse && me) fetchAttendance(selectedHouse); }, [selectedHouse, me]);

  // Fetch logged-in user
  async function fetchMe() {
    try {
      const res = await axios.get('/api/me');
      if (!mountedRef.current) return;
      setMe(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch all houses (for sidebar)
  async function fetchHouses() {
    try {
      const res = await axios.get('/api/houses');
      if (!mountedRef.current) return;
      setHouses(res.data.houses || res.data);
      if (res.data.houses && res.data.houses.length > 0) setSelectedHouse(res.data.houses[0].name);
    } catch (err) {
      console.error(err);
    }
  }

  // Fetch attendance and members for selected house
  async function fetchAttendance(houseName) {
    setLoading(true);
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
      const isoWeekStart = weekStart.toISOString().slice(0,10);
      const res = await axios.get('/api/attendance', { params: { house: houseName, weekStart: isoWeekStart } });
      if (!mountedRef.current) return;
      const data = res.data.records || [];
      setAttendance(data);
      setMembers(data.map(r => ({ userId: r.userId, name: r.user?.displayName || r.user?.username || r.userId, status: { ...r.status } })));
    } catch (err) {
      console.error(err);
      setMembers([]);
      setAttendance([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  // Handle click to open cell menu
  function openCellMenu(e, memberId, day) {
    if (!isOverseer()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCellMenu({ memberId, day, rect });
  }

  function closeCellMenu() { setCellMenu(null); }

  function changeCellStatus(memberId, day, status) {
    setMembers(prev => prev.map(m => m.userId === memberId ? { ...m, status: { ...m.status, [day]: status } } : m));
    closeCellMenu();
  }

  async function saveChanges() {
    if (!selectedHouse) return;
    setSaving(true);
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const isoWeekStart = weekStart.toISOString().slice(0,10);
      const payload = members.map(m => ({ userId: m.userId, status: m.status }));
      await axios.patch(`/api/attendance/${attendance._id}`, { records: payload });
      setEditing(false);
      fetchAttendance(selectedHouse);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function isOverseer() { return me?.role === 'OVERSEER'; }

  if (loading) return <div className="p-6 flex justify-center items-center"><div className="animate-spin h-10 w-10 border-4 border-t-transparent rounded-full border-gray-300" /></div>;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Houses ({houses.length})</h2>
        <ul>
          {houses.map(h => (
            <li key={h.name}>
              <button
                className={`block w-full text-left px-2 py-2 rounded ${selectedHouse===h.name?'bg-indigo-600':'hover:bg-gray-700'}`}
                onClick={() => setSelectedHouse(h.name)}
              >
                {h.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{selectedHouse} Attendance</h1>
          {isOverseer() && !editing && <button className="px-4 py-2 bg-indigo-600 rounded" onClick={() => setEditing(true)}>Edit Attendance</button>}
          {editing && isOverseer() && (
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-green-600 rounded" onClick={saveChanges} disabled={saving}>{saving?'Saving...':'Save'}</button>
              <button className="px-4 py-2 bg-red-600 rounded" onClick={() => { fetchAttendance(selectedHouse); setEditing(false); }}>Cancel</button>
            </div>
          )}
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(m => (
            <div key={m.userId} className="bg-gray-800 p-4 rounded shadow">
              <div className="mb-3 font-semibold text-lg">{m.name}</div>
              <div className="flex gap-2">
                {DAYS.map(day => (
                  <div
                    key={day}
                    onClick={(e) => editing && openCellMenu(e, m.userId, day)}
                    className={`w-10 h-10 rounded ${STATUS_COLORS[m.status[day]] || 'bg-gray-700'} ${editing ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-400' : ''}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-4 text-sm">
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-green-500 rounded" />Present</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-red-500 rounded" />Absent</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-orange-400 rounded" />Excused</div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 bg-blue-500 rounded" />No Card</div>
        </div>
      </div>

      {/* Cell Menu Popup */}
      {cellMenu && (
        <div className="fixed z-50" style={{ top: cellMenu.rect.bottom + window.scrollY + 6, left: cellMenu.rect.left + window.scrollX }}>
          <div className="bg-gray-700 border border-gray-500 rounded shadow p-2 flex flex-col gap-1">
            {Object.keys(STATUS_COLORS).map(k => (
              <button key={k} onClick={() => changeCellStatus(cellMenu.memberId, cellMenu.day, k)} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-600 rounded">
                <div className={`w-4 h-4 rounded ${STATUS_COLORS[k]}`}></div>
                <span className="text-sm capitalize">{k.replace('_',' ')}</span>
              </button>
            ))}
            <button onClick={closeCellMenu} className="mt-1 text-xs text-gray-300">Close</button>
          </div>
        </div>
      )}

    </div>
  );
}
