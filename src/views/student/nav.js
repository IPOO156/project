export const studentArchiveCategories = [
  { key: 'honor', label: '荣誉证书', icon: '🏆' },
  { key: 'innovation', label: '创新创业', icon: '💡' },
  { key: 'research', label: '学术研究', icon: '📚' },
  { key: 'competition', label: '学科竞赛', icon: '🎯' },
  { key: 'scholarship', label: '奖学金', icon: '🎓' },
  { key: 'practice', label: '社会实践', icon: '🏗️' },
  { key: 'internship', label: '实习经历', icon: '🧰' },
  { key: 'training', label: '实训项目', icon: '🧩' },
  { key: 'organization', label: '组织履历', icon: '👥' },
  { key: 'reflection', label: '成长心得', icon: '📝' },
]

export function getStudentArchiveCategory(key) {
  return studentArchiveCategories.find((c) => c.key === key)
}

export const studentNavGroups = [
  {
    title: '概览',
    items: [
      { label: '我的档案概览', to: '/student/dashboard', icon: '📊', pill: '学期' },
      { label: '成长时间轴', to: '/student/timeline', icon: '🕒', pill: '内容' },
    ],
  },
  {
    title: '成长档案',
    items: studentArchiveCategories.map((c) => ({
      label: c.label,
      to: `/student/archive/${c.key}`,
      icon: c.icon,
      pill: '材料',
    })),
  },
  {
    title: '管理',
    items: [
      { label: '提交记录', to: '/student/submissions', icon: '🧾', pill: '审核' },
      { label: '个人中心', to: '/student/profile', icon: '👤', pill: '账号' },
    ],
  },
]

