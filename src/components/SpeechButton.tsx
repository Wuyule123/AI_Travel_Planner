'use client'
import { useState, useRef } from 'react'

type Props = { onText: (text: string) => void }

export default function SpeechButton({ onText }: Props) {
  const [listening, setListening] = useState(false)
  const recogRef = useRef<any>(null)

  const start = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('当前浏览器不支持语音识别')
      return
    }
    const recog = new SpeechRecognition()
    recog.lang = 'zh-CN'
    recog.interimResults = false
    recog.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      onText(text)
    }
    recog.onend = () => setListening(false)
    recog.onerror = () => setListening(false)
    recog.start()
    recogRef.current = recog
    setListening(true)
  }

  const stop = () => {
    recogRef.current?.stop()
    setListening(false)
  }

  return (
    <button
      type="button"
      className="px-3 py-2 border rounded"
      onClick={() => (listening ? stop() : start())}
    >
      {listening ? '停止' : '语音输入'}
    </button>
  )
}