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

export function useVoiceInput(options?: UseVoiceInputOptions) {
  const isRecording = ref(false)
  const transcript = ref('')
  const errorMsg = ref('')

  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined

  const isSupported = computed(() => !!SpeechRecognitionCtor)

  let recognition: SpeechRecognition | null = null
  let finalText = ''
  let manualStop = false

  function buildRecognition(): SpeechRecognition | null {
    if (!SpeechRecognitionCtor) return null
    const rec = new SpeechRecognitionCtor()
    rec.lang = 'zh-CN'
    rec.continuous = true
    rec.interimResults = true
    rec.maxAlternatives = 1

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
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMsg.value = '麦克风权限被拒绝，请在浏览器设置中允许访问'
      } else if (event.error === 'no-speech') {
        errorMsg.value = '未检测到语音，请重试'
      } else if (event.error === 'network') {
        errorMsg.value = '网络异常，语音识别失败'
      } else {
        errorMsg.value = `语音识别出错：${event.error}`
      }
      options?.onError?.(errorMsg.value)
      // 出错后停止
      isRecording.value = false
    }

    rec.onend = () => {
      // 非手动停止且仍处于录音状态 → 自动重启继续识别（浏览器超时保护）
      if (!manualStop && isRecording.value) {
        try {
          rec.start()
        } catch {
          isRecording.value = false
        }
      } else {
        isRecording.value = false
      }
    }

    return rec
  }

  function start() {
    if (!isSupported.value) {
      errorMsg.value = '当前浏览器不支持语音输入，请使用 Chrome 或 Edge'
      options?.onError?.(errorMsg.value)
      return
    }
    if (isRecording.value) return

    // 每次重新构建实例，避免复用导致的 onstart 冲突
    recognition = buildRecognition()
    if (!recognition) return

    manualStop = false
    finalText = ''
    transcript.value = ''
    errorMsg.value = ''

    try {
      recognition.start()
      isRecording.value = true
    } catch {
      errorMsg.value = '启动语音识别失败，请重试'
      options?.onError?.(errorMsg.value)
      isRecording.value = false
    }
  }

  function stop() {
    manualStop = true
    isRecording.value = false
    recognition?.stop()
    recognition = null
    if (finalText && options?.onFinal) {
      options.onFinal(finalText)
    }
    finalText = ''
    transcript.value = ''
  }

  function toggle() {
    if (isRecording.value) {
      stop()
    } else {
      start()
    }
  }

  onBeforeUnmount(() => {
    if (isRecording.value) {
      manualStop = true
      recognition?.stop()
      recognition = null
      isRecording.value = false
    }
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
