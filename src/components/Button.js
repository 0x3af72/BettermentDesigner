import React from 'react'
import { useNavigate } from 'react-router-dom'

import './Button.css'

function Button({ nav, func, text, className, ...props }) {

  const navigate = useNavigate()
  const handleNavigate = () => {
    if (nav) navigate(nav)
  }

  const handleClick = () => {
    handleNavigate()
    if (func) func()
  }

  return (
    <div  {...props} className={`button ${className || ''}`} onClick={handleClick}>{ text }</div>
  )
}

export default Button