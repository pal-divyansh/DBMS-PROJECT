import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import styles from './Layout.module.css'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={styles.layout}>
      <Header onToggleSidebar={() => setCollapsed(c => !c)} />
      <div className={styles.body}>
        <Sidebar collapsed={collapsed} />
        <main className={styles.main}>
          <div className={styles.contentWrap}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
