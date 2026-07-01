export const studentArchiveCategories = [
  { key: 'honor', label: '荣誉证书', icon: 'award' },
  { key: 'innovation', label: '创新创业', icon: 'idea' },
  { key: 'research', label: '学术研究', icon: 'book' },
  { key: 'competition', label: '学科竞赛', icon: 'target' },
  { key: 'scholarship', label: '奖学金', icon: 'medal' },
  { key: 'practice', label: '社会实践', icon: 'practice' },
  { key: 'internship', label: '实习经历', icon: 'briefcase' },
  { key: 'training', label: '实训项目', icon: 'tools' },
  { key: 'organization', label: '组织履历', icon: 'users' },
  { key: 'reflection', label: '成长心得', icon: 'edit' },
]

export function getStudentArchiveCategory(key) {
  return studentArchiveCategories.find((c) => c.key === key)
}

export const studentNavGroups = [
  {
    title: '概览',
    items: [
      { label: '我的档案概览', to: '/student/dashboard', icon: 'dashboard', pill: '学期' },
      { label: '成长时间轴', to: '/student/timeline', icon: 'timeline', pill: '内容' },
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
      { label: '提交记录', to: '/student/submissions', icon: 'receipt', pill: '审核' },
      { label: '个人中心', to: '/student/profile', icon: 'user', pill: '账号' },
    ],
  },
]

