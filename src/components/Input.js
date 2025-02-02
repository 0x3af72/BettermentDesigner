import React from 'react'
import { useState } from 'react'

import './Input.css'

function InputBox(props) {

  const [inputValue, setInputValue] = useState('')

  const handleInputChange = (event) => {
    setInputValue(event.target.value)
  }

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleInputChange}
      className="input-box"
      {...props}
    />
  )
}

export default InputBox