/**
 * 申报/档案记录字段 → 中文标签
 *
 * 供记录详情弹窗与纠错弹窗共用，保证同一字段在两处显示一致。
 * 顺序即详情弹窗的展示顺序。
 */
export const FIELD_LABELS: Record<string, string> = {
  /* 通用 */
  title: '标题',
  typeLabel: '类型',
  submitDate: '提交日期',
  semester: '学期',
  status: '状态',
  rejectedReason: '退回原因',
  proofMaterials: '证明材料',
  role: '本人角色',
  certNumber: '证书编号',
  issuingAuthority: '发证单位',
  acquisitionDate: '取得时间',
  validityPeriod: '有效期',
  /* 学科竞赛 / 竞赛之星 */
  competitionName: '竞赛名称',
  competitionType: '竞赛类型',
  competitionDate: '参赛时间',
  awardDate: '获奖时间',
  competitionLevel: '竞赛级别',
  awardLevel: '获奖等级',
  /* 创新创业 / 双创之星 */
  companyName: '公司名称',
  industryType: '行业类型',
  companyType: '项目类型',
  teamRole: '团队角色',
  registerDate: '注册时间',
  /* 实训 / 科研项目 / 学术研究 / 科研之星-科研项目 */
  projectName: '项目名称',
  projectContent: '项目内容',
  projectLevel: '项目级别',
  researchType: '研究类型',
  projectDate: '开始时间',
  ranking: '排名/总人数',
  /* 社会实践 */
  activityName: '活动名称',
  location: '活动地点',
  organization: '组织单位',
  volunteerHours: '志愿时长',
  /* 组织履历 */
  organizationLevel: '组织级别',
  department: '部门',
  position: '职务',
  /* 荣誉证书 */
  certType: '证书类型',
  certName: '证书名称',
  certDate: '获得时间',
  /* 图书心得 */
  bookName: '图书名称',
  bookDate: '阅读时间',
  review: '心得体会',
  /* 奖学金 */
  awardName: '奖项名称',
  scholarshipLevel: '奖学金级别',
  scholarshipGrade: '获奖等级',
  acquireDate: '获得时间',
  /* 实习经历 */
  company: '实习公司',
  /* 软件著作权 */
  softName: '软著名称',
  approveDate: '获批时间',
  /* 发表论文 */
  journalName: '期刊名称',
  paperName: '论文名称',
  publishDate: '发表时间',
  /* 起止时间通用 */
  startDate: '开始时间',
  endDate: '结束时间',
}
