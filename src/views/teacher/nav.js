export const teacherNavGroups = [
  {
    title: '概览',
    items: [
      { label: '审核总览', to: '/teacher/dashboard', icon: 'dashboard', pill: '统计' },
    ],
  },
  {
    title: '审核管理',
    items: [
      { label: '待审核', to: '/teacher/review?tab=pending', icon: 'clock', pill: '审核' },
      { label: '审核记录', to: '/teacher/review?tab=history', icon: 'receipt', pill: '历史' },
    ],
  },
  {
    title: '数据',
    items: [
      { label: '统计分析', to: '/teacher/stats', icon: 'view', pill: '图表' },
      { label: '导出管理', to: '/teacher/export', icon: 'download', pill: 'CSV' },
    ],
  },
]
