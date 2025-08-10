export const runtime = 'edge'
export default function Probe() {
  return (
    <div style={{ padding: 24 }}>
      <h1>probe ok</h1>
      <p>如果这个页面能正常显示，说明基础框架没问题，问题在首页用到的客户端组件里。</p>
    </div>
  )
}
