# 原子成长时间轴 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 Vue 项目中新增一个 `/growth-timeline` 页面，使用 Three.js 渲染年轮式原子模型，电子代表个人经历，支持点击查看详情和点击原子核添加经历。

**Architecture:** 采用 `GrowthTimeline.vue` 作为页面容器，内部组合 `AtomScene.vue`（Three.js 3D 场景）、`ExperienceDetail.vue`（详情卡片）、`ExperienceForm.vue`（添加表单）。数据和学期计算逻辑收敛到 `useGrowthTimeline.ts`，学期轨道配置收敛到 `constants.ts`。

**Tech Stack:** Vue 3 + TypeScript + Element Plus + Three.js

---

## File Structure

```
src/features/growth-timeline/
├── GrowthTimeline.vue
├── components/
│   ├── AtomScene.vue
│   ├── ExperienceDetail.vue
│   └── ExperienceForm.vue
├── composables/
│   └── useGrowthTimeline.ts
└── constants.ts

src/app/router/routes.ts
src/app/layouts/components/Sidebar.vue
package.json
```

---

### Task 1: Install Three.js

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

```bash
pnpm add three
pnpm add -D @types/three
```

- [ ] **Step 2: Verify package.json**

确认 `dependencies` 中新增 `"three": "^0.x.x"`，`devDependencies` 中新增 `"@types/three": "^0.x.x"`。

---

### Task 2: Create constants.ts

**Files:**

- Create: `src/features/growth-timeline/constants.ts`

- [ ] **Step 1: Write constants**

```ts
export interface SemesterOrbit {
  level: number
  label: string
  code: string
  radius: number
  tilt: number
  color: string
}

export const SEMESTER_ORBITS: SemesterOrbit[] = [
  { level: 1, label: '大一上', code: '2023-2024-1', radius: 80, tilt: 0.15, color: '#8b6340' },
  { level: 2, label: '大一下', code: '2023-2024-2', radius: 110, tilt: -0.2, color: '#a88560' },
  { level: 3, label: '大二上', code: '2024-2025-1', radius: 140, tilt: 0.25, color: '#5a7c5a' },
  { level: 4, label: '大二下', code: '2024-2025-2', radius: 170, tilt: -0.15, color: '#6b8e5b' },
  { level: 5, label: '大三上', code: '2025-2026-1', radius: 200, tilt: 0.2, color: '#c8943e' },
  { level: 6, label: '大三下', code: '2025-2026-2', radius: 230, tilt: -0.25, color: '#ddb05a' },
  { level: 7, label: '大四上', code: '2026-2027-1', radius: 260, tilt: 0.1, color: '#3a5c3a' },
  { level: 8, label: '大四下', code: '2026-2027-2', radius: 290, tilt: -0.1, color: '#5c3d28' },
]

export interface GrowthExperience {
  id: string
  title: string
  date: string
  semester: string
  description: string
  tags: string[]
  skills: { name: string; growth: number }[]
}

export const INITIAL_EXPERIENCES: GrowthExperience[] = [
  {
    id: '1',
    title: '第一粒种子',
    date: '2023-09-15',
    semester: '2023-2024-1',
    description: '高中毕业后的暑假，读到了一本改变认知的书，埋下了好奇的种子。',
    tags: ['阅读', '认知'],
    skills: [
      { name: '好奇心', growth: 90 },
      { name: '阅读', growth: 50 },
    ],
  },
  {
    id: '2',
    title: '图书馆的冬天与夏天',
    date: '2024-03-10',
    semester: '2023-2024-2',
    description: '大一下学期几乎住在了图书馆，广泛阅读哲学、心理学、经济学。',
    tags: ['阅读', '跨学科'],
    skills: [
      { name: '跨学科思维', growth: 75 },
      { name: '阅读量', growth: 80 },
    ],
  },
  {
    id: '3',
    title: '第一次竞赛获奖',
    date: '2024-11-20',
    semester: '2024-2025-1',
    description: '参加校级程序设计竞赛获得二等奖，找到了技术热情。',
    tags: ['竞赛', '技术'],
    skills: [
      { name: '编程', growth: 70 },
      { name: '团队协作', growth: 60 },
    ],
  },
  {
    id: '4',
    title: '暑期社会实践',
    date: '2025-07-05',
    semester: '2024-2025-2',
    description: '参与乡村支教项目，学会了与不同背景的人沟通。',
    tags: ['实践', '公益'],
    skills: [
      { name: '沟通能力', growth: 80 },
      { name: '责任心', growth: 85 },
    ],
  },
  {
    id: '5',
    title: '科研项目立项',
    date: '2025-10-12',
    semester: '2025-2026-1',
    description: '加入导师课题组，开始接触学术研究和论文写作。',
    tags: ['科研', '学术'],
    skills: [
      { name: '研究能力', growth: 65 },
      { name: '写作', growth: 55 },
    ],
  },
]

export function inferSemester(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const isFirstTerm = month >= 9 || month <= 1
  const startYear = isFirstTerm ? year : year - 1
  const term = isFirstTerm ? 1 : 2
  return `${startYear}-${startYear + 1}-${term}`
}

export function findOrbitBySemester(semester: string): SemesterOrbit | undefined {
  return SEMESTER_ORBITS.find((o) => o.code === semester)
}
```

- [ ] **Step 2: Verify with type check**

```bash
npx vue-tsc --noEmit
```

---

### Task 3: Create useGrowthTimeline composable

**Files:**

- Create: `src/features/growth-timeline/composables/useGrowthTimeline.ts`

- [ ] **Step 1: Write composable**

```ts
import { computed, ref } from 'vue'
import { INITIAL_EXPERIENCES, inferSemester, type GrowthExperience } from '../constants'

export function useGrowthTimeline() {
  const experiences = ref<GrowthExperience[]>([...INITIAL_EXPERIENCES])
  const selectedId = ref<string | null>(null)
  const formVisible = ref(false)

  const selectedExperience = computed(() => {
    return experiences.value.find((e) => e.id === selectedId.value) ?? null
  })

  function selectExperience(id: string | null) {
    selectedId.value = id
  }

  function openForm() {
    formVisible.value = true
  }

  function closeForm() {
    formVisible.value = false
  }

  function addExperience(payload: Omit<GrowthExperience, 'id' | 'semester'>) {
    const semester = inferSemester(payload.date)
    const newExperience: GrowthExperience = {
      ...payload,
      id: `${Date.now()}`,
      semester,
    }
    experiences.value.unshift(newExperience)
  }

  return {
    experiences,
    selectedId,
    selectedExperience,
    formVisible,
    selectExperience,
    openForm,
    closeForm,
    addExperience,
  }
}
```

---

### Task 4: Create AtomScene.vue

**Files:**

- Create: `src/features/growth-timeline/components/AtomScene.vue`

- [ ] **Step 1: Implement Three.js scene**

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { SEMESTER_ORBITS, type GrowthExperience, type SemesterOrbit } from '../constants'

interface Props {
  experiences: GrowthExperience[]
  selectedId: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'add'): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let renderer: THREE.WebGLRenderer | null = null
let rafId = 0
const electronMeshes: Map<string, THREE.Mesh> = new Map()
const orbitRings: Map<number, THREE.Mesh> = new Map()

function createNucleus() {
  const geometry = new THREE.SphereGeometry(28, 64, 64)
  const material = new THREE.MeshStandardMaterial({
    color: 0x5c3d28,
    emissive: 0x3d2b1f,
    emissiveIntensity: 0.3,
    roughness: 0.8,
    metalness: 0.1,
  })
  const nucleus = new THREE.Mesh(geometry, material)

  // 年轮纹理环
  for (let i = 1; i <= 6; i++) {
    const ringGeo = new THREE.TorusGeometry(28 + i * 2.5, 0.3, 8, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8b6340,
      transparent: true,
      opacity: 0.4,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = Math.PI / 2
    nucleus.add(ring)
  }

  nucleus.userData = { type: 'nucleus' }
  return nucleus
}

function createOrbit(orbit: SemesterOrbit) {
  const geometry = new THREE.TorusGeometry(orbit.radius, 0.6, 16, 128)
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(orbit.color),
    transparent: true,
    opacity: 0.35,
  })
  const ring = new THREE.Mesh(geometry, material)
  ring.rotation.x = Math.PI / 2 + orbit.tilt
  ring.userData = { type: 'orbit', level: orbit.level }
  return ring
}

function createElectron(
  experience: GrowthExperience,
  orbit: SemesterOrbit,
  index: number,
  total: number,
) {
  const geometry = new THREE.SphereGeometry(5, 32, 32)
  const material = new THREE.MeshStandardMaterial({
    color: 0xc8943e,
    emissive: 0xd9944a,
    emissiveIntensity: 0.6,
  })
  const electron = new THREE.Mesh(geometry, material)
  electron.userData = { type: 'electron', id: experience.id, title: experience.title }

  const angle = (index / total) * Math.PI * 2
  electron.position.set(
    Math.cos(angle) * orbit.radius,
    Math.sin(angle) * orbit.radius * Math.sin(orbit.tilt),
    Math.sin(angle) * orbit.radius * Math.cos(orbit.tilt),
  )

  return electron
}

function buildScene() {
  if (!containerRef.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf4efe6)

  camera = new THREE.PerspectiveCamera(
    45,
    containerRef.value.clientWidth / containerRef.value.clientHeight,
    1,
    2000,
  )
  camera.position.set(0, 300, 500)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0xffeedd, 1.2, 1000)
  pointLight.position.set(100, 200, 200)
  scene.add(pointLight)

  const nucleus = createNucleus()
  scene.add(nucleus)

  SEMESTER_ORBITS.forEach((orbit) => {
    const ring = createOrbit(orbit)
    scene!.add(ring)
    orbitRings.set(orbit.level, ring)
  })

  updateElectrons()
  animate()
}

function updateElectrons() {
  if (!scene) return

  // Remove old electrons
  electronMeshes.forEach((mesh) => {
    scene!.remove(mesh)
  })
  electronMeshes.clear()

  // Group by semester
  const grouped = new Map<string, GrowthExperience[]>()
  props.experiences.forEach((exp) => {
    const list = grouped.get(exp.semester) ?? []
    list.push(exp)
    grouped.set(exp.semester, list)
  })

  grouped.forEach((list, semester) => {
    const orbit = SEMESTER_ORBITS.find((o) => o.code === semester)
    if (!orbit) return

    list.forEach((exp, index) => {
      const electron = createElectron(exp, orbit, index, list.length)
      scene!.add(electron)
      electronMeshes.set(exp.id, electron)
    })
  })
}

function animate() {
  rafId = requestAnimationFrame(animate)

  electronMeshes.forEach((mesh, id) => {
    const exp = props.experiences.find((e) => e.id === id)
    if (!exp) return
    const orbit = SEMESTER_ORBITS.find((o) => o.code === exp.semester)
    if (!orbit) return

    const list = props.experiences.filter((e) => e.semester === exp.semester)
    const index = list.findIndex((e) => e.id === id)
    const baseAngle = (index / list.length) * Math.PI * 2
    const speed = 0.3 / orbit.level
    const time = Date.now() * 0.001
    const angle = baseAngle + time * speed

    mesh.position.x = Math.cos(angle) * orbit.radius
    mesh.position.y = Math.sin(angle) * orbit.radius * Math.sin(orbit.tilt)
    mesh.position.z = Math.sin(angle) * orbit.radius * Math.cos(orbit.tilt)
  })

  renderer?.render(scene!, camera!)
}

function handleClick(event: MouseEvent) {
  if (!camera || !renderer) return

  const rect = renderer.domElement.getBoundingClientRect()
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  )

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(scene!.children, true)
  for (const hit of intersects) {
    const data = hit.object.userData
    if (data.type === 'electron' && data.id) {
      emit('select', data.id)
      return
    }
    if (data.type === 'nucleus') {
      emit('add')
      return
    }
  }

  emit('select', '')
}

function handleResize() {
  if (!containerRef.value || !camera || !renderer) return
  camera.aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
}

watch(() => props.experiences, updateElectrons, { deep: true })

onMounted(() => {
  buildScene()
  window.addEventListener('resize', handleResize)
  renderer?.domElement.addEventListener('click', handleClick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', handleResize)
  renderer?.domElement.removeEventListener('click', handleClick)
  renderer?.dispose()
})
</script>

<template>
  <div ref="containerRef" class="atom-scene" />
</template>

<style scoped lang="scss">
.atom-scene {
  width: 100%;
  height: 100%;
  min-height: 600px;
  cursor: pointer;
}
</style>
```

---

### Task 5: Create ExperienceDetail.vue

**Files:**

- Create: `src/features/growth-timeline/components/ExperienceDetail.vue`

- [ ] **Step 1: Implement detail card**

```vue
<script setup lang="ts">
import { Clock, X } from 'lucide-vue-next'
import { computed } from 'vue'
import { findOrbitBySemester, type GrowthExperience } from '../constants'

interface Props {
  experience: GrowthExperience | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'close'): void }>()

const semesterLabel = computed(() => {
  if (!props.experience) return ''
  return findOrbitBySemester(props.experience.semester)?.label ?? props.experience.semester
})
</script>

<template>
  <transition name="slide">
    <div v-if="experience" class="experience-detail">
      <div class="detail-header">
        <span class="detail-semester">{{ semesterLabel }}</span>
        <el-button text :icon="X" size="small" circle @click="emit('close')" />
      </div>

      <h3 class="detail-title">{{ experience.title }}</h3>
      <p class="detail-date">
        <Clock :size="14" />
        {{ experience.date }}
      </p>

      <p class="detail-desc">{{ experience.description }}</p>

      <div class="detail-tags">
        <span v-for="tag in experience.tags" :key="tag" class="detail-tag">{{ tag }}</span>
      </div>

      <div class="detail-skills">
        <div v-for="skill in experience.skills" :key="skill.name" class="detail-skill">
          <div class="skill-row">
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-value">{{ skill.growth }}%</span>
          </div>
          <div class="skill-track">
            <div class="skill-fill" :style="{ width: `${skill.growth}%` }" />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.experience-detail {
  position: absolute;
  right: 24px;
  top: 24px;
  width: 360px;
  max-height: calc(100% - 48px);
  overflow-y: auto;
  padding: 24px;
  background: rgba(255, 252, 247, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(61, 43, 31, 0.08);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(26, 18, 10, 0.08);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.detail-semester {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #5c3d28;
  border: 1px solid rgba(61, 43, 31, 0.1);
  padding: 4px 10px;
  border-radius: 100px;
}

.detail-title {
  font-family: 'Instrument Serif', serif;
  font-size: 1.6rem;
  font-weight: 400;
  color: #2d1e12;
  margin-bottom: 8px;
  line-height: 1.3;
}

.detail-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  color: #9a8474;
  margin-bottom: 16px;
}

.detail-desc {
  font-size: 0.9rem;
  color: #6b5443;
  line-height: 1.9;
  margin-bottom: 16px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.detail-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 1.5px;
  padding: 5px 10px;
  border: 1px solid rgba(61, 43, 31, 0.12);
  border-radius: 100px;
  color: #6b5443;
}

.detail-skill {
  margin-bottom: 12px;
}

.skill-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b5443;
  margin-bottom: 4px;
}

.skill-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.skill-track {
  height: 4px;
  background: rgba(61, 43, 31, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  background: linear-gradient(to right, #8b6340, #c8943e);
  border-radius: 2px;
  transition: width 0.8s ease;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
```

---

### Task 6: Create ExperienceForm.vue

**Files:**

- Create: `src/features/growth-timeline/components/ExperienceForm.vue`

- [ ] **Step 1: Implement form dialog**

```vue
<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { reactive, ref, watch } from 'vue'
import { inferSemester, type GrowthExperience } from '../constants'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', payload: Omit<GrowthExperience, 'id' | 'semester'>): void
}>()

const form = reactive({
  title: '',
  date: '',
  description: '',
  tags: '',
  skills: [{ name: '', growth: 0 }],
})

const submitting = ref(false)

function reset() {
  form.title = ''
  form.date = ''
  form.description = ''
  form.tags = ''
  form.skills = [{ name: '', growth: 0 }]
}

function addSkill() {
  form.skills.push({ name: '', growth: 0 })
}

function removeSkill(index: number) {
  form.skills.splice(index, 1)
}

function handleSubmit() {
  if (!form.title || !form.date) return
  submitting.value = true

  setTimeout(() => {
    emit('submit', {
      title: form.title,
      date: form.date,
      description: form.description,
      tags: form.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      skills: form.skills.filter((s) => s.name),
    })
    submitting.value = false
    reset()
    emit('update:visible', false)
  }, 400)
}

watch(
  () => props.visible,
  (val) => {
    if (!val) reset()
  },
)
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="添加成长经历"
    width="560px"
    :close-on-click-modal="false"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form :model="form" label-width="90px">
      <el-form-item label="经历标题" required>
        <el-input v-model="form.title" placeholder="例如：第一次竞赛获奖" />
      </el-form-item>

      <el-form-item label="发生日期" required>
        <el-date-picker
          v-model="form.date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="学期">
        <el-input :value="form.date ? inferSemester(form.date) : ''" disabled />
      </el-form-item>

      <el-form-item label="经历描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="描述这段经历带给你的成长..."
        />
      </el-form-item>

      <el-form-item label="标签">
        <el-input v-model="form.tags" placeholder="用逗号分隔，如：竞赛, 技术, 团队" />
      </el-form-item>

      <el-form-item label="能力成长">
        <div v-for="(skill, index) in form.skills" :key="index" class="skill-input-row">
          <el-input v-model="skill.name" placeholder="能力名称" />
          <el-slider v-model="skill.growth" :min="0" :max="100" show-stops style="width: 160px;" />
          <el-button v-if="form.skills.length > 1" text type="danger" @click="removeSkill(index)"
            >删除</el-button
          >
        </div>
        <el-button text type="primary" :icon="Plus" @click="addSkill">添加能力</el-button>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.skill-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
</style>
```

---

### Task 7: Create GrowthTimeline.vue

**Files:**

- Create: `src/features/growth-timeline/GrowthTimeline.vue`

- [ ] **Step 1: Implement page container**

```vue
<script setup lang="ts">
import AtomScene from './components/AtomScene.vue'
import ExperienceDetail from './components/ExperienceDetail.vue'
import ExperienceForm from './components/ExperienceForm.vue'
import { useGrowthTimeline } from './composables/useGrowthTimeline'

const {
  experiences,
  selectedExperience,
  formVisible,
  selectExperience,
  openForm,
  closeForm,
  addExperience,
} = useGrowthTimeline()

function handleSelect(id: string) {
  if (!id) {
    selectExperience(null)
    return
  }
  selectExperience(id)
}
</script>

<template>
  <div class="growth-timeline-page">
    <div class="scene-wrapper">
      <AtomScene
        :experiences="experiences"
        :selected-id="selectedExperience?.id ?? null"
        @select="handleSelect"
        @add="openForm"
      />
      <ExperienceDetail :experience="selectedExperience" @close="selectExperience(null)" />
    </div>

    <div class="page-hint">
      <span>点击原子核添加经历 · 点击电子查看详情</span>
    </div>

    <ExperienceForm v-model:visible="formVisible" @submit="addExperience" />
  </div>
</template>

<style scoped lang="scss">
.growth-timeline-page {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  background: #f4efe6;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }
}

.scene-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.page-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #9a8474;
  padding: 8px 16px;
  background: rgba(255, 252, 247, 0.7);
  border-radius: 100px;
  border: 1px solid rgba(61, 43, 31, 0.08);
}
</style>
```

---

### Task 8: Update routes.ts

**Files:**

- Modify: `src/app/router/routes.ts`

- [ ] **Step 1: Add growth-timeline route**

在与个人中心、各类申报、奖项报名同级位置新增：

```ts
{
  path: '/growth-timeline',
  name: 'GrowthTimeline',
  component: () => import('@/features/growth-timeline/GrowthTimeline.vue'),
  meta: { title: '成长时间轴', icon: 'Clock' },
},
```

---

### Task 9: Update Sidebar.vue

**Files:**

- Modify: `src/app/layouts/components/Sidebar.vue`

- [ ] **Step 1: Add navigation item**

在导航列表中和个人中心、各类申报、奖项报名同级添加：

```ts
{ name: '成长时间轴', path: '/growth-timeline', icon: 'Clock' },
```

注意确认项目 Sidebar 使用的 icon 名称规范（可能是 lucide-vue-next 的图标名）。

---

### Task 10: Run lint and build

- [ ] **Step 1: Run lint**

```bash
npm run lint:check
```

- [ ] **Step 2: Run type check and build**

```bash
npm run build
```

- [ ] **Step 3: Manual verification**

启动 dev server，访问 `/growth-timeline`，验证：

1. 3D 原子模型正常渲染。
2. 原子核和电子可见。
3. 点击电子右侧出现详情卡片。
4. 点击原子核弹出添加表单。
5. 添加经历后新电子出现在对应轨道上。

---

## Self-Review

- **Spec coverage:** 所有设计文档要求（路由、3D 场景、原子核、轨道、电子、详情卡片、添加表单、学期计算、自然配色）都已对应到任务。
- **Placeholder scan:** 无 TBD/TODO，所有代码块已给出。
- **Type consistency:** `GrowthExperience`、`SemesterOrbit`、`inferSemester`、`findOrbitBySemester` 在 constants.ts 中定义，并在组件和 composable 中一致使用。
