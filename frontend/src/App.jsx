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

  // Admin uchun yangi user
  const [newUsername, setNewUsername] = useState('')
  const [newRole, setNewRole] = useState('tuman')
  const [newDepartment, setNewDepartment] = useState('')

  // Tahrirlash oynasi
  const [editingUser, setEditingUser] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [editDepartment, setEditDepartment] = useState('')

  // Yig‘iladigan guruhlar (sahifa ochilganda yopiq)
  const [openSections, setOpenSections] = useState({
    tumanlar: false,
    viloyatlar: false,
    tahlilchilar: false,
    admins: false
  })

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Yig‘iladigan topshiriqlar
  const [openTasks, setOpenTasks] = useState({})

  const toggleTask = (taskId) => {
    setOpenTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  // Topshiriq yaratish
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [answersVisible, setAnswersVisible] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL

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
    await axios.post(`${API_URL}/response/review/${responseId}`, { status, rejectReason: reason }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setMessage(status === 'accepted' ? 'Qabul qilindi!' : 'Rad etildi!')
    loadData()
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    try {
      await axios.post(`${API_URL}/admin/user/create`, {
        username: newUsername,
        role: newRole,
        department: newDepartment || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage('Yangi foydalanuvchi qo‘shildi!')
      setNewUsername('')
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
        department: editDepartment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMessage('Ma\'lumotlar o‘zgartirildi!')
      setEditingUser(null)
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
    if (!confirm('Bu topshiriqni o‘chirishni tasdiqlaysizmi? Barcha javoblar ham o‘chadi!')) return
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
            <input type="text" placeholder="Login" value={newUsername} onChange={e => setNewUsername(e.target.value)} required style={{ padding: '10px', margin: '5px' }} />
            <input type="text" placeholder="Bo‘lim nomi" value={newDepartment} onChange={e => setNewDepartment(e.target.value)} style={{ padding: '10px', margin: '5px' }} />
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

      {/* Barcha topshiriqlar – yig‘iladigan */}
      <h2>Barcha topshiriqlar ({tasks.length} ta)</h2>
      {tasks.map(task => (
        <div key={task.id} style={{ border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', backgroundColor: '#fff' }}>
          <div 
            onClick={() => toggleTask(task.id)} 
            style={{ cursor: 'pointer', padding: '15px', backgroundColor: '#f0f8ff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <strong>{task.title}</strong> <small style={{ color: '#666' }}>(Yaratuvchi: {task.creator?.department || 'Noma\'lum'})</small>
              <span style={{ marginLeft: '20px', color: '#007bff' }}>
                {openTasks[task.id] ? '▼' : '▶'} Batafsil
              </span>
            </div>
            {user.role === 'admin' && (
              <button onClick={(e) => {
                e.stopPropagation()
                handleDeleteTask(task.id)
              }} style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '5px' }}>
                O‘chirish
              </button>
            )}
          </div>

          {openTasks[task.id] && (
            <div style={{ padding: '20px' }}>
              <p>{task.description || 'Tavsif yo‘q'}</p>
              <p><strong>Muddat:</strong> {task.deadline ? new Date(task.deadline).toLocaleDateString('uz-UZ') : 'Yo‘q'}</p>
              <p><strong>Javoblar ko‘rinishi:</strong> {task.answersVisible ? 'Ha' : 'Yo‘q'}</p>

              {/* Javoblar */}
              {task.Responses && task.Responses.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                  <h4>Javoblar ({task.Responses.length} ta):</h4>
                  {task.Responses.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)).map((resp, index) => (
                    <div key={resp.id} style={{ borderLeft: '4px solid #007bff', padding: '10px', margin: '10px 0', backgroundColor: '#f8f9fa' }}>
                      <p><strong>{index + 1}-o‘rinda → {resp.responder?.department || 'Noma\'lum'}</strong> ({new Date(resp.submittedAt).toLocaleString('uz-UZ')})</p>
                      <p><strong>Izoh:</strong> {resp.comment || 'Izoh yo‘q'}</p>

                      {/* Fayllar */}
                      {resp.rejectReason && resp.rejectReason.includes('|||') && (
                        <div style={{ marginTop: '10px' }}>
                          <strong>Biriktirilgan fayllar:</strong>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                            {resp.rejectReason.split('|||').map((filePath, i) => {
                              const fileName = filePath.split('/').pop().split('-').slice(1).join('-')
                              return (
                                <div key={i} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px', backgroundColor: '#fff' }}>
                                  <a href={`${API_URL}${filePath}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#007bff' }}>
                                    📎 {fileName}
                                  </a>
                                  <br />
                                  <a href={`${API_URL}${filePath}`} download style={{ fontSize: '12px', color: '#28a745' }}>
                                    Yuklab olish ↓
                                  </a>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <p>
                        {resp.status === 'accepted' && <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Qabul qilindi</span>}
                        {resp.status === 'rejected' && <span style={{ color: 'red', fontWeight: 'bold' }}>✗ Rad etildi</span>}
                        {resp.status === 'pending' && user.role === 'viloyat' && (
                          <div style={{ marginTop: '10px' }}>
                            <button onClick={() => handleReview(resp.id, 'accepted')} style={{ backgroundColor: '#28a745', color: 'white', marginRight: '10px' }}>Qabul qilish</button>
                            <button onClick={() => {
                              const reason = prompt('Rad etish sababi:')
                              if (reason) handleReview(resp.id, 'rejected', reason)
                            }} style={{ backgroundColor: '#dc3545', color: 'white' }}>Rad etish</button>
                          </div>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {user.role === 'tuman' && (!task.Responses || !task.Responses.find(r => r.responderId === user.id)) && (
                <button onClick={() => setSelectedTask(task)} style={{ marginTop: '15px', backgroundColor: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px' }}>
                  Javob berish
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Javob berish formasi */}
      {selectedTask && user.role === 'tuman' && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '30px', border: '3px solid #007bff', borderRadius: '12px', boxShadow: '0 0 30px rgba(0,0,0,0.4)', zIndex: 1000, maxWidth: '500px', width: '90%' }}>
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
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '30px', border: '3px solid #007bff', borderRadius: '12px', boxShadow: '0 0 30px rgba(0,0,0,0.4)', zIndex: 1000, width: '400px' }}>
          <h3>{editingUser.username} ni tahrirlash</h3>
          <form onSubmit={handleEditUser}>
            <input type="text" placeholder="Bo‘lim nomi" value={editDepartment} onChange={e => setEditDepartment(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} />
            <select value={editRole} onChange={e => setEditRole(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '20px' }}>
              <option value="tuman">Tuman bo‘limi</option>
              <option value="viloyat">Viloyat bo‘limi</option>
              <option value="tahlilchi">Tahlilchi</option>
              <option value="admin">Admin</option>
            </select>
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