/**
 * useVoiceInput - Web Speech API 语音输入封装
 *
 * - continuous + interimResults，实时回显 transcript
 * - onend 时若非手动停止则自动重启（部分浏览器会提前结束）
 * - 不支持时 isSupported=false，调用方降级提示
 * - 类型用 interface + declare global 声明，禁用 as any
 */
import { computed, onBeforeUnmount, ref } from 'vue'

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: ((event: Event) => void) | null
  onstart: ((event: Event) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface UseVoiceInputOptions {
  /** 识别完成（手动停止后）回调，传入最终文本 */
  onFinal?: (text: string) => void
  /** 发生错误回调 */
  onError?: (msg: string) => void
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': '麦克风权限被拒绝，请在浏览器地址栏的站点权限中重新允许麦克风访问',
  'service-not-allowed': '麦克风权限被拒绝，请在浏览器地址栏的站点权限中重新允许麦克风访问',
  'no-speech': '未检测到语音，请重试',
  network: '语音识别服务不可用，请检查网络或浏览器服务状态',
  'audio-capture': '未检测到可用的麦克风设备',
  aborted: '语音识别已取消',
}

export function useVoiceInput(options?: UseVoiceInputOptions) {
  const isRecording = ref(false)
  const transcript = ref('')
  const errorMsg = ref('')

  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined

  const isSecureContextForVoice = computed(() => {
    if (typeof window === 'undefined') {
      return false
    }
    const { protocol, hostname } = window.location
    return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1'
  })

  const isSupported = computed(() => !!SpeechRecognitionCtor && isSecureContextForVoice.value)

  let recognition: SpeechRecognition | null = null
  let finalText = ''
  let manualStop = false
  let restartTimer: number | null = null

  function clearRestartTimer() {
    if (restartTimer) {
      window.clearTimeout(restartTimer)
      restartTimer = null
    }
  }

  function buildRecognition(): SpeechRecognition | null {
    if (!SpeechRecognitionCtor) return null
    const rec = new SpeechRecognitionCtor()
    rec.lang = 'zh-CN'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => {
      isRecording.value = true
    }

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      transcript.value = finalText + interim
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message = ERROR_MESSAGES[event.error] || `语音识别出错：${event.error}`
      errorMsg.value = message
      options?.onError?.(message)
      isRecording.value = false
      manualStop = false
    }

    rec.onend = () => {
      clearRestartTimer()

      if (manualStop) {
        isRecording.value = false
        if (finalText && options?.onFinal) {
          options.onFinal(finalText.trim())
        }
        finalText = ''
        transcript.value = ''
        return
      }

      if (isRecording.value) {
        restartTimer = window.setTimeout(() => {
          try {
            rec.start()
          } catch {
            isRecording.value = false
          }
        }, 100)
      }
    }

    return rec
  }

  function start() {
    if (!SpeechRecognitionCtor) {
      errorMsg.value = '当前浏览器不支持语音输入，请使用最新版 Chrome 或 Edge'
      options?.onError?.(errorMsg.value)
      return
    }
    if (!isSecureContextForVoice.value) {
      errorMsg.value = '语音输入仅支持 HTTPS 或 localhost 环境，请切换到本地地址或安全协议'
      options?.onError?.(errorMsg.value)
      return
    }
    if (isRecording.value) return

    recognition = buildRecognition()
    if (!recognition) return

    manualStop = false
    finalText = ''
    transcript.value = ''
    errorMsg.value = ''

    try {
      recognition.start()
    } catch {
      errorMsg.value = '启动语音识别失败，请重试'
      options?.onError?.(errorMsg.value)
      isRecording.value = false
    }
  }

  function stop() {
    if (!isRecording.value && !recognition) return
    manualStop = true
    clearRestartTimer()
    recognition?.stop()
  }

  function toggle() {
    if (isRecording.value) {
      stop()
    } else {
      start()
    }
  }

  onBeforeUnmount(() => {
    clearRestartTimer()
    manualStop = true
    if (recognition) {
      try {
        recognition.abort()
      } catch {
        /* noop */
      }
      recognition = null
    }
    isRecording.value = false
    finalText = ''
  })

  return {
    isRecording,
    transcript,
    isSupported,
    errorMsg,
    start,
    stop,
    toggle,
  }
}
