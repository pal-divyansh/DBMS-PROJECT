export default function Spinner({ size = 20 }) {
  const s = { width: size, height: size, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }
  return (
    <div style={{ display: 'inline-block' }}>
      <div style={s} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
