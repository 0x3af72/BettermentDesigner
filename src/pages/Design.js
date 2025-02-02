import React, { useRef, useState, useEffect } from 'react'
import interact from 'interactjs'

import Button from '../components/Button'
import './Design.css'
import compartmentTypes from '../data/compartment-types.json'
import compartmentDefaultDims from '../data/compartment-default-dimensions.json'

// Check if rects are intersecting
function isIntersecting(rect1, rect2) {
  return !(
    rect1.left + rect1.width < rect2.left ||
    rect1.left > rect2.left + rect2.width ||
    rect1.top + rect1.height < rect2.top ||
    rect1.top > rect2.top + rect2.height
  )
}

// Compartment creation menu
const CompartmentCreation = ({ holderLength, holderWidth, mmToPixel, onCreateCompartment }) => {

  const [compartmentType, setCompartmentType] = useState('')
  const [length, setLength] = useState(1)
  const [width, setWidth] = useState(1)

  const handleCompartmentTypeChange = (event) => {

    const newType = event.target.value

    // Set default dimensions
    if (compartmentDefaultDims.hasOwnProperty(newType)) {
      const dims = compartmentDefaultDims[newType]
      setLength(dims[0])
      setWidth(dims[1])
    }
    
    setCompartmentType(event.target.value)
  }

  const handleLengthChange = (event) => {
    setLength(event.target.value)
  }

  const handleWidthChange = (event) => {
    setWidth(event.target.value)
  }

  const createCompartment = () => {
    if (!compartmentType || compartmentType === 'Select...') return
    onCreateCompartment({
      id: Date.now().toString(),
      text: compartmentType,
      left: 0,
      top: 0,
      width: length * mmToPixel,
      height: width * mmToPixel,
      zIndex: 1000,
    })
  }

  return (
    <div id="compartmentCreation">
      <label htmlFor="compartmentType">Compartment type:</label>
      <select id="compartmentTypeSelect" name="compartmentType" value={compartmentType} onChange={handleCompartmentTypeChange}>
        {compartmentTypes.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <br />
      <label htmlFor="length">Compartment length ({length}mm):</label>
      <input className="slider" type="range" id="length" name="length" min="1" max={holderLength - 40} value={length} onChange={handleLengthChange}/>
      <br />
      <label htmlFor="width">Compartment width ({width}mm):</label>
      <input className="slider" type="range" id="width" name="width" min="1" max={holderWidth - 40} value={width} onChange={handleWidthChange} />
      <Button func={createCompartment} text="Create" />
    </div>
  )
}

// Individual Compartment Component
const Compartment = ({ id, text, left, top, width, height, onMove, isIntersecting, isMoving, zIndex }) => {

  const dragRef = useRef(null)

  useEffect(() => {
    interact(dragRef.current)
    .draggable({
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: document.querySelector('#holderShadow'),
          endOnly: false,
        }),
      ],
      listeners: {
        move: (event) => {

          const target = event.target
          const x = (parseFloat(target.style.left) || 0) + event.dx
          const y = (parseFloat(target.style.top) || 0) + event.dy

          onMove(id, x, y)
        },
      },
    })
    .on('tap', (event) => {
      onMove(id, parseFloat(event.target.style.left), parseFloat(event.target.style.top))
    })
  }, [id, onMove])

  return (
    <div
      ref={dragRef}
      style={{
        position: 'absolute',
        left, top,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: isIntersecting ? 'red' : 'white',
        cursor: 'move',
        zIndex: (zIndex && zIndex !== 1) ? zIndex : (isMoving ? 999 : 1),
      }}
      className="compartment"
    >
      {text}
    </div>
  )
}

const Holder = ({ width, height, compartments, onMoveCompartment, mmToPixel }) => {

  return (
    <div
      id="holder"
      style={{ width: `${width}px`, height: `${height}px`, }}
    >
      <div
      id="holderShadow"
      style={{
        width: `${width - 40 * mmToPixel}px`,
        height: `${height - 40 * mmToPixel}px`,
        top: `${20 * mmToPixel}px`,
        left: `${20 * mmToPixel}px`,
      }}
      />
      {compartments.map((comp) => (
        <Compartment
          {...comp}
          key={comp.id}
          id={comp.id}
          text={comp.text}
          left={comp.left}
          top={comp.top}
          onMove={onMoveCompartment}
          isIntersecting={comp.isIntersecting}
          isMoving={comp.isMoving}
        />
      ))}
    </div>
  )
}

function Design() {

  let holderDims = JSON.parse(localStorage['holderDims'])

  // Scale holder
  const SCALE = 85
  let width, height
  if (holderDims.length > holderDims.width) {
    width = SCALE
    height = SCALE * (holderDims.width / holderDims.length)
  } else {
    height = SCALE
    width = SCALE * (holderDims.length / holderDims.width)
  }
  width *= window.innerHeight / 100
  height *= window.innerHeight / 100

  // Get ratio of mm to pixel
  const mmToPixel = height / holderDims.width

  const [compartments, setCompartments] = useState([])
  const createCompartment = (newCompartment) => {
    const holderShadow = document.querySelector('#holderShadow')
    const rect = holderShadow.getBoundingClientRect()
    newCompartment.top += rect.top + window.scrollY
    newCompartment.left += rect.left + window.scrollX
    setCompartments((prevCompartments) => [...prevCompartments, newCompartment])
  }

  const [selectedCompartmentID, setSelectedCompartmentID] = useState(null)
  const onMoveCompartment = (id, x, y) => {

    // Set selected compartment
    console.log("set to", id)
    setSelectedCompartmentID(id)

    // O(n^2) but we should be fine
    setCompartments((prev) =>
      prev.map((comp) => {

        if (comp.id === id) {
          comp = { ...comp, left: x, top: y, isMoving: true }
        } else {
          comp = { ...comp, isMoving: false }
        }

        const hasIntersect = prev.reduce((acc, otherComp) => {

          if (otherComp.id === comp.id) return acc
          const moving = { left: comp.left, top: comp.top, width: comp.width, height: comp.height }
          const immoving = {
            left: otherComp.left - 2 * mmToPixel, // Compartments must be 4mm apart
            top: otherComp.top - 2 * mmToPixel,
            width: otherComp.width + 4 * mmToPixel,
            height: otherComp.height + 4 * mmToPixel
          }

          const hasIntersect = isIntersecting(moving, immoving)
          if (hasIntersect) {
            return true
          }
          return acc

        }, false)
          
        return { ...comp, isIntersecting: hasIntersect, zIndex: 1 }
      })
    )
  }

  // Keyboard shortcuts
  const deleteCurrentCompartment = () => {
    setCompartments((prevCompartments) => prevCompartments.filter(compartment => compartment.id !== selectedCompartmentID))
  }
  const duplicateCurrentCompartment = () => {

  }

  // Handle keyboard events
  useEffect(() => {

    const handleKeyDown = (event) => {
      if (event.key === 'x' || event.key === 'X') {
        console.log("deleting", selectedCompartmentID)
        deleteCurrentCompartment()
      } else if (event.key === 'd' || event.key === 'D') {
        duplicateCurrentCompartment()
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <>
      <CompartmentCreation onCreateCompartment={createCompartment} mmToPixel={mmToPixel} holderLength={holderDims.length} holderWidth={holderDims.width} />
      <div id="canvas">
        <div className="row">
          <div className="dimension">
            <span>{holderDims.width} mm</span>
            <span className="arrow">↕</span>
          </div>
          <Holder mmToPixel={mmToPixel} width={width} height={height} compartments={compartments} onMoveCompartment={onMoveCompartment} />
        </div>
        <div className="dimension" style={{ paddingLeft: "40px" }}>
          <span>{holderDims.length} mm</span>
          <span className="arrow">↔</span>
        </div>
      </div>
    </>
  )
}

export default Design