/* =============================================================================
   管理员 / 教师端重构原型 —— 交互脚本
   纯静态演示：无后端请求，数据均为演示数据。
   ============================================================================= */

;(() => {
  'use strict'

  /* ---------------------------------------------------------------------------
     1. 图标
     --------------------------------------------------------------------------- */

  const ICONS = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    archive:
      '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
    download: '<path d="M12 3v11"/><path d="m7 9 5 5 5-5"/><path d="M4 20h16"/>',
    review:
      '<path d="M9 4H6a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3"/><rect x="9" y="2" width="6" height="4" rx="1"/><path d="m8.5 13 2.5 2.5 4.5-5"/>',
    flow: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19" r="2"/><path d="M8 5h5a2 2 0 0 1 2 2v3"/><path d="M8 19h5a2 2 0 0 0 2-2v-3"/>',
    chart: '<path d="M3 20h18"/><path d="M6 20v-7M12 20V6M18 20V10"/>',
    heatmap:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    org: '<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
    users:
      '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5a3 3 0 0 1 0 6"/><path d="M18 20a6 6 0 0 0-3-5.2"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4.3-4.3"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 20a2 2 0 0 1-3.4 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    external:
      '<path d="M14 3h7v7"/><path d="M21 3 10 14"/><path d="M19 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>',
    fileText:
      '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    alert:
      '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    more: '<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    logout:
      '<path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash:
      '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6"/><path d="M10 11v6M14 11v6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 11 2 2 4-4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    database:
      '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    zap: '<path d="M13 2 3 14h8l-1 8 10-12h-8z"/>',
    log: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    message: '<path d="M21 15a3 3 0 0 1-3 3H8l-5 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 4.4 2.7c-.9.5-1.5 1.2-1.5 2.3"/><path d="M12 17h.01"/>',
    panelLeft:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="m14 9-3 3 3 3"/>',
    folder:
      '<path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8"/><path d="m17 6 2 2M14 9l2 2"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    arrowUpRight: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  }

  function icon(name, size = 16) {
    const path = ICONS[name] || ICONS.dot || '<circle cx="12" cy="12" r="2"/>'
    return `<svg width="${size}" height="${
      size
    }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
      path
    }</svg>`
  }

  /* ---------------------------------------------------------------------------
     2. 基础工具
     --------------------------------------------------------------------------- */

  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))
  const nf = new Intl.NumberFormat('zh-CN')
  const fmt = (n) => nf.format(Number(n) || 0)
  const esc = (value) =>
    String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    })

  const ROLE_META = {
    admin: {
      name: '王五',
      roleLabel: '系统管理员',
      initial: '王',
      scope: '全校数据',
      scopeShort: '全校',
    },
    teacher: {
      name: '李四',
      roleLabel: '教师',
      initial: '李',
      scope: '教育学院 · 小学教育',
      scopeShort: '教育学院',
    },
  }

  /* ---------------------------------------------------------------------------
     3. 导航与路由元数据（5 组）
     --------------------------------------------------------------------------- */

  const NAV = {
    admin: [
      {
        key: 'overview',
        label: '概览',
        icon: 'grid',
        children: [{ key: 'dashboard', label: '工作台' }],
      },
      {
        key: 'archive',
        label: '档案业务',
        icon: 'archive',
        children: [
          { key: 'archive', label: '学生档案' },
          { key: 'export', label: '档案导出' },
        ],
      },
      {
        key: 'review',
        label: '审核与评估',
        icon: 'review',
        children: [
          { key: 'review', label: '材料审核' },
          { key: 'approval', label: '审批流程' },
          { key: 'indicator', label: '指标体系' },
          { key: 'heatmap', label: '成果热力图' },
        ],
      },
      {
        key: 'org',
        label: '组织与人员',
        icon: 'org',
        children: [
          { key: 'org', label: '组织架构' },
          { key: 'accounts', label: '账号与角色' },
        ],
      },
      {
        key: 'system',
        label: '系统',
        icon: 'settings',
        children: [{ key: 'settings', label: '系统设置' }],
      },
    ],
    teacher: [
      {
        key: 'overview',
        label: '概览',
        icon: 'grid',
        children: [{ key: 'dashboard', label: '工作台' }],
      },
      {
        key: 'archive',
        label: '档案业务',
        icon: 'archive',
        children: [
          { key: 'archive', label: '学生档案' },
          { key: 'export', label: '档案导出' },
        ],
      },
      {
        key: 'review',
        label: '审核与评估',
        icon: 'review',
        children: [
          { key: 'review', label: '材料审核' },
          { key: 'heatmap', label: '成果热力图' },
        ],
      },
    ],
  }

  const ROUTE_META = {
    dashboard: { title: '工作台', group: '概览' },
    archive: { title: '学生档案', group: '档案业务' },
    export: { title: '档案导出', group: '档案业务' },
    review: { title: '材料审核', group: '审核与评估' },
    approval: { title: '审批流程', group: '审核与评估' },
    indicator: { title: '指标体系', group: '审核与评估' },
    heatmap: { title: '成果热力图', group: '审核与评估' },
    org: { title: '组织架构', group: '组织与人员' },
    accounts: { title: '账号与角色', group: '组织与人员' },
    settings: { title: '系统设置', group: '系统' },
    messages: { title: '消息中心', group: '概览' },
  }

  /* ---------------------------------------------------------------------------
     4. 演示数据
     --------------------------------------------------------------------------- */

  const STUDENTS = [
    {
      id: 's1',
      no: '2023010088',
      name: '林嘉怡',
      gender: '女',
      college: '教育学院',
      major: '学前教育',
      grade: '2023',
      className: '学前2301',
      counselor: '陈静',
      complete: 98,
      status: '已归档',
      updated: '2026-10-30 14:22',
      phone: '138****2210',
      email: 'linjy@example.edu.cn',
      political: '共青团员',
      source: '普通高考',
      materials: 12,
      awards: 3,
      missing: [],
    },
    {
      id: 's2',
      no: '2024010012',
      name: '陈雨桐',
      gender: '女',
      college: '教育学院',
      major: '小学教育',
      grade: '2024',
      className: '小教2401',
      counselor: '周敏',
      complete: 78,
      status: '待补录',
      updated: '2026-10-30 11:08',
      phone: '139****6732',
      email: 'chenyt@example.edu.cn',
      political: '共青团员',
      source: '普通高考',
      materials: 8,
      awards: 1,
      missing: ['心理健康测评表', '社会实践证明'],
    },
    {
      id: 's3',
      no: '2024020115',
      name: '赵子涵',
      gender: '男',
      college: '教育学院',
      major: '教育技术学',
      grade: '2024',
      className: '教技2402',
      counselor: '王华',
      complete: 88,
      status: '审核中',
      updated: '2026-10-29 17:41',
      phone: '137****4408',
      email: 'zhaozh@example.edu.cn',
      political: '群众',
      source: '普通高考',
      materials: 10,
      awards: 2,
      missing: ['学籍异动审批表'],
    },
    {
      id: 's4',
      no: '2023030076',
      name: '吴雨欣',
      gender: '女',
      college: '教育学院',
      major: '学前教育',
      grade: '2023',
      className: '学前2302',
      counselor: '陈静',
      complete: 96,
      status: '已归档',
      updated: '2026-10-28 15:19',
      phone: '136****9014',
      email: 'wuyx@example.edu.cn',
      political: '中共党员',
      source: '普通高考',
      materials: 11,
      awards: 4,
      missing: [],
    },
    {
      id: 's5',
      no: '2022010034',
      name: '周子墨',
      gender: '男',
      college: '信息工程学院',
      major: '计算机科学与技术',
      grade: '2022',
      className: '计科2201',
      counselor: '张伟',
      complete: 100,
      status: '已归档',
      updated: '2026-10-27 09:36',
      phone: '135****1177',
      email: 'zhouzm@example.edu.cn',
      political: '共青团员',
      source: '普通高考',
      materials: 13,
      awards: 5,
      missing: [],
    },
    {
      id: 's6',
      no: '2024010091',
      name: '郑一诺',
      gender: '女',
      college: '文学院',
      major: '汉语言文学',
      grade: '2024',
      className: '汉文2403',
      counselor: '刘芳',
      complete: 61,
      status: '异常',
      updated: '2026-10-26 16:52',
      phone: '158****3320',
      email: 'zhengyin@example.edu.cn',
      political: '群众',
      source: '普通高考',
      materials: 5,
      awards: 0,
      missing: ['身份证明复印件', '学籍档案正本', '体检表'],
    },
    {
      id: 's7',
      no: '2023030042',
      name: '孙悦',
      gender: '女',
      college: '教育学院',
      major: '教育学',
      grade: '2023',
      className: '教育2301',
      counselor: '李明',
      complete: 84,
      status: '待补录',
      updated: '2026-10-25 10:44',
      phone: '182****7781',
      email: 'sunyue@example.edu.cn',
      political: '共青团员',
      source: '普通高考',
      materials: 9,
      awards: 2,
      missing: ['交换项目协议'],
    },
    {
      id: 's8',
      no: '2022020017',
      name: '何思远',
      gender: '男',
      college: '理学院',
      major: '数学与应用数学',
      grade: '2022',
      className: '数学2202',
      counselor: '李娜',
      complete: 95,
      status: '已归档',
      updated: '2026-10-24 13:05',
      phone: '159****5502',
      email: 'hesy@example.edu.cn',
      political: '共青团员',
      source: '普通高考',
      materials: 11,
      awards: 3,
      missing: [],
    },
  ]

  const REVIEW_ITEMS = [
    {
      id: 'rv1',
      studentId: 's1',
      student: '林嘉怡',
      no: '2023010088',
      college: '教育学院',
      major: '学前教育',
      grade: '2023',
      counselor: '陈静',
      type: '国家励志奖学金材料',
      time: '今天 09:12',
      wait: '等待 2 小时',
      files: [
        { name: '2025-2026学年国家励志奖学金申请表.pdf', size: '1.2 MB', time: '昨天 18:40' },
        { name: '成绩单（教务处盖章）.pdf', size: '860 KB', time: '昨天 18:41' },
        { name: '获奖证书扫描件.zip', size: '4.6 MB', time: '昨天 18:43' },
      ],
    },
    {
      id: 'rv2',
      studentId: 's3',
      student: '赵子涵',
      no: '2024020115',
      college: '教育学院',
      major: '教育技术学',
      grade: '2024',
      counselor: '王华',
      type: '学籍异动材料',
      time: '今天 08:36',
      wait: '等待 3 小时',
      files: [
        { name: '学籍异动申请审批表.pdf', size: '1.1 MB', time: '今天 08:30' },
        { name: '家长知情同意书.pdf', size: '640 KB', time: '今天 08:31' },
      ],
    },
    {
      id: 'rv3',
      studentId: 's4',
      student: '吴雨欣',
      no: '2023030076',
      college: '教育学院',
      major: '学前教育',
      grade: '2023',
      counselor: '陈静',
      type: '心理测评材料补传',
      time: '昨天 16:20',
      wait: '等待 17 小时',
      files: [{ name: '心理健康测评报告.pdf', size: '2.3 MB', time: '昨天 16:18' }],
    },
    {
      id: 'rv4',
      studentId: 's2',
      student: '陈雨桐',
      no: '2024010012',
      college: '教育学院',
      major: '小学教育',
      grade: '2024',
      counselor: '周敏',
      type: '家庭经济困难认定材料',
      time: '昨天 14:05',
      wait: '等待 19 小时',
      files: [
        { name: '家庭经济困难学生认定申请表.pdf', size: '1.4 MB', time: '昨天 14:01' },
        { name: '家庭情况说明.docx', size: '96 KB', time: '昨天 14:02' },
      ],
    },
    {
      id: 'rv5',
      studentId: 's6',
      student: '郑一诺',
      no: '2024010091',
      college: '文学院',
      major: '汉语言文学',
      grade: '2024',
      counselor: '刘芳',
      type: '处分撤销材料',
      time: '昨天 10:22',
      wait: '等待 23 小时',
      files: [{ name: '处分撤销申请书.pdf', size: '720 KB', time: '昨天 10:20' }],
    },
    {
      id: 'rv6',
      studentId: 's7',
      student: '孙悦',
      no: '2023030042',
      college: '教育学院',
      major: '教育学',
      grade: '2023',
      counselor: '李明',
      type: '交换生项目材料',
      time: '10-30 15:40',
      wait: '等待 2 天',
      files: [
        { name: '交换学习申请表.pdf', size: '980 KB', time: '10-30 15:38' },
        { name: '语言能力证明.pdf', size: '1.5 MB', time: '10-30 15:39' },
        { name: '交换项目协议（待补）.pdf', size: '—', time: '—' },
      ],
    },
  ]

  const MESSAGES = [
    {
      id: 'm1',
      title: '材料审核待办：林嘉怡 · 国家励志奖学金',
      from: '系统通知',
      time: '今天 09:12',
      category: 'review',
      unread: true,
      snippet: '该材料已由辅导员初审通过，现进入学校终审环节。',
      body: [
        '学生林嘉怡（2023010088，教育学院 / 学前教育）提交的 2025-2026 学年国家励志奖学金材料已由辅导员陈静初审通过，现流转至学校终审。',
        '请核对申请表、成绩单与获奖证书扫描件，并在 24 小时内完成审核。如材料缺失，请退回并注明需要补充的内容。',
      ],
      route: 'review',
    },
    {
      id: 'm2',
      title: '档案补录提醒：陈雨桐等 38 名学生',
      from: '档案管理',
      time: '今天 08:45',
      category: 'system',
      unread: true,
      snippet: '38 份档案完整率低于 85%，请督促辅导员补录。',
      body: [
        '截至今日 08:45，全校共有 38 份学生档案完整率低于 85%，主要集中在 2024 级新生档案。',
        '请相关辅导员在本周五前完成缺失材料补录，逾期未补录的档案将进入异常清单，并在月度统计中单独列示。',
      ],
      route: 'archive',
    },
    {
      id: 'm3',
      title: '审批结果：批量导出申请已通过',
      from: '审批中心',
      time: '昨天 15:26',
      category: 'system',
      unread: true,
      snippet: '你发起的“全校档案完整率统计”导出申请已通过。',
      body: [
        '你于 2026-11-01 14:50 发起的“全校档案完整率统计”批量导出申请已由学院管理员审批通过。',
        '文件正在生成，预计 3 分钟内完成。生成后可在“档案导出 → 导出任务”中下载，下载链接 7 天内有效。',
      ],
      route: 'export',
    },
    {
      id: 'm4',
      title: '材料退回：孙悦 · 交换生项目材料',
      from: '审核通知',
      time: '10-30 16:05',
      category: 'review',
      unread: false,
      snippet: '缺少交换项目协议，请补充后重新提交。',
      body: [
        '你提交的孙悦（2023030042）交换生项目材料缺少“交换项目协议”，学院复审未通过。',
        '请补充协议扫描件后重新提交。其他材料已核验通过，无需重复上传。',
      ],
      route: 'review',
    },
    {
      id: 'm5',
      title: '系统维护通知：11 月 5 日 00:00–02:00',
      from: '系统运维',
      time: '10-29 10:00',
      category: 'system',
      unread: false,
      snippet: '维护期间档案系统暂停服务，导出任务将顺延执行。',
      body: [
        '为升级数据库与导出服务，系统将于 2026-11-05 00:00 至 02:00 进行例行维护。',
        '维护期间登录、档案查询与导出功能将暂时不可用；已排队的定时任务将在维护结束后自动顺延执行。',
      ],
      route: 'settings',
    },
    {
      id: 'm6',
      title: '月度统计：10 月档案归档报告已生成',
      from: '统计中心',
      time: '10-28 09:00',
      category: 'system',
      unread: false,
      snippet: '10 月新增档案 46 份，归档率 85.7%，同比提升 3.2%。',
      body: [
        '10 月档案归档报告已生成。本月新增档案 46 份，完成归档 39 份，归档率 85.7%，较上月提升 3.2 个百分点。',
        '完整率低于 85% 的档案共 38 份，已在报告中按学院与辅导员分组列示，可在“档案导出”中下载明细。',
      ],
      route: 'export',
    },
  ]

  /* ---------------------------------------------------------------------------
     5. 全局状态
     --------------------------------------------------------------------------- */

  let savedTheme = 'light'
  try {
    savedTheme = localStorage.getItem('prototype-theme') || 'light'
  } catch {
    savedTheme = 'light'
  }

  const state = {
    role: 'admin',
    route: 'dashboard',
    theme: savedTheme === 'dark' ? 'dark' : 'light',
    collapsed: false,
    openGroups: new Set(['overview', 'archive', 'review']),
    dashboardTodo: 'all',
    archiveTab: 'list',
    archiveMore: false,
    exportTab: 'tasks',
    reviewTab: 'pending',
    reviewSelected: 'rv1',
    indicatorTab: 'tree',
    indicatorSelected: 'i1',
    accountTab: 'accounts',
    settingsTab: 'dict',
    dictType: 'status',
    messageFilter: 'all',
    messageSelected: 'm1',
    readMessages: new Set(),
    selectedOrg: 'edu',
    cmdQuery: '',
    cmdIndex: 0,
    cmdResults: [],
  }

  /* ---------------------------------------------------------------------------
     6. 通用片段
     --------------------------------------------------------------------------- */

  const STATUS_TONE = {
    已归档: 'ok',
    待补录: 'warn',
    审核中: 'info',
    异常: 'danger',
    启用: 'ok',
    停用: 'muted',
    已完成: 'ok',
    进行中: 'info',
    失败: 'danger',
    草稿: 'muted',
    待审核: 'warn',
    已通过: 'ok',
    已退回: 'danger',
    生效中: 'ok',
    已结束: 'muted',
  }

  function tag(text, tone, noDot) {
    return `<span class="tag ${tone || ''}${noDot ? ' no-dot' : ''}">${text}</span>`
  }

  function statusTag(text) {
    return tag(text, STATUS_TONE[text] || 'muted')
  }

  function pageHead(opts) {
    const actions = opts.actions ? `<div class="page-actions">${opts.actions}</div>` : ''
    return `<div class="page-head"><div><h1>${opts.title}</h1>${
      opts.desc ? `<p class="page-desc">${opts.desc}</p>` : ''
    }</div>${actions}</div>`
  }

  function kpiStrip(items, five) {
    return `<div class="kpi-strip${five ? ' kpi-strip--5' : ''}">${items
      .map((item) => {
        const meta = item.meta
          ? `<div class="kpi-meta ${item.metaTone || ''}">${item.meta}</div>`
          : ''
        const inner = `<div class="kpi-label">${item.icon ? icon(item.icon, 13) : ''}${
          item.label
        }</div><div class="kpi-value ${item.tone || ''}">${item.value}${
          item.unit ? `<span class="unit">${item.unit}</span>` : ''
        }</div>${meta}`
        if (item.route) {
          return `<button type="button" class="kpi" data-action="navigate" data-route="${
            item.route
          }">${inner}</button>`
        }
        return `<div class="kpi">${inner}</div>`
      })
      .join('')}</div>`
  }

  function card(opts) {
    const head = opts.title
      ? `<div class="card-head"><div class="card-title">${opts.title}${
          opts.sub ? `<span class="sub">${opts.sub}</span>` : ''
        }</div>${opts.actions ? `<div class="card-actions">${opts.actions}</div>` : ''}</div>`
      : ''
    const body = `<div class="card-body${opts.noPad ? ' no-pad' : ''}">${opts.body || ''}</div>`
    const foot = opts.foot ? `<div class="card-foot">${opts.foot}</div>` : ''
    return `<section class="card ${opts.className || ''}">${head}${body}${foot}</section>`
  }

  function table(headers, rows, opts) {
    const options = opts || {}
    if (!rows || !rows.length) {
      return `<div class="table-empty"><strong>${options.emptyTitle || '暂无数据'}</strong>${
        options.emptyText || '可以调整筛选条件后重试。'
      }</div>`
    }
    const head = headers
      .map((h) => {
        if (typeof h === 'string') return `<th>${h}</th>`
        return `<th class="${h.num ? 'cell-num' : ''}">${h.label}</th>`
      })
      .join('')
    return `<div class="table-wrap"><table class="table"><thead><tr>${
      head
    }</tr></thead><tbody>${rows.join('')}</tbody></table></div>`
  }

  function pagination(total, page, size, unit) {
    const pages = Math.max(1, Math.ceil(total / size))
    const nums = []
    for (let i = 1; i <= Math.min(3, pages); i += 1) nums.push(i)
    if (pages > 3) nums.push('…', pages)
    return (
      `<div class="pagination"><span>共 <span class="num">${fmt(total)}</span> ${
        unit || '条'
      } · 每页 ${size} 条</span><div class="pager">` +
      `<button type="button" disabled>上一页</button>${nums
        .map((n) => {
          if (n === '…') return '<button type="button" disabled>…</button>'
          return `<button type="button" class="${
            n === page ? 'is-current' : ''
          }" data-action="pager" data-page="${n}">${n}</button>`
        })
        .join('')}<button type="button" data-action="pager" data-page="2">下一页</button>` +
      `</div></div>`
    )
  }

  function tabsRow(tabs, active, action, tools) {
    return `<div class="tabs-row"><div class="tabs" role="tablist">${tabs
      .map(
        (t) =>
          `<button type="button" role="tab" class="tab ${
            t.key === active ? 'is-active' : ''
          }" data-action="${action}" data-tab="${t.key}">${t.label}${
            t.count != null ? `<span class="tab-count">${t.count}</span>` : ''
          }</button>`,
      )
      .join('')}</div>${tools ? `<div class="tab-tools">${tools}</div>` : ''}</div>`
  }

  function field(label, control, wide) {
    return `<div class="field${wide ? ' field--wide' : ''}"><label>${label}</label>${control}</div>`
  }

  function select(options, value, placeholder) {
    return `<select class="select"><option value="">${placeholder || '全部'}</option>${options
      .map((o) => `<option value="${esc(o)}"${o === value ? ' selected' : ''}>${o}</option>`)
      .join('')}</select>`
  }

  function progress(value, tone) {
    return `<div class="progress-row"><div class="progress ${tone || ''}"><span style="width:${
      value
    }%"></span></div><span class="progress-value">${value}%</span></div>`
  }

  /* ---------------------------------------------------------------------------
     7. 外壳渲染：侧栏 / 顶栏 / 内容
     --------------------------------------------------------------------------- */

  function navItems() {
    return NAV[state.role].reduce((acc, group) => {
      group.children.forEach((child) => {
        acc.push({
          key: child.key,
          label: child.label,
          group: group.label,
          groupKey: group.key,
          icon: group.icon,
        })
      })
      return acc
    }, [])
  }

  function isRouteAllowed(route) {
    return route === 'messages' || navItems().some((item) => item.key === route)
  }

  function renderSidebar() {
    const root = $('#sidebar')
    if (!root) return
    const meta = ROLE_META[state.role]
    const groups = NAV[state.role]

    const brand =
      `<div class="side-brand"><div class="brand-mark">档</div><div class="brand-text">档鉴未来</div>` +
      `<button type="button" class="side-collapse" data-action="toggle-sidebar" title="收起侧栏" aria-label="收起侧栏">${icon(
        'panelLeft',
        16,
      )}</button></div>`

    const scope = `<div class="side-scope"><span class="scope-dot"></span><strong>${
      meta.scopeShort
    }</strong><span>数据范围</span></div>`

    const nav = groups
      .map((group) => {
        const open = state.openGroups.has(group.key)
        const currentGroup = group.children.some((child) => child.key === state.route)
        const children = group.children
          .map(
            (child) =>
              `<button type="button" class="nav-link ${
                child.key === state.route ? 'is-active' : ''
              }" data-action="navigate" data-route="${child.key}" title="${group.label} / ${
                child.label
              }"><span>${child.label}</span></button>`,
          )
          .join('')
        return `<div class="nav-group ${
          open ? 'is-open' : ''
        }"><button type="button" class="nav-group-head ${
          currentGroup ? 'is-current' : ''
        }" data-action="toggle-group" data-group="${group.key}" aria-expanded="${
          open
        }"><span class="nav-icon">${icon(group.icon, 16)}</span><span>${
          group.label
        }</span><span class="chev">${icon(
          'chevronRight',
          13,
        )}</span></button><div class="nav-children">${children}</div></div>`
      })
      .join('')

    root.className = `sidebar${state.collapsed ? ' is-collapsed' : ''}`
    root.innerHTML =
      `${brand + scope}<nav class="side-nav" aria-label="主要导航">${nav}</nav>` +
      `<div class="side-foot"><span>v2.4.0 · 原型</span><button type="button" data-action="toggle-sidebar" title="展开/收起侧栏" aria-label="展开或收起侧栏">${icon(
        'panelLeft',
        15,
      )}</button></div>`
  }

  function unreadMessages() {
    return MESSAGES.filter((m) => m.unread && !state.readMessages.has(m.id))
  }

  function renderTopbar() {
    const root = $('#topbar')
    if (!root) return
    const meta = ROUTE_META[state.route] || { title: '', group: '' }
    const who = ROLE_META[state.role]
    const unread = unreadMessages().length

    const crumbs =
      state.route === 'dashboard'
        ? `<span class="current">${meta.title}</span>`
        : `<span>${meta.group}</span><span class="sep">/</span><span class="current">${
            meta.title
          }</span>`

    root.innerHTML =
      `<div class="topbar-left"><nav class="breadcrumb" aria-label="面包屑">${crumbs}</nav></div>` +
      `<button type="button" class="topbar-search" data-action="open-cmd" aria-label="打开全局搜索（Ctrl+K）">${icon(
        'search',
        15,
      )}<span class="search-text">搜索页面、操作或消息…</span><kbd>Ctrl K</kbd></button>` +
      `<div class="topbar-actions">` +
      `<button type="button" class="icon-btn" data-action="refresh" title="刷新当前页" aria-label="刷新当前页">${icon(
        'refresh',
        17,
      )}</button>` +
      `<button type="button" class="icon-btn" data-action="open-bell" title="消息" aria-label="消息，${
        unread
      } 条未读">${icon('bell', 17)}${
        unread ? `<span class="badge">${unread}</span>` : ''
      }</button>` +
      `<button type="button" class="icon-btn" data-action="toggle-theme" title="切换明暗" aria-label="切换明暗主题">${icon(
        state.theme === 'light' ? 'moon' : 'sun',
        17,
      )}</button>` +
      `<span class="topbar-divider"></span>` +
      `<button type="button" class="user-btn" data-action="open-user" aria-label="账号菜单">` +
      `<span class="avatar">${who.initial}</span><span class="user-meta"><span class="user-name">${
        who.name
      }</span><span class="user-role">${who.roleLabel}</span></span>${icon(
        'chevronDown',
        14,
      )}</button></div>`

    document.documentElement.dataset.theme = state.theme
  }

  function navigate(route) {
    if (!ROUTE_META[route]) return
    if (!isRouteAllowed(route)) {
      toast('当前身份没有该模块权限')
      return
    }
    state.route = route
    const group = NAV[state.role].find((g) => g.children.some((c) => c.key === route))
    if (group) state.openGroups.add(group.key)
    closeDropdown()
    render()
  }

  function refreshCurrent() {
    toast('已刷新当前页数据（原型演示）')
  }

  function setTheme(theme) {
    state.theme = theme
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('prototype-theme', theme)
    } catch {
      /* 忽略隐私模式下的存储异常 */
    }
    renderTopbar()
    syncProtoPanel()
  }

  function toggleTheme() {
    setTheme(state.theme === 'light' ? 'dark' : 'light')
  }

  function setRole(role) {
    if (role !== 'admin' && role !== 'teacher') return
    state.role = role
    state.openGroups = new Set(['overview', 'archive', 'review'])
    if (!isRouteAllowed(state.route)) state.route = 'dashboard'
    closeDropdown()
    closeOverlay()
    render()
    syncProtoPanel()
    toast(`已切换为${ROLE_META[role].roleLabel}视角（原型）`)
  }

  /* ---------------------------------------------------------------------------
     8. 下拉菜单 / Toast / 浮层 / 抽屉 / 弹窗
     --------------------------------------------------------------------------- */

  const overlayRoot = $('#overlayRoot')
  const toastRoot = $('#toastRoot')
  let toastTimer = null

  function toast(message) {
    if (!toastRoot) return
    const el = document.createElement('div')
    el.className = 'toast'
    el.textContent = message
    toastRoot.appendChild(el)
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      el.remove()
    }, 2800)
  }

  function setOverlay(html) {
    overlayRoot.innerHTML = html
    document.body.style.overflow = 'hidden'
    document.body.classList.add('has-overlay')
  }

  function closeOverlay() {
    overlayRoot.innerHTML = ''
    document.body.style.overflow = ''
    document.body.classList.remove('has-overlay')
  }

  function closeDropdown() {
    const root = $('#dropdownRoot')
    if (root) root.remove()
  }

  function positionDropdown(anchor) {
    const rect = anchor.getBoundingClientRect()
    return `top:${Math.round(rect.bottom + 6)}px;right:${Math.round(window.innerWidth - rect.right)}px;`
  }

  function openBell(anchor) {
    closeDropdown()
    const unread = unreadMessages()
    const items = (unread.length ? unread : MESSAGES).slice(0, 3)
    const html =
      `<div id="dropdownRoot"><div class="dropdown dropdown-messages" style="${positionDropdown(
        anchor,
      )}">` +
      `<div class="dropdown-head"><strong>消息</strong><span>${
        unread.length
      } 条未读</span></div>${items
        .map(
          (m) =>
            `<button type="button" class="menu-item" data-action="open-message" data-id="${
              m.id
            }"><span class="dm-title"><span>${m.title}</span><span class="muted">${
              m.time
            }</span></span><span class="dm-snippet">${m.from} · ${m.snippet}</span></button>`,
        )
        .join(
          '',
        )}<div class="dropdown-foot"><button type="button" class="btn btn-sm" data-action="navigate" data-route="messages">查看全部消息</button></div>` +
      `</div></div>`
    document.body.insertAdjacentHTML('beforeend', html)
  }

  function openUser(anchor) {
    closeDropdown()
    const who = ROLE_META[state.role]
    const html =
      `<div id="dropdownRoot"><div class="dropdown" style="${positionDropdown(anchor)}">` +
      `<div class="dropdown-head"><strong>${who.name} · ${who.roleLabel}</strong><span>${
        who.scope
      }</span></div>` +
      `<button type="button" class="menu-item" data-action="open-profile">${icon(
        'user',
        15,
      )}个人信息</button>` +
      `<button type="button" class="menu-item" data-action="open-shortcuts">${icon(
        'key',
        15,
      )}键盘快捷键</button>` +
      `<button type="button" class="menu-item" data-action="open-notes">${icon(
        'info',
        15,
      )}原型改造说明</button>` +
      `<div class="menu-sep"></div>` +
      `<button type="button" class="menu-item" data-action="switch-account">${icon(
        'users',
        15,
      )}切换账号</button>` +
      `<button type="button" class="menu-item danger" data-action="logout">${icon(
        'logout',
        15,
      )}退出登录</button>` +
      `</div></div>`
    document.body.insertAdjacentHTML('beforeend', html)
  }

  function openModal(opts) {
    closeDropdown()
    setOverlay(
      `<div class="overlay is-center" data-overlay><div class="modal ${
        opts.wide ? 'modal--wide' : ''
      }" role="dialog" aria-modal="true" aria-label="${esc(opts.title)}">` +
        `<div class="modal-head"><div><h2>${opts.title}</h2>${
          opts.desc ? `<p>${opts.desc}</p>` : ''
        }</div><button type="button" class="close-btn" data-action="close-overlay" aria-label="关闭">${icon(
          'close',
          16,
        )}</button></div>` +
        `<div class="modal-body">${opts.body || ''}</div>${
          opts.foot ? `<div class="modal-foot">${opts.foot}</div>` : ''
        }</div></div>`,
    )
  }

  function openDrawer(opts) {
    closeDropdown()
    setOverlay(
      `<div class="overlay" data-overlay><div class="drawer ${
        opts.narrow ? 'drawer--narrow' : ''
      }" role="dialog" aria-modal="true" aria-label="${esc(opts.title)}">` +
        `<div class="drawer-head"><div><h2>${opts.title}</h2>${
          opts.sub ? `<p>${opts.sub}</p>` : ''
        }</div><button type="button" class="close-btn" data-action="close-overlay" aria-label="关闭">${icon(
          'close',
          16,
        )}</button></div>` +
        `<div class="drawer-body">${opts.body || ''}</div>${
          opts.foot ? `<div class="drawer-foot">${opts.foot}</div>` : ''
        }</div></div>`,
    )
  }

  function openConfirm(opts) {
    openModal({
      title: opts.title,
      desc: opts.desc || '',
      body: `<div class="callout ${opts.warn ? 'warn' : 'info'}"><span class="callout-icon">${icon(
        opts.warn ? 'alert' : 'info',
        16,
      )}</span><div>${opts.body || '该操作会记录在操作日志中。'}</div></div>`,
      foot:
        `<span class="foot-left">原型演示，不会修改真实数据</span>` +
        `<button type="button" class="btn" data-action="close-overlay">取消</button>` +
        `<button type="button" class="btn ${
          opts.danger ? 'btn-danger' : 'btn-primary'
        }" data-action="submit-modal" data-toast="${esc(opts.toast || '操作已完成（原型演示）')}">${
          opts.confirmLabel || '确认'
        }</button>`,
    })
  }

  /* ---------------------------------------------------------------------------
     9. 全局搜索（Ctrl+K）
     --------------------------------------------------------------------------- */

  function commandResults() {
    const q = state.cmdQuery.trim().toLowerCase()
    const pages = navItems().map((item) => ({
      kind: 'page',
      title: item.label,
      sub: `页面 · ${item.group}`,
      icon: item.icon,
      route: item.key,
    }))
    pages.push({
      kind: 'page',
      title: '消息中心',
      sub: '页面 · 概览',
      icon: 'mail',
      route: 'messages',
    })

    const actions = [
      {
        kind: 'action',
        title: '切换明暗主题',
        sub: '操作 · 外观',
        icon: state.theme === 'light' ? 'moon' : 'sun',
        run: toggleTheme,
      },
      {
        kind: 'action',
        title: '查看改造说明',
        sub: '操作 · 原型说明',
        icon: 'info',
        run: openNotes,
      },
      {
        kind: 'action',
        title: '刷新当前页面',
        sub: '操作 · 数据',
        icon: 'refresh',
        run: refreshCurrent,
      },
    ]
    if (state.role === 'admin') {
      actions.push({
        kind: 'action',
        title: '新建导出任务',
        sub: '操作 · 档案导出',
        icon: 'download',
        run: openExportModal,
      })
      actions.push({
        kind: 'action',
        title: '重算评分',
        sub: '操作 · 指标体系',
        icon: 'zap',
        run: openRecalcModal,
      })
      actions.push({
        kind: 'action',
        title: '新增账号',
        sub: '操作 · 账号与角色',
        icon: 'user',
        run: openAccountModal,
      })
    }
    const all = pages.concat(actions)
    if (!q) return all
    return all.filter((item) => (item.title + item.sub).toLowerCase().includes(q))
  }

  function openCommand() {
    state.cmdQuery = ''
    state.cmdIndex = 0
    state.cmdResults = commandResults()
    closeDropdown()
    setOverlay(
      `<div class="overlay is-top" data-overlay><div class="cmd" role="dialog" aria-modal="true" aria-label="全局搜索">` +
        `<div class="cmd-input-row">${icon(
          'search',
          18,
        )}<input id="cmdInput" type="text" placeholder="搜索页面、操作或消息…" autocomplete="off" spellcheck="false" />` +
        `<kbd>Esc</kbd></div>` +
        `<div class="cmd-list" id="cmdList"></div>` +
        `<div class="cmd-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 打开</span><span><kbd>Esc</kbd> 关闭</span></div>` +
        `</div></div>`,
    )
    renderCmdList()
    const input = $('#cmdInput')
    if (!input) return
    input.focus()
    input.addEventListener('input', () => {
      state.cmdQuery = input.value
      state.cmdResults = commandResults()
      state.cmdIndex = 0
      renderCmdList()
    })
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        state.cmdIndex = Math.min(state.cmdResults.length - 1, state.cmdIndex + 1)
        renderCmdList()
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        state.cmdIndex = Math.max(0, state.cmdIndex - 1)
        renderCmdList()
      } else if (event.key === 'Enter') {
        event.preventDefault()
        runCommand(state.cmdIndex)
      }
    })
  }

  function renderCmdList() {
    const list = $('#cmdList')
    if (!list) return
    if (!state.cmdResults.length) {
      list.innerHTML =
        '<div class="cmd-empty">没有找到匹配的页面或操作<br /><span class="muted">试试“档案”“导出”“审核”</span></div>'
      return
    }
    list.innerHTML = state.cmdResults
      .map(
        (item, index) =>
          `<button type="button" class="cmd-item ${
            index === state.cmdIndex ? 'is-active' : ''
          }" data-action="cmd-run" data-index="${index}">${icon(
            item.icon,
            16,
          )}<span class="cmd-main"><span>${item.title}</span><span class="cmd-sub">${
            item.sub
          }</span></span><span class="cmd-kbd">↵</span></button>`,
      )
      .join('')
    const active = $('.cmd-item.is-active', list)
    if (active) active.scrollIntoView({ block: 'nearest' })
  }

  function runCommand(index) {
    const item = state.cmdResults[index]
    if (!item) return
    closeOverlay()
    if (item.kind === 'page') {
      navigate(item.route)
    } else if (typeof item.run === 'function') {
      item.run()
    }
  }

  /* ---------------------------------------------------------------------------
     10. 原型预览控制
     --------------------------------------------------------------------------- */

  function toggleProtoPanel() {
    const panel = $('#protoPanel')
    if (!panel) return
    panel.hidden = !panel.hidden
  }

  function syncProtoPanel() {
    const panel = $('#protoPanel')
    if (!panel) return
    $$('[data-action="set-role"]', panel).forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.role === state.role)
    })
  }

  /* ---------------------------------------------------------------------------
     11. 事件入口
     --------------------------------------------------------------------------- */

  function handleClick(event) {
    const overlay = event.target.closest('[data-overlay]')
    if (overlay && event.target === overlay) {
      closeOverlay()
      return
    }

    const trigger = event.target.closest('[data-action]')
    if (!trigger) {
      closeDropdown()
      return
    }

    // 原型内链接型操作（如公告）不触发页面跳转
    if (trigger.tagName === 'A') event.preventDefault()

    const action = trigger.dataset.action
    const dataset = trigger.dataset

    switch (action) {
      case 'toggle-sidebar':
        state.collapsed = !state.collapsed
        renderSidebar()
        break
      case 'toggle-group': {
        const key = dataset.group
        const isNarrow = window.matchMedia('(max-width: 900px)').matches
        if (state.collapsed || isNarrow) {
          const group = NAV[state.role].find((g) => g.key === key)
          if (group && group.children[0]) navigate(group.children[0].key)
          return
        }
        if (state.openGroups.has(key)) state.openGroups.delete(key)
        else state.openGroups.add(key)
        renderSidebar()
        break
      }
      case 'navigate':
        navigate(dataset.route)
        break
      case 'open-message':
        openMessage(dataset.id)
        break
      case 'toggle-theme':
        toggleTheme()
        break
      case 'open-bell':
        openBell(trigger)
        break
      case 'open-user':
        openUser(trigger)
        break
      case 'close-dropdown':
        closeDropdown()
        break
      case 'open-cmd':
        openCommand()
        break
      case 'cmd-run':
        runCommand(Number(dataset.index))
        break
      case 'close-overlay':
        closeOverlay()
        break
      case 'refresh':
        refreshCurrent()
        break
      case 'pager':
        toast(`原型分页：第 ${dataset.page} 页（演示）`)
        break
      case 'toast':
        toast(dataset.message || '演示操作')
        break
      case 'submit-modal':
        closeOverlay()
        toast(dataset.toast || '操作已完成（原型演示）')
        break
      case 'confirm-action':
        openConfirm({
          title: dataset.title || '确认操作',
          body: dataset.body || '该操作会记录在操作日志中。',
          confirmLabel: dataset.confirmLabel || '确认',
          toast: dataset.toast || '操作已完成（原型演示）',
          danger: dataset.danger === 'true',
          warn: dataset.warn === 'true',
        })
        break
      case 'open-notes':
        openNotes()
        break
      case 'close-proto':
        $('#protoPanel').hidden = true
        break
      case 'set-role':
        setRole(dataset.role)
        break
      case 'open-profile':
        openProfile()
        break
      case 'open-shortcuts':
        openShortcuts()
        break
      case 'switch-account':
        closeDropdown()
        toast('真实系统会跳转登录页；原型中请用右下角“原型预览”切换身份')
        break
      case 'logout':
        closeDropdown()
        openConfirm({
          title: '退出登录',
          desc: '确认退出当前账号？',
          body: '退出后需要重新登录，未保存的筛选条件将丢失。',
          confirmLabel: '退出登录',
          toast: '已退出登录（原型演示）',
          danger: true,
        })
        break
      case 'todo-filter':
        state.dashboardTodo = dataset.filter
        render()
        break
      case 'archive-tab':
        state.archiveTab = dataset.tab
        render()
        break
      case 'toggle-filters':
        state.archiveMore = !state.archiveMore
        render()
        break
      case 'view-student':
        openStudentDrawer(dataset.id)
        break
      case 'export-tab':
        state.exportTab = dataset.tab
        render()
        break
      case 'review-tab':
        state.reviewTab = dataset.tab
        render()
        break
      case 'select-review':
        state.reviewSelected = dataset.id
        render()
        break
      case 'indicator-tab':
        state.indicatorTab = dataset.tab
        render()
        break
      case 'select-indicator':
        state.indicatorSelected = dataset.id
        render()
        break
      case 'account-tab':
        state.accountTab = dataset.tab
        render()
        break
      case 'settings-tab':
        state.settingsTab = dataset.tab
        render()
        break
      case 'select-dict':
        state.dictType = dataset.type
        render()
        break
      case 'select-org':
        state.selectedOrg = dataset.id
        render()
        break
      case 'message-filter':
        state.messageFilter = dataset.filter
        render()
        break
      case 'select-message':
        state.messageSelected = dataset.id
        state.readMessages.add(dataset.id)
        render()
        break
      case 'mark-all-read':
        MESSAGES.forEach((m) => state.readMessages.add(m.id))
        render()
        toast('已全部标记为已读')
        break
      case 'open-export-modal':
        openExportModal()
        break
      case 'open-delegation-modal':
        openDelegationModal()
        break
      case 'open-recalc-modal':
        openRecalcModal()
        break
      case 'open-account-modal':
        openAccountModal()
        break
      case 'open-indicator-modal':
        openIndicatorModal()
        break
      case 'open-flow-modal':
        openFlowModal()
        break
      case 'open-org-modal':
        openOrgModal()
        break
      case 'open-template-modal':
        openTemplateModal()
        break
      case 'download':
        toast('文件开始下载（原型演示）')
        break
      case 'retry':
        toast('任务已重新排队（原型演示）')
        break
      case 'run-task':
        toast('任务已触发，稍后可在日志中查看结果（原型演示）')
        break
      default:
        break
    }
  }

  function openMessage(id) {
    const message = MESSAGES.find((m) => m.id === id)
    if (!message) return
    state.messageSelected = id
    state.readMessages.add(id)
    closeDropdown()
    state.route = 'messages'
    state.messageFilter = 'all'
    render()
  }

  function handleKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      openCommand()
      return
    }
    if (event.key === 'Escape') {
      if (overlayRoot.innerHTML) {
        closeOverlay()
        return
      }
      if ($('#dropdownRoot')) {
        closeDropdown()
        return
      }
      const panel = $('#protoPanel')
      if (panel && !panel.hidden) panel.hidden = true
    }
  }

  /* ---------------------------------------------------------------------------
     12. 工作台
     --------------------------------------------------------------------------- */

  const ADMIN_TODOS = [
    {
      type: 'review',
      typeLabel: '材料审核',
      title: '国家励志奖学金材料待终审',
      target: '林嘉怡 · 2023010088',
      time: '今天 09:12',
      action: '去审核',
      route: 'review',
    },
    {
      type: 'review',
      typeLabel: '材料审核',
      title: '学籍异动材料待复核',
      target: '赵子涵 · 2024020115',
      time: '今天 08:36',
      action: '去审核',
      route: 'review',
    },
    {
      type: 'approval',
      typeLabel: '审批',
      title: '学生档案信息更正申请',
      target: '教育学院 · 周敏',
      time: '昨天 17:20',
      action: '去审批',
      route: 'approval',
    },
    {
      type: 'approval',
      typeLabel: '审批',
      title: '批量档案导出申请',
      target: '信息工程学院 · 张伟',
      time: '昨天 15:02',
      action: '去审批',
      route: 'approval',
    },
    {
      type: 'system',
      typeLabel: '系统',
      title: '定时任务执行失败',
      target: '每周档案完整率统计',
      time: '昨天 02:00',
      action: '去处理',
      route: 'settings',
    },
    {
      type: 'review',
      typeLabel: '材料审核',
      title: '心理健康测评材料补传',
      target: '吴雨欣 · 2023030076',
      time: '昨天 11:47',
      action: '去审核',
      route: 'review',
    },
  ]

  const TEACHER_TODOS = [
    {
      type: 'review',
      typeLabel: '材料审核',
      title: '国家励志奖学金材料待初审',
      target: '林嘉怡 · 2023010088',
      time: '今天 09:12',
      action: '去审核',
      route: 'review',
    },
    {
      type: 'review',
      typeLabel: '材料审核',
      title: '交换生项目材料待初审',
      target: '孙悦 · 2023030042',
      time: '10-30 15:40',
      action: '去审核',
      route: 'review',
    },
    {
      type: 'approval',
      typeLabel: '审批',
      title: '课程成绩更正申请',
      target: '陈雨桐 · 2024010012',
      time: '今天 08:05',
      action: '去审批',
      route: 'review',
    },
    {
      type: 'system',
      typeLabel: '系统',
      title: '小教2401 成绩导入结果待确认',
      target: '教务系统 · 42 条记录',
      time: '昨天 18:30',
      action: '去确认',
      route: 'archive',
    },
  ]

  const NOTICES = [
    { title: '关于 2026 年秋季学期学生档案归档工作的通知', time: '今天 08:30' },
    { title: '档案系统将于 11 月 5 日 00:00–02:00 例行维护', time: '昨天 10:00' },
    { title: '2026 年 10 月档案归档报告已生成', time: '10-28 09:00' },
  ]

  const RECENT_LOGS = [
    { actor: '王五', action: '审核通过', target: '吴雨欣 · 心理测评材料', time: '今天 09:05' },
    { actor: '周敏', action: '创建导出任务', target: '教育学院 · 档案明细', time: '今天 08:58' },
    { actor: '陈静', action: '补录材料', target: '陈雨桐 · 社会实践证明', time: '今天 08:42' },
    { actor: '系统', action: '执行定时任务', target: '每周完整率统计', time: '今天 02:00' },
    { actor: '王五', action: '修改系统配置', target: '导出单次上限 5,000 条', time: '昨天 17:36' },
  ]

  const TEACHER_RECENT_LOGS = [
    { actor: '李四', action: '初审通过', target: '林嘉怡 · 奖学金材料', time: '今天 09:18' },
    { actor: '李四', action: '补录材料', target: '陈雨桐 · 社会实践证明', time: '今天 08:42' },
    { actor: '李四', action: '导出档案', target: '小教2401 · 42 人', time: '昨天 16:10' },
    { actor: '系统', action: '成绩导入完成', target: '小教2401 · 42 条', time: '昨天 18:30' },
  ]

  const QUICK_LINKS_ADMIN = [
    { label: '档案查询', icon: 'archive', route: 'archive' },
    { label: '材料审核', icon: 'review', route: 'review' },
    { label: '导出任务', icon: 'download', route: 'export' },
    { label: '成果热力图', icon: 'heatmap', route: 'heatmap' },
    { label: '消息中心', icon: 'mail', route: 'messages' },
    { label: '系统设置', icon: 'settings', route: 'settings' },
  ]

  const QUICK_LINKS_TEACHER = [
    { label: '档案查询', icon: 'archive', route: 'archive' },
    { label: '材料审核', icon: 'review', route: 'review' },
    { label: '导出任务', icon: 'download', route: 'export' },
    { label: '成果热力图', icon: 'heatmap', route: 'heatmap' },
    { label: '消息中心', icon: 'mail', route: 'messages' },
    { label: '改造说明', icon: 'info', action: 'open-notes' },
  ]

  function quickLink(item) {
    return `<button type="button" class="quick-btn" data-action="${item.action || 'navigate'}"${
      item.route ? ` data-route="${item.route}"` : ''
    }>${icon(item.icon, 16)}<span>${item.label}</span></button>`
  }

  function screenDashboard() {
    const isTeacher = state.role === 'teacher'
    const who = ROLE_META[state.role]
    const todos = isTeacher ? TEACHER_TODOS : ADMIN_TODOS
    const filtered =
      state.dashboardTodo === 'all' ? todos : todos.filter((t) => t.type === state.dashboardTodo)
    const logs = isTeacher ? TEACHER_RECENT_LOGS : RECENT_LOGS
    const quick = isTeacher ? QUICK_LINKS_TEACHER : QUICK_LINKS_ADMIN
    const scopeName = isTeacher ? '教育学院' : '全校'

    const todoFilters = [
      { key: 'all', label: '全部' },
      { key: 'review', label: '材料审核' },
      { key: 'approval', label: '审批' },
      { key: 'system', label: '系统' },
    ]

    const actions = `<div class="segmented" role="group" aria-label="待办筛选">${todoFilters
      .map(
        (f) =>
          `<button type="button" class="segmented__btn ${
            state.dashboardTodo === f.key ? 'is-active' : ''
          }" data-action="todo-filter" data-filter="${f.key}">${f.label}</button>`,
      )
      .join('')}</div>`

    const todoRows = filtered.map(
      (t) =>
        `<tr><td><span class="type-mark ${t.type}"><span class="type-dot"></span>${
          t.typeLabel
        }</span></td><td><span class="cell-strong">${t.title}</span></td><td>${
          t.target
        }</td><td class="muted">${
          t.time
        }</td><td><button type="button" class="link-btn" data-action="navigate" data-route="${
          t.route
        }">${t.action}</button></td></tr>`,
    )

    const todoCard = card({
      title: '待办工作台',
      sub: `共 ${filtered.length} 项`,
      actions,
      noPad: true,
      body: `${table(['类型', '事项', '对象', '发起时间', '操作'], todoRows, {
        emptyTitle: '当前分类没有待办',
        emptyText: '切换分类查看其他事项。',
      })}<div class="card-foot"><span>待办每 5 分钟自动刷新</span><button type="button" class="link-btn" data-action="navigate" data-route="messages">查看相关消息</button></div>`,
    })

    const quickCard = card({
      title: '快捷入口',
      sub: '常用功能',
      body: `<div class="quick-grid">${quick.map(quickLink).join('')}</div>`,
    })

    const noticeCard = card({
      title: '系统公告',
      actions:
        '<button type="button" class="link-btn muted" data-action="navigate" data-route="messages">更多</button>',
      body: `<div class="notice-list">${NOTICES.map(
        (n) =>
          `<a class="notice-item" href="#" data-action="toast" data-message="公告详情（原型演示）"><span class="notice-dot"></span><span><span class="notice-title">${
            n.title
          }</span><span class="notice-time">${n.time}</span></span></a>`,
      ).join('')}</div>`,
    })

    const logRows = logs.map(
      (l) =>
        `<tr><td class="cell-strong">${l.actor}</td><td>${l.action}</td><td>${
          l.target
        }</td><td class="muted">${l.time}</td></tr>`,
    )

    const logCard = card({
      title: '最近操作',
      actions: `<button type="button" class="link-btn muted" data-action="${
        isTeacher ? 'toast' : 'navigate'
      }"${
        isTeacher ? ' data-message="教师端仅展示本人操作记录"' : ' data-route="settings"'
      }>查看全部</button>`,
      noPad: true,
      body: table(['操作人', '操作内容', '对象', '时间'], logRows),
    })

    const scopeCard = card({
      title: '我的角色与数据范围',
      body:
        `<div class="detail-summary">` +
        `<div class="item"><div class="label">当前角色</div><div class="value">${
          who.roleLabel
        }</div></div>` +
        `<div class="item"><div class="label">数据范围</div><div class="value">${
          who.scope
        }</div></div>` +
        `<div class="item"><div class="label">可用模块</div><div class="value">${
          navItems().length
        } 项` +
        `</div></div>` +
        `<div class="item"><div class="label">最近登录</div><div class="value">今天 09:02</div></div>` +
        `</div>` +
        `<div class="split-divider"></div>` +
        `<div class="callout info"><span class="callout-icon">${icon(
          'shield',
          16,
        )}</span><div>菜单按角色权限自动过滤。教师默认仅可见工作台、学生档案、档案导出与成果热力图；材料审核需管理员授权。</div></div>`,
    })

    const reviewCount = todos.filter((t) => t.type === 'review').length
    const approvalCount = todos.filter((t) => t.type === 'approval').length
    const systemCount = todos.filter((t) => t.type === 'system').length
    const todoMeta = [
      reviewCount ? `${reviewCount} 项材料审核` : '',
      approvalCount ? `${approvalCount} 项审批` : '',
      systemCount ? `${systemCount} 项系统` : '',
    ]
      .filter(Boolean)
      .join(' · ')

    const kpis = kpiStrip([
      {
        label: '待处理事项',
        value: todos.length,
        unit: '项',
        meta: todoMeta,
        route: 'messages',
      },
      {
        label: '在库学生',
        value: isTeacher ? 312 : 1286,
        unit: '人',
        meta: `较上月 +${isTeacher ? '1.2' : '1.8'}%`,
        route: 'archive',
      },
      {
        label: '本月新增档案',
        value: isTeacher ? 12 : 46,
        unit: '份',
        meta: `完整录入 ${isTeacher ? 10 : 38} 份`,
      },
      {
        label: '档案完整率',
        value: isTeacher ? '94.6' : '92.4',
        unit: '%',
        meta: isTeacher ? '低于 85% 的档案 18 份' : '低于 85% 的档案 38 份',
        metaTone: 'up',
      },
    ])

    const metrics = [
      { label: '在库档案', value: isTeacher ? 312 : 1286, sub: '含在籍与休学' },
      { label: '本月新增', value: isTeacher ? 12 : 46, sub: '较上月 +1.8%' },
      {
        label: '已归档',
        value: isTeacher ? 268 : 1174,
        sub: `归档率 ${isTeacher ? '85.9%' : '91.3%'}`,
      },
      { label: '待补录', value: isTeacher ? 18 : 38, sub: '需辅导员处理' },
      { label: '异常档案', value: isTeacher ? 2 : 5, sub: '完整率低于 70%' },
    ]

    const dataStrip = `<div class="data-strip"><div class="data-strip-head"><h2>档案数据概览</h2><div class="tools"><span class="muted">${
      scopeName
    } · 更新于 09:42</span><button type="button" class="btn btn-sm" data-action="refresh">${icon(
      'refresh',
      14,
    )}刷新</button></div></div><div class="metrics">${metrics
      .map(
        (m) =>
          `<div class="metric"><div class="metric-label">${
            m.label
          }</div><div class="metric-value">${fmt(m.value)}</div><div class="metric-sub">${
            m.sub
          }</div></div>`,
      )
      .join('')}</div></div>`

    return (
      `${
        pageHead({
          title: '工作台',
          desc:
            `${who.name}，` +
            `今天有 ${todos.length} 项待办需要处理。` +
            `数据范围：${who.scope}。`,
          actions: `<button type="button" class="btn" data-action="refresh">${icon(
            'refresh',
            15,
          )}刷新数据</button>${
            isTeacher
              ? `<button type="button" class="btn btn-primary" data-action="navigate" data-route="archive">${icon(
                  'archive',
                  15,
                )}查看档案</button>`
              : `<button type="button" class="btn btn-primary" data-action="open-export-modal">${icon(
                  'download',
                  15,
                )}新建导出</button>`
          }`,
        }) +
        kpis +
        dataStrip
      }<div class="grid-2-1 section-gap"><div class="stack">${todoCard}</div><div class="stack">${
        quickCard
      }${noticeCard}</div></div>` + `<div class="grid-2-1 section-gap">${logCard}${scopeCard}</div>`
    )
  }

  /* ---------------------------------------------------------------------------
     13. 学生档案
     --------------------------------------------------------------------------- */

  const COLLEGE_STATS = [
    { name: '教育学院', students: 420, archived: 394, pending: 10, rate: 93.8, counselor: '周敏' },
    { name: '文学院', students: 236, archived: 218, pending: 5, rate: 92.4, counselor: '刘芳' },
    {
      name: '信息工程学院',
      students: 198,
      archived: 186,
      pending: 3,
      rate: 93.9,
      counselor: '张伟',
    },
    { name: '理学院', students: 156, archived: 138, pending: 6, rate: 88.5, counselor: '李娜' },
    { name: '艺术学院', students: 104, archived: 89, pending: 5, rate: 85.6, counselor: '王强' },
    { name: '外国语学院', students: 82, archived: 72, pending: 3, rate: 87.8, counselor: '陈晨' },
    { name: '体育学院', students: 58, archived: 49, pending: 4, rate: 84.5, counselor: '赵磊' },
    {
      name: '马克思主义学院',
      students: 32,
      archived: 28,
      pending: 2,
      rate: 87.5,
      counselor: '孙倩',
    },
  ]

  function archiveFilterBar() {
    const collegeOptions = COLLEGE_STATS.map((c) => c.name)
    const majorOptions = Array.from(new Set(STUDENTS.map((s) => s.major)))

    const more = state.archiveMore
      ? `<div class="filter-grid section-gap">${field(
          '年级',
          select(['2022', '2023', '2024', '2025']),
        )}${field('辅导员', select(['周敏', '陈静', '王华', '李明', '刘芳', '张伟']))}${field(
          '完整率',
          select(['90% 以上', '80%–89%', '70%–79%', '低于 70%']),
        )}${field('更新时间', '<input class="input" type="date" value="2026-10-01" />')}${field(
          '数据范围',
          select(['全部学生', '在籍学生', '休学学生', '已毕业学生']),
        )}</div>`
      : ''

    return (
      `<div class="filter-bar"><div class="filter-grid">${field(
        '关键字',
        '<input class="input" type="text" placeholder="学号 / 姓名 / 手机号" />',
        true,
      )}${field('学院', select(collegeOptions))}${field('专业', select(majorOptions))}${field(
        '档案状态',
        select(['已归档', '待补录', '审核中', '异常']),
      )}<div class="filter-actions"><button type="button" class="btn btn-primary" data-action="toast" data-message="已按当前条件查询（原型演示）">查询</button><button type="button" class="btn" data-action="toast" data-message="筛选条件已重置">重置</button></div>` +
      `</div>${
        more
      }<div class="filter-foot"><button type="button" class="filter-toggle" data-action="toggle-filters">${icon(
        state.archiveMore ? 'chevronDown' : 'chevronRight',
        13,
      )}${
        state.archiveMore ? '收起筛选' : '更多筛选'
      }</button><span class="filter-summary">当前：全部学院 · 全部专业 · 共 <span class="num">1,286</span> 份档案</span></div>` +
      `</div>`
    )
  }

  function screenArchiveList() {
    const rows = STUDENTS.map(
      (s) =>
        `<tr class="is-clickable" data-action="view-student" data-id="${
          s.id
        }"><td><div class="cell-strong">${s.name}</div><div class="cell-sub">${
          s.no
        }</div></td><td>${s.college}</td><td>${s.major}</td><td>${
          s.grade
        } 级</td><td class="cell-num">${s.complete}%</td><td>${statusTag(
          s.status,
        )}</td><td class="muted">${
          s.updated
        }</td><td><button type="button" class="link-btn" data-action="view-student" data-id="${
          s.id
        }">查看档案</button></td></tr>`,
    )

    const kpis = kpiStrip([
      { label: '当前结果', value: 1286, unit: '份', meta: '在籍 1,248 · 休学 38' },
      { label: '档案完整率', value: '92.4', unit: '%', meta: '较上月 +1.2%', metaTone: 'good' },
      { label: '待补录', value: 38, unit: '份', meta: '涉及 9 名辅导员', tone: 'is-warning' },
      { label: '异常档案', value: 5, unit: '份', meta: '完整率低于 70%', tone: 'is-danger' },
    ])

    const listCard = card({
      title: '学生档案',
      sub: '1,286 份',
      actions:
        `<button type="button" class="btn btn-sm" data-action="toast" data-message="已按当前筛选条件创建导出任务">${icon(
          'download',
          14,
        )}导出当前结果</button>` +
        `<button type="button" class="btn btn-sm" data-action="toast" data-message="字段设置（原型演示）">${icon(
          'settings',
          14,
        )}字段设置</button>`,
      noPad: true,
      body:
        table(['姓名 / 学号', '学院', '专业', '年级', '完整率', '状态', '更新时间', '操作'], rows) +
        pagination(1286, 1, 10, '份'),
    })

    return kpis + listCard
  }

  function screenArchiveSummary() {
    const rows = COLLEGE_STATS.map(
      (c) =>
        `<tr><td class="cell-strong">${c.name}</td><td class="cell-num">${
          c.students
        }</td><td class="cell-num">${c.archived}</td><td class="cell-num">${
          c.pending
        }</td><td>${progress(c.rate)}</td><td>${
          c.counselor
        }</td><td><button type="button" class="link-btn" data-action="toast" data-message="已筛选 ${
          c.name
        } 档案">查看档案</button></td></tr>`,
    )

    const kpis = kpiStrip([
      { label: '学院', value: 8, unit: '个' },
      { label: '专业', value: 24, unit: '个' },
      { label: '平均完整率', value: '92.4', unit: '%' },
      { label: '未分配辅导员', value: 6, unit: '人', tone: 'is-warning' },
    ])

    const tableCard = card({
      title: '学院档案汇总',
      sub: '按完整率排序',
      noPad: true,
      body: `${table(
        [
          '学院',
          { label: '学生数', num: true },
          { label: '已归档', num: true },
          { label: '待补录', num: true },
          '完整率',
          '辅导员',
          '操作',
        ],
        rows,
      )}<div class="card-foot"><span>统计时间：2026-11-02 09:42</span><button type="button" class="link-btn" data-action="toast" data-message="汇总数据已导出">导出汇总</button></div>`,
    })

    const distribution = [
      { label: '90% 及以上', value: 812 },
      { label: '80%–89%', value: 336 },
      { label: '70%–79%', value: 92 },
      { label: '低于 70%', value: 46 },
    ]
    const max = 812

    const distCard = card({
      title: '完整率分布',
      sub: '全校 1,286 份',
      body:
        `<div class="bars">${distribution
          .map(
            (d) =>
              `<div class="bar-row"><span class="bar-label">${
                d.label
              }</span><span class="bar-track"><span class="bar-fill" style="width:${Math.round(
                (d.value / max) * 100,
              )}%"></span></span><span class="bar-value">${fmt(d.value)}</span></div>`,
          )
          .join('')}</div>` +
        `<div class="split-divider"></div>` +
        `<div class="callout warn"><span class="callout-icon">${icon(
          'alert',
          16,
        )}</span><div>46 份档案完整率低于 70%，主要集中在艺术学院与体育学院，建议在本周例会上督办。</div></div>`,
    })

    return `${kpis}<div class="grid-2-1">${tableCard}${distCard}</div>`
  }

  function screenArchiveAnalysis() {
    const kpis = kpiStrip([
      { label: '在库档案', value: 1286, unit: '份' },
      { label: '本月新增', value: 46, unit: '份', meta: '较上月 +1.8%', metaTone: 'good' },
      { label: '归档率', value: '91.3', unit: '%' },
      { label: '平均材料数', value: 9.6, unit: '份/人' },
    ])

    function barCard(title, sub, items) {
      const max = Math.max.apply(
        null,
        items.map((i) => i.value),
      )
      return card({
        title,
        sub,
        body: `<div class="bars">${items
          .map(
            (i) =>
              `<div class="bar-row"><span class="bar-label">${
                i.label
              }</span><span class="bar-track"><span class="bar-fill" style="width:${Math.round(
                (i.value / max) * 100,
              )}%"></span></span><span class="bar-value">${fmt(i.value)}</span></div>`,
          )
          .join('')}</div>`,
      })
    }

    const college = barCard(
      '学院学生分布',
      '在库档案',
      COLLEGE_STATS.map((c) => ({ label: c.name, value: c.students })),
    )
    const grades = barCard('年级分布', '在库档案', [
      { label: '2022 级', value: 312 },
      { label: '2023 级', value: 428 },
      { label: '2024 级', value: 546 },
    ])
    const status = barCard('档案状态', '全校', [
      { label: '已归档', value: 1174 },
      { label: '审核中', value: 69 },
      { label: '待补录', value: 38 },
      { label: '异常', value: 5 },
    ])

    return `${kpis}<div class="grid-3">${college}${grades}${status}</div>`
  }

  function screenArchive() {
    const tools = `<span class="muted">数据更新于 09:42</span><button type="button" class="btn btn-sm" data-action="refresh">${icon(
      'refresh',
      14,
    )}刷新</button>`

    const content =
      state.archiveTab === 'list'
        ? screenArchiveList()
        : state.archiveTab === 'summary'
          ? screenArchiveSummary()
          : screenArchiveAnalysis()

    return (
      pageHead({
        title: '学生档案',
        desc: '按学号、学院与状态快速定位档案；点击任意一行查看档案详情与归档材料。',
        actions: `<button type="button" class="btn" data-action="toast" data-message="批量补录提醒已发送给相关辅导员">${icon(
          'send',
          15,
        )}发送补录提醒</button>`,
      }) +
      tabsRow(
        [
          { key: 'list', label: '学生档案', count: 1286 },
          { key: 'summary', label: '组织汇总', count: 8 },
          { key: 'analysis', label: '统计分析' },
        ],
        state.archiveTab,
        'archive-tab',
        tools,
      ) +
      (state.archiveTab === 'list' ? archiveFilterBar() : '') +
      content
    )
  }

  function openStudentDrawer(id) {
    const s = STUDENTS.find((item) => item.id === id)
    if (!s) return

    const categories = [
      { name: '基本信息', total: 6, got: 6 },
      { name: '学籍材料', total: 4, got: 4 },
      { name: '奖惩记录', total: 3, got: s.awards ? 3 : 2 },
      { name: '实践成果', total: 4, got: s.complete >= 90 ? 4 : 3 },
      { name: '心理健康', total: 1, got: s.missing.includes('心理健康测评表') ? 0 : 1 },
    ]

    const missingCallout = s.missing.length
      ? `<div class="callout warn"><span class="callout-icon">${icon(
          'alert',
          16,
        )}</span><div><strong>缺失材料：</strong>${s.missing.join('、')}。可发送补录提醒给辅导员 ${
          s.counselor
        }。</div></div>`
      : `<div class="callout info"><span class="callout-icon">${icon(
          'checkCircle',
          16,
        )}</span><div>该档案材料齐全，已于 ${s.updated} 完成归档。</div></div>`

    const files = [
      { name: '学生登记表.pdf', size: '820 KB', time: '2026-09-12' },
      { name: '学籍卡扫描件.pdf', size: '1.1 MB', time: '2026-09-12' },
      { name: '成绩单（2025-2026学年）.pdf', size: '640 KB', time: '2026-10-20' },
      {
        name: '获奖证书汇总.pdf',
        size: s.awards ? '2.4 MB' : '—',
        time: s.awards ? '2026-10-21' : '—',
      },
    ]

    const fileList = `<div class="file-list">${files
      .map(
        (f) =>
          `<div class="file-row"><span class="file-icon">${icon(
            'fileText',
            16,
          )}</span><span class="file-meta"><span class="file-name">${
            f.name
          }</span><span class="file-sub">${f.size} · ${f.time}</span></span>${
            f.size === '—'
              ? tag('未上传', 'muted')
              : '<button type="button" class="link-btn" data-action="toast" data-message="文件预览（原型演示）">预览</button>'
          }</div>`,
      )
      .join('')}</div>`

    const timelineItems = [
      { title: '档案创建', meta: '系统自动 · 2023-09-10 09:00', state: 'is-done' },
      { title: '材料上传', meta: `${s.counselor} · 2026-10-28 16:12`, state: 'is-done' },
      { title: '学院审核', meta: '周敏 · 2026-10-29 10:05', state: 'is-done' },
      s.status === '已归档'
        ? { title: '归档完成', meta: `王五 · ${s.updated}`, state: 'is-done' }
        : { title: '待补录材料', meta: `等待 ${s.counselor} 补传`, state: 'is-current' },
    ]

    const timeline = `<div class="timeline">${timelineItems
      .map(
        (t) =>
          `<div class="timeline-item ${
            t.state
          }"><span class="timeline-dot"></span><span class="timeline-content"><span class="timeline-title">${
            t.title
          }</span><span class="timeline-meta">${t.meta}</span></span></div>`,
      )
      .join('')}</div>`

    const body =
      `<div class="detail-summary">` +
      `<div class="item"><div class="label">学号</div><div class="value num">${s.no}</div></div>` +
      `<div class="item"><div class="label">姓名</div><div class="value">${s.name} · ${
        s.gender
      }</div></div>` +
      `<div class="item"><div class="label">学院 / 专业</div><div class="value">${s.college} / ${
        s.major
      }</div></div>` +
      `<div class="item"><div class="label">年级 / 班级</div><div class="value">${s.grade} 级 · ${
        s.className
      }</div></div>` +
      `<div class="item"><div class="label">辅导员</div><div class="value">${
        s.counselor
      }</div></div>` +
      `<div class="item"><div class="label">政治面貌</div><div class="value">${
        s.political
      }</div></div>` +
      `<div class="item"><div class="label">联系电话</div><div class="value num">${
        s.phone
      }</div></div>` +
      `<div class="item"><div class="label">档案状态</div><div class="value">${statusTag(
        s.status,
      )}</div></div>` +
      `</div>` +
      `<div class="detail-section"><h3>档案完整率</h3><div class="completion"><span class="completion-value">${
        s.complete
      }%</span><span class="completion-text">已收录 ${s.materials} 份材料，缺失 ${
        s.missing.length
      } 项</span></div><div class="progress ${
        s.complete >= 90 ? 'is-success' : ''
      } mt-12"><span style="width:${s.complete}%"></span></div></div>` +
      `<div class="detail-section"><h3>归档材料 <span class="count">5 类</span></h3><div class="archive-categories">${categories
        .map((c) => {
          const done = c.got >= c.total
          return `<div class="archive-category"><span class="cat-left">${icon(
            done ? 'checkCircle' : 'folder',
            15,
          )}${c.name}</span><span class="cat-count">${c.got}/${c.total}</span>${
            done ? tag('已齐全', 'ok') : tag(`缺 ${c.total - c.got} 项`, 'warn')
          }</div>`
        })
        .join('')}</div></div>${
        missingCallout
      }<div class="detail-section"><h3>材料文件 <span class="count">${files.length} 个</span></h3>${
        fileList
      }</div>` +
      `<div class="detail-section"><h3>归档记录</h3>${timeline}</div>`

    openDrawer({
      title: `${s.name} 的档案`,
      sub: `${s.no} · ${s.college} / ${s.major}`,
      body,
      foot:
        `<button type="button" class="btn" data-action="close-overlay">关闭</button>` +
        `<button type="button" class="btn" data-action="toast" data-message="档案打印任务已创建">${icon(
          'file',
          15,
        )}打印档案</button>${
          state.role === 'admin'
            ? `<button type="button" class="btn btn-primary" data-action="toast" data-message="补录提醒已发送给 ${
                s.counselor
              }">发送补录提醒</button>`
            : '<button type="button" class="btn btn-primary" data-action="toast" data-message="档案导出任务已创建">导出档案</button>'
        }`,
    })
  }

  /* ---------------------------------------------------------------------------
     14. 档案导出
     --------------------------------------------------------------------------- */

  const EXPORT_TASKS = [
    {
      name: '2025-2026 学年第一学期教育学院档案导出',
      type: '档案明细',
      scope: '教育学院 · 420 人',
      rows: 420,
      status: '已完成',
      creator: '王五',
      time: '今天 09:20',
    },
    {
      name: '全校档案完整率统计',
      type: '统计汇总',
      scope: '全校 · 1,286 人',
      rows: 1286,
      status: '进行中',
      creator: '王五',
      time: '今天 08:55',
    },
    {
      name: '学生奖惩记录（2024 级）',
      type: '档案明细',
      scope: '全校 2024 级 · 546 人',
      rows: 546,
      status: '已完成',
      creator: '周敏',
      time: '昨天 16:12',
    },
    {
      name: '心理测评材料补录清单',
      type: '统计汇总',
      scope: '全校 · 38 人',
      rows: 38,
      status: '失败',
      creator: '王五',
      time: '昨天 11:30',
    },
    {
      name: '毕业生档案移交清单',
      type: '档案明细',
      scope: '2022 级 · 312 人',
      rows: 312,
      status: '已完成',
      creator: '王五',
      time: '10-30 14:02',
    },
    {
      name: '辅导员带班档案汇总',
      type: '统计汇总',
      scope: '教育学院 · 20 个班级',
      rows: 420,
      status: '已完成',
      creator: '周敏',
      time: '10-28 10:45',
    },
  ]

  const EXPORT_TEMPLATES = [
    {
      name: '标准档案明细（全字段）',
      scope: '学生档案',
      fields: 32,
      editor: '王五',
      updated: '2026-09-18',
    },
    { name: '学院汇总简表', scope: '组织汇总', fields: 12, editor: '周敏', updated: '2026-08-22' },
    {
      name: '毕业生移交清单',
      scope: '学生档案',
      fields: 18,
      editor: '王五',
      updated: '2026-07-04',
    },
  ]

  const FORM_TEMPLATES = [
    {
      name: '学生基本信息登记表',
      scene: '新生建档',
      fields: 24,
      status: '启用',
      updated: '2026-09-01',
    },
    {
      name: '学籍异动申请表',
      scene: '学籍异动',
      fields: 16,
      status: '启用',
      updated: '2026-08-15',
    },
    {
      name: '家庭经济困难认定表',
      scene: '奖助学金',
      fields: 21,
      status: '启用',
      updated: '2026-08-02',
    },
    { name: '心理测评补录表', scene: '材料补录', fields: 9, status: '停用', updated: '2026-06-30' },
  ]

  function screenExport() {
    const kpis = kpiStrip([
      { label: '本月导出', value: 18, unit: '次', meta: '较上月 +3 次' },
      { label: '进行中', value: 2, unit: '个', tone: 'is-warning' },
      { label: '失败任务', value: 1, unit: '个', meta: '可重试', tone: 'is-danger' },
      { label: '累计下载', value: 143, unit: '次' },
    ])

    const filters =
      `<div class="filter-bar"><div class="filter-grid">${field(
        '任务名称',
        '<input class="input" type="text" placeholder="输入任务名称" />',
        true,
      )}${field('导出类型', select(['档案明细', '统计汇总']))}${field(
        '状态',
        select(['已完成', '进行中', '失败']),
      )}${field(
        '创建时间',
        '<input class="input" type="date" value="2026-10-01" />',
      )}<div class="filter-actions"><button type="button" class="btn btn-primary" data-action="toast" data-message="已查询导出任务">查询</button><button type="button" class="btn" data-action="toast" data-message="筛选条件已重置">重置</button></div>` +
      `</div></div>`

    let content = ''
    if (state.exportTab === 'tasks') {
      const rows = EXPORT_TASKS.map(
        (t) =>
          `<tr><td><div class="cell-strong">${t.name}</div><div class="cell-sub">${t.creator} · ${
            t.time
          }</div></td><td>${t.type}</td><td>${t.scope}</td><td class="cell-num">${fmt(
            t.rows,
          )}</td><td>${statusTag(t.status)}</td><td>${t.creator}</td><td class="muted">${
            t.time
          }</td><td><div class="row-actions">${
            t.status === '失败'
              ? '<button type="button" class="link-btn" data-action="retry">重试</button>'
              : t.status === '已完成'
                ? '<button type="button" class="link-btn" data-action="download">下载</button>'
                : '<button type="button" class="link-btn muted" data-action="toast" data-message="任务生成中，请稍后刷新">生成中</button>'
          }<button type="button" class="link-btn muted" data-action="toast" data-message="任务详情（原型演示）">详情</button></div></td></tr>`,
      )

      content =
        filters +
        card({
          title: '导出任务',
          sub: '共 6 个',
          actions: `<button type="button" class="btn btn-sm" data-action="refresh">${icon(
            'refresh',
            14,
          )}刷新</button>`,
          noPad: true,
          body:
            table(
              [
                '任务名称',
                '类型',
                '导出范围',
                { label: '记录数', num: true },
                '状态',
                '创建人',
                '创建时间',
                '操作',
              ],
              rows,
            ) + pagination(6, 1, 10, '个'),
        })
    } else if (state.exportTab === 'templates') {
      const rows = EXPORT_TEMPLATES.map(
        (t) =>
          `<tr><td class="cell-strong">${t.name}</td><td>${t.scope}</td><td class="cell-num">${
            t.fields
          }</td><td>${t.editor}</td><td class="muted">${
            t.updated
          }</td><td><div class="row-actions"><button type="button" class="link-btn" data-action="open-template-modal">编辑</button><button type="button" class="link-btn muted" data-action="toast" data-message="模板已复制">复制</button></div></td></tr>`,
      )
      content = card({
        title: '导出模板',
        sub: '预设导出字段组合，减少重复配置',
        actions: `<button type="button" class="btn btn-sm btn-primary" data-action="open-template-modal">${icon(
          'plus',
          14,
        )}新建模板</button>`,
        noPad: true,
        body: table(
          ['模板名称', '适用范围', { label: '字段数', num: true }, '更新人', '更新时间', '操作'],
          rows,
        ),
      })
    } else {
      const rows = FORM_TEMPLATES.map(
        (t) =>
          `<tr><td class="cell-strong">${t.name}</td><td>${t.scene}</td><td class="cell-num">${
            t.fields
          }</td><td>${statusTag(t.status)}</td><td class="muted">${
            t.updated
          }</td><td><div class="row-actions"><button type="button" class="link-btn" data-action="open-template-modal">编辑</button><button type="button" class="link-btn muted" data-action="toast" data-message="表单预览（原型演示）">预览</button></div></td></tr>`,
      )
      content = `<div class="callout info mb-16"><span class="callout-icon">${icon(
        'info',
        16,
      )}</span><div>原侧栏“表单自定义”已并入本页。档案表单字段、必填规则与校验提示均在此维护，不再单独占用导航入口。</div></div>${card(
        {
          title: '表单模板',
          actions: `<button type="button" class="btn btn-sm btn-primary" data-action="open-template-modal">${icon(
            'plus',
            14,
          )}新建表单</button>`,
          noPad: true,
          body: table(
            ['模板名称', '适用场景', { label: '字段数', num: true }, '状态', '更新时间', '操作'],
            rows,
          ),
        },
      )}`
    }

    return (
      pageHead({
        title: '档案导出',
        desc: '统一管理档案明细导出、统计汇总、导出模板与档案表单模板。',
        actions: `<button type="button" class="btn btn-primary" data-action="open-export-modal">${icon(
          'plus',
          15,
        )}新建导出任务</button>`,
      }) +
      tabsRow(
        [
          { key: 'tasks', label: '导出任务', count: 6 },
          { key: 'templates', label: '导出模板', count: 3 },
          { key: 'forms', label: '表单模板', count: 4 },
        ],
        state.exportTab,
        'export-tab',
        '<span class="muted">导出文件保留 7 天</span>',
      ) +
      kpis +
      content
    )
  }

  function openExportModal() {
    openModal({
      title: '新建导出任务',
      desc: '导出范围与操作人将记录在操作日志中，文件生成后可在“导出任务”下载。',
      body:
        `<form class="form-grid" onsubmit="return false">` +
        `<div class="field field--full"><label>任务名称 <span class="required">*</span></label><input class="input" type="text" placeholder="如：教育学院 2024 级档案导出" value="教育学院档案明细导出" /></div>${field(
          '导出类型',
          '<select class="select"><option>档案明细</option><option>统计汇总</option></select>',
        )}${field(
          '数据范围',
          '<select class="select"><option>全校档案</option><option>教育学院</option><option>文学院</option><option>信息工程学院</option></select>',
        )}${field(
          '导出模板',
          '<select class="select"><option>标准档案明细（全字段）</option><option>学院汇总简表</option><option>毕业生移交清单</option></select>',
        )}${field(
          '文件格式',
          '<select class="select"><option>Excel（.xlsx）</option><option>CSV</option><option>PDF</option></select>',
        )}<div class="field field--full"><label>备注</label><textarea class="textarea" placeholder="选填，说明导出用途"></textarea><p class="help-text">单次导出上限 5,000 条；超出请分批次导出。</p></div>` +
        `</form>`,
      foot:
        '<span class="foot-left">任务创建后通常 1–3 分钟完成</span>' +
        '<button type="button" class="btn" data-action="close-overlay">取消</button>' +
        '<button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="导出任务已创建，完成后可在列表中下载">创建任务</button>',
    })
  }

  function openTemplateModal() {
    const isForm = state.exportTab === 'forms'
    openModal({
      title: isForm ? '新建表单模板' : '新建导出模板',
      desc: isForm
        ? '表单模板用于学生建档与材料补录，可配置字段与校验规则。'
        : '选择需要导出的字段，保存后可在创建导出任务时直接复用。',
      body:
        `<form class="form-grid" onsubmit="return false">` +
        `<div class="field field--full"><label>模板名称 <span class="required">*</span></label><input class="input" type="text" placeholder="${
          isForm ? '如：交换生项目登记表' : '如：2024 级档案简表'
        }" /></div>${field(
          '适用范围',
          `<select class="select">${isForm ? '<option>新生建档</option><option>学籍异动</option><option>材料补录</option>' : '<option>学生档案</option><option>组织汇总</option>'}</select>`,
        )}${field(
          '状态',
          '<select class="select"><option>启用</option><option>停用</option></select>',
        )}<div class="field field--full"><label>字段选择</label><div class="check-row"><label class="check"><input type="checkbox" checked /> 学号</label><label class="check"><input type="checkbox" checked /> 姓名</label><label class="check"><input type="checkbox" checked /> 学院</label><label class="check"><input type="checkbox" checked /> 专业</label><label class="check"><input type="checkbox" /> 联系电话</label><label class="check"><input type="checkbox" /> 家庭住址</label><label class="check"><input type="checkbox" /> 奖惩记录</label></div></div>` +
        `</form>`,
      foot:
        '<button type="button" class="btn" data-action="close-overlay">取消</button>' +
        '<button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="模板已保存（原型演示）">保存模板</button>',
    })
  }

  /* ---------------------------------------------------------------------------
     15. 材料审核
     --------------------------------------------------------------------------- */

  const REVIEW_RECORDS = [
    {
      no: 'RV-20261102-018',
      student: '吴雨欣 · 2023030076',
      type: '心理测评材料',
      result: '已通过',
      reviewer: '王五',
      time: '今天 09:05',
    },
    {
      no: 'RV-20261101-047',
      student: '陈雨桐 · 2024010012',
      type: '贫困生认定材料',
      result: '已退回',
      reviewer: '周敏',
      time: '昨天 16:48',
    },
    {
      no: 'RV-20261101-032',
      student: '孙悦 · 2023030042',
      type: '交换生项目材料',
      result: '已退回',
      reviewer: '周敏',
      time: '10-30 16:05',
    },
    {
      no: 'RV-20261030-091',
      student: '何思远 · 2022020017',
      type: '学籍证明材料',
      result: '已通过',
      reviewer: '王五',
      time: '10-30 11:20',
    },
    {
      no: 'RV-20261029-076',
      student: '周子墨 · 2022010034',
      type: '科研成果材料',
      result: '已通过',
      reviewer: '王五',
      time: '10-29 15:36',
    },
    {
      no: 'RV-20261029-058',
      student: '赵子涵 · 2024020115',
      type: '学籍异动材料',
      result: '已退回',
      reviewer: '周敏',
      time: '10-29 10:12',
    },
  ]

  const DELEGATIONS = [
    {
      from: '王五',
      to: '周敏',
      scope: '教育学院 · 材料审核',
      period: '2026-10-01 ~ 2026-11-30',
      status: '生效中',
    },
    {
      from: '周敏',
      to: '陈静',
      scope: '教育学院 · 奖学金材料',
      period: '2026-10-15 ~ 2026-10-31',
      status: '已结束',
    },
    {
      from: '王五',
      to: '张伟',
      scope: '信息工程学院 · 全部审核',
      period: '2026-09-20 ~ 2026-10-10',
      status: '已结束',
    },
  ]

  function screenReviewPending() {
    const kpis = kpiStrip([
      { label: '待审核', value: 6, unit: '项', tone: 'is-warning' },
      { label: '今日已审', value: 12, unit: '项' },
      { label: '平均处理时长', value: 1.8, unit: '小时' },
      { label: '超时提醒', value: 1, unit: '项', tone: 'is-danger', meta: '超过 24 小时未处理' },
    ])

    const selected =
      REVIEW_ITEMS.find((item) => item.id === state.reviewSelected) || REVIEW_ITEMS[0]

    const listItems = REVIEW_ITEMS.map(
      (item) =>
        `<button type="button" class="review-item ${
          item.id === selected.id ? 'is-active' : ''
        }" data-action="select-review" data-id="${
          item.id
        }"><span class="review-item-head"><span class="review-item-name">${item.student}</span>${
          item.wait.includes('2 天') ? tag('超时', 'danger') : tag('待审核', 'warn')
        }</span><span class="review-item-type">${
          item.type
        }</span><span class="review-item-meta"><span>${item.no} · ${item.college}</span><span>${
          item.time
        }</span></span></button>`,
    )

    const listCard = card({
      title: '待审核队列',
      sub: `${REVIEW_ITEMS.length} 项`,
      actions: `<button type="button" class="btn btn-sm" data-action="refresh">${icon(
        'refresh',
        14,
      )}刷新</button>`,
      noPad: true,
      className: 'review-list',
      body:
        `<div class="review-list-tools"><input class="input" type="text" placeholder="搜索学生 / 学号" /><select class="select"><option>全部类型</option><option>奖学金材料</option><option>学籍异动</option></select></div>` +
        `<div class="review-list-body">${listItems.join('')}</div>`,
    })

    const fileRows = selected.files
      .map(
        (f) =>
          `<div class="file-row"><span class="file-icon">${icon(
            'fileText',
            16,
          )}</span><span class="file-meta"><span class="file-name">${
            f.name
          }</span><span class="file-sub">${f.size} · ${f.time}</span></span>${
            f.size === '—'
              ? tag('缺失', 'danger')
              : '<button type="button" class="link-btn" data-action="toast" data-message="文件预览（原型演示）">预览</button>'
          }</div>`,
      )
      .join('')

    const timeline =
      `<div class="timeline">` +
      `<div class="timeline-item is-done"><span class="timeline-dot"></span><span class="timeline-content"><span class="timeline-title">学生提交材料</span><span class="timeline-meta">${
        selected.student
      } · ${
        selected.time
      }</span></span></div><div class="timeline-item is-done"><span class="timeline-dot"></span><span class="timeline-content"><span class="timeline-title">辅导员初审通过</span><span class="timeline-meta">${
        selected.counselor
      } · 今天 08:50</span></span></div><div class="timeline-item is-done"><span class="timeline-dot"></span><span class="timeline-content"><span class="timeline-title">学院复审通过</span><span class="timeline-meta">周敏 · 今天 09:02</span></span></div><div class="timeline-item is-current"><span class="timeline-dot"></span><span class="timeline-content"><span class="timeline-title">学校终审</span><span class="timeline-meta">当前环节 · 王五</span></span></div></div>`

    const detail =
      `<section class="card review-detail"><div class="detail-head"><div class="detail-student"><span class="avatar">${selected.student.slice(
        0,
        1,
      )}</span><div><h2>${selected.student} <span class="tag warn">待审核</span></h2><p>${
        selected.no
      } · ${selected.college} / ${selected.major} · ${
        selected.grade
      } 级</p></div></div><div class="row-actions"><button type="button" class="btn btn-sm" data-action="view-student" data-id="${
        selected.studentId
      }">${icon('archive', 14)}查看完整档案</button></div></div>` +
      `<div class="detail-body">` +
      `<div class="detail-section"><h3>申请信息</h3><div class="info-grid"><div class="info-item"><div class="label">材料类型</div><div class="value">${
        selected.type
      }</div></div><div class="info-item"><div class="label">提交时间</div><div class="value">${
        selected.time
      }</div></div><div class="info-item"><div class="label">辅导员</div><div class="value">${
        selected.counselor
      }</div></div><div class="info-item"><div class="label">学号</div><div class="value num">${
        selected.no
      }</div></div><div class="info-item"><div class="label">学院 / 专业</div><div class="value">${
        selected.college
      } / ${
        selected.major
      }</div></div><div class="info-item"><div class="label">当前环节</div><div class="value">学校终审</div></div></div></div>` +
      `<div class="detail-section"><h3>材料文件 <span class="count">${
        selected.files.length
      } 个</span></h3><div class="file-list">${fileRows}</div></div>` +
      `<div class="detail-section"><h3>审批流转</h3>${timeline}</div>` +
      `<div class="detail-section"><h3>审核意见</h3><textarea class="textarea" placeholder="填写审核意见；退回时必须说明需要补充的材料。"></textarea><p class="help-text">审核意见将通知学生与辅导员，并记录在档案操作日志中。</p></div>` +
      `</div>` +
      `<div class="detail-foot"><span class="hint">剩余处理时间 22 小时</span><div class="actions"><button type="button" class="btn" data-action="confirm-action" data-title="退回补充" data-body="退回后学生可补充材料并重新提交，本次审核记录将保留。" data-confirm-label="确认退回" data-toast="材料已退回，已通知学生与辅导员" data-warn="true">退回补充</button><button type="button" class="btn btn-primary" data-action="confirm-action" data-title="审核通过" data-body="通过后材料将进入档案正式记录，操作不可撤销。" data-confirm-label="审核通过" data-toast="审核已通过，材料已归档">审核通过</button></div></div></section>`

    return `${kpis}<div class="review-layout">${listCard}${detail}</div>`
  }

  function screenReviewRecords() {
    const rows = REVIEW_RECORDS.map(
      (r) =>
        `<tr><td class="cell-strong num">${r.no}</td><td>${r.student}</td><td>${
          r.type
        }</td><td>${statusTag(r.result)}</td><td>${r.reviewer}</td><td class="muted">${
          r.time
        }</td><td><button type="button" class="link-btn" data-action="toast" data-message="审核记录详情（原型演示）">查看</button></td></tr>`,
    )

    return `<div class="filter-bar"><div class="filter-grid">${field(
      '关键字',
      '<input class="input" type="text" placeholder="学生 / 学号 / 记录编号" />',
      true,
    )}${field('审核结果', select(['已通过', '已退回']))}${field(
      '材料类型',
      select(['奖学金材料', '学籍异动', '心理测评', '交换项目']),
    )}${field(
      '审核时间',
      '<input class="input" type="date" value="2026-10-01" />',
    )}<div class="filter-actions"><button type="button" class="btn btn-primary" data-action="toast" data-message="已查询审核记录">查询</button><button type="button" class="btn" data-action="toast" data-message="筛选条件已重置">重置</button></div></div></div>${card(
      {
        title: '审核记录',
        sub: '共 126 条',
        noPad: true,
        body:
          table(['记录编号', '学生', '材料类型', '审核结果', '审核人', '审核时间', '操作'], rows) +
          pagination(126, 1, 10),
      },
    )}`
  }

  function screenReviewDelegations() {
    const rows = DELEGATIONS.map(
      (d) =>
        `<tr><td class="cell-strong">${d.from}</td><td>${d.to}</td><td>${
          d.scope
        }</td><td class="num">${d.period}</td><td>${statusTag(
          d.status,
        )}</td><td><div class="row-actions"><button type="button" class="link-btn" data-action="toast" data-message="委托编辑（原型演示）">编辑</button><button type="button" class="link-btn danger" data-action="confirm-action" data-title="终止委托" data-body="终止后受托人将无法继续处理你名下的审核任务。" data-confirm-label="终止委托" data-toast="委托已终止" data-danger="true">终止</button></div></td></tr>`,
    )

    return `<div class="callout info mb-16"><span class="callout-icon">${icon(
      'info',
      16,
    )}</span><div>审批委托用于临时将审核权限转交给他人，到期后自动失效。原侧栏“审批委托”已并入材料审核，作为独立页签。</div></div>${card(
      {
        title: '审批委托',
        sub: '3 条记录',
        actions: `<button type="button" class="btn btn-sm btn-primary" data-action="open-delegation-modal">${icon(
          'plus',
          14,
        )}新建委托</button>`,
        noPad: true,
        body: `${table(
          ['委托人', '受托人', '委托范围', '有效期', '状态', '操作'],
          rows,
        )}<div class="card-foot"><span>委托期间，受托人可处理你权限范围内的审核任务，操作记录归属受托人。</span></div>`,
      },
    )}`
  }

  function screenReview() {
    let content = ''
    if (state.reviewTab === 'pending') content = screenReviewPending()
    else if (state.reviewTab === 'records') content = screenReviewRecords()
    else content = screenReviewDelegations()

    return (
      pageHead({
        title: '材料审核',
        desc: '集中处理奖学金、学籍异动、心理测评等材料；审核记录与审批委托已合并到本页。',
        actions: `<button type="button" class="btn" data-action="toast" data-message="已切换到“我的待办”视图">${icon(
          'filter',
          15,
        )}只看我的待办</button>`,
      }) +
      tabsRow(
        [
          { key: 'pending', label: '待审核', count: 6 },
          { key: 'records', label: '审核记录', count: 126 },
          { key: 'delegations', label: '审批委托', count: 3 },
        ],
        state.reviewTab,
        'review-tab',
        '<span class="muted">平均处理时长 1.8 小时</span>',
      ) +
      content
    )
  }

  function openDelegationModal() {
    openModal({
      title: '新建审批委托',
      desc: '委托到期后自动失效，受托人仅在委托范围内代你处理审核任务。',
      body:
        `<form class="form-grid" onsubmit="return false">${field(
          '受托人',
          '<select class="select"><option>周敏（学院管理员）</option><option>陈静（辅导员）</option><option>张伟（学院管理员）</option></select>',
        )}${field(
          '委托范围',
          '<select class="select"><option>全部材料审核</option><option>奖学金材料</option><option>学籍异动材料</option></select>',
        )}${field('开始日期', '<input class="input" type="date" value="2026-11-02" />')}${field(
          '结束日期',
          '<input class="input" type="date" value="2026-11-30" />',
        )}<div class="field field--full"><label>委托说明</label><textarea class="textarea" placeholder="选填，说明委托原因"></textarea></div>` +
        `</form>`,
      foot:
        '<button type="button" class="btn" data-action="close-overlay">取消</button>' +
        '<button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="审批委托已创建，将于开始日期生效">创建委托</button>',
    })
  }

  /* ---------------------------------------------------------------------------
     16. 审批流程
     --------------------------------------------------------------------------- */

  const FLOWS = [
    {
      name: '学生档案信息更正审批',
      scene: '档案信息修改',
      nodes: 4,
      version: 'v2.3',
      status: '启用',
      updated: '2026-09-18',
    },
    {
      name: '材料补充审核流程',
      scene: '材料审核异常',
      nodes: 3,
      version: 'v1.8',
      status: '启用',
      updated: '2026-08-02',
    },
    {
      name: '批量档案导出审批',
      scene: '数据导出',
      nodes: 3,
      version: 'v1.2',
      status: '启用',
      updated: '2026-07-11',
    },
    {
      name: '学籍异动备案流程',
      scene: '学籍异动',
      nodes: 5,
      version: 'v1.0',
      status: '停用',
      updated: '2026-05-30',
    },
  ]

  const FLOW_NODES = [
    { title: '学生提交申请', meta: '学生 · 填写更正内容并上传证明材料', state: 'is-done' },
    { title: '辅导员初审', meta: '辅导员 · 1 个工作日内完成', state: 'is-done' },
    { title: '学院复审', meta: '学院管理员 · 2 个工作日内完成', state: 'is-current' },
    { title: '学校终审', meta: '系统管理员 · 3 个工作日内完成', state: '' },
    { title: '归档生效', meta: '系统自动 · 终审通过后立即生效', state: '' },
  ]

  function screenApproval() {
    const kpis = kpiStrip([
      { label: '在用流程', value: 3, unit: '个' },
      { label: '运行中实例', value: 12, unit: '个' },
      { label: '今日完成', value: 5, unit: '个' },
      { label: '平均耗时', value: 6.4, unit: '小时' },
    ])

    const rows = FLOWS.map(
      (f) =>
        `<tr><td class="cell-strong">${f.name}</td><td>${f.scene}</td><td class="cell-num">${
          f.nodes
        }</td><td class="num">${f.version}</td><td>${statusTag(f.status)}</td><td class="muted">${
          f.updated
        }</td><td><div class="row-actions"><button type="button" class="link-btn" data-action="open-flow-modal">编辑</button>${
          f.status === '启用'
            ? '<button type="button" class="link-btn danger" data-action="confirm-action" data-title="停用流程" data-body="停用后新申请将无法使用该流程，运行中的实例不受影响。" data-confirm-label="停用" data-toast="流程已停用" data-danger="true">停用</button>'
            : '<button type="button" class="link-btn" data-action="toast" data-message="流程已启用">启用</button>'
        }</div></td></tr>`,
    )

    const flowCard = card({
      title: '审批流程',
      sub: '共 4 个',
      actions: `<button type="button" class="btn btn-sm" data-action="refresh">${icon(
        'refresh',
        14,
      )}刷新</button>`,
      noPad: true,
      body: table(
        [
          '流程名称',
          '适用场景',
          { label: '节点数', num: true },
          '版本',
          '状态',
          '更新时间',
          '操作',
        ],
        rows,
      ),
    })

    const previewCard = card({
      title: '流程预览',
      sub: '学生档案信息更正审批 · v2.3',
      actions: `<button type="button" class="btn btn-sm" data-action="open-flow-modal">${icon(
        'edit',
        14,
      )}编辑节点</button>`,
      body:
        `<div class="timeline">${FLOW_NODES.map(
          (n) =>
            `<div class="timeline-item ${
              n.state
            }"><span class="timeline-dot"></span><span class="timeline-content"><span class="timeline-title">${
              n.title
            }</span><span class="timeline-meta">${n.meta}</span></span></div>`,
        ).join('')}</div>` +
        `<div class="split-divider"></div>` +
        `<div class="callout info"><span class="callout-icon">${icon(
          'info',
          16,
        )}</span><div>节点支持“或签 / 会签”配置；任一节点超时未处理时，系统将提醒管理员并可启用审批委托。</div></div>`,
    })

    return `${
      pageHead({
        title: '审批流程',
        desc: '维护档案更正、材料补充、批量导出等审批流程；流程停用不影响运行中的审批实例。',
        actions: `<button type="button" class="btn btn-primary" data-action="open-flow-modal">${icon(
          'plus',
          15,
        )}新建流程</button>`,
      }) + kpis
    }<div class="grid-2-1">${flowCard}${previewCard}</div>`
  }

  /* ---------------------------------------------------------------------------
     17. 指标体系
     --------------------------------------------------------------------------- */

  const INDICATORS = [
    {
      id: 'i1',
      level: 1,
      name: '学业成绩',
      weight: 40,
      method: '自动计算',
      source: '教务系统',
      status: '启用',
      full: 40,
      desc: '以教务系统课程成绩为数据源，按平均分与专业排名综合折算。',
    },
    {
      id: 'i2',
      level: 2,
      parent: '学业成绩',
      name: '课程平均分',
      weight: 25,
      method: '数值映射',
      source: '教务系统',
      status: '启用',
      full: 25,
      desc: '按必修课加权平均分线性映射至 0–25 分。',
    },
    {
      id: 'i3',
      level: 2,
      parent: '学业成绩',
      name: '专业排名',
      weight: 15,
      method: '区间计分',
      source: '教务系统',
      status: '启用',
      full: 15,
      desc: '专业排名前 10% 得满分，后 10% 得 0 分，中间线性折算。',
    },
    {
      id: 'i4',
      level: 1,
      name: '学业成果',
      weight: 30,
      method: '自动计算',
      source: '成果库',
      status: '启用',
      full: 30,
      desc: '科研成果、竞赛获奖与实践成果的汇总指标。',
    },
    {
      id: 'i5',
      level: 2,
      parent: '学业成果',
      name: '科研竞赛',
      weight: 18,
      method: '审核计分',
      source: '材料审核',
      status: '启用',
      full: 18,
      desc: '按竞赛级别与获奖等级计分，需上传获奖证书。',
    },
    {
      id: 'i6',
      level: 2,
      parent: '学业成果',
      name: '实践成果',
      weight: 12,
      method: '审核计分',
      source: '材料审核',
      status: '启用',
      full: 12,
      desc: '实习、社会实践与创新创业项目，按结项材料计分。',
    },
    {
      id: 'i7',
      level: 1,
      name: '综合素质',
      weight: 20,
      method: '自动计算',
      source: '学工系统',
      status: '启用',
      full: 20,
      desc: '志愿服务、学生工作、荣誉奖励与文体活动的综合表现。',
    },
    {
      id: 'i8',
      level: 2,
      parent: '综合素质',
      name: '志愿服务',
      weight: 7,
      method: '时长折算',
      source: '志愿系统',
      status: '启用',
      full: 7,
      desc: '每 20 小时计 1 分，上限 7 分。',
    },
    {
      id: 'i9',
      level: 2,
      parent: '综合素质',
      name: '学生工作',
      weight: 6,
      method: '审核计分',
      source: '学工系统',
      status: '启用',
      full: 6,
      desc: '担任学生干部满一学年，按岗位级别计分。',
    },
    {
      id: 'i10',
      level: 2,
      parent: '综合素质',
      name: '荣誉奖励',
      weight: 4,
      method: '审核计分',
      source: '材料审核',
      status: '启用',
      full: 4,
      desc: '校级及以上荣誉按级别累计，上限 4 分。',
    },
    {
      id: 'i11',
      level: 2,
      parent: '综合素质',
      name: '文体活动',
      weight: 3,
      method: '审核计分',
      source: '材料审核',
      status: '停用',
      full: 3,
      desc: '校级文体活动获奖计分，当前停用。',
    },
    {
      id: 'i12',
      level: 1,
      name: '行为规范',
      weight: 10,
      method: '自动计算',
      source: '学工系统',
      status: '启用',
      full: 10,
      desc: '考勤与诚信记录，违纪行为将直接扣分。',
    },
    {
      id: 'i13',
      level: 2,
      parent: '行为规范',
      name: '考勤记录',
      weight: 6,
      method: '扣分制',
      source: '教务系统',
      status: '启用',
      full: 6,
      desc: '每旷课 1 次扣 0.5 分，扣完为止。',
    },
    {
      id: 'i14',
      level: 2,
      parent: '行为规范',
      name: '诚信记录',
      weight: 4,
      method: '扣分制',
      source: '学工系统',
      status: '启用',
      full: 4,
      desc: '考试违纪、学术不端等记录一次性扣完。',
    },
  ]

  const SCORE_RULES = [
    {
      name: '课程平均分映射',
      target: '课程平均分',
      condition: '平均分 ≥ 90',
      score: '25 分',
      status: '启用',
    },
    {
      name: '专业排名前 10%',
      target: '专业排名',
      condition: '排名位于前 10%',
      score: '15 分',
      status: '启用',
    },
    {
      name: '省级以上竞赛',
      target: '科研竞赛',
      condition: '省级一等奖及以上',
      score: '+5 分（上限 18）',
      status: '启用',
    },
    {
      name: '违纪扣分',
      target: '行为规范',
      condition: '存在违纪记录',
      score: '每项 -2 分',
      status: '启用',
    },
  ]

  const RECALC_RECORDS = [
    {
      batch: 'RC-20261102-01',
      scope: '全校 · 1,286 人',
      status: '进行中',
      operator: '王五',
      time: '今天 09:30',
    },
    {
      batch: 'RC-20261028-03',
      scope: '教育学院 · 420 人',
      status: '已完成',
      operator: '周敏',
      time: '10-28 03:02',
    },
    {
      batch: 'RC-20261028-01',
      scope: '全校 · 1,286 人',
      status: '已完成',
      operator: '王五',
      time: '10-28 02:15',
    },
  ]

  function screenIndicator() {
    const kpis = kpiStrip([
      { label: '一级指标', value: 4, unit: '项' },
      { label: '二级指标', value: 10, unit: '项' },
      { label: '启用指标', value: 13, unit: '项', meta: '1 项停用' },
      { label: '本月评分批次', value: 3, unit: '批' },
    ])

    let content = ''
    if (state.indicatorTab === 'tree') {
      const selected = INDICATORS.find((i) => i.id === state.indicatorSelected) || INDICATORS[0]

      const rows = INDICATORS.map(
        (i) =>
          `<tr class="is-clickable ${
            i.id === selected.id ? 'is-selected' : ''
          }" data-action="select-indicator" data-id="${i.id}"><td>${
            i.level === 2 ? '<span class="muted">└ </span>' : ''
          }<span class="${i.level === 1 ? 'cell-strong' : ''}">${
            i.name
          }</span></td><td class="cell-num">${i.weight}</td><td>${i.method}</td><td>${
            i.source
          }</td><td>${statusTag(
            i.status,
          )}</td><td><button type="button" class="link-btn" data-action="select-indicator" data-id="${
            i.id
          }">配置</button></td></tr>`,
      )

      const treeCard = card({
        title: '指标树',
        sub: '权重合计 100',
        actions: `<button type="button" class="btn btn-sm" data-action="open-indicator-modal">${icon(
          'plus',
          14,
        )}新增指标</button>`,
        noPad: true,
        body: table(
          ['指标名称', { label: '权重', num: true }, '评分方式', '数据来源', '状态', '操作'],
          rows,
        ),
      })

      const detailCard = card({
        title: '指标配置',
        sub: selected.name,
        body:
          `<form class="form-grid" onsubmit="return false">${field(
            '指标名称',
            `<input class="input" type="text" value="${selected.name}" />`,
          )}${field(
            '权重',
            `<input class="input" type="number" value="${selected.weight}" />`,
          )}${field(
            '评分方式',
            select(
              ['自动计算', '数值映射', '区间计分', '审核计分', '时长折算', '扣分制'],
              selected.method,
              '请选择',
            ),
          )}${field(
            '数据来源',
            select(
              ['教务系统', '学工系统', '志愿系统', '材料审核', '成果库'],
              selected.source,
              '请选择',
            ),
          )}${field(
            '满分',
            `<input class="input" type="number" value="${selected.full}" />`,
          )}${field(
            '状态',
            select(['启用', '停用'], selected.status, '请选择'),
          )}<div class="field field--full"><label>指标说明</label><textarea class="textarea">${
            selected.desc
          }</textarea></div>` +
          `<div class="field field--full"><div class="form-actions"><button type="button" class="btn" data-action="toast" data-message="配置已重置">重置</button><button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="指标配置已保存">保存配置</button></div></div>` +
          `</form>` +
          `<div class="split-divider"></div>` +
          `<div class="callout info"><span class="callout-icon">${icon(
            'info',
            16,
          )}</span><div>全部一级指标权重合计必须为 100；修改权重后将影响下一次评分批次，不会自动追溯历史分数。</div></div>`,
      })

      content = `<div class="grid-2-1">${treeCard}${detailCard}</div>`
    } else if (state.indicatorTab === 'rules') {
      const rows = SCORE_RULES.map(
        (r) =>
          `<tr><td class="cell-strong">${r.name}</td><td>${r.target}</td><td>${
            r.condition
          }</td><td>${r.score}</td><td>${statusTag(
            r.status,
          )}</td><td><button type="button" class="link-btn" data-action="toast" data-message="规则编辑（原型演示）">编辑</button></td></tr>`,
      )
      content = card({
        title: '评分规则',
        sub: '4 条规则',
        actions: `<button type="button" class="btn btn-sm btn-primary" data-action="toast" data-message="新增规则（原型演示）">${icon(
          'plus',
          14,
        )}新增规则</button>`,
        noPad: true,
        body: table(['规则名称', '适用指标', '条件', '分值', '状态', '操作'], rows),
      })
    } else {
      const rows = RECALC_RECORDS.map(
        (r) =>
          `<tr><td class="cell-strong num">${r.batch}</td><td>${r.scope}</td><td>${statusTag(
            r.status,
          )}</td><td>${r.operator}</td><td class="muted">${
            r.time
          }</td><td><button type="button" class="link-btn" data-action="toast" data-message="批次详情（原型演示）">查看</button></td></tr>`,
      )
      content = `<div class="callout info mb-16"><span class="callout-icon">${icon(
        'info',
        16,
      )}</span><div>原侧栏“评分重算”已并入指标体系。重算会覆盖所选范围内学生的当前评分，历史批次保留可追溯记录。</div></div>${card(
        {
          title: '重算记录',
          actions: `<button type="button" class="btn btn-sm btn-primary" data-action="open-recalc-modal">${icon(
            'zap',
            14,
          )}发起重算</button>`,
          noPad: true,
          body: table(['批次号', '数据范围', '状态', '发起人', '发起时间', '操作'], rows),
        },
      )}`
    }

    return (
      pageHead({
        title: '指标体系',
        desc: '维护学生画像评分指标、权重与评分规则；评分重算已并入本页，作为批次记录管理。',
        actions: `<button type="button" class="btn" data-action="open-recalc-modal">${icon(
          'zap',
          15,
        )}重算评分</button>`,
      }) +
      tabsRow(
        [
          { key: 'tree', label: '指标树', count: 14 },
          { key: 'rules', label: '评分规则', count: 4 },
          { key: 'records', label: '重算记录', count: 3 },
        ],
        state.indicatorTab,
        'indicator-tab',
        '<span class="muted">当前权重合计 100</span>',
      ) +
      kpis +
      content
    )
  }

  function openRecalcModal() {
    openModal({
      title: '重算评分',
      desc: '按当前指标权重重新计算学生画像分数，任务在后台异步执行。',
      body:
        `<div class="callout warn mb-16"><span class="callout-icon">${icon(
          'alert',
          16,
        )}</span><div>重算将覆盖所选范围内学生的当前评分，请确认指标权重已保存。历史评分批次仍可在“重算记录”中查看。</div></div>` +
        `<form class="form-grid" onsubmit="return false">${field(
          '数据范围',
          '<select class="select"><option>全校学生（1,286 人）</option><option>教育学院（420 人）</option><option>信息工程学院（198 人）</option></select>',
        )}${field(
          '指标范围',
          '<select class="select"><option>全部启用指标</option><option>仅学业成绩</option><option>仅综合素质</option></select>',
        )}${field(
          '评分批次',
          '<input class="input" type="text" value="2026-11 月度评分" />',
        )}${field(
          '执行方式',
          '<select class="select"><option>立即执行</option><option>加入定时任务队列</option></select>',
        )}<div class="field field--full"><label class="check"><input type="checkbox" /> 同时生成评分变化说明（耗时约增加 30%）</label></div>` +
        `<div class="field field--full"><label>备注</label><textarea class="textarea" placeholder="选填，说明本次重算原因"></textarea></div>` +
        `</form>`,
      foot:
        '<span class="foot-left">预计耗时 2–5 分钟</span>' +
        '<button type="button" class="btn" data-action="close-overlay">取消</button>' +
        '<button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="重算任务已提交，可在重算记录中查看进度">开始重算</button>',
    })
  }

  function openIndicatorModal() {
    openModal({
      title: '新增指标',
      desc: '新增指标默认停用，配置权重与评分规则后再启用。',
      body:
        `<form class="form-grid" onsubmit="return false">` +
        `<div class="field field--full"><label>指标名称 <span class="required">*</span></label><input class="input" type="text" placeholder="如：创新创业" /></div>${field(
          '上级指标',
          '<select class="select"><option>无（一级指标）</option><option>学业成绩</option><option>学业成果</option><option>综合素质</option><option>行为规范</option></select>',
        )}${field('权重', '<input class="input" type="number" placeholder="0" />')}${field(
          '评分方式',
          '<select class="select"><option>审核计分</option><option>自动计算</option><option>数值映射</option><option>扣分制</option></select>',
        )}${field(
          '数据来源',
          '<select class="select"><option>材料审核</option><option>教务系统</option><option>学工系统</option><option>成果库</option></select>',
        )}<div class="field field--full"><label>指标说明</label><textarea class="textarea" placeholder="说明计分口径与数据口径"></textarea></div>` +
        `</form>`,
      foot:
        '<button type="button" class="btn" data-action="close-overlay">取消</button>' +
        '<button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="指标已新增，请配置评分规则后启用">保存指标</button>',
    })
  }

  function openFlowModal() {
    openModal({
      title: '编辑审批流程',
      desc: '节点顺序变更将从下一条新申请开始生效，运行中的实例维持原流程。',
      body:
        `<form class="form-grid" onsubmit="return false">` +
        `<div class="field field--full"><label>流程名称 <span class="required">*</span></label><input class="input" type="text" value="学生档案信息更正审批" /></div>${field(
          '适用场景',
          '<select class="select"><option>档案信息修改</option><option>材料审核异常</option><option>数据导出</option><option>学籍异动</option></select>',
        )}${field(
          '超时处理',
          '<select class="select"><option>提醒管理员</option><option>自动转交上级</option><option>自动通过</option></select>',
        )}<div class="field field--full"><label>审批节点</label><div class="file-list"><div class="file-row"><span class="file-icon">${icon(
          'user',
          15,
        )}</span><span class="file-meta"><span class="file-name">1. 辅导员初审</span><span class="file-sub">1 个工作日内 · 或签</span></span><button class="link-btn" type="button" data-action="toast" data-message="节点编辑（原型演示）">编辑</button></div><div class="file-row"><span class="file-icon">${icon(
          'users',
          15,
        )}</span><span class="file-meta"><span class="file-name">2. 学院复审</span><span class="file-sub">2 个工作日内 · 或签</span></span><button class="link-btn" type="button" data-action="toast" data-message="节点编辑（原型演示）">编辑</button></div><div class="file-row"><span class="file-icon">${icon(
          'shield',
          15,
        )}</span><span class="file-meta"><span class="file-name">3. 学校终审</span><span class="file-sub">3 个工作日内 · 会签</span></span><button class="link-btn" type="button" data-action="toast" data-message="节点编辑（原型演示）">编辑</button></div></div></div>` +
        `</form>`,
      foot:
        '<button type="button" class="btn" data-action="close-overlay">取消</button>' +
        '<button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="审批流程已保存，新版本将在下次申请时生效">保存流程</button>',
    })
  }

  /* ---------------------------------------------------------------------------
     18. 成果热力图
     --------------------------------------------------------------------------- */

  const HEAT_MONTHS = ['3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月']

  const HEAT_SERIES = [
    { name: '教育学院', values: [42, 51, 46, 63, 58, 72, 69, 81] },
    { name: '文学院', values: [38, 44, 41, 55, 49, 61, 66, 70] },
    { name: '理学院', values: [35, 39, 52, 48, 57, 63, 60, 74] },
    { name: '信息工程学院', values: [47, 53, 58, 66, 71, 64, 78, 88] },
    { name: '艺术学院', values: [29, 33, 36, 40, 45, 52, 48, 57] },
    { name: '外国语学院', values: [31, 36, 34, 43, 47, 50, 55, 62] },
    { name: '体育学院', values: [26, 30, 35, 38, 42, 46, 51, 58] },
    { name: '马克思主义学院', values: [18, 22, 25, 27, 31, 35, 33, 40] },
  ]

  function screenHeatmap() {
    const max = Math.max.apply(
      null,
      HEAT_SERIES.reduce((acc, row) => acc.concat(row.values), []),
    )
    const totals = HEAT_SERIES.map((row) => ({
      name: row.name,
      total: row.values.reduce((a, b) => a + b, 0),
    })).sort((a, b) => b.total - a.total)
    const grandTotal = totals.reduce((a, b) => a + b.total, 0)

    const header = `<div class="heat-label head">学院 / 月份</div>${HEAT_MONTHS.map(
      (m) => `<div class="heat-label head">${m}</div>`,
    ).join('')}`

    const cells = HEAT_SERIES.map((row) => {
      const cellsHtml = row.values
        .map((value, index) => {
          const level = value <= 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((value / max) * 4)))
          return `<div class="heat-cell" data-level="${level}" title="${row.name} · ${
            HEAT_MONTHS[index]
          }：${value} 项成果">${value}</div>`
        })
        .join('')
      return `<div class="heat-label" title="${row.name}">${row.name}</div>${cellsHtml}`
    }).join('')

    const heatCard = card({
      title: '成果热力图',
      sub: '2026 年 3 月 – 10 月',
      className: 'heat-card',
      body:
        `<div class="heat-toolbar"><div class="tools"><select class="select select-sm"><option>学院 × 月份</option><option>专业 × 月份</option><option>教师 × 月份</option></select><select class="select select-sm"><option>全部成果类型</option><option>科研竞赛</option><option>实践成果</option><option>荣誉奖励</option></select><input class="input input-sm" type="date" value="2026-03-01" /><button type="button" class="btn btn-sm btn-primary" data-action="toast" data-message="筛选已应用（原型演示）">应用</button></div><div class="heat-legend">低<span class="legend-swatch" data-level="0"></span><span class="legend-swatch" data-level="1"></span><span class="legend-swatch" data-level="2"></span><span class="legend-swatch" data-level="3"></span><span class="legend-swatch" data-level="4"></span>高</div></div>` +
        `<div class="heat-grid-wrap"><div class="heat-grid">${header}${cells}</div></div>`,
    })

    const rankCard = card({
      title: '学院排行',
      sub: '按成果总数',
      body: `<div class="rank-list">${totals
        .slice(0, 5)
        .map(
          (t, index) =>
            `<div class="rank-item"><span class="rank-index">${
              index + 1
            }</span><span class="rank-main"><span class="rank-name">${
              t.name
            }</span><span class="rank-sub">占全校 ${((t.total / grandTotal) * 100).toFixed(
              1,
            )}%</span></span><span class="rank-value">${t.total}</span></div>`,
        )
        .join('')}</div>`,
    })

    const noteCard = card({
      title: '数据口径',
      body:
        `<div class="callout info"><span class="callout-icon">${icon(
          'info',
          16,
        )}</span><div>统计已审核通过并归档的成果，按成果归属学院与完成月份计数；同一成果不重复计入。</div></div>` +
        `<div class="detail-section section-gap"><h3>观察</h3><p class="help-text">信息工程学院 10 月成果增长最快，环比 +12.8%；马克思主义学院基数较小，建议结合人均成果数解读。热力图颜色按 8 个月全校最大值分档。</p></div>`,
    })

    const detailRows = totals.map((t, index) => {
      const row = HEAT_SERIES.find((r) => r.name === t.name)
      const compare = ((row.values[7] - row.values[6]) / row.values[6]) * 100
      return `<tr><td class="cell-num">${index + 1}</td><td class="cell-strong">${
        t.name
      }</td><td class="cell-num">${t.total}</td><td class="num">${
        compare >= 0 ? '+' : ''
      }${compare.toFixed(1)}%</td><td class="cell-num">${((t.total / grandTotal) * 100).toFixed(
        1,
      )}%</td><td><button type="button" class="link-btn" data-action="toast" data-message="已查看 ${
        t.name
      } 明细">查看明细</button></td></tr>`
    })

    const detailCard = card({
      title: '成果明细',
      sub: '共 8 个学院 · 3,256 项成果',
      actions: `<button type="button" class="btn btn-sm" data-action="toast" data-message="热力图数据已导出">${icon(
        'download',
        14,
      )}导出数据</button>`,
      noPad: true,
      body: table(
        [
          '排名',
          '学院',
          { label: '成果总数', num: true },
          '月度环比',
          { label: '占全校', num: true },
          '操作',
        ],
        detailRows,
      ),
    })

    return (
      `${pageHead({
        title: '成果热力图',
        desc: '按学院与月份查看学生成果分布，快速识别增长集中区域与低活跃组织。',
        actions: `<button type="button" class="btn" data-action="refresh">${icon(
          'refresh',
          15,
        )}刷新数据</button>`,
      })}<div class="heatmap-layout">${heatCard}<div class="stack">${rankCard}${
        noteCard
      }</div></div>` + `<div class="section-gap">${detailCard}</div>`
    )
  }

  /* ---------------------------------------------------------------------------
     19. 组织架构
     --------------------------------------------------------------------------- */

  const ORG_ORDER = ['all', 'edu', 'lib', 'sci', 'info', 'art', 'fl', 'pe', 'marx']

  const ORGS = {
    all: {
      name: '示范大学',
      code: 'UNIV-001',
      admin: '王五',
      students: 1286,
      rate: 92.4,
      phone: '0571-8888 1000',
      founded: '1998 年',
      desc: '学校组织层级固定为「学校 → 学院 → 专业」，班主任与辅导员在账号管理中分配。',
    },
    edu: {
      name: '教育学院',
      code: 'EDU',
      admin: '周敏',
      students: 420,
      rate: 93.8,
      phone: '0571-8888 1201',
      founded: '2003 年',
      desc: '下设教育学系、心理学系与小学教育系，承担小学教育、学前教育等专业的档案管理。',
    },
    lib: {
      name: '文学院',
      code: 'LIB',
      admin: '刘芳',
      students: 236,
      rate: 92.4,
      phone: '0571-8888 1301',
      founded: '2001 年',
      desc: '下设中文系与对外汉语系，负责汉语言文学、汉语国际教育等专业。',
    },
    sci: {
      name: '理学院',
      code: 'SCI',
      admin: '李娜',
      students: 156,
      rate: 88.5,
      phone: '0571-8888 1401',
      founded: '2000 年',
      desc: '下设数学系、物理系与化学系。',
    },
    info: {
      name: '信息工程学院',
      code: 'INFO',
      admin: '张伟',
      students: 198,
      rate: 93.9,
      phone: '0571-8888 1501',
      founded: '2005 年',
      desc: '下设计算机系与软件工程系，档案数量增长较快。',
    },
    art: {
      name: '艺术学院',
      code: 'ART',
      admin: '王强',
      students: 104,
      rate: 85.6,
      phone: '0571-8888 1601',
      founded: '2008 年',
      desc: '下设音乐系、美术系与设计系，档案完整率低于全校平均。',
    },
    fl: {
      name: '外国语学院',
      code: 'FL',
      admin: '陈晨',
      students: 82,
      rate: 87.8,
      phone: '0571-8888 1701',
      founded: '2006 年',
      desc: '下设英语系、日语系与翻译系。',
    },
    pe: {
      name: '体育学院',
      code: 'PE',
      admin: '赵磊',
      students: 58,
      rate: 84.5,
      phone: '0571-8888 1801',
      founded: '2010 年',
      desc: '下设体育教育系与社会体育系。',
    },
    marx: {
      name: '马克思主义学院',
      code: 'MARX',
      admin: '孙倩',
      students: 32,
      rate: 87.5,
      phone: '0571-8888 1901',
      founded: '2015 年',
      desc: '承担思想政治教育专业与全校思政课程。',
    },
  }

  const ORG_MAJORS = {
    all: COLLEGE_STATS.map((c) => ({
      name: c.name,
      students: c.students,
      rate: c.rate,
      leader: c.counselor,
    })),
    edu: [
      { name: '小学教育', students: 132, rate: 96.2, leader: '周敏' },
      { name: '学前教育', students: 118, rate: 94.8, leader: '陈静' },
      { name: '教育学', students: 90, rate: 92.0, leader: '李明' },
      { name: '教育技术学', students: 80, rate: 91.5, leader: '王华' },
    ],
    lib: [
      { name: '汉语言文学', students: 108, rate: 93.1, leader: '刘芳' },
      { name: '汉语国际教育', students: 76, rate: 91.8, leader: '张蕾' },
      { name: '秘书学', students: 52, rate: 91.2, leader: '陈晨' },
    ],
    sci: [
      { name: '数学与应用数学', students: 68, rate: 89.6, leader: '李娜' },
      { name: '物理学', students: 48, rate: 87.4, leader: '王磊' },
      { name: '化学', students: 40, rate: 88.0, leader: '赵敏' },
    ],
    info: [
      { name: '计算机科学与技术', students: 88, rate: 94.8, leader: '张伟' },
      { name: '软件工程', students: 66, rate: 93.6, leader: '刘洋' },
      { name: '数据科学与大数据技术', students: 44, rate: 92.7, leader: '孙浩' },
    ],
    art: [
      { name: '音乐学', students: 38, rate: 86.2, leader: '王强' },
      { name: '美术学', students: 36, rate: 85.0, leader: '陈楠' },
      { name: '视觉传达设计', students: 30, rate: 85.7, leader: '李佳' },
    ],
    fl: [
      { name: '英语', students: 42, rate: 89.1, leader: '陈晨' },
      { name: '日语', students: 24, rate: 86.8, leader: '林悦' },
      { name: '翻译', students: 16, rate: 86.5, leader: '周宁' },
    ],
    pe: [
      { name: '体育教育', students: 34, rate: 85.2, leader: '赵磊' },
      { name: '社会体育指导与管理', students: 24, rate: 83.5, leader: '王涛' },
    ],
    marx: [{ name: '思想政治教育', students: 32, rate: 87.5, leader: '孙倩' }],
  }

  function screenOrg() {
    const selectedId = ORGS[state.selectedOrg] ? state.selectedOrg : 'edu'
    const org = ORGS[selectedId]

    const collegeButtons = ORG_ORDER.slice(1)
      .map((id) => {
        const item = ORGS[id]
        const active = id === selectedId
        let html = `<button type="button" class="tree-item ${
          active ? 'is-active' : ''
        }" data-action="select-org" data-id="${id}"><span class="tree-icon">${icon(
          'folder',
          15,
        )}</span><span>${item.name}</span><span class="tree-count">${item.students}</span></button>`
        if (id === 'edu' && active) {
          html += `<div class="tree-children">${['教育学系', '心理学系', '小学教育系']
            .map(
              (d) =>
                `<button type="button" class="tree-item" data-action="toast" data-message="${
                  d
                } 为系级组织，不单独维护档案"><span class="tree-icon">${icon(
                  'layers',
                  14,
                )}</span><span>${d}</span></button>`,
            )
            .join('')}</div>`
        }
        return html
      })
      .join('')

    const treeCard = card({
      title: '组织架构',
      actions: `<button type="button" class="btn btn-sm btn-icon" data-action="open-org-modal" title="新增学院" aria-label="新增学院">${icon(
        'plus',
        15,
      )}</button>`,
      noPad: true,
      body: `<div class="tree"><button type="button" class="tree-item ${
        selectedId === 'all' ? 'is-active' : ''
      }" data-action="select-org" data-id="all"><span class="tree-icon">${icon(
        'org',
        15,
      )}</span><span>${ORGS.all.name}</span><span class="tree-count">${fmt(
        ORGS.all.students,
      )}</span></button><div class="tree-children">${collegeButtons}</div></div>`,
    })

    const detailCard = card({
      title: '组织详情',
      sub: org.name,
      actions: `<button type="button" class="btn btn-sm" data-action="open-org-modal">${icon(
        'edit',
        14,
      )}编辑</button>`,
      body:
        `<div class="info-grid"><div class="info-item"><div class="label">组织名称</div><div class="value">${
          org.name
        }</div></div><div class="info-item"><div class="label">组织编码</div><div class="value num">${
          org.code
        }</div></div><div class="info-item"><div class="label">负责人</div><div class="value">${
          org.admin
        }</div></div><div class="info-item"><div class="label">学生数</div><div class="value num">${fmt(
          org.students,
        )} 人</div></div><div class="info-item"><div class="label">档案完整率</div><div class="value num">${
          org.rate
        }%</div></div><div class="info-item"><div class="label">联系电话</div><div class="value num">${
          org.phone
        }</div></div><div class="info-item"><div class="label">成立时间</div><div class="value">${
          org.founded
        }</div></div><div class="info-item"><div class="label">状态</div><div class="value">${tag(
          '正常',
          'ok',
        )}</div></div></div>` + `<p class="help-text mt-12">${org.desc}</p>`,
    })

    const majors = ORG_MAJORS[selectedId] || []
    const majorRows = majors.map(
      (m) =>
        `<tr><td class="cell-strong">${m.name}</td><td class="cell-num">${fmt(
          m.students,
        )}</td><td>${progress(m.rate)}</td><td>${
          m.leader
        }</td><td><div class="row-actions"><button type="button" class="link-btn" data-action="toast" data-message="已查看 ${
          m.name
        } 档案">查看档案</button><button type="button" class="link-btn muted" data-action="toast" data-message="已发送设置提醒">设置</button></div></td></tr>`,
    )

    const majorsCard = card({
      title: selectedId === 'all' ? '下属学院' : '下属专业',
      sub: `${majors.length} 个`,
      actions:
        selectedId === 'all'
          ? ''
          : `<button type="button" class="btn btn-sm" data-action="open-org-modal">${icon(
              'plus',
              14,
            )}新增专业</button>`,
      noPad: true,
      body: `${table(
        [
          selectedId === 'all' ? '学院' : '专业',
          { label: '学生数', num: true },
          '档案完整率',
          '负责人',
          '操作',
        ],
        majorRows,
      )}<div class="card-foot"><span>组织调整会同步影响数据范围与辅导员带班关系，请谨慎操作。</span></div>`,
    })

    return `${pageHead({
      title: '组织架构',
      desc: '学校 → 学院 → 专业三级结构；组织调整会同步更新账号数据范围与档案归属。',
      actions:
        `<button type="button" class="btn" data-action="toast" data-message="组织架构已导出">${icon(
          'download',
          15,
        )}导出组织</button>` +
        `<button type="button" class="btn btn-primary" data-action="open-org-modal">${icon(
          'plus',
          15,
        )}新增学院</button>`,
    })}<div class="org-layout">${treeCard}<div class="stack">${detailCard}${majorsCard}</div></div>`
  }

  function openOrgModal() {
    openModal({
      title: '新增 / 编辑组织',
      desc: '组织编码创建后不可修改；学院负责人默认拥有本学院数据范围。',
      body:
        `<form class="form-grid" onsubmit="return false">` +
        `<div class="field field--full"><label>组织名称 <span class="required">*</span></label><input class="input" type="text" placeholder="如：教育学院" /></div>${field(
          '组织类型',
          '<select class="select"><option>学院</option><option>专业</option><option>系</option></select>',
        )}${field(
          '上级组织',
          '<select class="select"><option>示范大学</option><option>教育学院</option><option>文学院</option></select>',
        )}${field(
          '组织编码',
          '<input class="input" type="text" placeholder="大写字母，如 EDU" />',
        )}${field(
          '负责人',
          '<select class="select"><option>周敏</option><option>刘芳</option><option>张伟</option></select>',
        )}${field(
          '联系电话',
          '<input class="input" type="text" placeholder="0571-8888 0000" />',
        )}${field(
          '排序',
          '<input class="input" type="number" value="10" />',
        )}<div class="field field--full"><label>组织说明</label><textarea class="textarea" placeholder="选填"></textarea></div>` +
        `</form>`,
      foot:
        '<button type="button" class="btn" data-action="close-overlay">取消</button>' +
        '<button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="组织信息已保存（原型演示）">保存组织</button>',
    })
  }

  /* ---------------------------------------------------------------------------
     20. 账号与角色
     --------------------------------------------------------------------------- */

  const ACCOUNTS = [
    {
      account: 'A00001',
      name: '王五',
      role: '系统管理员',
      org: '校级',
      scope: '全校',
      status: '启用',
      last: '今天 09:02',
    },
    {
      account: 'T00003',
      name: '周敏',
      role: '学院管理员',
      org: '教育学院',
      scope: '本学院',
      status: '启用',
      last: '昨天 17:22',
    },
    {
      account: 'T00010',
      name: '李四',
      role: '教师',
      org: '教育学院 · 小学教育',
      scope: '本人带班',
      status: '启用',
      last: '今天 08:40',
    },
    {
      account: 'C00002',
      name: '陈静',
      role: '辅导员',
      org: '教育学院',
      scope: '本学院',
      status: '启用',
      last: '10-29 14:10',
    },
    {
      account: 'T00012',
      name: '张伟',
      role: '学院管理员',
      org: '信息工程学院',
      scope: '本学院',
      status: '停用',
      last: '10-21 09:00',
    },
    {
      account: 'C00005',
      name: '刘芳',
      role: '辅导员',
      org: '文学院',
      scope: '本学院',
      status: '启用',
      last: '10-30 16:30',
    },
    {
      account: 'T00015',
      name: '孙志强',
      role: '教师',
      org: '文学院',
      scope: '本人带班',
      status: '启用',
      last: '10-30 09:15',
    },
  ]

  const ROLES = [
    { name: '系统管理员', desc: '全部模块与数据权限', count: 6, modules: 9, updated: '2026-09-18' },
    {
      name: '学院管理员',
      desc: '本学院档案、审核与账号管理',
      count: 12,
      modules: 7,
      updated: '2026-08-22',
    },
    {
      name: '辅导员',
      desc: '本学院档案补录与材料初审',
      count: 46,
      modules: 5,
      updated: '2026-07-30',
    },
    { name: '教师', desc: '本人带班档案查看与导出', count: 179, modules: 4, updated: '2026-06-12' },
  ]

  const SCOPES = [
    {
      target: '系统管理员',
      type: '全校',
      orgs: '全部组织',
      condition: '无限制',
      updated: '2026-09-18',
    },
    {
      target: '学院管理员',
      type: '本学院',
      orgs: '所属学院及下属专业',
      condition: '按账号所属组织',
      updated: '2026-08-22',
    },
    {
      target: '辅导员',
      type: '本学院',
      orgs: '所带班级学生',
      condition: '按带班关系',
      updated: '2026-07-30',
    },
    {
      target: '教师',
      type: '本人带班',
      orgs: '本人负责班级',
      condition: '按授课/带班关系',
      updated: '2026-06-12',
    },
    {
      target: '审核教师（授权）',
      type: '授权范围',
      orgs: '委托指定的学院',
      condition: '审批委托有效期内',
      updated: '2026-10-01',
    },
  ]

  const LOGIN_LOGS = [
    {
      time: '今天 09:02',
      account: 'A00001',
      name: '王五',
      ip: '10.12.3.44',
      place: '校内',
      result: '成功',
      detail: 'Chrome · Windows',
    },
    {
      time: '今天 08:40',
      account: 'T00010',
      name: '李四',
      ip: '10.12.8.17',
      place: '校内',
      result: '成功',
      detail: 'Edge · Windows',
    },
    {
      time: '昨天 17:22',
      account: 'T00003',
      name: '周敏',
      ip: '10.12.5.90',
      place: '校内',
      result: '成功',
      detail: 'Chrome · macOS',
    },
    {
      time: '昨天 11:08',
      account: 'T00012',
      name: '张伟',
      ip: '120.55.31.7',
      place: '杭州',
      result: '失败',
      detail: '密码错误（第 3 次）',
    },
    {
      time: '10-30 16:30',
      account: 'C00005',
      name: '刘芳',
      ip: '10.12.6.12',
      place: '校内',
      result: '成功',
      detail: 'Chrome · Windows',
    },
    {
      time: '10-30 09:15',
      account: 'T00015',
      name: '孙志强',
      ip: '10.12.8.33',
      place: '校内',
      result: '成功',
      detail: 'Safari · iPad',
    },
  ]

  function screenAccounts() {
    const kpis = kpiStrip([
      { label: '账号总数', value: 243, unit: '个' },
      { label: '启用账号', value: 231, unit: '个', meta: '停用 12 个' },
      { label: '管理员账号', value: 18, unit: '个', meta: '含学院管理员 12 个' },
      { label: '本月新增', value: 4, unit: '个' },
    ])

    let content = ''
    if (state.accountTab === 'accounts') {
      const rows = ACCOUNTS.map(
        (a) =>
          `<tr><td class="cell-strong num">${a.account}</td><td>${a.name}</td><td>${
            a.role
          }</td><td>${a.org}</td><td>${a.scope}</td><td>${statusTag(
            a.status,
          )}</td><td class="muted">${
            a.last
          }</td><td><div class="row-actions"><button type="button" class="link-btn" data-action="toast" data-message="账号编辑（原型演示）">编辑</button><button type="button" class="link-btn muted" data-action="confirm-action" data-title="重置密码" data-body="将为 ${
            a.name
          } 生成随机初始密码，并要求下次登录时修改。" data-confirm-label="重置密码" data-toast="初始密码已生成并发送">重置密码</button></div></td></tr>`,
      )
      content = `<div class="filter-bar"><div class="filter-grid">${field(
        '关键字',
        '<input class="input" type="text" placeholder="账号 / 姓名 / 手机号" />',
        true,
      )}${field('角色', select(['系统管理员', '学院管理员', '辅导员', '教师']))}${field(
        '所属组织',
        select(['教育学院', '文学院', '信息工程学院', '理学院']),
      )}${field(
        '状态',
        select(['启用', '停用']),
      )}<div class="filter-actions"><button type="button" class="btn btn-primary" data-action="toast" data-message="已查询账号">查询</button><button type="button" class="btn" data-action="toast" data-message="筛选条件已重置">重置</button></div></div></div>${card(
        {
          title: '账号管理',
          sub: '共 243 个',
          noPad: true,
          body:
            table(
              ['账号', '姓名', '角色', '所属组织', '数据范围', '状态', '最近登录', '操作'],
              rows,
            ) + pagination(243, 1, 10, '个'),
        },
      )}`
    } else if (state.accountTab === 'roles') {
      const rows = ROLES.map(
        (r) =>
          `<tr><td class="cell-strong">${r.name}</td><td>${r.desc}</td><td class="cell-num">${
            r.count
          }</td><td class="cell-num">${r.modules}</td><td class="muted">${
            r.updated
          }</td><td><div class="row-actions"><button type="button" class="link-btn" data-action="toast" data-message="角色权限编辑（原型演示）">配置权限</button><button type="button" class="link-btn muted" data-action="toast" data-message="已查看角色成员">成员</button></div></td></tr>`,
      )
      content = `<div class="callout info mb-16"><span class="callout-icon">${icon(
        'shield',
        16,
      )}</span><div>角色决定可见模块与默认数据范围。管理员可在“数据范围”页签为单个账号追加或收窄范围，但不得超出角色上限。</div></div>${card(
        {
          title: '角色权限',
          sub: '4 个角色',
          actions: `<button type="button" class="btn btn-sm btn-primary" data-action="toast" data-message="新增角色（原型演示）">${icon(
            'plus',
            14,
          )}新增角色</button>`,
          noPad: true,
          body: table(
            [
              '角色',
              '说明',
              { label: '账号数', num: true },
              { label: '可见模块', num: true },
              '更新时间',
              '操作',
            ],
            rows,
          ),
        },
      )}`
    } else if (state.accountTab === 'scopes') {
      const rows = SCOPES.map(
        (s) =>
          `<tr><td class="cell-strong">${s.target}</td><td>${s.type}</td><td>${s.orgs}</td><td>${
            s.condition
          }</td><td class="muted">${
            s.updated
          }</td><td><button type="button" class="link-btn" data-action="toast" data-message="数据范围配置（原型演示）">配置</button></td></tr>`,
      )
      content = `<div class="callout info mb-16"><span class="callout-icon">${icon(
        'info',
        16,
      )}</span><div>数据范围按「角色默认 + 账号追加」共同生效，取交集。审批委托期间，受托人可获得委托范围内的临时数据权限。</div></div>${card(
        {
          title: '数据范围',
          noPad: true,
          body: table(
            ['角色 / 账号', '范围类型', '覆盖组织', '生效条件', '更新时间', '操作'],
            rows,
          ),
        },
      )}`
    } else {
      const rows = LOGIN_LOGS.map(
        (l) =>
          `<tr><td class="muted">${l.time}</td><td class="cell-strong num">${l.account}</td><td>${
            l.name
          }</td><td class="num">${l.ip}</td><td>${l.place}</td><td>${
            l.result === '成功' ? tag('成功', 'ok') : tag('失败', 'danger')
          }</td><td class="muted">${l.detail}</td></tr>`,
      )
      content = `<div class="filter-bar"><div class="filter-grid">${field(
        '账号 / 姓名',
        '<input class="input" type="text" placeholder="账号或姓名" />',
        true,
      )}${field('登录结果', select(['成功', '失败']))}${field(
        '登录时间',
        '<input class="input" type="date" value="2026-10-01" />',
      )}${field(
        '来源 IP',
        '<input class="input" type="text" placeholder="如：10.12." />',
      )}<div class="filter-actions"><button type="button" class="btn btn-primary" data-action="toast" data-message="已查询登录日志">查询</button><button type="button" class="btn" data-action="toast" data-message="筛选条件已重置">重置</button></div></div></div>${card(
        {
          title: '登录日志',
          sub: '保留 90 天',
          actions: `<button type="button" class="btn btn-sm" data-action="toast" data-message="日志已导出">${icon(
            'download',
            14,
          )}导出</button>`,
          noPad: true,
          body:
            table(['登录时间', '账号', '姓名', '来源 IP', '地点', '结果', '客户端 / 说明'], rows) +
            pagination(864, 1, 10),
        },
      )}`
    }

    return (
      pageHead({
        title: '账号与角色',
        desc: '统一管理账号、角色权限与数据范围；登录日志已并入本页，不再单独占用导航。',
        actions: `<button type="button" class="btn btn-primary" data-action="open-account-modal">${icon(
          'plus',
          15,
        )}新增账号</button>`,
      }) +
      tabsRow(
        [
          { key: 'accounts', label: '账号管理', count: 243 },
          { key: 'roles', label: '角色权限', count: 4 },
          { key: 'scopes', label: '数据范围', count: 5 },
          { key: 'logs', label: '登录日志' },
        ],
        state.accountTab,
        'account-tab',
        '<span class="muted">账号变更会记录在操作日志</span>',
      ) +
      kpis +
      content
    )
  }

  function openAccountModal() {
    openModal({
      title: '新增账号',
      desc: '初始密码将通过短信发送给用户，首次登录必须修改密码。',
      body:
        `<form class="form-grid" onsubmit="return false">${field(
          '登录账号 <span class="required">*</span>',
          '<input class="input" type="text" placeholder="如：T00016" />',
        )}${field(
          '姓名 <span class="required">*</span>',
          '<input class="input" type="text" placeholder="真实姓名" />',
        )}${field(
          '角色 <span class="required">*</span>',
          '<select class="select"><option>教师</option><option>辅导员</option><option>学院管理员</option></select>',
        )}${field(
          '所属组织',
          '<select class="select"><option>教育学院</option><option>文学院</option><option>信息工程学院</option></select>',
        )}${field(
          '数据范围',
          '<select class="select"><option>本人带班</option><option>本学院</option><option>全校</option></select>',
        )}${field(
          '手机号',
          '<input class="input" type="text" placeholder="用于接收初始密码" />',
        )}${field(
          '初始密码',
          '<input class="input" type="text" value="随机生成" disabled />',
        )}${field(
          '状态',
          '<select class="select"><option>启用</option><option>停用</option></select>',
        )}<div class="field field--full"><label class="check"><input type="checkbox" checked /> 首次登录强制修改密码</label></div>` +
        `</form>`,
      foot:
        '<span class="foot-left">账号创建后将写入操作日志</span>' +
        '<button type="button" class="btn" data-action="close-overlay">取消</button>' +
        '<button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="账号已创建，初始密码已发送">创建账号</button>',
    })
  }

  /* ---------------------------------------------------------------------------
     21. 系统设置
     --------------------------------------------------------------------------- */

  const DICT_TYPES = [
    { key: 'status', label: '档案状态', count: 4 },
    { key: 'material', label: '材料类型', count: 8 },
    { key: 'grade', label: '年级', count: 4 },
    { key: 'enroll', label: '学籍状态', count: 5 },
  ]

  const DICT_ITEMS = {
    status: [
      { label: '待补录', code: 'PENDING', sort: 1, status: '启用' },
      { label: '审核中', code: 'REVIEWING', sort: 2, status: '启用' },
      { label: '已归档', code: 'ARCHIVED', sort: 3, status: '启用' },
      { label: '异常', code: 'ABNORMAL', sort: 4, status: '启用' },
    ],
    material: [
      { label: '基本信息', code: 'BASIC', sort: 1, status: '启用' },
      { label: '学籍材料', code: 'ENROLL', sort: 2, status: '启用' },
      { label: '奖惩记录', code: 'AWARD', sort: 3, status: '启用' },
      { label: '实践成果', code: 'PRACTICE', sort: 4, status: '启用' },
      { label: '心理健康', code: 'PSYCH', sort: 5, status: '启用' },
      { label: '奖助学金', code: 'GRANT', sort: 6, status: '启用' },
      { label: '学籍异动', code: 'TRANSFER', sort: 7, status: '启用' },
      { label: '其他', code: 'OTHER', sort: 8, status: '启用' },
    ],
    grade: [
      { label: '2022 级', code: '2022', sort: 1, status: '启用' },
      { label: '2023 级', code: '2023', sort: 2, status: '启用' },
      { label: '2024 级', code: '2024', sort: 3, status: '启用' },
      { label: '2025 级', code: '2025', sort: 4, status: '启用' },
    ],
    enroll: [
      { label: '在籍', code: 'ACTIVE', sort: 1, status: '启用' },
      { label: '休学', code: 'SUSPENDED', sort: 2, status: '启用' },
      { label: '保留学籍', code: 'RETAINED', sort: 3, status: '启用' },
      { label: '已毕业', code: 'GRADUATED', sort: 4, status: '启用' },
      { label: '退学', code: 'QUIT', sort: 5, status: '启用' },
    ],
  }

  const SEMESTERS = [
    {
      name: '2026-2027 学年第一学期',
      start: '2026-09-01',
      end: '2027-01-15',
      archive: '2027-01-31',
      current: '是',
    },
    {
      name: '2025-2026 学年第二学期',
      start: '2026-02-23',
      end: '2026-07-03',
      archive: '2026-07-20',
      current: '否',
    },
    {
      name: '2025-2026 学年第一学期',
      start: '2025-09-01',
      end: '2026-01-16',
      archive: '2026-01-31',
      current: '否',
    },
  ]

  const SCHEDULED_TASKS = [
    {
      name: '每日档案快照',
      cron: '0 2 * * *',
      last: '今天 02:00',
      next: '明天 02:00',
      status: '启用',
    },
    {
      name: '每周完整率统计',
      cron: '0 3 * * 1',
      last: '10-27 03:00',
      next: '11-03 03:00',
      status: '失败',
    },
    {
      name: '消息过期清理',
      cron: '0 4 * * *',
      last: '今天 04:00',
      next: '明天 04:00',
      status: '启用',
    },
    {
      name: '评分批次重算',
      cron: '0 1 1 * *',
      last: '11-01 01:00',
      next: '12-01 01:00',
      status: '启用',
    },
    {
      name: '导出文件清理',
      cron: '30 4 * * *',
      last: '今天 04:30',
      next: '明天 04:30',
      status: '启用',
    },
  ]

  const OP_LOGS = [
    {
      time: '今天 09:20',
      actor: '王五',
      action: '创建导出任务',
      target: '教育学院 · 420 人',
      ip: '10.12.3.44',
    },
    {
      time: '今天 09:05',
      actor: '王五',
      action: '审核通过',
      target: '吴雨欣 · 心理测评材料',
      ip: '10.12.3.44',
    },
    {
      time: '今天 08:55',
      actor: '周敏',
      action: '补录材料',
      target: '陈雨桐 · 社会实践证明',
      ip: '10.12.5.90',
    },
    {
      time: '昨天 17:36',
      actor: '王五',
      action: '修改系统配置',
      target: '导出单次上限 5,000 条',
      ip: '10.12.3.44',
    },
    {
      time: '昨天 16:12',
      actor: '周敏',
      action: '创建导出任务',
      target: '2024 级奖惩记录',
      ip: '10.12.5.90',
    },
    {
      time: '昨天 10:20',
      actor: '王五',
      action: '停用账号',
      target: '张伟（T00012）',
      ip: '10.12.3.44',
    },
  ]

  function settingsHead(title, actions) {
    return `<div class="settings-main-head"><h2>${title}</h2><div class="card-actions">${
      actions || ''
    }</div></div>`
  }

  function settingsDictPanel() {
    const type = DICT_TYPES.find((t) => t.key === state.dictType) || DICT_TYPES[0]
    const items = DICT_ITEMS[type.key] || []
    const rows = items.map(
      (item) =>
        `<tr><td class="cell-strong">${item.label}</td><td class="num">${
          item.code
        }</td><td class="cell-num">${item.sort}</td><td>${statusTag(
          item.status,
        )}</td><td><div class="row-actions"><button type="button" class="link-btn" data-action="toast" data-message="字典项编辑（原型演示）">编辑</button><button type="button" class="link-btn danger" data-action="confirm-action" data-title="删除字典项" data-body="被业务数据引用的字典项无法删除，只能停用。" data-confirm-label="删除" data-toast="字典项已删除（原型演示）" data-danger="true">删除</button></div></td></tr>`,
    )

    return `${settingsHead(
      '数据字典',
      `<button type="button" class="btn btn-sm btn-primary" data-action="toast" data-message="新增字典项（原型演示）">${icon(
        'plus',
        14,
      )}新增字典项</button>`,
    )}<div class="settings-body"><div class="dict-layout"><div class="dict-types">${DICT_TYPES.map(
      (t) =>
        `<button type="button" class="${
          t.key === type.key ? 'is-active' : ''
        }" data-action="select-dict" data-type="${t.key}"><span>${
          t.label
        }</span><span class="tree-count">${t.count}</span></button>`,
    ).join('')}</div><div class="dict-items"><div class="settings-subhead"><strong>${
      type.label
    }</strong><span class="muted">${items.length} 项</span></div>${table(
      ['字典项', '编码', { label: '排序', num: true }, '状态', '操作'],
      rows,
    )}</div></div></div>`
  }

  function settingsSemesterPanel() {
    const rows = SEMESTERS.map(
      (s) =>
        `<tr><td class="cell-strong">${s.name}</td><td class="num">${s.start}</td><td class="num">${
          s.end
        }</td><td class="num">${s.archive}</td><td>${
          s.current === '是' ? tag('当前学期', 'blue') : tag('历史学期', 'muted')
        }</td><td><div class="row-actions"><button type="button" class="link-btn" data-action="toast" data-message="学期编辑（原型演示）">编辑</button>${
          s.current === '是'
            ? ''
            : '<button type="button" class="link-btn" data-action="toast" data-message="已设为当前学期">设为当前</button>'
        }</div></td></tr>`,
    )

    return (
      `${settingsHead(
        '学期设置',
        `<button type="button" class="btn btn-sm btn-primary" data-action="toast" data-message="新增学期（原型演示）">${icon(
          'plus',
          14,
        )}新增学期</button>`,
      )}<div class="settings-body"><form class="form-grid" onsubmit="return false">` +
      `<div class="field field--full"><label>当前学期 <span class="required">*</span></label><select class="select"><option>2026-2027 学年第一学期</option><option>2025-2026 学年第二学期</option></select></div>${field(
        '学期开始',
        '<input class="input" type="date" value="2026-09-01" />',
      )}${field('学期结束', '<input class="input" type="date" value="2027-01-15" />')}${field(
        '档案归档截止',
        '<input class="input" type="date" value="2027-01-31" />',
      )}${field(
        '补录截止',
        '<input class="input" type="date" value="2027-02-15" />',
      )}<div class="field field--full"><label class="check"><input type="checkbox" checked /> 允许学生在补录期内自行补充材料</label></div>` +
      `<div class="field field--full"><div class="form-actions"><button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="学期设置已保存">保存设置</button></div></div>` +
      `</form><div class="split-divider"></div>${table(
        ['学期', '开始日期', '结束日期', '归档截止', '状态', '操作'],
        rows,
      )}</div>`
    )
  }

  function settingsConfigPanel() {
    return (
      `${settingsHead(
        '系统配置',
        '<span class="muted">最后保存：昨天 17:36</span>',
      )}<div class="settings-body"><form class="form-grid" onsubmit="return false">${field(
        '系统名称',
        '<input class="input" type="text" value="学生档案管理系统" />',
      )}${field('学校名称', '<input class="input" type="text" value="示范大学" />')}${field(
        '列表每页条数',
        '<input class="input" type="number" value="10" />',
      )}${field('导出单次上限', '<input class="input" type="number" value="5000" />')}${field(
        '会话超时（分钟）',
        '<input class="input" type="number" value="30" />',
      )}${field(
        '登录失败锁定次数',
        '<input class="input" type="number" value="5" />',
      )}<div class="field field--full"><label>安全与访问</label><div class="check-row"><label class="check"><input type="checkbox" checked /> 启用图形验证码</label><label class="check"><input type="checkbox" checked /> 导出操作二次确认</label><label class="check"><input type="checkbox" /> 允许校外 IP 登录</label><label class="check"><input type="checkbox" checked /> 记录登录日志</label></div></div>` +
      `<div class="field field--full"><label>运行状态</label><div class="switch-list"><div class="switch-row"><span>系统维护模式</span><label class="check"><input type="checkbox" /> 开启后仅管理员可登录</label></div><div class="switch-row"><span>档案补录提醒</span><label class="check"><input type="checkbox" checked /> 每日 09:00 发送</label></div></div></div>` +
      `<div class="field field--full"><div class="form-actions"><button type="button" class="btn" data-action="toast" data-message="配置已重置">重置</button><button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="系统配置已保存">保存配置</button></div></div>` +
      `</form><div class="callout warn"><span class="callout-icon">${icon(
        'alert',
        16,
      )}</span><div>修改会话超时与导出上限将立即影响所有在线用户，建议在非工作时段调整。</div></div></div>`
    )
  }

  function settingsTasksPanel() {
    const rows = SCHEDULED_TASKS.map(
      (t) =>
        `<tr><td class="cell-strong">${t.name}</td><td class="num">${
          t.cron
        }</td><td class="muted">${t.last}</td><td class="muted">${t.next}</td><td>${statusTag(
          t.status,
        )}</td><td><div class="row-actions"><button type="button" class="link-btn" data-action="run-task">立即执行</button><button type="button" class="link-btn" data-action="toast" data-message="任务编辑（原型演示）">编辑</button><button type="button" class="link-btn muted" data-action="toast" data-message="执行日志（原型演示）">日志</button></div></td></tr>`,
    )

    return `${settingsHead(
      '定时任务',
      `<button type="button" class="btn btn-sm btn-primary" data-action="toast" data-message="新增定时任务（原型演示）">${icon(
        'plus',
        14,
      )}新增任务</button>`,
    )}<div class="settings-body">${
      SCHEDULED_TASKS.some((t) => t.status === '失败')
        ? `<div class="callout warn mb-16"><span class="callout-icon">${icon(
            'alert',
            16,
          )}</span><div>“每周完整率统计”上次执行失败，请查看执行日志或手动触发一次。</div></div>`
        : ''
    }${table(['任务名称', 'Cron 表达式', '上次执行', '下次执行', '状态', '操作'], rows)}</div>`
  }

  function settingsLogsPanel() {
    const rows = OP_LOGS.map(
      (l) =>
        `<tr><td class="muted">${l.time}</td><td class="cell-strong">${l.actor}</td><td>${
          l.action
        }</td><td>${l.target}</td><td class="num muted">${l.ip}</td></tr>`,
    )

    return `${settingsHead(
      '操作日志',
      `<button type="button" class="btn btn-sm" data-action="toast" data-message="日志已导出">${icon(
        'download',
        14,
      )}导出</button>`,
    )}<div class="settings-body"><div class="filter-bar"><div class="filter-grid">${field(
      '操作人',
      '<input class="input" type="text" placeholder="姓名 / 账号" />',
    )}${field(
      '操作类型',
      select(['创建导出任务', '审核通过', '补录材料', '修改系统配置', '停用账号']),
    )}${field(
      '操作时间',
      '<input class="input" type="date" value="2026-10-01" />',
    )}<div class="filter-actions"><button type="button" class="btn btn-primary" data-action="toast" data-message="已查询操作日志">查询</button><button type="button" class="btn" data-action="toast" data-message="筛选条件已重置">重置</button></div></div></div>${table(
      ['时间', '操作人', '操作类型', '操作对象', '来源 IP'],
      rows,
    )}${pagination(2468, 1, 10)}</div>`
  }

  function screenSettings() {
    const items = [
      { key: 'dict', label: '数据字典' },
      { key: 'semester', label: '学期设置' },
      { key: 'config', label: '系统配置' },
      { key: 'tasks', label: '定时任务' },
      { key: 'logs', label: '操作日志' },
    ]

    let panel = settingsDictPanel()
    if (state.settingsTab === 'semester') panel = settingsSemesterPanel()
    else if (state.settingsTab === 'config') panel = settingsConfigPanel()
    else if (state.settingsTab === 'tasks') panel = settingsTasksPanel()
    else if (state.settingsTab === 'logs') panel = settingsLogsPanel()

    return `${pageHead({
      title: '系统设置',
      desc: '数据字典、学期、系统参数、定时任务与操作日志集中在此维护；原来的 4 个独立入口合并为同一页面。',
      actions:
        `<span class="tag ok">系统运行正常</span>` +
        `<button type="button" class="btn" data-action="toast" data-message="系统缓存已刷新">${icon(
          'refresh',
          15,
        )}刷新缓存</button>`,
    })}<div class="settings-split"><div class="settings-side">${items
      .map(
        (item) =>
          `<button type="button" class="${
            state.settingsTab === item.key ? 'is-active' : ''
          }" data-action="settings-tab" data-tab="${item.key}">${item.label}</button>`,
      )
      .join('')}</div><div class="settings-main">${panel}</div></div>`
  }

  /* ---------------------------------------------------------------------------
     22. 消息中心
     --------------------------------------------------------------------------- */

  function screenMessages() {
    const filters = [
      { key: 'all', label: '全部' },
      { key: 'unread', label: '未读' },
      { key: 'system', label: '系统' },
      { key: 'review', label: '审核' },
    ]
    const unread = unreadMessages().length
    const filtered = MESSAGES.filter((m) => {
      if (state.messageFilter === 'unread') return m.unread && !state.readMessages.has(m.id)
      if (state.messageFilter === 'system') return m.category === 'system'
      if (state.messageFilter === 'review') return m.category === 'review'
      return true
    })

    const selected =
      MESSAGES.find((m) => m.id === state.messageSelected) || filtered[0] || MESSAGES[0]

    const items = filtered.map((m) => {
      const isUnread = m.unread && !state.readMessages.has(m.id)
      return `<button type="button" class="message-item ${
        m.id === selected.id ? 'is-active ' : ''
      }${isUnread ? 'is-unread' : ''}" data-action="select-message" data-id="${
        m.id
      }"><span class="message-title-row"><span class="message-title">${
        m.title
      }</span><span class="message-time">${m.time}</span></span><span class="message-snippet">${
        m.from
      } · ${m.snippet}</span></button>`
    })

    const listCard = card({
      title: '消息',
      sub: `${unread} 条未读`,
      actions:
        '<button type="button" class="btn btn-sm" data-action="mark-all-read">全部已读</button>',
      noPad: true,
      className: 'message-list',
      body: `<div class="review-list-tools"><div class="segmented" role="group" aria-label="消息筛选">${filters
        .map(
          (f) =>
            `<button type="button" class="segmented__btn ${
              state.messageFilter === f.key ? 'is-active' : ''
            }" data-action="message-filter" data-filter="${f.key}">${f.label}</button>`,
        )
        .join('')}</div></div><div class="message-list-body">${
        items.length
          ? items.join('')
          : '<div class="empty-state"><strong>没有符合条件的消息</strong>切换筛选条件查看其他消息。</div>'
      }</div>`,
    })

    const categoryLabel = selected.category === 'review' ? '审核通知' : '系统通知'
    const detail = `<section class="card"><div class="message-detail-head"><h2>${
      selected.title
    }</h2><div class="message-detail-meta"><span>${selected.from}</span><span>·</span><span>${
      selected.time
    }</span>${tag(
      categoryLabel,
      selected.category === 'review' ? 'blue' : 'info',
      true,
    )}</div></div><div class="message-detail-body">${selected.body
      .map((p) => `<p>${p}</p>`)
      .join(
        '',
      )}</div><div class="detail-foot"><span class="hint">消息与相关业务记录关联，跳转后可继续处理。</span><div class="actions"><button type="button" class="btn" data-action="toast" data-message="已标记为未读">标记未读</button><button type="button" class="btn btn-primary" data-action="navigate" data-route="${
      selected.route
    }">查看关联内容</button></div></div></section>`

    return `${pageHead({
      title: '消息中心',
      desc: '消息中心保留全部能力，但已从侧栏移出：点击顶栏铃铛即可查看未读消息，或在此浏览全部消息。',
      actions: `<button type="button" class="btn" data-action="navigate" data-route="dashboard">${icon(
        'arrowLeft',
        15,
      )}返回工作台</button>`,
    })}<div class="message-layout">${listCard}${detail}</div>`
  }

  /* ---------------------------------------------------------------------------
     23. 个人信息 / 快捷键 / 改造说明
     --------------------------------------------------------------------------- */

  function openProfile() {
    const who = ROLE_META[state.role]
    openModal({
      title: '个人信息',
      desc: '身份与数据范围由管理员维护；联系方式可自行修改。',
      body:
        `<div class="detail-summary">` +
        `<div class="item"><div class="label">姓名</div><div class="value">${
          who.name
        }</div></div><div class="item"><div class="label">角色</div><div class="value">${
          who.roleLabel
        }</div></div><div class="item"><div class="label">数据范围</div><div class="value">${
          who.scope
        }</div></div><div class="item"><div class="label">账号</div><div class="value num">${
          state.role === 'admin' ? 'A00001' : 'T00010'
        }</div></div></div><div class="split-divider"></div>` +
        `<form class="form-grid" onsubmit="return false">${field(
          '手机号',
          '<input class="input" type="text" value="138****2210" />',
        )}${field(
          '邮箱',
          `<input class="input" type="text" value="${state.role === 'admin' ? 'wangwu' : 'lisi'}@example.edu.cn" />`,
        )}</form>`,
      foot:
        '<button type="button" class="btn" data-action="close-overlay">取消</button>' +
        '<button type="button" class="btn btn-primary" data-action="submit-modal" data-toast="个人信息已保存">保存</button>',
    })
  }

  function openShortcuts() {
    const rows = [
      ['Ctrl / ⌘ + K', '打开全局搜索'],
      ['↑ / ↓', '在搜索结果中选择'],
      ['Enter', '打开选中的页面或执行操作'],
      ['Esc', '关闭弹窗、抽屉或搜索'],
      ['点击侧栏图标', '收起 / 展开侧栏（窄屏自动收起）'],
    ]
      .map((r) => `<tr><td class="num"><kbd>${r[0]}</kbd></td><td>${r[1]}</td></tr>`)
      .join('')
    openModal({
      title: '键盘快捷键',
      desc: '管理员与教师端统一使用以下快捷键。',
      body: `<table class="notes-table"><thead><tr><th>快捷键</th><th>功能</th></tr></thead><tbody>${rows}</tbody></table>`,
      foot: '<button type="button" class="btn btn-primary" data-action="close-overlay">知道了</button>',
    })
  }

  function openNotes() {
    const mapping = [
      ['首页', '概览 / 工作台', 'keep', '更名，并改为“待办 + 数据 + 快捷入口”结构'],
      ['档案查看', '档案业务 / 学生档案', 'keep', '筛选、KPI、组织汇总、统计分析合并为页签'],
      ['学生档案详情', '学生档案抽屉', 'merge', '由独立页面改为行点击抽屉，保留原全部字段'],
      [
        '导出中心',
        '档案业务 / 档案导出',
        'keep',
        '原“导出中心”，更名；导出任务、导出模板、表单模板合并为页签',
      ],
      ['表单自定义', '档案导出 / 表单模板', 'merge', '原“表单自定义”，低频配置并入导出业务'],
      ['材料审核', '审核与评估 / 材料审核', 'keep', '待审核、审核记录、审批委托合并为页签'],
      ['审批委托', '材料审核 / 审批委托', 'merge', '不再占用侧栏入口'],
      ['审批流程', '审核与评估 / 审批流程', 'keep', '独立页面保留'],
      ['指标体系', '审核与评估 / 指标体系', 'keep', '指标树、评分规则、重算记录合并为页签'],
      ['评分重算', '指标体系 / 重算记录', 'merge', '重算入口改为页面主按钮 + 弹窗'],
      ['成果热力图', '审核与评估 / 成果热力图', 'keep', '独立页面保留'],
      ['组织架构', '组织与人员 / 组织架构', 'keep', '独立页面保留'],
      ['账号与角色', '组织与人员 / 账号与角色', 'keep', '账号、角色、数据范围、登录日志合并为页签'],
      ['日志查看', '系统设置 / 操作日志', 'merge', '统一到系统设置'],
      ['系统管理', '系统设置 / 数据字典', 'merge', '4 个系统类入口合并为 1 个页面'],
      ['系统配置', '系统设置 / 系统配置', 'merge', '同上'],
      ['定时任务', '系统设置 / 定时任务', 'merge', '同上'],
      ['消息中心', '顶栏铃铛 + 消息中心页', 'remove', '移出侧栏，不再占用一级入口'],
    ]

    const mappingRows = mapping
      .map(
        (r) =>
          `<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td><span class="notes-tag ${
            r[2]
          }">${r[2] === 'keep' ? '保留' : r[2] === 'merge' ? '合并' : '移出侧栏'}</span></td><td>${
            r[3]
          }</td></tr>`,
      )
      .join('')

    const suggestions = [
      [
        '教师 / 管理员顶栏“学习建议”',
        '建议移除',
        '这是学生端功能，教师与管理员不需要；原型中已去掉。',
      ],
      ['侧栏底部“切换账号”', '建议移动', '已移入右上角用户菜单，减少侧栏噪音。'],
      ['全屏加载遮罩 + 问候弹窗', '建议精简', '改为页面内轻量提示；仅登录后首次进入保留一次。'],
      ['书册光标', '建议移除', '管理员 / 教师端恢复系统默认指针；学生端可保留。'],
      [
        'KPI 中的“数据范围 / 当前角色”',
        '建议调整为信息卡',
        '这两个不是业务指标，已移至工作台右侧信息卡与侧栏范围条。',
      ],
      ['首页“刷新快照”按钮', '建议合并', '已合并到数据概览卡片的刷新按钮。'],
      ['消息中心独立菜单', '建议移出侧栏', '已改为顶栏铃铛 + 独立页面。'],
      ['多标签页栏', '已按确认移除', '管理员 / 教师端改面包屑；学生端维持现状。'],
      ['17 个侧栏入口', '已合并为 10 个', '分 5 组折叠，默认展开当前组。'],
      ['渐变 / 琥珀色 / 胶囊标签', '已移除', '中性灰白 + 墨蓝，表格与表单以可读性优先。'],
      ['全局搜索与 Ctrl+K', '建议保留', '支持页面、操作与消息快速跳转，后续可接入学生检索。'],
      ['档案页三层堆叠', '已改为页签', '学生档案 / 组织汇总 / 统计分析同屏切换。'],
    ]

    const suggestionRows = suggestions
      .map(
        (r) =>
          `<tr><td>${r[0]}</td><td><span class="notes-tag merge">${r[1]}</span></td><td>${
            r[2]
          }</td></tr>`,
      )
      .join('')

    const body =
      `<div class="notes-section"><div class="callout info"><span class="callout-icon">${icon(
        'info',
        16,
      )}</span><div>这是<strong>静态 HTML 原型</strong>，用于确认信息架构与视觉方向；尚未修改任何真实前端代码。确认后再按此结构生成 Vue 代码。</div></div></div>` +
      `<div class="notes-section"><h3>一、改造目标</h3><ul>` +
      `<li>把“找信息”放在第一位：减少层级、减少点击、减少装饰。</li>` +
      `<li>侧栏从 17 个入口压缩为 10 个，按 5 组折叠；低频业务并入主页面页签。</li>` +
      `<li>管理员 / 教师端使用中性灰白 + 墨蓝办公风格，恢复正常鼠标指针，移除无意义动效。</li>` +
      `<li>功能不减少：原有模块均有对应落点，仅调整入口与组织方式。</li>` +
      `</ul></div>` +
      `<div class="notes-section"><h3>二、原 17 个侧栏入口与相关子页面的去向</h3><table class="notes-table"><thead><tr><th>原入口</th><th>新位置</th><th>处理</th><th>说明</th></tr></thead><tbody>${
        mappingRows
      }</tbody></table></div>` +
      `<div class="notes-section"><h3>三、界面与交互调整</h3><ul>` +
      `<li><strong>侧栏：</strong>5 组折叠菜单，当前组自动展开；底部显示数据范围，不再放“切换账号”。</li>` +
      `<li><strong>顶栏：</strong>面包屑替代多标签栏；全局搜索（Ctrl+K）；消息铃铛；明暗切换；用户菜单。</li>` +
      `<li><strong>列表页：</strong>筛选 → 指标条 → 表格 的固定阅读顺序；表格 44px 行高、数字等宽。</li>` +
      `<li><strong>详情：</strong>列表行点击打开右侧抽屉，避免离开当前筛选环境。</li>` +
      `<li><strong>动效：</strong>只保留 120–160ms 的浮层与悬停反馈，去掉渐变大背景、胶囊标签与漂浮装饰。</li>` +
      `<li><strong>鼠标：</strong>管理员 / 教师端使用系统默认指针，不再加载书册光标脚本。</li>` +
      `<li><strong>一致性：</strong>所有系统类配置统一为左侧子导航 + 右侧内容，不再散落多个入口。</li>` +
      `</ul></div>` +
      `<div class="notes-section"><h3>四、建议移除 / 调整的功能（请逐条确认）</h3><table class="notes-table"><thead><tr><th>项目</th><th>建议</th><th>原因 / 处理方式</th></tr></thead><tbody>${
        suggestionRows
      }</tbody></table></div>` +
      `<div class="notes-section"><h3>五、需要你决定的问题</h3><ul>` +
      `<li>教师端是否还需要保留“学习建议”？原型按<strong>移除</strong>处理；若保留，建议放到用户菜单而不是顶栏。</li>` +
      `<li>教师默认菜单原型展示为：工作台、学生档案、档案导出、材料审核（模拟已授权）、成果热力图。真实权限下教师默认只有 4 项，<strong>是否维持按权限过滤</strong>？</li>` +
      `<li>“审批委托”放在材料审核页签，还是应放到审批流程页？原型暂放材料审核。</li>` +
      `<li>“登录日志”放在账号与角色，“操作日志”放在系统设置。<strong>是否统一到一个“日志”页签</strong>？</li>` +
      `<li>全局搜索首期只做页面 / 操作 / 消息跳转，学生检索是否本期接入？</li>` +
      `<li>学生端本次不改动（书册视觉、多标签栏保留），请确认边界。</li>` +
      `</ul></div>` +
      `<div class="notes-section"><h3>六、量化对比</h3><table class="notes-table"><thead><tr><th>维度</th><th>改造前</th><th>改造后</th></tr></thead><tbody>` +
      `<tr><td>侧栏一级入口</td><td>17 个平铺</td><td>10 个，分 5 组折叠</td></tr>` +
      `<tr><td>页面层数</td><td>部分页面 3 层堆叠</td><td>≤ 2 层，低频内容用页签</td></tr>` +
      `<tr><td>顶部导航</td><td>多标签栏 + 顶栏</td><td>面包屑 + 全局搜索 + 用户菜单</td></tr>` +
      `<tr><td>视觉</td><td>深海底蓝 + 琥珀 + 渐变</td><td>中性灰白 + 墨蓝，白底 1px 边框</td></tr>` +
      `<tr><td>鼠标</td><td>书册光标</td><td>系统默认指针</td></tr>` +
      `<tr><td>动效</td><td>页面过渡、浮动装饰、渐变</td><td>仅保留功能性 120–160ms 反馈</td></tr>` +
      `</tbody></table></div>`

    openModal({
      title: '管理员 / 教师端重构说明',
      desc: '17 个入口 → 5 组 10 个入口；视觉、导航与交互的完整对照。',
      wide: true,
      body,
      foot:
        '<span class="foot-left">原型路径：frontend/prototype/admin-console/index.html</span>' +
        '<button type="button" class="btn btn-primary" data-action="close-overlay">关闭</button>',
    })
  }

  /* ---------------------------------------------------------------------------
     24. 路由表与启动
     --------------------------------------------------------------------------- */

  const SCREENS = {
    dashboard: screenDashboard,
    archive: screenArchive,
    export: screenExport,
    review: screenReview,
    approval: screenApproval,
    indicator: screenIndicator,
    heatmap: screenHeatmap,
    org: screenOrg,
    accounts: screenAccounts,
    settings: screenSettings,
    messages: screenMessages,
  }

  function render() {
    renderSidebar()
    renderTopbar()
    const content = $('#content')
    if (!content) return
    const screen = SCREENS[state.route] || SCREENS.dashboard
    content.innerHTML = screen()
    content.scrollTop = 0
    window.scrollTo({ top: 0 })
    syncProtoPanel()
  }

  function init() {
    document.documentElement.dataset.theme = state.theme
    const fab = $('#protoFab')
    if (fab) fab.addEventListener('click', toggleProtoPanel)
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeydown)
    render()
    syncProtoPanel()
  }

  init()
})()
