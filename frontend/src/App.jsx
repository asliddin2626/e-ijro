import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)
  const [tasks, setTasks] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState([])

  // Topshiriq yaratish uchun
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [answersVisible, setAnswersVisible] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !user) {
      const saved = localStorage.getItem('user')
      if (saved) {
        const u = JSON.parse(saved)
        setUser(u)
        loadTasks(token)
      }
    }
  }, [])

  const loadTasks = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/response/all-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTasks(res.data)
    } catch (err) { console.error(err) }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      loadTasks(res.data.token)
    } catch (err) {
      setMessage('Login yoki parol xato!')
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const res = await axios.post(`${API_URL}/task/create`, { title, description, deadline: deadline || null, answersVisible }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setTasks([res.data.task, ...tasks])
    setShowCreateForm(false)
    setTitle(''); setDescription(''); setDeadline(''); setAnswersVisible(true)
    setMessage('Topshiriq yaratildi!')
  }

  const handleSubmitResponse = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('comment', comment)
    files.forEach(f => formData.append('files', f))

    await axios.post(`${API_URL}/response/submit/${selectedTask.id}`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setMessage('Javob yuborildi!')
    setComment(''); setFiles([]); setSelectedTask(null)
    loadTasks(token)
  }

  const handleReview = async (responseId, status, reason = '') => {
    const token = localStorage.getItem('token')
    await axios.post(`${API_URL}/response/review/${responseId}`, { status, rejectReason: reason }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setMessage(status === 'accepted' ? 'Qabul qilindi!' : 'Rad etildi!')
    loadTasks(token)
  }

  const handleLogout = () => {
    localStorage.clear()
    setUser(null)
    setTasks([])
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
        <p style={{ color: 'gray' }}>Misol: tahlilchi yoki viloyat1 yoki tuman1 / parol: 123456</p>
        <p style={{ color: 'red' }}>{message}</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>e-ijro tizimi</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white' }}>Chiqish</button>
      </div>

      <p><strong>Foydalanuvchi:</strong> {user.department || user.username} ({user.role})</p>
      <p style={{ color: user.role === 'tahlilchi' ? '#28a745' : 'green' }}>{message}</p>

      {/* Viloyat bo'limi */}
      {user.role === 'viloyat' && (
        <>
          <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', marginBottom: '20px' }}>
            Yangi topshiriq yaratish
          </button>

          {showCreateForm && (
            <form onSubmit={handleCreateTask} style={{ border: '2px solid #007bff', padding: '20px', borderRadius: '10px', backgroundColor: '#f0f8ff', marginBottom: '30px' }}>
              <input type="text" placeholder="Sarlavha" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px' }} required />
              <textarea placeholder="Tavsif" value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', height: '100px', padding: '10px', marginBottom: '10px' }} />
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ padding: '10px', marginBottom: '10px' }} />
              <label><input type="checkbox" checked={answersVisible} onChange={e => setAnswersVisible(e.target.checked)} /> Javoblar bir-biriga ko‘rinsin</label><br/>
              <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', marginTop: '10px' }}>Yaratish</button>
            </form>
          )}
        </>
      )}

      {/* Umumiy topshiriqlar ro'yxati */}
      <h2>Barcha topshiriqlar</h2>
      {tasks.map(task => (
        <div key={task.id} style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '10px', backgroundColor: '#fafafa' }}>
          <h3>{task.title} {task.creator?.department && <small style={{ color: '#666' }}>(Yaratuvchi: {task.creator.department})</small>}</h3>
          <p>{task.description || 'Tavsif yo‘q'}</p>
          <p><strong>Muddat:</strong> {task.deadline ? new Date(task.deadline).toLocaleDateString('uz-UZ') : 'Yo‘q'}</p>
          <p><strong>Javoblar ko‘rinishi:</strong> {task.answersVisible ? 'Ha' : 'Yo‘q'}</p>

          {/* Javoblar ro'yxati */}
          {task.Responses && task.Responses.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <h4>Javoblar ({task.Responses.filter(r => r.status === 'accepted').length} ta qabul qilingan):</h4>
              {task.Responses.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)).map((resp, index) => (
                <div key={resp.id} style={{ borderLeft: '4px solid #007bff', padding: '10px', margin: '10px 0', backgroundColor: '#f8f9fa' }}>
                  <p><strong>{index + 1}-o‘rinda javob bergan → {resp.responder?.department}</strong> ({new Date(resp.submittedAt).toLocaleString('uz-UZ')})</p>
                  <p><strong>Izoh:</strong> {resp.comment || 'Izoh yo‘q'}</p>
                  {resp.status === 'accepted' && <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Qabul qilindi</span>}
                  {resp.status === 'rejected' && <span style={{ color: 'red', fontWeight: 'bold' }}>✗ Rad etildi ({resp.rejectReason})</span>}
                  {resp.status === 'pending' && user.role === 'viloyat' && (
                    <div style={{ marginTop: '10px' }}>
                      <button onClick={() => handleReview(resp.id, 'accepted')} style={{ backgroundColor: '#28a745', color: 'white', marginRight: '10px' }}>Qabul qilish</button>
                      <button onClick={() => {
                        const reason = prompt('Rad etish sababi:')
                        if (reason) handleReview(resp.id, 'rejected', reason)
                      }} style={{ backgroundColor: '#dc3545', color: 'white' }}>Rad etish</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tuman uchun javob berish */}
          {user.role === 'tuman' && (!task.Responses || !task.Responses.find(r => r.responderId === user.id)) && (
            <button onClick={() => setSelectedTask(task)} style={{ marginTop: '10px', backgroundColor: '#007bff', color: 'white', padding: '10px' }}>
              Javob berish
            </button>
          )}
        </div>
      ))}

      {/* Javob berish formasi */}
      {selectedTask && user.role === 'tuman' && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '30px', border: '2px solid #007bff', borderRadius: '10px', boxShadow: '0 0 20px rgba(0,0,0,0.3)', zIndex: 1000 }}>
          <h3>{selectedTask.title} uchun javob</h3>
          <form onSubmit={handleSubmitResponse}>
            <textarea placeholder="Izoh yozing..." value={comment} onChange={e => setComment(e.target.value)} style={{ width: '100%', height: '100px', padding: '10px' }} required />
            <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files))} style={{ margin: '10px 0' }} />
            <div>
              <button type="submit" style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px' }}>Yuborish</button>
              <button type="button" onClick={() => { setSelectedTask(null); setComment(''); setFiles([]) }} style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: 'white' }}>Bekor qilish</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default App