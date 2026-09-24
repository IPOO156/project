export interface RingItem {
  r: number
  color: string
  dasharray: number
  delay: number
}

export interface ElectronItem {
  id: string
  title: string
  date: string
  semester: string
  color: string
  radius: number
  speed: number
  angle: number
  level: number
  subOrbitIndex?: number
}

export interface TooltipState {
  visible: boolean
  x: number
  y: number
  title: string
  date: string
  semester: string
}
