'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export default function Home() {
  const [memes, setMemes] = useState([])
  const [uploading, setUploading] = useState(false)

  // 1. 加载所有表情包
  useEffect(() => {
    fetchMemes()
  }, [])

  async function fetchMemes() {
    const { data } = await supabase.from('meme_list').select('*').order('created_at', { ascending: false })
    setMemes(data)
  }

  // 2. 上传处理
  async function handleUpload(event) {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return

      // a. 上传文件到 Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('memes')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // b. 获取公开链接
      const { data: { publicUrl } } = supabase.storage
        .from('memes')
        .getPublicUrl(fileName)

      // c. 将信息存入数据库
      const { error: dbError } = await supabase
        .from('meme_list')
        .insert([{ title: file.name, image_url: publicUrl }])

      if (dbError) throw dbError

      // d. 刷新列表
      fetchMemes()
    } catch (error) {
      alert('上传失败: ' + error.message)
    } finally {
      setUploading(false)
    }
  }
  //直接复制图片
  async function copyImageBlob(imgUrl) {
  const response = await fetch(imgUrl);
  const blob = await response.blob();
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type]: blob })
  ]);
  alert('图片已复制到剪贴板，去聊天框粘贴吧！');
}

  // 3. 复制功能
  const copyImage = (url) => {
    navigator.clipboard.writeText(url)
    alert('链接已复制！')
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>我的表情包仓库 🤪</h1>
      
      {/* 上传区域 */}
      <div style={{ marginBottom: '20px' }}>
        <input type="file" onChange={handleUpload} disabled={uploading} />
        {uploading && <span>上传中...</span>}
      </div>

      {/* 展示网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
        {memes.map((meme) => (
          <div key={meme.id} style={{ border: '1px solid #ccc', padding: '5px' }}>
            <img 
              src={meme.image_url} 
              alt={meme.title} 
              style={{ width: '100%', height: '150px', objectFit: 'cover', cursor: 'pointer' }}
              onClick={() => copyImage(meme.image_url)}
            />
            <p style={{ fontSize: '12px', truncate: true }}>{meme.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}