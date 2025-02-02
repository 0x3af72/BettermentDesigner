import React from 'react'
import { useNavigate } from 'react-router-dom'

import './Button.css'

function Button(props) {

  const navigate = useNavigate()
  const handleNavigate = () => {
    navigate(props['nav'])
  }

  return (
    <div className="button" onClick={handleNavigate} {...props}>{ props['text'] }</div>
  )
}

export default Button