import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'

import Home from './pages/Home'
import Design from './pages/Design'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/design' element={<Design />} />
      </Routes>
    </Router>
  )
}

export default App