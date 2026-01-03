'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

// 🔐 管理员密码 (删除时用)
const ADMIN_PASSWORD = "666" 

export default function Home() {
  const [memes, setMemes] = useState([])
  const [uploading, setUploading] = useState(false)

  // 初始化加载
  useEffect(() => {
    fetchMemes()
  }, [])

  async function fetchMemes() {
    const { data } = await supabase.from('meme_list').select('*').order('created_at', { ascending: false })
    setMemes(data || [])
  }

  // 📤 上传逻辑 (修改版：选图后弹窗改名)
  async function handleUpload(event) {
    try {
      const file = event.target.files[0]
      if (!file) return

      // 🔥 核心修改：选完图后，立刻弹窗询问名字
      // defaultValue 设置为文件名，方便你不想改的时候直接确认
      let titleToSave = prompt("给这张新图起个标题吧：", file.name)

      // 如果用户点击“取消”，则取消上传
      if (titleToSave === null) {
        event.target.value = "" // 清空选择，否则下次选同名文件不触发
        return 
      }

      // 如果用户留空直接点确定，就用原文件名
      if (!titleToSave.trim()) {
        titleToSave = file.name
      }

      setUploading(true)

      // 1. 上传文件
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('memes')
        .upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('memes')
        .getPublicUrl(fileName)

      // 2. 存入数据库 (记得去 Supabase 加 file_name 字段哦，没加也不影响上传，只是删不掉源文件)
      const { error: dbError } = await supabase
        .from('meme_list')
        .insert([{ 
          title: titleToSave, 
          image_url: publicUrl, 
          file_name: fileName 
        }])
      
      if (dbError) throw dbError

      // 3. 刷新
      fetchMemes()
      alert('上传成功！')
    } catch (error) {
      alert('上传炸了: ' + error.message)
    } finally {
      setUploading(false)
      event.target.value = "" // 清空input，防止连选同一张图没反应
    }
  }

  // 🗑️ 删除逻辑
  async function handleDelete(id, fileName) {
    const password = prompt("请输入管理员密码进行删除：")
    if (password !== ADMIN_PASSWORD) {
      alert("密码错误！")
      return
    }

    try {
      const { error: dbError } = await supabase.from('meme_list').delete().eq('id', id)
      if (dbError) throw dbError

      if (fileName) {
        await supabase.storage.from('memes').remove([fileName])
      }
      fetchMemes()
    } catch (error) {
      alert("删除失败: " + error.message)
    }
  }

  // ✏️ 重命名逻辑
  async function handleRename(id, oldTitle) {
    const newTitle = prompt("请输入新的名字：", oldTitle)
    if (newTitle === null || newTitle === oldTitle) return

    try {
      const { error } = await supabase
        .from('meme_list')
        .update({ title: newTitle })
        .eq('id', id)
      
      if (error) throw error
      fetchMemes()
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
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>😈 我的表情包军火库</h1>
      </header>

      {/* 上传区域：现在只需要一个大按钮 */}
      <div style={styles.uploadSection}>
        <label style={uploading ? styles.uploadBtnDisabled : styles.uploadBtn}>
          {uploading ? '⏳ 装填中...' : '📤 点击上传 (自动重命名)'}
          <input 
            type="file" 
            onChange={handleUpload} 
            disabled={uploading} 
            style={{ display: 'none' }} 
          />
        </label>
      </div>

      {/* 图片展示区 */}
      <div style={styles.grid}>
        {memes.map((meme) => (
          <div key={meme.id} style={styles.card}>
            <div style={styles.imageWrapper} onClick={() => copyToClipboard(meme.image_url)}>
              <img src={meme.image_url} alt={meme.title} style={styles.image} />
              <div style={styles.overlay}>🔗 点图复制</div>
            </div>
            
            <div style={styles.cardFooter}>
              <span style={styles.cardTitle}>{meme.title}</span>
              <div style={styles.actions}>
                <button onClick={() => handleRename(meme.id, meme.title)} style={styles.actionBtn} title="改名">✏️</button>
                <button onClick={() => handleDelete(meme.id, meme.file_name)} style={{...styles.actionBtn, color: '#ff4d4d'}} title="删除">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 样式表 (精简了一下，去掉了多余的输入框样式)
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontFamily: 'sans-serif',
    padding: '20px',
  },
  header: { textAlign: 'center', marginBottom: '30px' },
  title: {
    fontSize: '2rem',
    background: 'linear-gradient(45deg, #FF512F, #DD2476)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  uploadSection: { display: 'flex', justifyContent: 'center', marginBottom: '40px' },
  uploadBtn: {
    backgroundColor: '#DD2476', color: '#fff', padding: '12px 30px', borderRadius: '50px',
    cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem',
    boxShadow: '0 4px 15px rgba(221, 36, 118, 0.4)', transition: 'transform 0.1s',
  },
  uploadBtnDisabled: {
    backgroundColor: '#555', color: '#999', padding: '12px 30px', borderRadius: '50px', cursor: 'not-allowed',
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', maxWidth: '1200px', margin: '0 auto',
  },
  card: {
    backgroundColor: '#2a2a2a', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
  },
  imageWrapper: {
    position: 'relative', paddingTop: '100%', cursor: 'pointer', backgroundColor: '#000',
  },
  image: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain',
  },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '12px', textAlign: 'center', padding: '4px', opacity: 0, transition: 'opacity 0.2s',
  },
  cardFooter: {
    padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#222',
  },
  cardTitle: {
    fontSize: '0.9rem', color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px',
  },
  actions: { display: 'flex', gap: '5px' },
  actionBtn: {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', borderRadius: '4px',
  },
}