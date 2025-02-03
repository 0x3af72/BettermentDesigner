import React, { useState, useEffect } from 'react'

import InputBox from '../components/Input'
import Button from '../components/Button'
import './Home.css'

function Home() {
  const [holderDims, setHolderDims] = useState({
    width: 50,
    height: 50,
    length: 50,
  })

  useEffect(() => {
    localStorage.setItem('holderDims', JSON.stringify(holderDims))
  }, [holderDims])

  const handleChange = (e) => {
    const { name, value } = e.target
    let clippedValue = Math.max(50, value)
    setHolderDims((prev) => ({
      ...prev,
      [name]: Number(clippedValue)
    }))
  }

  return (
    <div id="homeMain">
      <p id="title">Betterment Holder Designer</p>
      <div className="fieldInput">
        <p>Holder width (mm):</p>
        <InputBox type="number" name="width" min="50" onChange={handleChange} value={holderDims.width} />
      </div>
      <div className="fieldInput">
        <p>Holder height (mm):</p>
        <InputBox type="number" name="height" min="50" onChange={handleChange} value={holderDims.height} />
      </div>
      <div className="fieldInput">
        <p>Holder length (mm):</p>
        <InputBox type="number" name="length" min="50" onChange={handleChange} value={holderDims.length} />
      </div>
      <Button text="BEGIN" nav="/design" className="centeredButton" />
    </div>
  )
}

export default Home
