#!/usr/bin/env node
/**
 * CI 的 Security audit 步骤。
 *
 * npm audit 没有忽略机制，命中任意 high 公告就返回 1。这里仍完整执行
 * `npm audit`，仅放行下面这一条例外：GHSA-fc5q-39xc-vjpf（picomatch <= 4.0.7，
 * registry 最新版仍是 4.0.7，无修复版本）。这是唯一登记的例外；上游发布修复版后，
 * 删除这一条并把 .github/workflows/ci.yml 的该步骤恢复为原命令：
 * `npm audit --audit-level=high --registry=https://registry.npmjs.org`
 */
import { spawnSync } from 'node:child_process'

const ALLOWED_ADVISORIES = new Set(['ghsa-fc5q-39xc-vjpf'])
const REGISTRY = 'https://registry.npmjs.org'

const audit = spawnSync(`npm audit --json --registry=${REGISTRY}`, {
  encoding: 'utf8',
  shell: true,
})

let report
try {
  report = JSON.parse(audit.stdout)
} catch {
  process.stderr.write(`无法解析 npm audit 输出：\n${audit.stdout || audit.stderr || audit.error || '（无输出）'}\n`)
  process.exit(1)
}

const vulnerabilities = report.vulnerabilities ?? {}
const isHigh = severity => severity === 'high' || severity === 'critical'
const blocked = Object.values(vulnerabilities).filter(item => isHigh(item.severity))

// 上游包只会重复公告标题与链接，公告本体挂在受影响包上，按公告编号判定即可。
const advisories = new Map()
for (const item of Object.values(vulnerabilities)) {
  for (const entry of item.via ?? []) {
    if (typeof entry === 'string' || !isHigh(entry.severity)) continue
    const ghsa = /GHSA-[a-z0-9-]+/i.exec(String(entry.url ?? ''))
    const id = ghsa ? ghsa[0].toLowerCase() : String(entry.title ?? entry.name)
    if (!advisories.has(id)) advisories.set(id, entry)
  }
}

const unregistered = [...advisories].filter(([id]) => !ALLOWED_ADVISORIES.has(id))
if (unregistered.length > 0) {
  process.stderr.write(`安全审计未通过：${unregistered.length} 条 high/critical 公告未登记\n`)
  for (const [id, entry] of unregistered) {
    process.stderr.write(`- ${id}：${entry.title ?? entry.name} ${entry.url ?? ''}\n`)
  }
  process.exit(1)
}

process.stdout.write(
  blocked.length > 0
    ? `安全审计通过：${blocked.length} 个 high/critical 依赖均来自已登记的例外 GHSA-FC5Q-39XC-VJPF\n`
    : '安全审计通过：无 high/critical 漏洞\n',
)
