import {useState, useEffect} from 'react'

interface Report {
  filename: string
  url: string
  date: string
  size: number
}

function App() {
  const [stockCode, setStockCode] = useState('600519')
  const [companyName, setCompanyName] = useState('贵州茅台')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reportUrl, setReportUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [reports, setReports] = useState<Report[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [useExistingData, setUseExistingData] = useState(true)

  // 加载历史报告
  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      if (data.success) {
        setReports(data.reports)
      }
    } catch {
      console.error('获取历史报告失败')
    }
  }

  const handleGenerate = async () => {
    if (!stockCode || !companyName) {
      setError('请输入股票代码和公司名称')
      return
    }

    setLoading(true)
    setError('')
    setReportUrl('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          stockCode,
          companyName,
          years: [2022, 2023, 2024],
          useExistingData,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setReportUrl(data.reportUrl)
        setDuration(data.duration)
        fetchReports()
      } else {
        setError(data.error || '生成失败')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = (url: string) => {
    setReportUrl(url)
    setShowHistory(false)
  }

  return (
    <div className="app">
      {/* 侧边栏 */}
      <aside className={`sidebar ${showHistory ? 'show' : ''}`}>
        <div className="sidebar-header">
          <h2>历史报告</h2>
          <button className="close-btn" onClick={() => setShowHistory(false)}>
            ×
          </button>
        </div>
        <div className="report-list">
          {reports.length === 0 ? (
            <p className="no-reports">暂无历史报告</p>
          ) : (
            reports.map((r) => (
              <div
                key={r.filename}
                className={`report-item ${reportUrl === r.url ? 'active' : ''}`}
                onClick={() => handleViewReport(r.url)}
              >
                <div className="report-date">{r.date}</div>
                <div className="report-size">{r.size} KB</div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="main">
        {/* 顶部栏 */}
        <header className="header">
          <div className="header-left">
            <button className="history-btn" onClick={() => setShowHistory(!showHistory)}>
              📋
            </button>
            <h1>AI 财务研报生成器</h1>
          </div>
          <div className="header-form">
            <input
              type="text"
              placeholder="股票代码"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              disabled={loading}
              className="input-code"
            />
            <input
              type="text"
              placeholder="公司名称"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={loading}
              className="input-name"
            />
            <label className="switch-label">
              <input
                type="checkbox"
                checked={useExistingData}
                onChange={(e) => setUseExistingData(e.target.checked)}
                disabled={loading}
              />
              <span className="switch-text">快速模式</span>
            </label>
            <button onClick={handleGenerate} disabled={loading} className="generate-btn">
              {loading ? '生成中...' : '生成研报'}
            </button>
          </div>
        </header>

        {/* 内容区 */}
        <div className="content">
          {error && <div className="error-message">{error}</div>}

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">
                {useExistingData
                  ? '正在生成研报（快速模式），预计需要 3-5 分钟...'
                  : '正在生成研报，预计需要 15-20 分钟...'}
              </p>
              <p className="loading-hint">
                {useExistingData
                  ? '流程：趋势分析 → 竞品对比 → 报告生成'
                  : '流程：深度搜索 → 数据采集 → 财务计算 → 趋势分析 → 竞品对比 → 估值建模 → 报告生成'}
              </p>
            </div>
          )}

          {!loading && !reportUrl && !error && (
            <div className="welcome">
              <div className="welcome-icon">📊</div>
              <h2>欢迎使用 AI 财务研报生成器</h2>
              <p>输入股票代码和公司名称，AI 将自动生成专业的财务分析研报</p>
              <div className="features">
                <div className="feature">
                  <span className="feature-icon">🔍</span>
                  <span>深度搜索行业数据</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📈</span>
                  <span>财务报表分析</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">🏢</span>
                  <span>竞品对比分析</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">💰</span>
                  <span>估值模型预测</span>
                </div>
              </div>
            </div>
          )}

          {reportUrl && !loading && (
            <div className="report-container">
              {duration > 0 && (
                <div className="success-banner">
                  研报生成完成，耗时 {duration} 分钟
                </div>
              )}
              <iframe src={reportUrl} className="report-iframe" title="财务研报" />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App

