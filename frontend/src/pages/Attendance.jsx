import React, { useState, useEffect } from 'react';
import { apiCall } from "../utils/requests.js";


// --- UTILS ---
const getSaturday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - ((day + 1) % 7);
  return new Date(date.setDate(diff));
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// API Helper to replace Axios
const API_URL = import.meta.env.VITE_API_URL || '';


// --- CONSTANTS ---
const HOUSES = ['Pendragon', 'Phantomhive', 'Tempest', 'Zoldyck', 'Fritz', 'Elric', 'Dragneel', 'Hellsing', 'Obsidian Order', 'Council of IV', 'Abyssal IV', 'Von Einzbern'];
const DAYS = ['Sa', 'Su', 'M', 'T', 'W', 'Th', 'F'];

const STATUS_COLORS = {
  present: '#22c55e',
  absent: '#ef4444',
  excused: '#fb923c',
  no_card: '#3b82f6',
};

const Attendance = () => {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState('');
  const [weekStart, setWeekStart] = useState(formatDate(getSaturday(new Date())));
  const [members, setMembers] = useState([]);
  const [attendanceDoc, setAttendanceDoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editBuffer, setEditBuffer] = useState({});

  // UI State
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // --- RESIZE LISTENER ---
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false); // Reset sidebar on desktop
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- INITIAL FETCH ---
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await apiCall('/auth/me');
        const currentUser = data.user;
        setUser(currentUser);
        setSelectedHouse(currentUser.house);
      } catch (err) {
        console.error("Failed to load user profile", err);
      }
    };
    fetchMe();
  }, []);

  // --- DATA LOADING ---
  useEffect(() => {
    if (!selectedHouse || !weekStart) return;

    const loadData = async () => {
      setLoading(true);
      // Close sidebar on mobile when a house is selected
      if (isMobile) setSidebarOpen(false);

      try {
        // 1. Get Members
        const membersData = await apiCall(`/users/by-house/${selectedHouse}`);
        const houseMembers = membersData.users || [];

        // 2. Get Attendance
        try {
          const params = new URLSearchParams({ house: selectedHouse, weekStart });
          const attData = await apiCall(`/attendance?${params.toString()}`);
          setAttendanceDoc(attData.attendance);
        } catch (err) {
          if (err.status === 404) {
            setAttendanceDoc(null);
          } else {
            throw err;
          }
        }

        setMembers(houseMembers);
        setEditBuffer({});
        setIsEditing(false);
      } catch (err) {
        console.error("Error loading attendance data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedHouse, weekStart, isMobile]);

  // --- HANDLERS ---
  const handleEdit = () => {
    const initialBuffer = {};
    const defaultRow = { Sa: 'absent', Su: 'absent', M: 'absent', T: 'absent', W: 'absent', Th: 'absent', F: 'absent' };

    members.forEach(m => {
      // USE _id HERE
      const uid = m.id || m._id;

      const record = attendanceDoc?.records?.find(r => (r.userId?._id || r.userId) === uid);

      initialBuffer[uid] = record
        ? { ...defaultRow, ...record.status }
        : { ...defaultRow };
    });

    setEditBuffer(initialBuffer);
    setIsEditing(true);
  };

  const handleCellClick = (memberId, day) => {
    if (!isEditing) return;

    setEditBuffer(prev => {
      const memberRow = prev[memberId] || {};
      const currentStatus = memberRow[day] || 'absent';

      const statuses = ['present', 'absent', 'excused', 'no_card'];
      const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
      const nextStatus = statuses[nextIndex];

      return {
        ...prev,
        [memberId]: {
          ...memberRow, // Keeps the other days (M, T, W...) intact
          [day]: nextStatus
        }
      };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const recordsPayload = Object.entries(editBuffer).map(([userId, status]) => ({
        userId,
        status
      }));

      const id = attendanceDoc?._id || 'new';
      const method = id === 'new' ? 'POST' : 'PATCH';
      const url = id === 'new' ? '/attendance' : `/attendance/${id}`;

      await apiCall(url, {
        method,
        body: JSON.stringify({
          house: selectedHouse,
          weekStart,
          records: recordsPayload
        })
      });

      // Reload data
      const params = new URLSearchParams({ house: selectedHouse, weekStart });
      const attData = await apiCall(`/attendance?${params.toString()}`);
      setAttendanceDoc(attData.attendance);

      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save", err);
      alert("Failed to save attendance.");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (memberId, day) => {
    if (isEditing) {
      return editBuffer[memberId]?.[day] || 'absent';
    }
    const record = attendanceDoc?.records?.find(r => (r.userId?._id || r.userId) === memberId);
    return record?.status?.[day] || 'absent';
  };

  const isOverseer = user?.moderatorType === 'Overseer' || user?.role === 'admin';

  // --- INLINE STYLES ---
  // --- INLINE STYLES (Responsive Updated) ---
  // --- INLINE STYLES (Fully Fixed) ---
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: '#f3f4f6',
      display: 'flex',
      fontFamily: 'sans-serif',
      flexDirection: 'row',
      overflow: 'hidden',
      position: 'relative'
    },
    sidebar: {
      width: '260px',
      minWidth: '260px',
      backgroundColor: '#1f2937',
      borderRight: '1px solid #374151',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      position: isMobile ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      height: '100%',
      zIndex: 1050,
      transform: isMobile && !isSidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
      transition: 'transform 0.3s ease-in-out',
      boxShadow: isSidebarOpen ? '4px 0 15px rgba(0,0,0,0.5)' : 'none'
    },
    overlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1040,
      display: isMobile && isSidebarOpen ? 'block' : 'none'
    },
    hamburgerBtn: {
      display: isMobile ? 'flex' : 'none',
      background: 'transparent', border: 'none', color: 'white',
      fontSize: '1.5rem', cursor: 'pointer', marginRight: '1rem',
      alignItems: 'center', justifyContent: 'center'
    },
    sidebarTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem',
      color: '#eab308',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    closeBtn: {
      background: 'none', border: 'none', color: '#9ca3af',
      cursor: 'pointer', fontSize: '1.2rem', display: isMobile ? 'block' : 'none'
    },
    houseList: {
      overflowY: 'auto',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    // RESTORED FUNCTION HERE
    houseBtn: (active) => ({
      width: '100%',
      textAlign: 'left',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: active ? '#ca8a04' : 'transparent',
      color: active ? '#ffffff' : '#d1d5db',
      fontWeight: active ? 'bold' : 'normal',
      boxShadow: active ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
      transition: 'background-color 0.2s'
    }),
    dateSection: {
      marginTop: '1rem',
      paddingTop: '1rem',
      borderTop: '1px solid #374151'
    },
    label: {
      display: 'block', fontSize: '0.75rem', color: '#9ca3af',
      fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem'
    },
    input: {
      width: '100%', backgroundColor: '#111827', border: '1px solid #4b5563',
      borderRadius: '0.25rem', padding: '0.5rem', color: 'white', fontSize: '0.875rem'
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      width: '100%'
    },
    header: {
      padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
      backgroundColor: '#111827',
      borderBottom: '1px solid #1f2937',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 10
    },
    headerLeft: { display: 'flex', alignItems: 'center' },
    title: {
      fontSize: isMobile ? '1.1rem' : '1.5rem',
      fontWeight: 'bold',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      lineHeight: 1.2
    },
    subtitle: {
      color: '#6b7280', fontSize: '0.875rem', fontWeight: 'normal',
      display: isMobile ? 'none' : 'inline'
    },
    weekText: {
      fontSize: isMobile ? '0.65rem' : '0.75rem',
      color: '#9ca3af', marginTop: '0.25rem'
    },
    btnGroup: { display: 'flex', gap: '0.5rem' },
    // RESTORED FUNCTION HERE
    btn: (variant) => ({
      padding: isMobile ? '0.35rem 0.75rem' : '0.5rem 1.5rem',
      borderRadius: '0.25rem',
      border: 'none',
      cursor: 'pointer',
      color: 'white',
      fontSize: isMobile ? '0.75rem' : '0.875rem',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'background-color 0.2s',
      backgroundColor: variant === 'primary' ? '#2563eb' :
        variant === 'success' ? '#16a34a' :
          '#4b5563'
    }),
    contentArea: {
      flex: 1,
      overflow: 'hidden',
      padding: isMobile ? '0.5rem' : '1.5rem',
      backgroundColor: '#111827',
      display: 'flex',
      flexDirection: 'column'
    },
    tableCard: {
      backgroundColor: '#1f2937',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      overflow: 'auto',
      flex: 1,
      border: '1px solid rgba(255,255,255,0.05)',
      position: 'relative'
    },
    table: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
      textAlign: 'left',
      minWidth: isMobile ? '100%' : '600px'
    },
    th: {
      padding: isMobile ? '0.75rem 0.5rem' : '1rem',
      backgroundColor: '#1f2937',
      color: '#d1d5db',
      fontSize: isMobile ? '0.65rem' : '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      fontWeight: '600',
      borderBottom: '1px solid #374151',
      position: 'sticky',
      top: 0,
      zIndex: 20
    },
    stickyCol: {
      position: 'sticky',
      left: 0,
      backgroundColor: '#1f2937',
      zIndex: 15,
      borderRight: '1px solid #374151',
      width: isMobile ? '120px' : 'auto',
      minWidth: isMobile ? '120px' : '200px',
      maxWidth: isMobile ? '120px' : 'none'
    },
    thDay: {
      width: isMobile ? '45px' : '80px',
      textAlign: 'center',
      borderLeft: '1px solid rgba(55, 65, 81, 0.5)',
      minWidth: isMobile ? '45px' : '80px'
    },
    tr: { borderBottom: '1px solid #374151' },
    td: {
      padding: isMobile ? '0.5rem' : '0.75rem 1rem',
      verticalAlign: 'middle',
      borderBottom: '1px solid #374151',
      backgroundColor: '#1f2937'
    },
    tdCell: {
      padding: isMobile ? '0.25rem' : '0.5rem',
      borderLeft: '1px solid rgba(55, 65, 81, 0.5)',
      textAlign: 'center',
      borderBottom: '1px solid #374151'
    },
    memberInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '0.5rem' : '0.75rem'
    },
    avatar: {
      width: isMobile ? '2rem' : '2.5rem',
      height: isMobile ? '2rem' : '2.5rem',
      borderRadius: '9999px',
      backgroundColor: '#4b5563',
      objectFit: 'cover',
      flexShrink: 0
    },
    memberName: {
      fontWeight: '500',
      color: 'white',
      fontSize: isMobile ? '0.8rem' : '1rem',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    memberHandle: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      display: isMobile ? 'none' : 'block'
    },
    // RESTORED FUNCTION HERE
    statusBox: (color, active) => ({
      width: '100%',
      height: isMobile ? '2rem' : '2.5rem',
      borderRadius: '0.25rem',
      backgroundColor: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(255,255,255,0.9)',
      fontSize: isMobile ? '0.7rem' : '0.75rem',
      fontWeight: 'bold',
      cursor: isEditing ? 'pointer' : 'default',
      opacity: isEditing ? 1 : 0.9,
      border: active ? '2px solid white' : 'none',
      transform: active ? 'scale(1.05)' : 'scale(1)',
      transition: 'all 0.1s'
    }),
    footer: {
      padding: '0.75rem',
      backgroundColor: '#1f2937',
      borderTop: '1px solid #374151',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      justifyContent: 'center',
      fontSize: '0.75rem',
      flexShrink: 0
    },
    legendItem: { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d1d5db' },
    legendColor: (color) => ({ width: '1rem', height: '1rem', borderRadius: '0.25rem', backgroundColor: color }),
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem', color: '#eab308' },
    emptyState: { padding: '2rem', textAlign: 'center', color: '#6b7280' }
  };

  return (
    <div style={{ ...styles.container, paddingBottom: '100px' }}>

      {/* --- MOBILE OVERLAY --- */}
      <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />

      {/* --- SIDEBAR --- */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTitle}>
          <span>Houses</span>
          <button style={styles.closeBtn} onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <div style={styles.houseList}>
          {HOUSES.map(house => (
            <button
              key={house}
              onClick={() => setSelectedHouse(house)}
              style={styles.houseBtn(selectedHouse === house)}
            >
              {house}
            </button>
          ))}
        </div>

        <div style={styles.dateSection}>
          <label style={styles.label}>Week of (Saturday)</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div style={styles.main}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            {/* Hamburger Menu */}
            <button style={styles.hamburgerBtn} onClick={() => setSidebarOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div>
              <h1 style={styles.title}>
                {selectedHouse}
                <span style={styles.subtitle}> Attendance Sheet</span>
              </h1>
              <p style={styles.weekText}>Week starting: {new Date(weekStart).toDateString()}</p>
            </div>
          </div>

          {/* Buttons */}
          {isOverseer && (
            <div style={styles.btnGroup}>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  style={styles.btn('primary')}
                >
                  {isMobile ? 'Edit' : 'Edit Attendance'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={styles.btn('cancel')}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    style={styles.btn('success')}
                    disabled={loading}
                  >
                    {loading ? '...' : 'Save'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Table Area */}
        {/* Table Area */}
        <div style={styles.contentArea}>
          {loading && !isEditing ? (
            <div style={styles.loading}>Loading...</div>
          ) : (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {/* STICKY HEADER for Member Name */}
                    <th style={{ ...styles.th, ...styles.stickyCol, zIndex: 30 }}>
                      Member
                    </th>
                    {DAYS.map(day => (
                      <th key={day} style={{ ...styles.th, ...styles.thDay }}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={styles.emptyState}>
                        No members found in {selectedHouse}
                      </td>
                    </tr>
                  ) : (
                    members.map(member => {
                      // UID FIX FROM PREVIOUS STEP
                      const uid = member.id || member._id;

                      return (
                        <tr key={uid} style={styles.tr}>
                          {/* STICKY COLUMN for Member Data */}
                          <td style={{ ...styles.td, ...styles.stickyCol }}>
                            <div style={styles.memberInfo}>
                              <img
                                src={member.photoUrl || '/default-avatar.png'}
                                alt=""
                                style={styles.avatar}
                              />
                              <div style={{ minWidth: 0 }}> {/* Min width 0 helps truncate text */}
                                <div style={styles.memberName}>{member.displayName}</div>
                                {/* Handle hidden on mobile via styles */}
                                <div style={styles.memberHandle}>@{member.username}</div>
                              </div>
                            </div>
                          </td>
                          {DAYS.map(day => {
                            const status = getStatus(uid, day);
                            const color = STATUS_COLORS[status];
                            const isActive = isEditing && editBuffer[uid]?.[day] === status;

                            return (
                              <td key={day} style={styles.tdCell}>
                                <div
                                  onClick={() => handleCellClick(uid, day)}
                                  style={styles.statusBox(color, isActive)}
                                  title={status}
                                >
                                  {status === 'no_card' ? 'NC' : status.substring(0, 1).toUpperCase()}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend Footer */}
        <div style={styles.footer}>
          <div style={styles.legendItem}>
            <div style={styles.legendColor(STATUS_COLORS.present)}></div>
            <span>P</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendColor(STATUS_COLORS.absent)}></div>
            <span>A</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendColor(STATUS_COLORS.excused)}></div>
            <span>E</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendColor(STATUS_COLORS.no_card)}></div>
            <span>NC</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Attendance;