import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [adminUsers, setAdminUsers] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState([])

  // Yangi foydalanuvchi qo'shish
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('tuman')
  const [newDepartment, setNewDepartment] = useState('')

  // Tahrirlash oynasi
  const [editingUser, setEditingUser] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [editPassword, setEditPassword] = useState('')

  // Yig'iladigan guruhlar va topshiriqlar
  const [openSections, setOpenSections] = useState({
    tumanlar: false,
    viloyatlar: false,
    tahlilchilar: false,
    admins: false
  })

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleTask = (taskId) => {
    setOpenTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  // Topshiriq yaratish
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [answersVisible, setAnswersVisible] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const loadData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const taskRes = await axios.get(`${API_URL}/response/all-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTasks(taskRes.data)

      if (user?.role === 'admin') {
        const userRes = await axios.get(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setAdminUsers(userRes.data)
      }
    } catch (err) {
      setMessage('Ma\'lumot yuklashda xato')
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser && !user) {
      const u = JSON.parse(savedUser)
      setUser(u)
      loadData()
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      setMessage('Xush kelibsiz!')
    } catch (err) {
      setMessage('Login yoki parol xato!')
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      const res = await axios.post(`${API_URL}/task/create`, {
        title,
        description,
        deadline: deadline || null,
        answersVisible
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTasks([res.data.task, ...tasks])
      setTitle('')
      setDescription('')
      setDeadline('')
      setAnswersVisible(true)
      setShowCreateForm(false)
      setMessage('Topshiriq yaratildi!')
    } catch (err) {
      setMessage('Xato yuz berdi')
    }
  }

  const handleSubmitResponse = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('comment', comment)
    files.forEach(f => formData.append('files', f))

    try {
      await axios.post(`${API_URL}/response/submit/${selectedTask.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage('Javob yuborildi!')
      setComment('')
      setFiles([])
      setSelectedTask(null)
      loadData()
    } catch (err) {
      setMessage('Javob yuborishda xato')
    }
  }

  const handleReview = async (responseId, status, reason = '') => {
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API_URL}/response/review/${responseId}`, { status, rejectReason: reason }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage(status === 'accepted' ? 'Qabul qilindi!' : 'Rad etildi!')
      loadData()
    } catch (err) {
      setMessage('Xato yuz berdi')
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API_URL}/admin/user/create`, {
        username: newUsername,
        password: newPassword,
        role: newRole,
        department: newDepartment || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage('Yangi foydalanuvchi qo‘shildi!')
      setNewUsername('')
      setNewPassword('')
      setNewDepartment('')
      loadData()
    } catch (err) {
      setMessage('Xato: ' + (err.response?.data?.message || 'Username band'))
    }
  }

  const handleEditUser = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      await axios.put(`${API_URL}/admin/user/edit`, {
        userId: editingUser.id,
        role: editRole,
        department: editDepartment,
        password: editPassword || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage('Ma\'lumotlar o‘zgartirildi!')
      setEditingUser(null)
      setEditPassword('')
      loadData()
    } catch (err) {
      setMessage('Xato yuz berdi')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Bu foydalanuvchini o‘chirishni tasdiqlaysizmi?')) return
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`${API_URL}/admin/user/delete/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage('Foydalanuvchi o‘chirildi!')
      loadData()
    } catch (err) {
      setMessage('Xato yuz berdi')
    }
  }

  const handleResetPassword = async (userId) => {
    if (!confirm('Parolni 123456 ga o‘zgartirishni tasdiqlaysizmi?')) return
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API_URL}/admin/user/reset`, { userId }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage('Parol 123456 ga o‘zgartirildi')
    } catch (err) {
      setMessage('Xato yuz berdi')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Bu topshiriqni o‘chirishni tasdiqlaysizmi?')) return
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`${API_URL}/task/delete/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage('Topshiriq o‘chirildi!')
      loadData()
    } catch (err) {
      setMessage('Xato yuz berdi')
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    setUser(null)
    setTasks([])
    setAdminUsers([])
    setMessage('')
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1>e-ijro</h1>
        <form onSubmit={handleLogin} style={{ display: 'inline-block', padding: '30px', border: '1px solid #ccc', borderRadius: '10px', backgroundColor: '#f9f9f9' }}>
          <input type="text" placeholder="Login" value={username} onChange={e => setUsername(e.target.value)} style={{ display: 'block', margin: '10px auto', padding: '10px', width: '250px' }} required />
          <input type="password" placeholder="Parol" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', margin: '10px auto', padding: '10px', width: '250px' }} required />
          <button type="submit" style={{ padding: '10px 30px', backgroundColor: '#007bff', color: 'white' }}>Kirish</button>
        </form>
        <p style={{ color: 'gray' }}>Misol: admin / 123456</p>
        <p style={{ color: 'red' }}>{message}</p>
      </div>
    )
  }

  // Guruhlash
  const tumanlar = adminUsers.filter(u => u.role === 'tuman')
  const viloyatlar = adminUsers.filter(u => u.role === 'viloyat')
  const tahlilchilar = adminUsers.filter(u => u.role === 'tahlilchi')
  const admins = adminUsers.filter(u => u.role === 'admin')

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>e-ijro tizimi</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white' }}>Chiqish</button>
      </div>

      <p><strong>Foydalanuvchi:</strong> {user.department || user.username} ({user.role})</p>
      <p style={{ color: 'green' }}>{message}</p>

      {/* ADMIN PANEL */}
      {user.role === 'admin' && (
        <div style={{ border: '3px solid #28a745', padding: '25px', borderRadius: '12px', backgroundColor: '#f0fff0', marginBottom: '40px' }}>
          <h2 style={{ color: '#28a745' }}>⚙️ Admin panel – Foydalanuvchilarni boshqarish</h2>

          <h3>Yangi foydalanuvchi qo‘shish</h3>
          <form onSubmit={handleCreateUser} style={{ marginBottom: '30px' }}>
            <input type="text" placeholder="Login" value={newUsername} onChange={e => setNewUsername(e.target.value)} required style={{ padding: '10px', margin: '5px', width: '200px' }} />
            <input type="password" placeholder="Parol (bo‘sh qoldirsa 123456)" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '10px', margin: '5px', width: '200px' }} />
            <input type="text" placeholder="Bo‘lim nomi" value={newDepartment} onChange={e => setNewDepartment(e.target.value)} style={{ padding: '10px', margin: '5px', width: '250px' }} />
            <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ padding: '10px', margin: '5px' }}>
              <option value="tuman">Tuman bo‘limi</option>
              <option value="viloyat">Viloyat bo‘limi</option>
              <option value="tahlilchi">Tahlilchi</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white' }}>Qo‘shish</button>
          </form>

          {/* 4 ta guruh horizontal 1 qatorda */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
            {/* 1. Tuman bo‘limlari */}
            <div>
              <h3 onClick={() => toggleSection('tumanlar')} style={{ cursor: 'pointer', backgroundColor: '#d4edda', padding: '12px', margin: '0', borderRadius: '5px' }}>
                1. Tuman bo‘limlari ({tumanlar.length} ta) {openSections.tumanlar ? '▼' : '▶'}
              </h3>
              {openSections.tumanlar && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#eee' }}>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Login</th>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Bo‘lim</th>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tumanlar.map(u => (
                      <tr key={u.id}>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.username}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.department || '-'}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                          <button onClick={() => {
                            setEditingUser(u)
                            setEditRole(u.role)
                            setEditDepartment(u.department || '')
                            setEditPassword('')
                          }} style={{ backgroundColor: '#007bff', color: 'white', padding: '5px 10px', marginRight: '5px' }}>Tahrirlash</button>
                          <button onClick={() => handleResetPassword(u.id)} style={{ backgroundColor: '#ffc107', color: 'black', padding: '5px 10px', marginRight: '5px' }}>Parolni reset</button>
                          <button onClick={() => handleDeleteUser(u.id)} style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px' }}>O‘chirish</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 2. Viloyat bo‘limlari */}
            <div>
              <h3 onClick={() => toggleSection('viloyatlar')} style={{ cursor: 'pointer', backgroundColor: '#d4edda', padding: '12px', margin: '0', borderRadius: '5px' }}>
                2. Viloyat bo‘limlari ({viloyatlar.length} ta) {openSections.viloyatlar ? '▼' : '▶'}
              </h3>
              {openSections.viloyatlar && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#eee' }}>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Login</th>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Bo‘lim</th>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viloyatlar.map(u => (
                      <tr key={u.id}>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.username}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.department || '-'}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                          <button onClick={() => {
                            setEditingUser(u)
                            setEditRole(u.role)
                            setEditDepartment(u.department || '')
                            setEditPassword('')
                          }} style={{ backgroundColor: '#007bff', color: 'white', padding: '5px 10px', marginRight: '5px' }}>Tahrirlash</button>
                          <button onClick={() => handleResetPassword(u.id)} style={{ backgroundColor: '#ffc107', color: 'black', padding: '5px 10px', marginRight: '5px' }}>Parolni reset</button>
                          <button onClick={() => handleDeleteUser(u.id)} style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px' }}>O‘chirish</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 3. Tahlilchilar */}
            <div>
              <h3 onClick={() => toggleSection('tahlilchilar')} style={{ cursor: 'pointer', backgroundColor: '#d4edda', padding: '12px', margin: '0', borderRadius: '5px' }}>
                3. Tahlilchilar ({tahlilchilar.length} ta) {openSections.tahlilchilar ? '▼' : '▶'}
              </h3>
              {openSections.tahlilchilar && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#eee' }}>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Login</th>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Bo‘lim</th>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tahlilchilar.map(u => (
                      <tr key={u.id}>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.username}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.department || '-'}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                          <button onClick={() => {
                            setEditingUser(u)
                            setEditRole(u.role)
                            setEditDepartment(u.department || '')
                            setEditPassword('')
                          }} style={{ backgroundColor: '#007bff', color: 'white', padding: '5px 10px', marginRight: '5px' }}>Tahrirlash</button>
                          <button onClick={() => handleResetPassword(u.id)} style={{ backgroundColor: '#ffc107', color: 'black', padding: '5px 10px', marginRight: '5px' }}>Parolni reset</button>
                          <button onClick={() => handleDeleteUser(u.id)} style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px' }}>O‘chirish</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* 4. Adminlar */}
            <div>
              <h3 onClick={() => toggleSection('admins')} style={{ cursor: 'pointer', backgroundColor: '#d4edda', padding: '12px', margin: '0', borderRadius: '5px' }}>
                4. Adminlar ({admins.length} ta) {openSections.admins ? '▼' : '▶'}
              </h3>
              {openSections.admins && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#eee' }}>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Login</th>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Bo‘lim</th>
                      <th style={{ padding: '10px', border: '1px solid #ccc' }}>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(u => (
                      <tr key={u.id}>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.username}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.department || '-'}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                          <button onClick={() => {
                            setEditingUser(u)
                            setEditRole(u.role)
                            setEditDepartment(u.department || '')
                            setEditPassword('')
                          }} style={{ backgroundColor: '#007bff', color: 'white', padding: '5px 10px', marginRight: '5px' }}>Tahrirlash</button>
                          <button onClick={() => handleResetPassword(u.id)} style={{ backgroundColor: '#ffc107', color: 'black', padding: '5px 10px' }}>Parolni reset</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Viloyat bo‘limi uchun topshiriq yaratish */}
      {user.role === 'viloyat' && (
        <div style={{ marginBottom: '30px' }}>
          <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ padding: '12px 24px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px' }}>
            {showCreateForm ? 'Bekor qilish' : 'Yangi topshiriq yaratish'}
          </button>

          {showCreateForm && (
            <form onSubmit={handleCreateTask} style={{ border: '2px solid #28a745', padding: '20px', borderRadius: '10px', backgroundColor: '#f0fff0', marginTop: '20px' }}>
              <input type="text" placeholder="Sarlavha" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} required />
              <textarea placeholder="Tavsif" value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', height: '100px', padding: '10px', marginBottom: '10px' }} />
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ padding: '10px', marginBottom: '10px' }} />
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input type="checkbox" checked={answersVisible} onChange={e => setAnswersVisible(e.target.checked)} />
                Javoblar bir-biriga ko‘rinsin
              </label>
              <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>Yaratish</button>
            </form>
          )}
        </div>
      )}

      {/* Barcha topshiriqlar – jadval ko‘rinishi */}
      <h2>Barcha topshiriqlar ({tasks.length} ta)</h2>

      <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
        <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={{ padding: '12px', border: '1px solid #ccc', textAlign: 'center' }}>T/R</th>
              <th style={{ padding: '12px', border: '1px solid #ccc', minWidth: '300px' }}>Topshiriq nomi</th>
              <th style={{ padding: '12px', border: '1px solid #ccc', textAlign: 'center' }}>Muddat</th>
              <th style={{ padding: '12px', border: '1px solid #ccc', textAlign: 'center' }}>Tumanlar holati</th>
              <th style={{ padding: '12px', border: '1px solid #ccc', textAlign: 'center' }}>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => {
              // 15 ta tuman nomi (bazangizga moslashtiring)
              const tumans = [
                'Angor', 'Bandixon', 'Termiz', 'Sariosiyo', 'Sherobod', 'Sho‘rchi', 'Termiz shahar',
                'Tuman 8', 'Tuman 9', 'Tuman 10', 'Tuman 11', 'Tuman 12', 'Tuman 13', 'Tuman 14', 'Tuman 15'
              ];

              // Bajarilgan tumanlar
              const completedTumans = task.Responses?.map(r => ({
                department: r.responder?.department || 'Noma\'lum',
                submittedAt: r.submittedAt,
                status: r.status
              })) || [];

              // Bajarish vaqti bo‘yicha tartiblash
              completedTumans.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

              return (
                <tr key={task.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <strong>{task.title}</strong>
                    <small style={{ color: '#666', display: 'block' }}>
                      Yaratuvchi: {task.creator?.department || 'Noma\'lum'}
                    </small>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {task.deadline ? new Date(task.deadline).toLocaleDateString('uz-UZ') : 'Yo‘q'}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {tumans.map((tuman) => {
                        const completed = completedTumans.find(c => c.department === tuman);
                        const rank = completed ? completedTumans.indexOf(completed) + 1 : null;

                        return (
                          <div
                            key={tuman}
                            title={completed ? `Bajarilgan: ${new Date(completed.submittedAt).toLocaleString('uz-UZ')}` : 'Bajarilmagan'}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              backgroundColor: completed ? '#28a745' : '#e9ecef',
                              color: completed ? 'white' : '#6c757d',
                              opacity: completed ? 1 : 0.6,
                              minWidth: '80px',
                              textAlign: 'center',
                              position: 'relative'
                            }}
                          >
                            {tuman}
                            {completed && rank && (
                              <span style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                backgroundColor: '#fff',
                                color: '#28a745',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                border: '1px solid #28a745'
                              }}>
                                {rank}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {user.role === 'admin' && (
                      <button onClick={() => handleDeleteTask(task.id)} style={{ backgroundColor: '#dc3545', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '5px' }}>
                        O‘chirish
                      </button>
                    )}
                    {user.role === 'tuman' && (!task.Responses || !task.Responses.find(r => r.responderId === user.id)) && (
                      <button onClick={() => setSelectedTask(task)} style={{ backgroundColor: '#007bff', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '5px' }}>
                        Javob berish
                      </button>
                    )}
                    {user.role === 'viloyat' && task.Responses && task.Responses.map(resp => (
                      <div key={resp.id} style={{ margin: '5px 0' }}>
                        {resp.status === 'pending' && (
                          <div>
                            <button
                              onClick={() => handleReview(resp.id, 'accepted')}
                              style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '5px',
                                marginRight: '5px'
                              }}
                            >
                              Qabul qilish
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rad etish sababi:')
                                if (reason) handleReview(resp.id, 'rejected', reason)
                              }}
                              style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '5px'
                              }}
                            >
                              Rad etish (izoh bilan)
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Javob berish formasi */}
      {selectedTask && user.role === 'tuman' && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '30px',
          border: '3px solid #007bff',
          borderRadius: '12px',
          boxShadow: '0 0 30px rgba(0,0,0,0.4)',
          zIndex: 1000,
          maxWidth: '500px',
          width: '90%'
        }}>
          <h3>{selectedTask.title} uchun javob</h3>
          <form onSubmit={handleSubmitResponse}>
            <textarea placeholder="Izoh yozing..." value={comment} onChange={e => setComment(e.target.value)} style={{ width: '100%', height: '100px', padding: '10px', marginBottom: '10px' }} required />
            <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files))} style={{ marginBottom: '15px' }} />
            <div style={{ textAlign: 'right' }}>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', marginRight: '10px' }}>Yuborish</button>
              <button type="button" onClick={() => { setSelectedTask(null); setComment(''); setFiles([]) }} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}>Bekor qilish</button>
            </div>
          </form>
        </div>
      )}

      {/* Tahrirlash oynasi */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '30px',
          border: '3px solid #007bff',
          borderRadius: '12px',
          boxShadow: '0 0 30px rgba(0,0,0,0.4)',
          zIndex: 1000,
          width: '400px'
        }}>
          <h3>{editingUser.username} ni tahrirlash</h3>
          <form onSubmit={handleEditUser}>
            <input type="text" placeholder="Bo‘lim nomi" value={editDepartment} onChange={e => setEditDepartment(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
            <select value={editRole} onChange={e => setEditRole(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
              <option value="tuman">Tuman bo‘limi</option>
              <option value="viloyat">Viloyat bo‘limi</option>
              <option value="tahlilchi">Tahlilchi</option>
              <option value="admin">Admin</option>
            </select>
            <input
              type="password"
              placeholder="Yangi parol (bo‘sh qoldirsa o‘zgarmaydi)"
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
            />
            <div style={{ textAlign: 'right' }}>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', marginRight: '10px' }}>Saqlash</button>
              <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}>Bekor qilish</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default App