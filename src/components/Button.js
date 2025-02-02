import React from 'react'
import { useNavigate } from 'react-router-dom'

import './Button.css'

function Button(props) {

  const navigate = useNavigate()
  const handleNavigate = () => {
    if (props['nav']) navigate(props['nav'])
  }

  const handleClick = () => {
    handleNavigate()
    if (props['func']) props['func']()
  }

  return (
    <div className="button" onClick={handleClick} {...props}>{ props['text'] }</div>
  )
}

export default Button