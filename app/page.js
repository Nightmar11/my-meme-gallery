'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

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

  // 上传逻辑
  async function handleUpload(event) {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      
      // 1. 上传图
      const { error: uploadError } = await supabase.storage
        .from('memes')
        .upload(fileName, file)
      if (uploadError) throw uploadError

      // 2. 获取链接
      const { data: { publicUrl } } = supabase.storage
        .from('memes')
        .getPublicUrl(fileName)

      // 3. 存数据库
      const { error: dbError } = await supabase
        .from('meme_list')
        .insert([{ title: file.name, image_url: publicUrl }])
      if (dbError) throw dbError

      // 4. 刷新
      fetchMemes()
    } catch (error) {
      alert('上传炸了: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // 复制功能
  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url)
    // 这里可以用个简单提示，或者弹窗
    const originalText = document.title
    document.title = "已复制！Copied!"
    setTimeout(() => document.title = originalText, 1000)
    alert("链接已复制，去聊天框粘贴吧！(Copied)")
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>😈 我的表情包军火库</h1>
        <p style={styles.subtitle}>点击图片复制链接，称霸聊天框</p>
      </header>

      {/* 上传区域 */}
      <div style={styles.uploadSection}>
        <label style={uploading ? styles.uploadBtnDisabled : styles.uploadBtn}>
          {uploading ? '正在装填弹药...' : '📤 上传新表情'}
          <input 
            type="file" 
            onChange={handleUpload} 
            disabled={uploading} 
            style={{ display: 'none' }} // 隐藏原始input
          />
        </label>
      </div>

      {/* 图片展示区 */}
      <div style={styles.grid}>
        {memes.map((meme) => (
          <div key={meme.id} style={styles.card} onClick={() => copyToClipboard(meme.image_url)}>
            <div style={styles.imageWrapper}>
              <img 
                src={meme.image_url} 
                alt={meme.title} 
                style={styles.image}
              />
              <div style={styles.overlay}>🔗 点我复制</div>
            </div>
          </div>
        ))}
      </div>
      
      {memes.length === 0 && <p style={{textAlign: 'center', color: '#666'}}>仓库是空的，快去进货！</p>}
    </div>
  )
}

// 简单的 CSS 样式对象
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a1a', // 深色背景
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    paddingTop: '20px',
  },
  title: {
    fontSize: '2.5rem',
    margin: '0',
    background: 'linear-gradient(45deg, #FF512F, #DD2476)', // 渐变色文字
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#888',
    marginTop: '10px',
  },
  uploadSection: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px',
  },
  uploadBtn: {
    backgroundColor: '#333',
    border: '2px dashed #666',
    color: '#fff',
    padding: '15px 30px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    transition: 'all 0.2s',
    display: 'inline-block',
  },
  uploadBtnDisabled: {
    backgroundColor: '#222',
    border: '2px dashed #444',
    color: '#666',
    padding: '15px 30px',
    borderRadius: '10px',
    cursor: 'not-allowed',
  },
  grid: {
    display: 'grid',
    // 响应式布局：最小宽度160px，自动填满
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '15px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'transform 0.2s',
    cursor: 'pointer',
    position: 'relative',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  },
  imageWrapper: {
    position: 'relative',
    paddingTop: '100%', // 保持正方形比例，如果不想要正方形可以去掉这行
    height: '0',
  },
  image: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover', // 裁剪图片以适应方块
  },
  overlay: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '5px',
    fontSize: '12px',
    textAlign: 'center',
    opacity: '0', // 默认隐藏提示
    transition: 'opacity 0.2s',
  },
}