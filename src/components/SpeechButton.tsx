'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2 } from 'lucide-react'

type Props = { onText: (text: string) => void }

export default function SpeechButton({ onText }: Props) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const recogRef = useRef<any>(null)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    // 检查浏览器支持
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  const start = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('当前浏览器不支持语音识别\n建议使用 Chrome 或 Edge 浏览器')
      return
    }
    
    const recog = new SpeechRecognition()
    recog.lang = 'zh-CN'
    recog.continuous = true        // 连续识别
    recog.interimResults = true    // 实时结果
    recog.maxAlternatives = 1

    finalTranscriptRef.current = ''

    recog.onstart = () => {
      console.log('语音识别开始')
      setListening(true)
    }

    recog.onresult = (e: any) => {
      let interimTranscript = ''
      
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcriptPart = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += transcriptPart
        } else {
          interimTranscript += transcriptPart
        }
      }
      
      // 显示临时结果（带样式区分）
      setTranscript(finalTranscriptRef.current + (interimTranscript ? ` [${interimTranscript}]` : ''))
    }

    recog.onend = () => {
      console.log('语音识别结束')
      setListening(false)
      
      // 将最终文本传递给父组件
      if (finalTranscriptRef.current.trim()) {
        onText(finalTranscriptRef.current.trim())
      }
      
      setTranscript('')
      finalTranscriptRef.current = ''
    }

    recog.onerror = (e: any) => {
      console.error('语音识别错误:', e.error)
      setListening(false)
      
      switch (e.error) {
        case 'no-speech':
          alert('未检测到语音，请重试')
          break
        case 'audio-capture':
          alert('无法访问麦克风，请检查权限')
          break
        case 'not-allowed':
          alert('麦克风权限被拒绝，请在浏览器设置中允许')
          break
        case 'network':
          alert('网络错误，请检查网络连接')
          break
        default:
          alert(`识别错误: ${e.error}`)
      }
    }

    try {
      recog.start()
      recogRef.current = recog
    } catch (error) {
      console.error('启动语音识别失败:', error)
      alert('启动语音识别失败，请重试')
    }
  }

  const stop = () => {
    if (recogRef.current) {
      recogRef.current.stop()
    }
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        当前浏览器不支持语音识别
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <Button
        type="button"
        variant={listening ? "destructive" : "outline"}
        size="sm"
        onClick={() => (listening ? stop() : start())}
        className="flex items-center gap-2"
      >
        {listening ? (
          <>
            <MicOff className="h-4 w-4 animate-pulse" />
            停止录音
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            语音输入
          </>
        )}
      </Button>
      
      {/* 实时转录显示 */}
      {listening && (
        <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
          <Volume2 className="h-4 w-4 mt-0.5 text-primary animate-pulse" />
          <div className="flex-1">
            {transcript ? (
              <p className="text-sm">{transcript}</p>
            ) : (
              <p className="text-sm text-muted-foreground">正在聆听...</p>
            )}
          </div>
        </div>
      )}
      
      {/* 提示信息 */}
      {!listening && (
        <p className="text-xs text-muted-foreground">
          💡 点击开始语音输入，说完后点击停止
        </p>
      )}
    </div>
  )
}