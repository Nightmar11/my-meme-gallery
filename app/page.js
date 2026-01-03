'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

// 🔐 这里设置你的管理员密码（简单版）
const ADMIN_PASSWORD = "666" 

export default function Home() {
  const [memes, setMemes] = useState([])
  const [uploading, setUploading] = useState(false)
  const [customTitle, setCustomTitle] = useState('') // 新增：用来存用户输入的标题

  // 初始化加载
  useEffect(() => {
    fetchMemes()
  }, [])

  async function fetchMemes() {
    const { data } = await supabase.from('meme_list').select('*').order('created_at', { ascending: false })
    setMemes(data || [])
  }

  // 📤 上传逻辑
  async function handleUpload(event) {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      // 1. 决定标题：如果用户没填，就叫“无题”
      const titleToSave = customTitle.trim() || "无题"

      // 2. 上传文件
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('memes')
        .upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('memes')
        .getPublicUrl(fileName)

      // 3. 存入数据库
      const { error: dbError } = await supabase
        .from('meme_list')
        .insert([{ title: titleToSave, image_url: publicUrl, file_name: fileName }])
      if (dbError) throw dbError

      // 4. 重置状态并刷新
      setCustomTitle('') // 清空输入框
      fetchMemes()
    } catch (error) {
      alert('上传炸了: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // 🗑️ 删除逻辑 (带密码验证)
  async function handleDelete(id, fileName) {
    // 1. 弹出密码框
    const password = prompt("请输入管理员密码进行删除：")
    if (password !== ADMIN_PASSWORD) {
      alert("密码错误！退下！")
      return
    }

    try {
      // 2. 删数据库
      const { error: dbError } = await supabase.from('meme_list').delete().eq('id', id)
      if (dbError) throw dbError

      // 3. 删图片文件 (虽然不删也不影响展示，但为了节省空间最好删掉)
      // 注意：这里需要你之前上传时存了 file_name，如果是旧数据可能删不掉文件，但不影响页面
      if (fileName) {
        await supabase.storage.from('memes').remove([fileName])
      }

      alert("删除成功！")
      fetchMemes()
    } catch (error) {
      alert("删除失败: " + error.message)
    }
  }

  // ✏️ 重命名逻辑
  async function handleRename(id, oldTitle) {
    const newTitle = prompt("请输入新的名字：", oldTitle)
    // 如果点击取消或者输入为空，则不修改
    if (newTitle === null || newTitle === oldTitle) return

    try {
      const { error } = await supabase
        .from('meme_list')
        .update({ title: newTitle })
        .eq('id', id)
      
      if (error) throw error
      fetchMemes() // 刷新列表
    } catch (error) {
      alert("改名失败: " + error.message)
    }
  }

  // 🔗 复制逻辑
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url)
    const originalText = document.title
    document.title = "已复制！Copied!"
    setTimeout(() => document.title = originalText, 1000)
    // 这里的alert如果不想要可以注释掉
    // alert("链接已复制！")
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>😈 我的表情包军火库</h1>
      </header>

      {/* 上传区域：新增了输入框 */}
      <div style={styles.uploadSection}>
        <div style={styles.inputGroup}>
          <input 
            type="text" 
            placeholder="给图片起个名 (选填)..." 
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            style={styles.textInput}
          />
          <label style={uploading ? styles.uploadBtnDisabled : styles.uploadBtn}>
            {uploading ? '⏳' : '📤 上传'}
            <input 
              type="file" 
              onChange={handleUpload} 
              disabled={uploading} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>

      {/* 图片展示区 */}
      <div style={styles.grid}>
        {memes.map((meme) => (
          <div key={meme.id} style={styles.card}>
            {/* 图片主体 */}
            <div style={styles.imageWrapper} onClick={() => copyToClipboard(meme.image_url)}>
              <img src={meme.image_url} alt={meme.title} style={styles.image} />
              <div style={styles.overlay}>🔗 点图复制</div>
            </div>
            
            {/* 底部操作栏 */}
            <div style={styles.cardFooter}>
              <span style={styles.cardTitle}>{meme.title}</span>
              <div style={styles.actions}>
                <button 
                  onClick={() => handleRename(meme.id, meme.title)} 
                  style={styles.actionBtn}
                  title="改名"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => handleDelete(meme.id, meme.file_name)} 
                  style={{...styles.actionBtn, color: '#ff4d4d'}}
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 样式表
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontFamily: 'sans-serif',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '2rem',
    background: 'linear-gradient(45deg, #FF512F, #DD2476)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  uploadSection: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px',
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    background: '#2a2a2a',
    padding: '10px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },
  textInput: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1rem',
    padding: '10px',
    outline: 'none',
    width: '180px',
  },
  uploadBtn: {
    backgroundColor: '#DD2476',
    color: '#fff',
    padding: '10px 25px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    transition: 'transform 0.1s',
  },
  uploadBtnDisabled: {
    backgroundColor: '#555',
    color: '#999',
    padding: '10px 25px',
    borderRadius: '8px',
    cursor: 'not-allowed',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
  },
  imageWrapper: {
    position: 'relative',
    paddingTop: '100%',
    cursor: 'pointer',
    backgroundColor: '#000',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain', // 改为 contain 可以看到完整图片，不会被裁剪
  },
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    fontSize: '12px',
    textAlign: 'center',
    padding: '4px',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  cardFooter: {
    padding: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#222',
  },
  cardTitle: {
    fontSize: '0.9rem',
    color: '#ddd',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100px',
  },
  actions: {
    display: 'flex',
    gap: '5px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.1rem',
    padding: '4px',
    borderRadius: '4px',
    transition: 'background 0.2s',
  },
}