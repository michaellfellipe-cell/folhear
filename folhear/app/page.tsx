'use client'
import dynamic from 'next/dynamic'
const FolhearApp = dynamic(() => import('../components/FolhearApp'), { ssr: false })
export default function Page() {
  return <FolhearApp />
}
