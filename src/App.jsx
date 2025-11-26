import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AutoOCR from './AutoOCR'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <AutoOCR />
    </>
  )
}

export default App
