import React, { useRef, useState, useEffect } from 'react'
import interact from 'interactjs'

import Button from '../components/Button'
import './Design.css'
import compartmentTypes from '../data/compartment-types.json'
import compartmentDefaultDims from '../data/compartment-default-dimensions.json'

// Check if rects are intersecting
function isIntersecting(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect1.x > rect2.x + rect2.width ||
    rect1.y + rect1.height < rect2.y ||
    rect1.y > rect2.y + rect2.height
  )
}

// Move a rect as close as possible to another if they are guaranteed to intersect
function asCloseAsPossible(rect1, rect2, dx, dy) {

  let newX = rect1.x + dx
  let newY = rect1.y + dy

  // Adjust horizontal movement
  if (dx) {
    if (rect1.x < rect2.x) {
      newX = rect2.x - rect1.width - 1
    } else {
      newX = rect2.x + rect2.width + 1
    }
  }

  // Adjust vertical movement
  if (dy) {
    if (rect1.y < rect2.y) {
      newY = rect2.y - rect1.width - 1
    } else {
      newY = rect2.y + rect2.height + 1
    }
  }

  return { x: newX, y: newY }
}

// Compartment controls
const Controls = ({ deleteCurrentCompartment, duplicateCurrentCompartment, selectedCompartmentID }) => {
  return (
    <div id="controls">
      <div className="controls-content">
        { selectedCompartmentID &&
          <>
            <span>[ESC to deselect compartment]</span>
            <span>[Drag or use WASD keys to move compartment]</span>
            <span>[X to delete selected compartment]</span><Button text='delete' func={deleteCurrentCompartment} />
            <span>[C to duplicate selected compartment]</span><Button text='duplicate' func={duplicateCurrentCompartment} />
          </>
        }
        {!selectedCompartmentID && <div className="placeholder" />}
      </div>
    </div>
  )
}

// Compartment creation menu
const CompartmentCreation = ({ holderLength, holderWidth, onCreateCompartment }) => {

  const maxLength = holderLength - 40
  const maxWidth = holderWidth - 40

  const [compartmentType, setCompartmentType] = useState('')
  const [length, setLength] = useState(1)
  const [width, setWidth] = useState(1)

  const handleCompartmentTypeChange = (event) => {

    const newType = event.target.value

    // Set default dimensions
    if (compartmentDefaultDims.hasOwnProperty(newType)) {
      const dims = compartmentDefaultDims[newType]
      setLength(Math.min(dims[0], maxLength))
      setWidth(Math.min(dims[1], maxWidth))
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
      x: 0, y: 0,
      width: parseInt(length),
      height: parseInt(width),
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
      <input className="slider" type="range" id="length" name="length" min="1" max={maxLength} value={length} onChange={handleLengthChange}/>
      <br />
      <label htmlFor="width">Compartment width ({width}mm):</label>
      <input className="slider" type="range" id="width" name="width" min="1" max={maxWidth} value={width} onChange={handleWidthChange} />
      <Button func={createCompartment} text="Create" />
    </div>
  )
}

// Individual Compartment Component
const Compartment = ({ id, text, x, y, width, height, onMove, isIntersecting, isMoving, zIndex, selectedCompartmentID, mmToPixel }) => {

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
          onMove(id, event.dx / mmToPixel, event.dy / mmToPixel)
        },
      },
    })
    .on('tap', (event) => {
      onMove(id, 0, 0)
    })
  }, [id, onMove])

  return (
    <div
      ref={dragRef}
      id={`c${id}`}
      style={{
        position: 'absolute',
        left: x * mmToPixel, top: y * mmToPixel,
        width: width * mmToPixel,
        height: height * mmToPixel,
        backgroundColor: isIntersecting ? 'red' : 'white',
        opacity: isIntersecting ? 0.3 : 1,
        cursor: 'move',
        zIndex: (zIndex && zIndex !== 1) ? zIndex : (isMoving ? 999 : 1),
      }}
      className={`compartment ${id === selectedCompartmentID ? 'selected' : ''}`}
    >
      {text}
    </div>
  )
}

const Holder = ({ width, height, compartments, onMoveCompartment, mmToPixel, selectedCompartmentID }) => {

  return (
    <div
      id="holder"
      style={{ width: `${width}px`, height: `${height}px`, }}
    >
      <div
      id="holderShadow"
      style={{
        width: width - 40 * mmToPixel,
        height: height - 40 * mmToPixel,
        top: 20 * mmToPixel,
        left: 20 * mmToPixel,
      }}
      />
      {compartments.map((comp) => (
        <Compartment
          {...comp}
          key={comp.id}
          id={comp.id}
          text={comp.text}
          x={comp.x}
          y={comp.y}
          onMove={onMoveCompartment}
          isIntersecting={comp.isIntersecting}
          isMoving={comp.isMoving}
          selectedCompartmentID={selectedCompartmentID}
          mmToPixel={mmToPixel}
        />
      ))}
    </div>
  )
}

function Design() {

  let holderDims = JSON.parse(localStorage['holderDims'])

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scale holder
  let SCALE = isMobile ? 0.7 : 0.85
  let width, height
  if (isMobile) {
    // Use 90% of window width for mobile
    const mobileWidth = window.innerWidth * 0.9
    width = SCALE * mobileWidth * (holderDims.length / Math.max(holderDims.length, holderDims.width))
    height = SCALE * mobileWidth * (holderDims.width / Math.max(holderDims.length, holderDims.width))
  } else {
    // Original scaling logic for desktop
    if (holderDims.length > holderDims.width) {
      width = SCALE
      height = SCALE * (holderDims.width / holderDims.length)
    } else {
      height = SCALE
      width = SCALE * (holderDims.length / holderDims.width)
    }
    width *= window.innerHeight
    height *= window.innerHeight
  }

  // Get ratio of mm to pixel
  const mmToPixel = height / holderDims.width

  // Compartment creation
  const [compartments, setCompartments] = useState([])
  const createCompartment = (newCompartment) => {
    newCompartment.x += 20 // Spacing between compartments and holder
    newCompartment.y += 20
    setCompartments((prevCompartments) => [...prevCompartments, newCompartment])
    onMoveCompartment(null, null, null) // Trigger updates
  }

  // Check if anything intersects
  const checkIntersect = (comp, compartments) => {
    return compartments.reduce((acc, otherComp) => {
      if (otherComp.id === comp.id) return acc
      const moving = { x: comp.x, y: comp.y, width: comp.width, height: comp.height }
      const immoving = {
        x: otherComp.x - 2, // Compartments must be 4mm apart
        y: otherComp.y - 2,
        width: otherComp.width + 4,
        height: otherComp.height + 4
      }

      const hasIntersect = isIntersecting(moving, immoving)
      if (hasIntersect) {
        return [true, immoving]
      }
      return acc

    }, [false, null])
  }

  // Compartment movement updates
  const [selectedCompartmentID, setSelectedCompartmentID] = useState(null)
  const onMoveCompartment = (id, dx, dy, preventIntersect=false, manualRestrict=false) => {

    // Set selected compartment
    if (id) setSelectedCompartmentID(id)

    // O(n^2) but we should be fine
    setCompartments((prev) =>
      prev.map((comp) => {

        if (comp.id === id) {

          let x = comp.x + dx
          let y = comp.y + dy

          // Manually restrict when using arrow keys
          if (manualRestrict) {

            let rect = {}
            rect.x = 20
            rect.y = 20
            rect.w = holderDims.length - 40
            rect.h = holderDims.width - 40
            
            x = Math.max(rect.x, x)
            x = Math.min(rect.x + rect.w - comp.width, x)
            y = Math.max(rect.y, y)
            y = Math.min(rect.y + rect.h - comp.height, y)
          }

          // Prevent intersection if not already intersected
          if (preventIntersect && !comp.isIntersecting) {

            // Check if will intersect with any
            let want = { ...comp, x, y, isMoving: true }
            const [hasIntersect, intersectWith] = checkIntersect(want, prev)
            if (hasIntersect) {
              const closest = asCloseAsPossible(want, intersectWith, dx, dy)
              x = closest.x
              y = closest.y
            }
          }

          comp = { ...comp, x, y, isMoving: true }
        } else {
          comp = { ...comp, isMoving: false }
        }

        const [hasIntersect, _] = checkIntersect(comp, prev)
          
        return { ...comp, isIntersecting: hasIntersect, zIndex: 1 }
      })
    )
  }

  // Keyboard shortcuts
  const deleteCurrentCompartment = () => {
    setCompartments((prevCompartments) => prevCompartments.filter(compartment => compartment.id !== selectedCompartmentID))
    setSelectedCompartmentID(null)
    onMoveCompartment(null, null, null) // Trigger updates
  }
  const duplicateCurrentCompartment = () => {
    for (let compartment of compartments) {
      if (compartment.id === selectedCompartmentID) {
        createCompartment({ ...compartment, id: Date.now().toString(), x: 0, y: 0 })
      }
    }
  }

  // Handle keyboard events
  useEffect(() => {

    const handleKeyDown = (event) => {
      
      // Magnitude of movement with arrow keys is 2%
      const dx = 0.02 * holderDims.length
      const dy = 0.02 * holderDims.width

      if (event.key === 'x' || event.key === 'X') {
        deleteCurrentCompartment()
      } 
      if (event.key === 'c' || event.key === 'C') {
        duplicateCurrentCompartment()
      }
      if (event.key === 'W' || event.key === 'w') {
        onMoveCompartment(selectedCompartmentID, 0, -dy, true, true)
      }
      if (event.key === 'S' || event.key === 's') {
        onMoveCompartment(selectedCompartmentID, 0, dy, true, true)
      }
      if (event.key === 'a' || event.key === 'A') {
        onMoveCompartment(selectedCompartmentID, -dx, 0, true, true)
      }
      if (event.key === 'd' || event.key === 'D') {
        onMoveCompartment(selectedCompartmentID, dx, 0, true, true)
      }
      if (event.key === 'Escape') {
        setSelectedCompartmentID(null)
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  })

  return (
    <div id="designMain">
      <div className="row">
        <CompartmentCreation
          onCreateCompartment={createCompartment}
          holderLength={holderDims.length}
          holderWidth={holderDims.width}
        />
        <Controls
          deleteCurrentCompartment={deleteCurrentCompartment}
          duplicateCurrentCompartment={duplicateCurrentCompartment}
          selectedCompartmentID={selectedCompartmentID}
        />
      </div>
      <div id="canvas">
        <div className="row">
          <div className="dimension">
            <span>{holderDims.width} mm</span>
            <span className="arrow">↕</span>
          </div>
          <Holder
            selectedCompartmentID={selectedCompartmentID}
            mmToPixel={mmToPixel}
            width={width} height={height}
            compartments={compartments}
            onMoveCompartment={onMoveCompartment}
          />
        </div>
        <div className="dimension" style={{ paddingLeft: "40px" }}>
          <span>{holderDims.length} mm</span>
          <span className="arrow">↔</span>
        </div>
      </div>
    </div>
  )
}

export default Design